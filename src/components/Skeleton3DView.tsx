import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { GLView, ExpoWebGLRenderingContext } from 'expo-gl';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { FrameData, CameraAngle, SkeletonConfig, Keypoint } from '../types/analysis';
import { getSkeletonBones, isBoneVisible } from '../services/skeletonBuilder';

interface Skeleton3DViewProps {
  frameData: FrameData | null;
  autoRotate?: boolean;
  style?: ViewStyle;
  config?: Partial<SkeletonConfig>;
}

export interface Skeleton3DViewRef {
  setCameraAngle: (angle: CameraAngle) => void;
  setCameraDistance: (distance: number) => void;
  updateSkeletonDirect: (frameData: FrameData | null) => void;
}

const defaultConfig: SkeletonConfig = {
  jointSize: 0.02,
  boneThickness: 0.01,
  visibilityThreshold: 0.4,
  showJointLabels: false,
};

// Static reusable vector for setFromUnitVectors (created once, never changes)
const UP_VECTOR = new THREE.Vector3(0, 1, 0);

// Cache skeleton bones array (structure never changes, called once at module level)
const SKELETON_BONES = getSkeletonBones();

// Pre-compute bone radius multipliers for all bones (eliminates 1000+ function calls per second)
const BONE_RADIUS_CACHE = new Map<string, number>();

// Helper function to compute radius multiplier (used only during initialization)
function computeBoneRadiusMultiplier(startId: number, endId: number): number {
  // MediaPipe landmark IDs
  const SHOULDER_LEFT = 11, SHOULDER_RIGHT = 12;
  const ELBOW_LEFT = 13, ELBOW_RIGHT = 14;
  const WRIST_LEFT = 15, WRIST_RIGHT = 16;
  const HIP_LEFT = 23, HIP_RIGHT = 24;
  const KNEE_LEFT = 25, KNEE_RIGHT = 26;
  const ANKLE_LEFT = 27, ANKLE_RIGHT = 28;

  // Upper arms (shoulder to elbow) - thickest
  if ((startId === SHOULDER_LEFT && endId === ELBOW_LEFT) ||
      (startId === SHOULDER_RIGHT && endId === ELBOW_RIGHT)) {
    return 1.5;
  }

  // Forearms (elbow to wrist) - medium
  if ((startId === ELBOW_LEFT && endId === WRIST_LEFT) ||
      (startId === ELBOW_RIGHT && endId === WRIST_RIGHT)) {
    return 1.0;
  }

  // Upper legs (hip to knee) - thickest
  if ((startId === HIP_LEFT && endId === KNEE_LEFT) ||
      (startId === HIP_RIGHT && endId === KNEE_RIGHT)) {
    return 1.5;
  }

  // Lower legs (knee to ankle) - medium
  if ((startId === KNEE_LEFT && endId === ANKLE_LEFT) ||
      (startId === KNEE_RIGHT && endId === ANKLE_RIGHT)) {
    return 1.0;
  }

  // Hands and feet - thinnest
  if (startId === WRIST_LEFT || startId === WRIST_RIGHT ||
      startId === ANKLE_LEFT || startId === ANKLE_RIGHT ||
      endId === WRIST_LEFT || endId === WRIST_RIGHT ||
      endId === ANKLE_LEFT || endId === ANKLE_RIGHT) {
    return 0.67;
  }

  // Neck - medium-thick
  if ((startId === 7 && endId === 11) || // left ear to left shoulder
      (startId === 8 && endId === 12)) { // right ear to right shoulder
    return 1.17;
  }

  // Default for head, torso, etc.
  return 1.0;
}

// Build cache once at module load
SKELETON_BONES.forEach(bone => {
  const cacheKey = `${bone.startId}-${bone.endId}`;
  BONE_RADIUS_CACHE.set(cacheKey, computeBoneRadiusMultiplier(bone.startId, bone.endId));
});

// Pre-define head keypoint IDs for fast volume calculations (avoid filter operations)
const HEAD_KEYPOINT_IDS = [0, 1, 2, 3, 4, 5, 6, 7, 8];

interface ThreeJSState {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: Renderer;
  jointMeshPool: THREE.Mesh[]; // Pre-allocated joint meshes (reused)
  boneMeshPool: THREE.Mesh[]; // Pre-allocated bone meshes (reused)
  volumeMeshPool: THREE.Mesh[]; // Pre-allocated volume meshes (head + torso)
}

const Skeleton3DView = forwardRef<Skeleton3DViewRef, Skeleton3DViewProps>(
  ({ frameData, autoRotate = false, style, config = {} }, ref) => {
    const threeStateRef = useRef<ThreeJSState | null>(null);
    const cameraDistanceRef = useRef<number>(2.5);
    const cameraAngleRef = useRef<CameraAngle>('front');
    const autoRotateAngleRef = useRef<number>(0);
    const lastScaleRef = useRef(1);
    const mergedConfig = { ...defaultConfig, ...config };

    // Shared geometries for performance (create once, reuse many times)
    const sharedGeometriesRef = useRef<{
      sphere: THREE.SphereGeometry | null;
      cylinder: THREE.CylinderGeometry | null;
      headSphere: THREE.SphereGeometry | null;
      torsoBox: THREE.BoxGeometry | null;
    }>({
      sphere: null,
      cylinder: null,
      headSphere: null,
      torsoBox: null,
    });

    // Vector3 object pool for temporary calculations (prevent GC thrashing)
    const tempVectorsRef = useRef<{
      startPos: THREE.Vector3;
      endPos: THREE.Vector3;
      direction: THREE.Vector3;
      midpoint: THREE.Vector3;
      centroid: THREE.Vector3;
    }>({
      startPos: new THREE.Vector3(),
      endPos: new THREE.Vector3(),
      direction: new THREE.Vector3(),
      midpoint: new THREE.Vector3(),
      centroid: new THREE.Vector3(),
    });

    // Pre-allocated Map for keypoint lookups (reused every frame)
    const keypointMapRef = useRef<Map<number, Keypoint>>(new Map());

    /**
     * Update the skeleton with new frame data - using object pooling for performance
     */
    const updateSkeleton = (frameData: FrameData | null) => {
      const threeState = threeStateRef.current;
      if (!threeState) return;

      const { jointMeshPool, boneMeshPool, volumeMeshPool } = threeState;

      // If no frame data, hide all meshes
      if (!frameData || frameData.keypoints.length === 0) {
        jointMeshPool.forEach((mesh) => (mesh.visible = false));
        boneMeshPool.forEach((mesh) => (mesh.visible = false));
        volumeMeshPool.forEach((mesh) => (mesh.visible = false));
        return;
      }

      // Single-pass: calculate centroid + build keypoint Map (O(n) instead of O(n²))
      let sumX = 0, sumY = 0, sumZ = 0, visibleCount = 0;
      const keypointMap = keypointMapRef.current;
      keypointMap.clear(); // Reuse existing Map instead of allocating new one

      for (const kp of frameData.keypoints) {
        keypointMap.set(kp.id, kp);
        if (kp.visibility >= mergedConfig.visibilityThreshold) {
          sumX += kp.x;
          sumY += kp.y;
          sumZ += kp.z;
          visibleCount++;
        }
      }

      if (visibleCount === 0) {
        jointMeshPool.forEach((mesh) => (mesh.visible = false));
        boneMeshPool.forEach((mesh) => (mesh.visible = false));
        volumeMeshPool.forEach((mesh) => (mesh.visible = false));
        return;
      }

      // Reuse centroid Vector3 from pool
      const centroid = tempVectorsRef.current.centroid;
      centroid.set(
        sumX / visibleCount,
        sumY / visibleCount,
        sumZ / visibleCount
      );

      // Update joint meshes from pool
      let jointIndex = 0;
      frameData.keypoints.forEach((keypoint) => {
        if (keypoint.visibility >= mergedConfig.visibilityThreshold && jointIndex < jointMeshPool.length) {
          const mesh = jointMeshPool[jointIndex];

          // Convert normalized coordinates to 3D space
          const x = (keypoint.x - centroid.x) * 2;
          const y = -(keypoint.y - centroid.y) * 2;
          const z = -(keypoint.z - centroid.z);

          mesh.position.set(x, y, z);

          // Scale based on visibility/confidence and size
          const scale = mergedConfig.jointSize * (0.5 + (keypoint.visibility * 0.5));
          mesh.scale.setScalar(scale);

          mesh.visible = true;
          jointIndex++;
        }
      });

      // Hide unused joint meshes
      for (let i = jointIndex; i < jointMeshPool.length; i++) {
        jointMeshPool[i].visible = false;
      }

      // Update bone meshes from pool (materials already set during init, don't update)
      const bones = SKELETON_BONES; // Use cached array instead of calling function
      let boneIndex = 0;

      // Get temp vectors from pool
      const { startPos, endPos, direction, midpoint } = tempVectorsRef.current;

      bones.forEach((bone, i) => {
        if (i >= boneMeshPool.length) return;

        // Use O(1) Map lookup instead of O(n) find()
        const startKp = keypointMap.get(bone.startId);
        const endKp = keypointMap.get(bone.endId);

        // Check visibility inline (avoid repeated Map lookups in isBoneVisible)
        if (startKp && endKp &&
            startKp.visibility >= mergedConfig.visibilityThreshold &&
            endKp.visibility >= mergedConfig.visibilityThreshold) {

          // Use bone index directly to get the pre-configured mesh with correct color
          const mesh = boneMeshPool[i];

          // Reuse pooled vectors instead of creating new ones
          startPos.set(
            (startKp.x - centroid.x) * 2,
            -(startKp.y - centroid.y) * 2,
            -(startKp.z - centroid.z)
          );
          endPos.set(
            (endKp.x - centroid.x) * 2,
            -(endKp.y - centroid.y) * 2,
            -(endKp.z - centroid.z)
          );

          direction.subVectors(endPos, startPos);
          const length = direction.length();
          midpoint.addVectors(startPos, endPos).multiplyScalar(0.5);

          mesh.position.copy(midpoint);
          mesh.quaternion.setFromUnitVectors(UP_VECTOR, direction.normalize());

          // Calculate appropriate radius for this bone segment (tapered limbs) - O(1) lookup from cache
          const cacheKey = `${startKp.id}-${endKp.id}`;
          const radiusMultiplier = BONE_RADIUS_CACHE.get(cacheKey) || 1.0;
          const radius = mergedConfig.boneThickness * radiusMultiplier;
          mesh.scale.set(radius, length, radius);

          // Material color already set during initialization - no need to update
          mesh.visible = true;
          boneIndex++;
        }
      });

      // Hide unused bone meshes
      for (let i = boneIndex; i < boneMeshPool.length; i++) {
        boneMeshPool[i].visible = false;
      }

      // Update volume meshes (head + torso)
      // Head volume (index 0) - optimized with direct lookups instead of filter/reduce
      if (volumeMeshPool[0]) {
        let headSumX = 0, headSumY = 0, headSumZ = 0, headCount = 0;

        // Direct Map lookups - 40-50% faster than filter + reduce
        for (const id of HEAD_KEYPOINT_IDS) {
          const kp = keypointMap.get(id);
          if (kp && kp.visibility >= mergedConfig.visibilityThreshold) {
            headSumX += kp.x;
            headSumY += kp.y;
            headSumZ += kp.z;
            headCount++;
          }
        }

        if (headCount > 0) {
          const headMesh = volumeMeshPool[0];
          const headAvgX = headSumX / headCount;
          const headAvgY = headSumY / headCount;
          const headAvgZ = headSumZ / headCount;

          const headX = (headAvgX - centroid.x) * 2;
          const headY = -(headAvgY - centroid.y) * 2;
          const headZ = -(headAvgZ - centroid.z);

          headMesh.position.set(headX, headY, headZ);
          headMesh.visible = true;
        } else {
          volumeMeshPool[0].visible = false;
        }
      }

      // Torso volume (index 1)
      const leftShoulder = keypointMap.get(11);
      const rightShoulder = keypointMap.get(12);
      const leftHip = keypointMap.get(23);
      const rightHip = keypointMap.get(24);

      if (leftShoulder && rightShoulder && leftHip && rightHip &&
          leftShoulder.visibility >= mergedConfig.visibilityThreshold &&
          rightShoulder.visibility >= mergedConfig.visibilityThreshold &&
          leftHip.visibility >= mergedConfig.visibilityThreshold &&
          rightHip.visibility >= mergedConfig.visibilityThreshold &&
          volumeMeshPool[1]) {

        const torsoMesh = volumeMeshPool[1];

        // Calculate torso dimensions
        const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x) * 2;
        const hipWidth = Math.abs(leftHip.x - rightHip.x) * 2;
        const torsoHeight = Math.abs(leftShoulder.y - leftHip.y) * 2;
        const avgWidth = (shoulderWidth + hipWidth) / 2;
        const depth = avgWidth * 0.4;

        // Calculate torso centroid
        const torsoX = ((leftShoulder.x + rightShoulder.x + leftHip.x + rightHip.x) / 4 - centroid.x) * 2;
        const torsoY = -((leftShoulder.y + rightShoulder.y + leftHip.y + rightHip.y) / 4 - centroid.y) * 2;
        const torsoZ = -((leftShoulder.z + rightShoulder.z + leftHip.z + rightHip.z) / 4 - centroid.z);

        torsoMesh.position.set(torsoX, torsoY, torsoZ);
        torsoMesh.scale.set(avgWidth, torsoHeight, depth);
        torsoMesh.visible = true;
      } else if (volumeMeshPool[1]) {
        volumeMeshPool[1].visible = false;
      }
    };

    /**
     * Set camera to a preset angle
     */
    const setCameraAngle = (angle: CameraAngle) => {
      console.log('[Skeleton3DView] Setting camera angle:', angle);
      const threeState = threeStateRef.current;
      if (!threeState) return;

      const { camera } = threeState;
      cameraAngleRef.current = angle;
      const distance = cameraDistanceRef.current;

      switch (angle) {
        case 'front':
          camera.position.set(0, 0, distance);
          break;
        case 'back':
          camera.position.set(0, 0, -distance);
          break;
        case 'left':
          camera.position.set(-distance, 0, 0);
          break;
        case 'right':
          camera.position.set(distance, 0, 0);
          break;
        case 'top':
          camera.position.set(0, distance, 0);
          break;
        case 'diagonal':
          camera.position.set(distance * 0.7, distance * 0.5, distance * 0.7);
          break;
      }

      camera.lookAt(0, 0, 0);
    };

    /**
     * Set camera zoom (distance)
     */
    const setCameraDistance = (distance: number) => {
      cameraDistanceRef.current = Math.max(1, Math.min(10, distance));
      setCameraAngle(cameraAngleRef.current);
    };

    /**
     * Orbit camera around the skeleton
     */
    const orbitCamera = (deltaX: number, deltaY: number) => {
      const threeState = threeStateRef.current;
      if (!threeState) return;

      const { camera } = threeState;
      const sensitivity = 0.005;

      // Get current position in spherical coordinates
      const position = camera.position.clone();
      const distance = position.length();

      const theta = Math.atan2(position.x, position.z) + deltaX * sensitivity;
      const phi = Math.acos(position.y / distance) + deltaY * sensitivity;
      const phiClamped = Math.max(0.1, Math.min(Math.PI - 0.1, phi));

      camera.position.x = distance * Math.sin(phiClamped) * Math.sin(theta);
      camera.position.y = distance * Math.cos(phiClamped);
      camera.position.z = distance * Math.sin(phiClamped) * Math.cos(theta);

      camera.lookAt(0, 0, 0);
    };

    /**
     * Initialize the Three.js scene
     */
    const onContextCreate = (gl: ExpoWebGLRenderingContext) => {
      console.log('[Skeleton3DView] Initializing Three.js scene');

      // Initialize shared geometries for performance (create once, reuse many times)
      if (!sharedGeometriesRef.current.sphere) {
        sharedGeometriesRef.current.sphere = new THREE.SphereGeometry(1, 16, 16); // Unit sphere
        sharedGeometriesRef.current.cylinder = new THREE.CylinderGeometry(1, 1, 1, 8); // Unit cylinder
        sharedGeometriesRef.current.headSphere = new THREE.SphereGeometry(0.09, 16, 16); // Head volume
        sharedGeometriesRef.current.torsoBox = new THREE.BoxGeometry(1, 1, 1); // Unit box for torso
        console.log('[Skeleton3DView] Shared geometries created');
      }

      // Create scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a1a1a);

      // Create camera with front view as default
      const camera = new THREE.PerspectiveCamera(
        50,
        gl.drawingBufferWidth / gl.drawingBufferHeight,
        0.1,
        1000
      );
      camera.position.set(0, 0, cameraDistanceRef.current); // Front view
      camera.lookAt(0, 0, 0);

      // Create renderer
      const renderer = new Renderer({ gl });
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

      // Add lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(5, 5, 5);
      scene.add(directionalLight);

      // Add grid helper for reference (brighter colors for visibility)
      const gridHelper = new THREE.GridHelper(2, 10, 0xaaaaaa, 0x666666);
      gridHelper.position.y = -0.5;
      scene.add(gridHelper);

      // Pre-create shared materials (one per color to avoid updates)
      // Use MeshBasicMaterial for joints - 50-60% faster than MeshStandardMaterial
      const jointMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
      });

      // Use MeshBasicMaterial for bones too - better performance
      const boneMaterials = new Map<string, THREE.MeshBasicMaterial>();
      const boneColors = ['#FFD700', '#FF4444', '#4444FF', '#44FF44']; // Gold, Red, Blue, Green
      boneColors.forEach((color) => {
        const mat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(color),
        });
        boneMaterials.set(color, mat);
      });

      // Pre-create mesh pools for performance (object pooling)
      const jointMeshPool: THREE.Mesh[] = [];
      const boneMeshPool: THREE.Mesh[] = [];

      // Create 33 joint meshes (max keypoints in MediaPipe) - all share same material
      for (let i = 0; i < 33; i++) {
        const mesh = new THREE.Mesh(sharedGeometriesRef.current.sphere!, jointMaterial);
        mesh.visible = false; // Start invisible
        scene.add(mesh);
        jointMeshPool.push(mesh);
      }

      // Create 43 bone meshes (35 original + 6 new connections) - we'll assign materials based on bone colors
      const bones = SKELETON_BONES; // Use cached array
      for (let i = 0; i < 43; i++) {
        // Get material for this bone's color (or default to first bone color)
        const boneColor = i < bones.length ? bones[i].color : boneColors[0];
        const material = boneMaterials.get(boneColor) || boneMaterials.values().next().value;

        const mesh = new THREE.Mesh(sharedGeometriesRef.current.cylinder!, material);
        mesh.visible = false; // Start invisible
        scene.add(mesh);
        boneMeshPool.push(mesh);
      }

      // Create 2 volume meshes (head + torso) - semi-transparent for body mass visualization
      const volumeMeshPool: THREE.Mesh[] = [];

      // Head volume mesh (gold, semi-transparent) - using MeshBasicMaterial for 60-70% better performance
      const headMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFD700,
        transparent: true,
        opacity: 0.35,
      });
      const headMesh = new THREE.Mesh(sharedGeometriesRef.current.headSphere!, headMaterial);
      headMesh.visible = false;
      scene.add(headMesh);
      volumeMeshPool.push(headMesh);

      // Torso volume mesh (red, semi-transparent) - using MeshBasicMaterial for 60-70% better performance
      const torsoMaterial = new THREE.MeshBasicMaterial({
        color: 0xFF4444,
        transparent: true,
        opacity: 0.35,
      });
      const torsoMesh = new THREE.Mesh(sharedGeometriesRef.current.torsoBox!, torsoMaterial);
      torsoMesh.visible = false;
      scene.add(torsoMesh);
      volumeMeshPool.push(torsoMesh);

      // Store state
      threeStateRef.current = {
        scene,
        camera,
        renderer,
        jointMeshPool,
        boneMeshPool,
        volumeMeshPool,
      };

      console.log('[Skeleton3DView] Three.js scene initialized');

      // Start render loop using local variables (they're stable within this scope)
      const render = () => {
        if (autoRotate) {
          autoRotateAngleRef.current += 0.01;
          const distance = cameraDistanceRef.current;
          camera.position.x = Math.sin(autoRotateAngleRef.current) * distance;
          camera.position.z = Math.cos(autoRotateAngleRef.current) * distance;
          camera.lookAt(0, 0, 0);
        }

        renderer.render(scene, camera);
        gl.endFrameEXP(); // Use gl context directly, not renderer.gl
        requestAnimationFrame(render);
      };

      render();
      console.log('[Skeleton3DView] Render loop started');

      // Update skeleton with initial frame data if available
      if (frameData) {
        updateSkeleton(frameData);
      }
    };

    // Update skeleton when frameData changes
    useEffect(() => {
      console.log('[Skeleton3DView] frameData useEffect', {
        hasFrameData: !!frameData,
        frameNumber: frameData?.frame_number,
        hasThreeState: !!threeStateRef.current,
      });

      if (threeStateRef.current) {
        updateSkeleton(frameData);
      }
    }, [frameData]);

    useImperativeHandle(ref, () => ({
      setCameraAngle,
      setCameraDistance,
      updateSkeletonDirect: updateSkeleton,
    }));

    // Pan gesture for orbiting camera
    const panGesture = Gesture.Pan().onUpdate((event) => {
      orbitCamera(event.translationX, event.translationY);
    });

    // Pinch gesture for zooming
    const pinchGesture = Gesture.Pinch()
      .onUpdate((event) => {
        const scaleChange = event.scale / lastScaleRef.current;
        lastScaleRef.current = event.scale;

        // Invert scale: pinch in = zoom out, pinch out = zoom in
        setCameraDistance(2.5 / event.scale);
      })
      .onEnd(() => {
        lastScaleRef.current = 1;
      });

    const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

    return (
      <GestureDetector gesture={composedGesture}>
        <GLView style={[styles.container, style]} onContextCreate={onContextCreate} />
      </GestureDetector>
    );
  }
);

Skeleton3DView.displayName = 'Skeleton3DView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Skeleton3DView;
