/**
 * Types for movement analysis report generation
 */

export interface KeyMetrics {
  // Velocity metrics
  peakVelocity: number; // Maximum velocity achieved (units/s)
  peakVelocityFrame: number; // Frame where peak velocity occurred
  averageVelocity: number; // Average velocity throughout movement

  // Angle metrics
  maxElbowAngle: number | null; // Maximum elbow extension (degrees)
  minElbowAngle: number | null; // Minimum elbow flexion (degrees)
  maxShoulderAngle: number | null; // Maximum shoulder angle (degrees)

  // Range of motion
  armExtensionRange: {
    min: number;
    max: number;
    range: number;
  };

  // Jump metrics (vertical displacement)
  jumpHeight: number | null; // Vertical displacement in normalized units
  highestBodyPositionFrame: number | null;
  lowestBodyPositionFrame: number | null;

  // Body positioning
  averageTorsoAngle: number | null; // Average body lean (degrees from vertical)
  shoulderWidth: number | null; // Average shoulder width
}

export interface MovementPhase {
  name: string; // e.g., "Preparation", "Acceleration", "Contact", "Follow-through"
  startFrame: number;
  endFrame: number;
  duration: number; // Duration in seconds

  // Key metrics for this phase
  avgVelocity: number;
  maxVelocity: number;

  // Insights
  description: string; // Human-readable description
  insights: string[]; // Array of insight strings
}

export interface KeyMoment {
  frame: number;
  timestamp: number;
  label: string; // e.g., "Peak Velocity", "Maximum Extension"
  description: string;
  metrics: {
    velocity?: number;
    elbowAngle?: number | null;
    shoulderAngle?: number | null;
    armExtension?: number | null;
    bodyHeight?: number | null;
  };
}

export interface VelocityDataPoint {
  frame: number;
  timestamp: number;
  velocity: number;
  bodyPart: string; // e.g., "Right Wrist", "Right Elbow"
}

export interface AngleDataPoint {
  frame: number;
  timestamp: number;
  angle: number | null;
  joint: string; // e.g., "Right Elbow", "Right Shoulder"
}

export interface TimelineData {
  velocities: VelocityDataPoint[];
  angles: AngleDataPoint[];
}

export interface MovementReport {
  // Metadata
  videoFilename: string;
  processedAt: string;
  totalFrames: number;
  duration: number;
  fps: number;
  analysisFrames: number; // Number of frames with valid keypoint data

  // Overall metrics
  keyMetrics: KeyMetrics;

  // Phase breakdown
  phases: MovementPhase[];

  // Key moments
  keyMoments: KeyMoment[];

  // Timeline data for charts
  timelineData: TimelineData;

  // Overall insights
  overallInsights: string[];
}

/**
 * Analysis options for report generation
 */
export interface AnalysisOptions {
  minVisibility?: number; // Minimum keypoint visibility threshold (default: 0.5)
  smoothingWindow?: number; // Number of frames for smoothing calculations (default: 3)
  velocityThreshold?: number; // Threshold for detecting significant movement (default: 0.1)
}
