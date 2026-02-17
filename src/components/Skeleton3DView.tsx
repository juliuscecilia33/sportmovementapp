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
}

const defaultConfig: SkeletonConfig = {
  jointSize: 0.02,
  boneThickness: 0.01,
  visibilityThreshold: 0.4,
  showJointLabels: false,
};

interface ThreeJSState {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: Renderer;
  jointMeshPool: THREE.Mesh[]; // Pre-allocated joint meshes (reused)
  boneMeshPool: THREE.Mesh[]; // Pre-allocated bone meshes (reused)
}

const Skeleton3DView = forwardRef<Skeleton3DViewRef, Skeleton3DViewProps>(
  ({ frameData, autoRotate = false, style, config = {} }, ref) => {
    const threeStateRef = useRef<ThreeJSState | null>(null);
    const cameraDistanceRef = useRef<number>(2.5);
    const cameraAngleRef = useRef<CameraAngle>('diagonal');
    const autoRotateAngleRef = useRef<number>(0);
    const lastScaleRef = useRef(1);
    const mergedConfig = { ...defaultConfig, ...config };

    // Shared geometries for performance (create once, reuse many times)
    const sharedGeometriesRef = useRef<{
      sphere: THREE.SphereGeometry | null;
      cylinder: THREE.CylinderGeometry | null;
    }>({
      sphere: null,
      cylinder: null,
    });

    /**
     * Update the skeleton with new frame data - using object pooling for performance
     */
    const updateSkeleton = (frameData: FrameData | null) => {
      const threeState = threeStateRef.current;
      if (!threeState) return;

      const { jointMeshPool, boneMeshPool } = threeState;

      // If no frame data, hide all meshes
      if (!frameData || frameData.keypoints.length === 0) {
        jointMeshPool.forEach((mesh) => (mesh.visible = false));
        boneMeshPool.forEach((mesh) => (mesh.visible = false));
        return;
      }

      // Calculate centroid of visible keypoints to center skeleton at origin
      const visibleKeypoints = frameData.keypoints.filter(
        (kp) => kp.visibility >= mergedConfig.visibilityThreshold
      );

      if (visibleKeypoints.length === 0) {
        jointMeshPool.forEach((mesh) => (mesh.visible = false));
        boneMeshPool.forEach((mesh) => (mesh.visible = false));
        return;
      }

      const centroid = {
        x: visibleKeypoints.reduce((sum, kp) => sum + kp.x, 0) / visibleKeypoints.length,
        y: visibleKeypoints.reduce((sum, kp) => sum + kp.y, 0) / visibleKeypoints.length,
        z: visibleKeypoints.reduce((sum, kp) => sum + kp.z, 0) / visibleKeypoints.length,
      };

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
      const bones = getSkeletonBones();
      let boneIndex = 0;

      bones.forEach((bone, i) => {
        if (isBoneVisible(bone, frameData.keypoints, mergedConfig.visibilityThreshold) && i < boneMeshPool.length) {
          const startKp = frameData.keypoints.find((kp) => kp.id === bone.startId);
          const endKp = frameData.keypoints.find((kp) => kp.id === bone.endId);

          if (startKp && endKp) {
            // Use bone index directly to get the pre-configured mesh with correct color
            const mesh = boneMeshPool[i];

            const startPos = new THREE.Vector3(
              (startKp.x - centroid.x) * 2,
              -(startKp.y - centroid.y) * 2,
              -(startKp.z - centroid.z)
            );
            const endPos = new THREE.Vector3(
              (endKp.x - centroid.x) * 2,
              -(endKp.y - centroid.y) * 2,
              -(endKp.z - centroid.z)
            );

            const direction = new THREE.Vector3().subVectors(endPos, startPos);
            const length = direction.length();
            const midpoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);

            mesh.position.copy(midpoint);
            mesh.quaternion.setFromUnitVectors(
              new THREE.Vector3(0, 1, 0),
              direction.normalize()
            );
            mesh.scale.set(mergedConfig.boneThickness, length, mergedConfig.boneThickness);

            // Material color already set during initialization - no need to update
            mesh.visible = true;
            boneIndex++;
          }
        }
      });

      // Hide unused bone meshes
      for (let i = boneIndex; i < boneMeshPool.length; i++) {
        boneMeshPool[i].visible = false;
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
        console.log('[Skeleton3DView] Shared geometries created');
      }

      // Create scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a1a1a);

      // Create camera
      const camera = new THREE.PerspectiveCamera(
        50,
        gl.drawingBufferWidth / gl.drawingBufferHeight,
        0.1,
        1000
      );
      camera.position.set(
        cameraDistanceRef.current * 0.7,
        cameraDistanceRef.current * 0.5,
        cameraDistanceRef.current * 0.7
      );
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
      const jointMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x222222,
        metalness: 0.3,
        roughness: 0.7,
      });

      const boneMaterials = new Map<string, THREE.MeshStandardMaterial>();
      const boneColors = ['#FFD700', '#FF4444', '#4444FF', '#44FF44']; // Gold, Red, Blue, Green
      boneColors.forEach((color) => {
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(color),
          emissive: new THREE.Color(color).multiplyScalar(0.2),
          metalness: 0.4,
          roughness: 0.6,
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

      // Create 37 bone meshes - we'll assign materials based on bone colors
      const bones = getSkeletonBones();
      for (let i = 0; i < 37; i++) {
        // Get material for this bone's color (or default to first bone color)
        const boneColor = i < bones.length ? bones[i].color : boneColors[0];
        const material = boneMaterials.get(boneColor) || boneMaterials.values().next().value;

        const mesh = new THREE.Mesh(sharedGeometriesRef.current.cylinder!, material);
        mesh.visible = false; // Start invisible
        scene.add(mesh);
        boneMeshPool.push(mesh);
      }

      // Store state
      threeStateRef.current = {
        scene,
        camera,
        renderer,
        jointMeshPool,
        boneMeshPool,
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
