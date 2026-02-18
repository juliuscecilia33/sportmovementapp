import { KeyMoment } from '../types/report';

/**
 * MediaPipe Pose landmark IDs for relevant joints
 */
export const MediaPipeLandmarks = {
  RIGHT_SHOULDER: 12,
  RIGHT_ELBOW: 14,
  RIGHT_WRIST: 16,
  RIGHT_HIP: 24,
  RIGHT_KNEE: 26,
  RIGHT_ANKLE: 28,
  LEFT_SHOULDER: 11,
  LEFT_ELBOW: 13,
  LEFT_WRIST: 15,
  LEFT_HIP: 23,
  LEFT_KNEE: 25,
  LEFT_ANKLE: 27,
} as const;

/**
 * Marker type for timeline visualization
 */
export interface MarkerData {
  frame: number;
  color: string;
  type: 'keyMoment' | 'phaseStart' | 'phaseEnd';
  label: string;
  keyMoment?: KeyMoment;
}

/**
 * Maps finding label keywords to relevant joint IDs that should be highlighted
 */
export function getJointsForFinding(label: string): number[] {
  const labelLower = label.toLowerCase();

  // Velocity-related findings (wrist movement)
  if (labelLower.includes('velocity') || labelLower.includes('speed')) {
    return [
      MediaPipeLandmarks.RIGHT_WRIST,
      MediaPipeLandmarks.RIGHT_ELBOW,
      MediaPipeLandmarks.RIGHT_SHOULDER,
    ];
  }

  // Extension or elbow-related findings
  if (labelLower.includes('extension') || labelLower.includes('elbow')) {
    return [
      MediaPipeLandmarks.RIGHT_ELBOW,
      MediaPipeLandmarks.RIGHT_SHOULDER,
      MediaPipeLandmarks.RIGHT_WRIST,
    ];
  }

  // Jump or height-related findings
  if (labelLower.includes('jump') || labelLower.includes('height') || labelLower.includes('vertical')) {
    return [
      MediaPipeLandmarks.RIGHT_HIP,
      MediaPipeLandmarks.RIGHT_KNEE,
      MediaPipeLandmarks.RIGHT_ANKLE,
      MediaPipeLandmarks.LEFT_HIP,
      MediaPipeLandmarks.LEFT_KNEE,
      MediaPipeLandmarks.LEFT_ANKLE,
    ];
  }

  // Shoulder-related findings
  if (labelLower.includes('shoulder')) {
    return [
      MediaPipeLandmarks.RIGHT_SHOULDER,
      MediaPipeLandmarks.RIGHT_ELBOW,
    ];
  }

  // Default: highlight right arm
  return [
    MediaPipeLandmarks.RIGHT_WRIST,
    MediaPipeLandmarks.RIGHT_ELBOW,
    MediaPipeLandmarks.RIGHT_SHOULDER,
  ];
}

/**
 * Maps finding types to colors for visualization
 */
export function getColorForFindingType(label: string): string {
  const labelLower = label.toLowerCase();

  if (labelLower.includes('peak') || labelLower.includes('maximum') || labelLower.includes('max')) {
    return '#004aad'; // Blue - peak moments
  }

  if (labelLower.includes('velocity') || labelLower.includes('speed')) {
    return '#00c851'; // Green - velocity
  }

  if (labelLower.includes('extension') || labelLower.includes('elbow')) {
    return '#ff8800'; // Orange - arm mechanics
  }

  if (labelLower.includes('jump') || labelLower.includes('height')) {
    return '#aa66cc'; // Purple - vertical movement
  }

  if (labelLower.includes('contact') || labelLower.includes('release')) {
    return '#ff4444'; // Red - critical moments
  }

  return '#888888'; // Gray - default
}

/**
 * Formats metric values for display
 */
export function formatMetricValue(key: string, value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';

  const keyLower = key.toLowerCase();

  if (keyLower.includes('angle')) {
    return `${value.toFixed(1)}°`;
  }

  if (keyLower.includes('velocity') || keyLower.includes('speed')) {
    return `${value.toFixed(3)} m/s`;
  }

  if (keyLower.includes('extension') || keyLower.includes('height')) {
    return `${value.toFixed(3)} units`;
  }

  return value.toFixed(2);
}

/**
 * Extracts display-friendly metrics from a KeyMoment
 */
export function getDisplayMetrics(keyMoment: KeyMoment): Array<{ label: string; value: string }> {
  const metrics: Array<{ label: string; value: string }> = [];

  if (keyMoment.metrics.velocity !== undefined) {
    metrics.push({
      label: 'Velocity',
      value: formatMetricValue('velocity', keyMoment.metrics.velocity),
    });
  }

  if (keyMoment.metrics.elbowAngle !== undefined && keyMoment.metrics.elbowAngle !== null) {
    metrics.push({
      label: 'Elbow Angle',
      value: formatMetricValue('angle', keyMoment.metrics.elbowAngle),
    });
  }

  if (keyMoment.metrics.shoulderAngle !== undefined && keyMoment.metrics.shoulderAngle !== null) {
    metrics.push({
      label: 'Shoulder Angle',
      value: formatMetricValue('angle', keyMoment.metrics.shoulderAngle),
    });
  }

  if (keyMoment.metrics.armExtension !== undefined && keyMoment.metrics.armExtension !== null) {
    metrics.push({
      label: 'Arm Extension',
      value: formatMetricValue('extension', keyMoment.metrics.armExtension),
    });
  }

  if (keyMoment.metrics.bodyHeight !== undefined && keyMoment.metrics.bodyHeight !== null) {
    metrics.push({
      label: 'Body Height',
      value: formatMetricValue('height', keyMoment.metrics.bodyHeight),
    });
  }

  return metrics;
}
