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

  // Weakness detection and drill recommendations
  weaknesses: Weakness[];
  drillRecommendations: DrillRecommendation[];
}

/**
 * Analysis options for report generation
 */
export interface AnalysisOptions {
  minVisibility?: number; // Minimum keypoint visibility threshold (default: 0.5)
  smoothingWindow?: number; // Number of frames for smoothing calculations (default: 3)
  velocityThreshold?: number; // Threshold for detecting significant movement (default: 0.1)
}

/**
 * Detected weakness in movement mechanics
 */
export interface Weakness {
  category: string; // e.g., "Arm Mechanics", "Timing", "Power Generation"
  issue: string; // e.g., "Low Contact Point", "Incomplete Arm Extension"
  severity: 'low' | 'medium' | 'high';
  detectedValue: number; // Actual measured value from analysis
  optimalRange: {
    min: number;
    max: number;
  };
  explanation: string; // Why this is problematic and its impact
}

/**
 * Training drill to address specific weaknesses
 */
export interface Drill {
  id: string;
  name: string;
  description: string;
  category: string; // Maps to weakness category
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  equipment: string[]; // Required equipment (e.g., "Ball", "Net", "Wall")
  focusAreas: string[]; // What aspects this drill improves
  instructions: string[]; // Step-by-step instructions
  videoUrl?: string; // Optional: link to demonstration video
  sets?: string; // Recommended sets/reps (e.g., "3 sets of 10")
}

/**
 * Drill recommendation paired with detected weakness
 */
export interface DrillRecommendation {
  weakness: Weakness;
  recommendedDrills: Drill[]; // Top 2-3 drills for this weakness
  priority: number; // 1 = highest priority
}
