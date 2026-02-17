import { SkeletonBone, BodySegment, MediaPipeLandmark } from '../types/analysis';

// Color scheme for body segments
const COLORS = {
  HEAD: '#FFD700', // Gold
  TORSO: '#FF4444', // Red
  LEFT_ARM: '#4444FF', // Blue
  RIGHT_ARM: '#4444FF', // Blue
  LEFT_LEG: '#44FF44', // Green
  RIGHT_LEG: '#44FF44', // Green
};

/**
 * Defines all bone connections in the MediaPipe pose skeleton
 * Each bone connects two keypoints
 */
export function getSkeletonBones(): SkeletonBone[] {
  return [
    // Head connections
    {
      startId: MediaPipeLandmark.NOSE,
      endId: MediaPipeLandmark.LEFT_EYE_INNER,
      color: COLORS.HEAD,
      segment: BodySegment.HEAD,
    },
    {
      startId: MediaPipeLandmark.LEFT_EYE_INNER,
      endId: MediaPipeLandmark.LEFT_EYE,
      color: COLORS.HEAD,
      segment: BodySegment.HEAD,
    },
    {
      startId: MediaPipeLandmark.LEFT_EYE,
      endId: MediaPipeLandmark.LEFT_EYE_OUTER,
      color: COLORS.HEAD,
      segment: BodySegment.HEAD,
    },
    {
      startId: MediaPipeLandmark.LEFT_EYE_OUTER,
      endId: MediaPipeLandmark.LEFT_EAR,
      color: COLORS.HEAD,
      segment: BodySegment.HEAD,
    },
    {
      startId: MediaPipeLandmark.NOSE,
      endId: MediaPipeLandmark.RIGHT_EYE_INNER,
      color: COLORS.HEAD,
      segment: BodySegment.HEAD,
    },
    {
      startId: MediaPipeLandmark.RIGHT_EYE_INNER,
      endId: MediaPipeLandmark.RIGHT_EYE,
      color: COLORS.HEAD,
      segment: BodySegment.HEAD,
    },
    {
      startId: MediaPipeLandmark.RIGHT_EYE,
      endId: MediaPipeLandmark.RIGHT_EYE_OUTER,
      color: COLORS.HEAD,
      segment: BodySegment.HEAD,
    },
    {
      startId: MediaPipeLandmark.RIGHT_EYE_OUTER,
      endId: MediaPipeLandmark.RIGHT_EAR,
      color: COLORS.HEAD,
      segment: BodySegment.HEAD,
    },
    {
      startId: MediaPipeLandmark.MOUTH_LEFT,
      endId: MediaPipeLandmark.MOUTH_RIGHT,
      color: COLORS.HEAD,
      segment: BodySegment.HEAD,
    },

    // Torso connections
    {
      startId: MediaPipeLandmark.LEFT_SHOULDER,
      endId: MediaPipeLandmark.RIGHT_SHOULDER,
      color: COLORS.TORSO,
      segment: BodySegment.TORSO,
    },
    {
      startId: MediaPipeLandmark.LEFT_SHOULDER,
      endId: MediaPipeLandmark.LEFT_HIP,
      color: COLORS.TORSO,
      segment: BodySegment.TORSO,
    },
    {
      startId: MediaPipeLandmark.RIGHT_SHOULDER,
      endId: MediaPipeLandmark.RIGHT_HIP,
      color: COLORS.TORSO,
      segment: BodySegment.TORSO,
    },
    {
      startId: MediaPipeLandmark.LEFT_HIP,
      endId: MediaPipeLandmark.RIGHT_HIP,
      color: COLORS.TORSO,
      segment: BodySegment.TORSO,
    },

    // Left arm connections
    {
      startId: MediaPipeLandmark.LEFT_SHOULDER,
      endId: MediaPipeLandmark.LEFT_ELBOW,
      color: COLORS.LEFT_ARM,
      segment: BodySegment.LEFT_ARM,
    },
    {
      startId: MediaPipeLandmark.LEFT_ELBOW,
      endId: MediaPipeLandmark.LEFT_WRIST,
      color: COLORS.LEFT_ARM,
      segment: BodySegment.LEFT_ARM,
    },
    {
      startId: MediaPipeLandmark.LEFT_WRIST,
      endId: MediaPipeLandmark.LEFT_PINKY,
      color: COLORS.LEFT_ARM,
      segment: BodySegment.LEFT_ARM,
    },
    {
      startId: MediaPipeLandmark.LEFT_WRIST,
      endId: MediaPipeLandmark.LEFT_INDEX,
      color: COLORS.LEFT_ARM,
      segment: BodySegment.LEFT_ARM,
    },
    {
      startId: MediaPipeLandmark.LEFT_WRIST,
      endId: MediaPipeLandmark.LEFT_THUMB,
      color: COLORS.LEFT_ARM,
      segment: BodySegment.LEFT_ARM,
    },
    {
      startId: MediaPipeLandmark.LEFT_PINKY,
      endId: MediaPipeLandmark.LEFT_INDEX,
      color: COLORS.LEFT_ARM,
      segment: BodySegment.LEFT_ARM,
    },

    // Right arm connections
    {
      startId: MediaPipeLandmark.RIGHT_SHOULDER,
      endId: MediaPipeLandmark.RIGHT_ELBOW,
      color: COLORS.RIGHT_ARM,
      segment: BodySegment.RIGHT_ARM,
    },
    {
      startId: MediaPipeLandmark.RIGHT_ELBOW,
      endId: MediaPipeLandmark.RIGHT_WRIST,
      color: COLORS.RIGHT_ARM,
      segment: BodySegment.RIGHT_ARM,
    },
    {
      startId: MediaPipeLandmark.RIGHT_WRIST,
      endId: MediaPipeLandmark.RIGHT_PINKY,
      color: COLORS.RIGHT_ARM,
      segment: BodySegment.RIGHT_ARM,
    },
    {
      startId: MediaPipeLandmark.RIGHT_WRIST,
      endId: MediaPipeLandmark.RIGHT_INDEX,
      color: COLORS.RIGHT_ARM,
      segment: BodySegment.RIGHT_ARM,
    },
    {
      startId: MediaPipeLandmark.RIGHT_WRIST,
      endId: MediaPipeLandmark.RIGHT_THUMB,
      color: COLORS.RIGHT_ARM,
      segment: BodySegment.RIGHT_ARM,
    },
    {
      startId: MediaPipeLandmark.RIGHT_PINKY,
      endId: MediaPipeLandmark.RIGHT_INDEX,
      color: COLORS.RIGHT_ARM,
      segment: BodySegment.RIGHT_ARM,
    },

    // Left leg connections
    {
      startId: MediaPipeLandmark.LEFT_HIP,
      endId: MediaPipeLandmark.LEFT_KNEE,
      color: COLORS.LEFT_LEG,
      segment: BodySegment.LEFT_LEG,
    },
    {
      startId: MediaPipeLandmark.LEFT_KNEE,
      endId: MediaPipeLandmark.LEFT_ANKLE,
      color: COLORS.LEFT_LEG,
      segment: BodySegment.LEFT_LEG,
    },
    {
      startId: MediaPipeLandmark.LEFT_ANKLE,
      endId: MediaPipeLandmark.LEFT_HEEL,
      color: COLORS.LEFT_LEG,
      segment: BodySegment.LEFT_LEG,
    },
    {
      startId: MediaPipeLandmark.LEFT_ANKLE,
      endId: MediaPipeLandmark.LEFT_FOOT_INDEX,
      color: COLORS.LEFT_LEG,
      segment: BodySegment.LEFT_LEG,
    },
    {
      startId: MediaPipeLandmark.LEFT_HEEL,
      endId: MediaPipeLandmark.LEFT_FOOT_INDEX,
      color: COLORS.LEFT_LEG,
      segment: BodySegment.LEFT_LEG,
    },

    // Right leg connections
    {
      startId: MediaPipeLandmark.RIGHT_HIP,
      endId: MediaPipeLandmark.RIGHT_KNEE,
      color: COLORS.RIGHT_LEG,
      segment: BodySegment.RIGHT_LEG,
    },
    {
      startId: MediaPipeLandmark.RIGHT_KNEE,
      endId: MediaPipeLandmark.RIGHT_ANKLE,
      color: COLORS.RIGHT_LEG,
      segment: BodySegment.RIGHT_LEG,
    },
    {
      startId: MediaPipeLandmark.RIGHT_ANKLE,
      endId: MediaPipeLandmark.RIGHT_HEEL,
      color: COLORS.RIGHT_LEG,
      segment: BodySegment.RIGHT_LEG,
    },
    {
      startId: MediaPipeLandmark.RIGHT_ANKLE,
      endId: MediaPipeLandmark.RIGHT_FOOT_INDEX,
      color: COLORS.RIGHT_LEG,
      segment: BodySegment.RIGHT_LEG,
    },
    {
      startId: MediaPipeLandmark.RIGHT_HEEL,
      endId: MediaPipeLandmark.RIGHT_FOOT_INDEX,
      color: COLORS.RIGHT_LEG,
      segment: BodySegment.RIGHT_LEG,
    },
  ];
}

/**
 * Gets the color for a specific body segment
 */
export function getSegmentColor(segment: BodySegment): string {
  switch (segment) {
    case BodySegment.HEAD:
      return COLORS.HEAD;
    case BodySegment.TORSO:
      return COLORS.TORSO;
    case BodySegment.LEFT_ARM:
      return COLORS.LEFT_ARM;
    case BodySegment.RIGHT_ARM:
      return COLORS.RIGHT_ARM;
    case BodySegment.LEFT_LEG:
      return COLORS.LEFT_LEG;
    case BodySegment.RIGHT_LEG:
      return COLORS.RIGHT_LEG;
    default:
      return '#FFFFFF';
  }
}

/**
 * Checks if both keypoints in a bone connection are visible
 */
export function isBoneVisible(
  bone: SkeletonBone,
  keypoints: Array<{ id: number; visibility: number }>,
  threshold: number = 0.4
): boolean {
  const startPoint = keypoints.find((kp) => kp.id === bone.startId);
  const endPoint = keypoints.find((kp) => kp.id === bone.endId);

  if (!startPoint || !endPoint) {
    return false;
  }

  return startPoint.visibility >= threshold && endPoint.visibility >= threshold;
}
