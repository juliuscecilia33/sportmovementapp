import { useRef, useEffect, useCallback, useMemo } from 'react';
import { ExpoWebGLRenderingContext } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import {
  FrameData,
  CameraAngle,
  SkeletonConfig,
  Keypoint,
} from '../types/analysis';
import { getSkeletonBones, isBoneVisible } from '../services/skeletonBuilder';

interface SkeletonRendererState {
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  renderer: Renderer | null;
  jointMeshes: Map<number, THREE.Mesh>;
  boneMeshes: THREE.Mesh[];
  volumeMeshes: THREE.Mesh[];
}

export function useSkeletonRenderer(config: SkeletonConfig) {
  const stateRef = useRef<SkeletonRendererState>({
    scene: null,
    camera: null,
    renderer: null,
    jointMeshes: new Map(),
    boneMeshes: [],
    volumeMeshes: [],
  });

  const autoRotateRef = useRef<number>(0);
  const cameraDistanceRef = useRef<number>(2.5);
  const cameraAngleRef = useRef<CameraAngle>('front');

  /**
   * Initialize the Three.js scene
   */
  const initializeScene = useCallback((gl: ExpoWebGLRenderingContext) => {
    console.log('[useSkeletonRenderer] Initializing scene');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    const camera = new THREE.PerspectiveCamera(
      50,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, cameraDistanceRef.current);
    camera.lookAt(0, 0, 0);

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

    stateRef.current = {
      scene,
      camera,
      renderer,
      jointMeshes: new Map(),
      boneMeshes: [],
      volumeMeshes: [],
    };

    console.log('[useSkeletonRenderer] Scene initialized successfully');
    return { scene, camera, renderer };
  }, []);

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
    // X and Y are normalized [0,1], Z is already in meters
    const x = (keypoint.x - centroid.x) * 2; // Center around centroid
    const y = -(keypoint.y - centroid.y) * 2; // Center and flip Y
    const z = -(keypoint.z - centroid.z); // Center Z and negate for correct depth

    mesh.position.set(x, y, z);

    // Scale based on visibility/confidence
    const scale = 0.5 + (keypoint.visibility * 0.5);
    mesh.scale.setScalar(scale);

    return mesh;
  };

  /**
   * Get bone radius based on body segment for realistic proportions
   */
  const getBoneRadius = (startId: number, endId: number, baseThickness: number): number => {
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
      return baseThickness * 1.5; // 0.045 if baseThickness is 0.03
    }

    // Forearms (elbow to wrist) - medium
    if ((startId === ELBOW_LEFT && endId === WRIST_LEFT) ||
        (startId === ELBOW_RIGHT && endId === WRIST_RIGHT)) {
      return baseThickness * 1.0; // 0.03
    }

    // Upper legs (hip to knee) - thickest
    if ((startId === HIP_LEFT && endId === KNEE_LEFT) ||
        (startId === HIP_RIGHT && endId === KNEE_RIGHT)) {
      return baseThickness * 1.5; // 0.045
    }

    // Lower legs (knee to ankle) - medium
    if ((startId === KNEE_LEFT && endId === ANKLE_LEFT) ||
        (startId === KNEE_RIGHT && endId === ANKLE_RIGHT)) {
      return baseThickness * 1.0; // 0.03
    }

    // Hands and feet - thinnest
    if (startId === WRIST_LEFT || startId === WRIST_RIGHT ||
        startId === ANKLE_LEFT || startId === ANKLE_RIGHT ||
        endId === WRIST_LEFT || endId === WRIST_RIGHT ||
        endId === ANKLE_LEFT || endId === ANKLE_RIGHT) {
      return baseThickness * 0.67; // 0.02
    }

    // Neck - medium-thick
    if ((startId === 7 && endId === 11) || // left ear to left shoulder
        (startId === 8 && endId === 12)) { // right ear to right shoulder
      return baseThickness * 1.17; // 0.035
    }

    // Default to base thickness for head, torso, etc.
    return baseThickness;
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

    // Calculate appropriate radius for this bone segment
    const radius = getBoneRadius(start.id, end.id, thickness);

    const geometry = new THREE.CylinderGeometry(
      radius,
      radius,
      length,
      8
    );
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
   * Create a head sphere volume mesh
   */
  const createHeadVolume = (
    keypoints: Keypoint[],
    centroid: { x: number; y: number; z: number }
  ): THREE.Mesh | null => {
    // Head keypoints: nose, eyes, ears (IDs 0-8)
    const headKeypoints = keypoints.filter(kp => kp.id <= 8 && kp.visibility >= config.visibilityThreshold);

    if (headKeypoints.length === 0) return null;

    // Calculate head centroid
    const headCentroid = {
      x: headKeypoints.reduce((sum, kp) => sum + kp.x, 0) / headKeypoints.length,
      y: headKeypoints.reduce((sum, kp) => sum + kp.y, 0) / headKeypoints.length,
      z: headKeypoints.reduce((sum, kp) => sum + kp.z, 0) / headKeypoints.length,
    };

    const geometry = new THREE.SphereGeometry(0.09, 16, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0xFFD700, // Gold
      transparent: true,
      opacity: 0.35,
      emissive: 0xFFD700,
      emissiveIntensity: 0.1,
      metalness: 0.3,
      roughness: 0.7,
    });
    const mesh = new THREE.Mesh(geometry, material);

    // Position at head centroid
    const x = (headCentroid.x - centroid.x) * 2;
    const y = -(headCentroid.y - centroid.y) * 2;
    const z = -(headCentroid.z - centroid.z);
    mesh.position.set(x, y, z);

    return mesh;
  };

  /**
   * Create a torso box volume mesh
   */
  const createTorsoVolume = (
    keypoints: Keypoint[],
    centroid: { x: number; y: number; z: number }
  ): THREE.Mesh | null => {
    // Torso keypoints: shoulders and hips (IDs 11, 12, 23, 24)
    const leftShoulder = keypoints.find(kp => kp.id === 11);
    const rightShoulder = keypoints.find(kp => kp.id === 12);
    const leftHip = keypoints.find(kp => kp.id === 23);
    const rightHip = keypoints.find(kp => kp.id === 24);

    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return null;
    if (leftShoulder.visibility < config.visibilityThreshold ||
        rightShoulder.visibility < config.visibilityThreshold ||
        leftHip.visibility < config.visibilityThreshold ||
        rightHip.visibility < config.visibilityThreshold) {
      return null;
    }

    // Calculate torso dimensions
    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x) * 2;
    const hipWidth = Math.abs(leftHip.x - rightHip.x) * 2;
    const torsoHeight = Math.abs(leftShoulder.y - leftHip.y) * 2;
    const avgWidth = (shoulderWidth + hipWidth) / 2;
    const depth = avgWidth * 0.4; // Approximate depth as 40% of width

    // Calculate torso centroid
    const torsoCentroid = {
      x: (leftShoulder.x + rightShoulder.x + leftHip.x + rightHip.x) / 4,
      y: (leftShoulder.y + rightShoulder.y + leftHip.y + rightHip.y) / 4,
      z: (leftShoulder.z + rightShoulder.z + leftHip.z + rightHip.z) / 4,
    };

    const geometry = new THREE.BoxGeometry(avgWidth, torsoHeight, depth);
    const material = new THREE.MeshStandardMaterial({
      color: 0xFF4444, // Red
      transparent: true,
      opacity: 0.35,
      emissive: 0xFF4444,
      emissiveIntensity: 0.1,
      metalness: 0.3,
      roughness: 0.7,
    });
    const mesh = new THREE.Mesh(geometry, material);

    // Position at torso centroid
    const x = (torsoCentroid.x - centroid.x) * 2;
    const y = -(torsoCentroid.y - centroid.y) * 2;
    const z = -(torsoCentroid.z - centroid.z);
    mesh.position.set(x, y, z);

    return mesh;
  };

  /**
   * Update the skeleton with new frame data
   */
  const updateSkeleton = useCallback((frameData: FrameData | null) => {
    console.log('[useSkeletonRenderer] updateSkeleton called', {
      hasFrameData: !!frameData,
      keypointsCount: frameData?.keypoints.length ?? 0,
      frameNumber: frameData?.frame_number,
    });

    const { scene, jointMeshes, boneMeshes, volumeMeshes } = stateRef.current;
    if (!scene) {
      console.log('[useSkeletonRenderer] No scene available, skipping update');
      return;
    }

    // Clear existing meshes
    jointMeshes.forEach((mesh) => scene.remove(mesh));
    jointMeshes.clear();
    boneMeshes.forEach((mesh) => scene.remove(mesh));
    boneMeshes.length = 0;
    volumeMeshes.forEach((mesh) => scene.remove(mesh));
    volumeMeshes.length = 0;

    if (!frameData || frameData.keypoints.length === 0) {
      console.log('[useSkeletonRenderer] No frame data or keypoints, clearing skeleton');
      return;
    }

    // Calculate centroid of visible keypoints to center skeleton at origin
    const visibleKeypoints = frameData.keypoints.filter(
      (kp) => kp.visibility >= config.visibilityThreshold
    );

    if (visibleKeypoints.length === 0) {
      console.log('[useSkeletonRenderer] No visible keypoints after filtering');
      return;
    }

    const centroid = {
      x: visibleKeypoints.reduce((sum, kp) => sum + kp.x, 0) / visibleKeypoints.length,
      y: visibleKeypoints.reduce((sum, kp) => sum + kp.y, 0) / visibleKeypoints.length,
      z: visibleKeypoints.reduce((sum, kp) => sum + kp.z, 0) / visibleKeypoints.length,
    };

    console.log('[useSkeletonRenderer] Rendering skeleton:', {
      centroid,
      visibleKeypoints: visibleKeypoints.length,
      totalKeypoints: frameData.keypoints.length,
    });

    const bones = getSkeletonBones();

    // Build connectivity graph to filter out floating joints
    const keypointMap = new Map<number, Keypoint>();
    frameData.keypoints.forEach(kp => keypointMap.set(kp.id, kp));

    const adjacency = new Map<number, Set<number>>();

    bones.forEach((bone) => {
      const startKp = keypointMap.get(bone.startId);
      const endKp = keypointMap.get(bone.endId);

      // Check if bone will be rendered (same logic as bone rendering below)
      if (startKp && endKp &&
          (startKp.visibility >= config.visibilityThreshold ||
           endKp.visibility >= config.visibilityThreshold)) {

        // Build bidirectional adjacency graph
        if (!adjacency.has(bone.startId)) adjacency.set(bone.startId, new Set());
        if (!adjacency.has(bone.endId)) adjacency.set(bone.endId, new Set());
        adjacency.get(bone.startId)!.add(bone.endId);
        adjacency.get(bone.endId)!.add(bone.startId);
      }
    });

    // BFS from torso anchor points to find all connected joints
    const TORSO_ANCHORS = [11, 12, 23, 24]; // Left shoulder, right shoulder, left hip, right hip
    const connectedJoints = new Set<number>();
    const queue: number[] = [];

    // Initialize queue with visible torso anchors
    for (const anchorId of TORSO_ANCHORS) {
      const kp = keypointMap.get(anchorId);
      if (kp && kp.visibility >= config.visibilityThreshold) {
        connectedJoints.add(anchorId);
        queue.push(anchorId);
      }
    }

    // BFS traversal to find all connected joints
    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = adjacency.get(current);

      if (neighbors) {
        for (const neighborId of neighbors) {
          if (!connectedJoints.has(neighborId)) {
            const kp = keypointMap.get(neighborId);
            if (kp && kp.visibility >= config.visibilityThreshold) {
              connectedJoints.add(neighborId);
              queue.push(neighborId);
            }
          }
        }
      }
    }

    // Create bone meshes first (so they appear behind joints)
    bones.forEach((bone) => {
      if (isBoneVisible(bone, frameData.keypoints, config.visibilityThreshold)) {
        const startKp = frameData.keypoints.find((kp) => kp.id === bone.startId);
        const endKp = frameData.keypoints.find((kp) => kp.id === bone.endId);

        if (startKp && endKp) {
          const boneMesh = createBoneMesh(
            startKp,
            endKp,
            bone.color,
            config.boneThickness,
            centroid
          );
          scene.add(boneMesh);
          boneMeshes.push(boneMesh);
        }
      }
    });

    // Create joint meshes (only render connected joints)
    frameData.keypoints.forEach((keypoint) => {
      if (keypoint.visibility >= config.visibilityThreshold && connectedJoints.has(keypoint.id)) {
        const jointMesh = createJointMesh(keypoint, config.jointSize, centroid);
        scene.add(jointMesh);
        jointMeshes.set(keypoint.id, jointMesh);
      }
    });

    // Create volume meshes for body mass visualization
    const headVolume = createHeadVolume(frameData.keypoints, centroid);
    if (headVolume) {
      scene.add(headVolume);
      volumeMeshes.push(headVolume);
    }

    const torsoVolume = createTorsoVolume(frameData.keypoints, centroid);
    if (torsoVolume) {
      scene.add(torsoVolume);
      volumeMeshes.push(torsoVolume);
    }

    stateRef.current.boneMeshes = boneMeshes;
    stateRef.current.volumeMeshes = volumeMeshes;
    console.log('[useSkeletonRenderer] Skeleton rendered:', {
      joints: jointMeshes.size,
      bones: boneMeshes.length,
      volumes: volumeMeshes.length,
    });
  }, [config]);

  /**
   * Set camera to a preset angle
   */
  const setCameraAngle = useCallback((angle: CameraAngle) => {
    console.log('[useSkeletonRenderer] Setting camera angle:', angle);
    const { camera } = stateRef.current;
    if (!camera) {
      console.log('[useSkeletonRenderer] No camera available');
      return;
    }

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
    console.log('[useSkeletonRenderer] Camera position:', camera.position);
  }, []);

  /**
   * Set camera zoom (distance)
   */
  const setCameraDistance = useCallback((distance: number) => {
    cameraDistanceRef.current = Math.max(1, Math.min(10, distance));
    setCameraAngle(cameraAngleRef.current);
  }, [setCameraAngle]);

  /**
   * Orbit camera around the skeleton
   */
  const orbitCamera = useCallback((deltaX: number, deltaY: number) => {
    const { camera } = stateRef.current;
    if (!camera) return;

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
  }, []);

  /**
   * Render loop
   */
  const startRenderLoop = useCallback((autoRotate: boolean = false) => {
    console.log('[useSkeletonRenderer] Starting render loop, autoRotate:', autoRotate);
    const { scene, camera, renderer } = stateRef.current;
    if (!scene || !camera || !renderer) {
      console.log('[useSkeletonRenderer] Cannot start render loop - missing scene/camera/renderer');
      return;
    }

    const render = () => {
      if (autoRotate) {
        autoRotateRef.current += 0.01;
        const distance = cameraDistanceRef.current;
        camera.position.x = Math.sin(autoRotateRef.current) * distance;
        camera.position.z = Math.cos(autoRotateRef.current) * distance;
        camera.lookAt(0, 0, 0);
      }

      renderer.render(scene, camera);
      renderer.gl.endFrameEXP();
      requestAnimationFrame(render);
    };

    render();
  }, []);

  return useMemo(
    () => ({
      initializeScene,
      updateSkeleton,
      setCameraAngle,
      setCameraDistance,
      orbitCamera,
      startRenderLoop,
    }),
    [
      initializeScene,
      updateSkeleton,
      setCameraAngle,
      setCameraDistance,
      orbitCamera,
      startRenderLoop,
    ]
  );
}
