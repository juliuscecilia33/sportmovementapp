import { useRef, useEffect } from 'react';
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
}

export function useSkeletonRenderer(config: SkeletonConfig) {
  const stateRef = useRef<SkeletonRendererState>({
    scene: null,
    camera: null,
    renderer: null,
    jointMeshes: new Map(),
    boneMeshes: [],
  });

  const autoRotateRef = useRef<number>(0);
  const cameraDistanceRef = useRef<number>(2.5);
  const cameraAngleRef = useRef<CameraAngle>('front');

  /**
   * Initialize the Three.js scene
   */
  const initializeScene = (gl: ExpoWebGLRenderingContext) => {
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
    };

    return { scene, camera, renderer };
  };

  /**
   * Create a joint (sphere) mesh
   */
  const createJointMesh = (
    keypoint: Keypoint,
    size: number
  ): THREE.Mesh => {
    const geometry = new THREE.SphereGeometry(size, 16, 16);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x222222,
      metalness: 0.3,
      roughness: 0.7,
    });
    const mesh = new THREE.Mesh(geometry, material);

    // Convert normalized coordinates to 3D space
    // X and Y are normalized [0,1], Z is already in meters
    const x = (keypoint.x - 0.5) * 2; // Convert to [-1, 1]
    const y = -(keypoint.y - 0.5) * 2; // Convert to [-1, 1] and flip Y
    const z = -keypoint.z; // Negate Z for correct depth

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
    thickness: number
  ): THREE.Mesh => {
    const startPos = new THREE.Vector3(
      (start.x - 0.5) * 2,
      -(start.y - 0.5) * 2,
      -start.z
    );
    const endPos = new THREE.Vector3(
      (end.x - 0.5) * 2,
      -(end.y - 0.5) * 2,
      -end.z
    );

    const direction = new THREE.Vector3().subVectors(endPos, startPos);
    const length = direction.length();
    const midpoint = new THREE.Vector3().addVectors(startPos, endPos).multiplyScalar(0.5);

    const geometry = new THREE.CylinderGeometry(
      thickness,
      thickness,
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
   * Update the skeleton with new frame data
   */
  const updateSkeleton = (frameData: FrameData | null) => {
    const { scene, jointMeshes, boneMeshes } = stateRef.current;
    if (!scene) return;

    // Clear existing meshes
    jointMeshes.forEach((mesh) => scene.remove(mesh));
    jointMeshes.clear();
    boneMeshes.forEach((mesh) => scene.remove(mesh));
    boneMeshes.length = 0;

    if (!frameData || frameData.keypoints.length === 0) {
      return;
    }

    const bones = getSkeletonBones();

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
            config.boneThickness
          );
          scene.add(boneMesh);
          boneMeshes.push(boneMesh);
        }
      }
    });

    // Create joint meshes
    frameData.keypoints.forEach((keypoint) => {
      if (keypoint.visibility >= config.visibilityThreshold) {
        const jointMesh = createJointMesh(keypoint, config.jointSize);
        scene.add(jointMesh);
        jointMeshes.set(keypoint.id, jointMesh);
      }
    });

    stateRef.current.boneMeshes = boneMeshes;
  };

  /**
   * Set camera to a preset angle
   */
  const setCameraAngle = (angle: CameraAngle) => {
    const { camera } = stateRef.current;
    if (!camera) return;

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
  };

  /**
   * Render loop
   */
  const startRenderLoop = (autoRotate: boolean = false) => {
    const { scene, camera, renderer } = stateRef.current;
    if (!scene || !camera || !renderer) return;

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
  };

  return {
    initializeScene,
    updateSkeleton,
    setCameraAngle,
    setCameraDistance,
    orbitCamera,
    startRenderLoop,
  };
}
