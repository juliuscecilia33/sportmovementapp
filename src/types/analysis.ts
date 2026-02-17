// Re-export existing pose types
export type {
  Keypoint,
  FrameData,
  VideoInfo,
  AnalysisResult,
  AnalyzeVideoResponse,
} from './pose';

// 3D Skeleton bone connection between two keypoints
export interface SkeletonBone {
  startId: number;
  endId: number;
  color: string;
  segment: BodySegment;
}

// Body segment categories for visualization
export enum BodySegment {
  HEAD = 'head',
  TORSO = 'torso',
  LEFT_ARM = 'left_arm',
  RIGHT_ARM = 'right_arm',
  LEFT_LEG = 'left_leg',
  RIGHT_LEG = 'right_leg',
}

// Camera preset angles
export type CameraAngle = 'front' | 'back' | 'left' | 'right' | 'top' | 'diagonal';

// Camera state for 3D view
export interface CameraState {
  angle: CameraAngle;
  distance: number;
  autoRotate: boolean;
  rotationSpeed: number;
}

// Playback state
export interface PlaybackState {
  isPlaying: boolean;
  currentFrame: number;
  currentTime: number;
  speed: number;
  duration: number;
}

// Video sync configuration
export interface VideoSyncConfig {
  fps: number;
  totalFrames: number;
  startFrame: number;
  endFrame: number;
}

// 3D skeleton configuration
export interface SkeletonConfig {
  jointSize: number;
  boneThickness: number;
  visibilityThreshold: number;
  showJointLabels: boolean;
}

// MediaPipe Pose landmark indices
export enum MediaPipeLandmark {
  NOSE = 0,
  LEFT_EYE_INNER = 1,
  LEFT_EYE = 2,
  LEFT_EYE_OUTER = 3,
  RIGHT_EYE_INNER = 4,
  RIGHT_EYE = 5,
  RIGHT_EYE_OUTER = 6,
  LEFT_EAR = 7,
  RIGHT_EAR = 8,
  MOUTH_LEFT = 9,
  MOUTH_RIGHT = 10,
  LEFT_SHOULDER = 11,
  RIGHT_SHOULDER = 12,
  LEFT_ELBOW = 13,
  RIGHT_ELBOW = 14,
  LEFT_WRIST = 15,
  RIGHT_WRIST = 16,
  LEFT_PINKY = 17,
  RIGHT_PINKY = 18,
  LEFT_INDEX = 19,
  RIGHT_INDEX = 20,
  LEFT_THUMB = 21,
  RIGHT_THUMB = 22,
  LEFT_HIP = 23,
  RIGHT_HIP = 24,
  LEFT_KNEE = 25,
  RIGHT_KNEE = 26,
  LEFT_ANKLE = 27,
  RIGHT_ANKLE = 28,
  LEFT_HEEL = 29,
  RIGHT_HEEL = 30,
  LEFT_FOOT_INDEX = 31,
  RIGHT_FOOT_INDEX = 32,
}
