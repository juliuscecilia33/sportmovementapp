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
  jointMeshes: Map<number, THREE.Mesh>;
  boneMeshes: THREE.Mesh[];
}

const Skeleton3DView = forwardRef<Skeleton3DViewRef, Skeleton3DViewProps>(
  ({ frameData, autoRotate = false, style, config = {} }, ref) => {
    const threeStateRef = useRef<ThreeJSState | null>(null);
    const cameraDistanceRef = useRef<number>(2.5);
    const cameraAngleRef = useRef<CameraAngle>('diagonal');
    const autoRotateAngleRef = useRef<number>(0);
    const lastScaleRef = useRef(1);
    const mergedConfig = { ...defaultConfig, ...config };

    /**
     * Create a joint (sphere) mesh
     */
    const createJointMesh = (
      keypoint: Keypoint,
      size: number,
      centroid: { x: number; y: number; z: number }
    ): THREE.Mesh => {
      const geometry = new THREE.SphereGeometry(size, 16, 16);
      const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x222222,
        metalness: 0.3,
        roughness: 0.7,
      });
      const mesh = new THREE.Mesh(geometry, material);

      // Convert normalized coordinates to 3D space, centered around skeleton centroid
      const x = (keypoint.x - centroid.x) * 2;
      const y = -(keypoint.y - centroid.y) * 2;
      const z = -(keypoint.z - centroid.z);

      mesh.position.set(x, y, z);

      // Scale based on visibility/confidence
      const scale = 0.5 + (keypoint.visibility * 0.5);
      mesh.scale.setScalar(scale);

      return mesh;
    };

    /**
     * Create a bone (cylinder) mesh between two keypoints
     */
    const createBoneMesh = (
      start: Keypoint,
      end: Keypoint,
      color: string,
      thickness: number,
      centroid: { x: number; y: number; z: number }
    ): THREE.Mesh => {
      const startPos = new THREE.Vector3(
        (start.x - centroid.x) * 2,
        -(start.y - centroid.y) * 2,
        -(start.z - centroid.z)
      );
      const endPos = new THREE.Vector3(
        (end.x - centroid.x) * 2,
        -(end.y - centroid.y) * 2,
        -(end.z - centroid.z)
      );

      const direction = new THREE.Vector3().subVectors(endPos, startPos);
      const length = direction.length();
      const midpoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);

      const geometry = new THREE.CylinderGeometry(thickness, thickness, length, 8);
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        emissive: new THREE.Color(color).multiplyScalar(0.2),
        metalness: 0.4,
        roughness: 0.6,
      });
      const mesh = new THREE.Mesh(geometry, material);

      mesh.position.copy(midpoint);
      mesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        direction.normalize()
      );

      return mesh;
    };

    /**
     * Update the skeleton with new frame data
     */
    const updateSkeleton = (frameData: FrameData | null) => {
      console.log('[Skeleton3DView] updateSkeleton called', {
        hasFrameData: !!frameData,
        keypointsCount: frameData?.keypoints.length ?? 0,
        frameNumber: frameData?.frame_number,
      });

      const threeState = threeStateRef.current;
      if (!threeState) {
        console.log('[Skeleton3DView] No three state, skipping update');
        return;
      }

      const { scene, jointMeshes, boneMeshes } = threeState;

      // Clear existing meshes
      jointMeshes.forEach((mesh) => scene.remove(mesh));
      jointMeshes.clear();
      boneMeshes.forEach((mesh) => scene.remove(mesh));
      boneMeshes.length = 0;

      if (!frameData || frameData.keypoints.length === 0) {
        console.log('[Skeleton3DView] No frame data or keypoints');
        return;
      }

      // Calculate centroid of visible keypoints to center skeleton at origin
      const visibleKeypoints = frameData.keypoints.filter(
        (kp) => kp.visibility >= mergedConfig.visibilityThreshold
      );

      if (visibleKeypoints.length === 0) {
        console.log('[Skeleton3DView] No visible keypoints after filtering');
        return;
      }

      const centroid = {
        x: visibleKeypoints.reduce((sum, kp) => sum + kp.x, 0) / visibleKeypoints.length,
        y: visibleKeypoints.reduce((sum, kp) => sum + kp.y, 0) / visibleKeypoints.length,
        z: visibleKeypoints.reduce((sum, kp) => sum + kp.z, 0) / visibleKeypoints.length,
      };

      console.log('[Skeleton3DView] Rendering skeleton:', {
        centroid,
        visibleKeypoints: visibleKeypoints.length,
      });

      const bones = getSkeletonBones();

      // Create bone meshes first (so they appear behind joints)
      bones.forEach((bone) => {
        if (isBoneVisible(bone, frameData.keypoints, mergedConfig.visibilityThreshold)) {
          const startKp = frameData.keypoints.find((kp) => kp.id === bone.startId);
          const endKp = frameData.keypoints.find((kp) => kp.id === bone.endId);

          if (startKp && endKp) {
            const boneMesh = createBoneMesh(
              startKp,
              endKp,
              bone.color,
              mergedConfig.boneThickness,
              centroid
            );
            scene.add(boneMesh);
            boneMeshes.push(boneMesh);
          }
        }
      });

      // Create joint meshes
      frameData.keypoints.forEach((keypoint) => {
        if (keypoint.visibility >= mergedConfig.visibilityThreshold) {
          const jointMesh = createJointMesh(keypoint, mergedConfig.jointSize, centroid);
          scene.add(jointMesh);
          jointMeshes.set(keypoint.id, jointMesh);
        }
      });

      console.log('[Skeleton3DView] Skeleton rendered:', {
        joints: jointMeshes.size,
        bones: boneMeshes.length,
      });
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

      // Add grid helper for reference
      const gridHelper = new THREE.GridHelper(2, 10, 0x444444, 0x222222);
      gridHelper.position.y = -0.5;
      scene.add(gridHelper);

      // Store state
      threeStateRef.current = {
        scene,
        camera,
        renderer,
        jointMeshes: new Map(),
        boneMeshes: [],
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
