import { AnalysisResult, FrameData, Keypoint } from '../types/analysis';
import {
  MovementReport,
  KeyMetrics,
  MovementPhase,
  KeyMoment,
  TimelineData,
  VelocityDataPoint,
  AngleDataPoint,
  AnalysisOptions,
} from '../types/report';
import {
  calculateVelocity,
  calculateRightElbowAngle,
  calculateRightShoulderAngle,
  calculateRightArmExtension,
  calculateBodyCenterOfMass,
  calculateTorsoAngle,
  calculateShoulderWidth,
} from '../utils/biomechanics';

const DEFAULT_OPTIONS: AnalysisOptions = {
  minVisibility: 0.5,
  smoothingWindow: 3,
  velocityThreshold: 0.1,
};

/**
 * Generate a comprehensive movement analysis report from analysis data
 */
export function generateMovementReport(
  analysis: AnalysisResult,
  options: AnalysisOptions = {}
): MovementReport {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  console.log('[MovementAnalyzer] Generating movement report...');
  console.log('[MovementAnalyzer] Total frames:', analysis.frames.length);

  // Calculate velocity data for all frames
  const velocityData = calculateVelocityTimeline(analysis.frames, opts);

  // Calculate angle data for all frames
  const angleData = calculateAngleTimeline(analysis.frames, opts);

  // Detect key moments
  const keyMoments = detectKeyMoments(analysis.frames, velocityData, angleData);

  // Detect movement phases
  const phases = detectMovementPhases(analysis.frames, velocityData, keyMoments);

  // Calculate key metrics
  const keyMetrics = calculateKeyMetrics(analysis.frames, velocityData, angleData);

  // Generate overall insights
  const overallInsights = generateOverallInsights(keyMetrics, phases, keyMoments);

  const report: MovementReport = {
    videoFilename: analysis.video_filename,
    processedAt: analysis.processed_at,
    totalFrames: analysis.video_info.total_frames,
    duration: analysis.video_info.duration_seconds,
    fps: analysis.video_info.fps,
    analysisFrames: analysis.frames.length,
    keyMetrics,
    phases,
    keyMoments,
    timelineData: {
      velocities: velocityData,
      angles: angleData,
    },
    overallInsights,
  };

  console.log('[MovementAnalyzer] Report generated successfully');
  return report;
}

/**
 * Calculate velocity for each frame
 */
function calculateVelocityTimeline(
  frames: FrameData[],
  opts: AnalysisOptions
): VelocityDataPoint[] {
  const velocities: VelocityDataPoint[] = [];

  for (let i = 1; i < frames.length; i++) {
    const currentFrame = frames[i];
    const previousFrame = frames[i - 1];

    // Calculate velocity for right wrist (primary hitting hand)
    const currentWrist = currentFrame.keypoints.find(kp => kp.id === 16); // RIGHT_WRIST
    const previousWrist = previousFrame.keypoints.find(kp => kp.id === 16);

    if (currentWrist && previousWrist &&
        currentWrist.visibility >= (opts.minVisibility || 0.5) &&
        previousWrist.visibility >= (opts.minVisibility || 0.5)) {

      const deltaTime = currentFrame.timestamp - previousFrame.timestamp;
      const velocity = calculateVelocity(previousWrist, currentWrist, deltaTime);

      velocities.push({
        frame: currentFrame.frame_number,
        timestamp: currentFrame.timestamp,
        velocity,
        bodyPart: 'Right Wrist',
      });
    }
  }

  return velocities;
}

/**
 * Calculate joint angles for each frame
 */
function calculateAngleTimeline(
  frames: FrameData[],
  opts: AnalysisOptions
): AngleDataPoint[] {
  const angles: AngleDataPoint[] = [];

  for (const frame of frames) {
    // Right elbow angle
    const elbowAngle = calculateRightElbowAngle(frame.keypoints);
    angles.push({
      frame: frame.frame_number,
      timestamp: frame.timestamp,
      angle: elbowAngle,
      joint: 'Right Elbow',
    });

    // Right shoulder angle
    const shoulderAngle = calculateRightShoulderAngle(frame.keypoints);
    angles.push({
      frame: frame.frame_number,
      timestamp: frame.timestamp,
      angle: shoulderAngle,
      joint: 'Right Shoulder',
    });
  }

  return angles;
}

/**
 * Detect key moments in the movement
 */
function detectKeyMoments(
  frames: FrameData[],
  velocityData: VelocityDataPoint[],
  angleData: AngleDataPoint[]
): KeyMoment[] {
  const moments: KeyMoment[] = [];

  if (velocityData.length === 0 || frames.length === 0) {
    return moments;
  }

  // Find peak velocity moment
  const peakVelocityData = velocityData.reduce((max, current) =>
    current.velocity > max.velocity ? current : max
  );

  const peakVelocityFrame = frames.find(f => f.frame_number === peakVelocityData.frame);
  if (peakVelocityFrame) {
    const elbowAngle = calculateRightElbowAngle(peakVelocityFrame.keypoints);
    const shoulderAngle = calculateRightShoulderAngle(peakVelocityFrame.keypoints);
    const armExtension = calculateRightArmExtension(peakVelocityFrame.keypoints);

    moments.push({
      frame: peakVelocityData.frame,
      timestamp: peakVelocityData.timestamp,
      label: 'Peak Velocity',
      description: `Maximum hand speed achieved: ${peakVelocityData.velocity.toFixed(3)} units/s`,
      metrics: {
        velocity: peakVelocityData.velocity,
        elbowAngle,
        shoulderAngle,
        armExtension,
      },
    });
  }

  // Find maximum arm extension
  let maxExtension = 0;
  let maxExtensionFrame: FrameData | null = null;

  for (const frame of frames) {
    const extension = calculateRightArmExtension(frame.keypoints);
    if (extension !== null && extension > maxExtension) {
      maxExtension = extension;
      maxExtensionFrame = frame;
    }
  }

  if (maxExtensionFrame) {
    const velocity = velocityData.find(v => v.frame === maxExtensionFrame!.frame_number);
    moments.push({
      frame: maxExtensionFrame.frame_number,
      timestamp: maxExtensionFrame.timestamp,
      label: 'Maximum Extension',
      description: `Full arm extension reached: ${maxExtension.toFixed(3)} units`,
      metrics: {
        armExtension: maxExtension,
        velocity: velocity?.velocity,
        elbowAngle: calculateRightElbowAngle(maxExtensionFrame.keypoints),
        shoulderAngle: calculateRightShoulderAngle(maxExtensionFrame.keypoints),
      },
    });
  }

  // Find highest body position (potential jump peak)
  let highestPosition = Infinity;
  let highestFrame: FrameData | null = null;

  for (const frame of frames) {
    const com = calculateBodyCenterOfMass(frame.keypoints);
    if (com && com.y < highestPosition) { // Lower y = higher position in image coordinates
      highestPosition = com.y;
      highestFrame = frame;
    }
  }

  if (highestFrame) {
    moments.push({
      frame: highestFrame.frame_number,
      timestamp: highestFrame.timestamp,
      label: 'Peak Height',
      description: `Highest body position reached`,
      metrics: {
        bodyHeight: highestPosition,
      },
    });
  }

  // Sort by frame number
  moments.sort((a, b) => a.frame - b.frame);

  return moments;
}

/**
 * Detect movement phases based on velocity patterns
 */
function detectMovementPhases(
  frames: FrameData[],
  velocityData: VelocityDataPoint[],
  keyMoments: KeyMoment[]
): MovementPhase[] {
  if (frames.length === 0 || velocityData.length === 0) {
    return [];
  }

  const phases: MovementPhase[] = [];

  const peakVelocityMoment = keyMoments.find(m => m.label === 'Peak Velocity');
  const peakVelocityFrame = peakVelocityMoment?.frame || velocityData[Math.floor(velocityData.length / 2)].frame;

  const startFrame = frames[0].frame_number;
  const endFrame = frames[frames.length - 1].frame_number;

  // Phase 1: Preparation (start to 30% of movement before peak)
  const prepEndFrame = Math.floor(peakVelocityFrame - (peakVelocityFrame - startFrame) * 0.3);
  const prepVelocities = velocityData.filter(v => v.frame >= startFrame && v.frame <= prepEndFrame);
  const prepFrames = frames.filter(f => f.frame_number >= startFrame && f.frame_number <= prepEndFrame);

  if (prepFrames.length > 0) {
    phases.push({
      name: 'Preparation',
      startFrame,
      endFrame: prepEndFrame,
      duration: prepFrames[prepFrames.length - 1].timestamp - prepFrames[0].timestamp,
      avgVelocity: prepVelocities.length > 0
        ? prepVelocities.reduce((sum, v) => sum + v.velocity, 0) / prepVelocities.length
        : 0,
      maxVelocity: prepVelocities.length > 0
        ? Math.max(...prepVelocities.map(v => v.velocity))
        : 0,
      description: 'Initial body positioning and arm cocking phase',
      insights: [
        'Body prepares for explosive movement',
        'Arm moves into optimal striking position',
      ],
    });
  }

  // Phase 2: Acceleration (30% before peak to peak velocity)
  const accelStartFrame = prepEndFrame + 1;
  const accelEndFrame = peakVelocityFrame;
  const accelVelocities = velocityData.filter(v => v.frame >= accelStartFrame && v.frame <= accelEndFrame);
  const accelFrames = frames.filter(f => f.frame_number >= accelStartFrame && f.frame_number <= accelEndFrame);

  if (accelFrames.length > 0) {
    phases.push({
      name: 'Acceleration',
      startFrame: accelStartFrame,
      endFrame: accelEndFrame,
      duration: accelFrames[accelFrames.length - 1].timestamp - accelFrames[0].timestamp,
      avgVelocity: accelVelocities.length > 0
        ? accelVelocities.reduce((sum, v) => sum + v.velocity, 0) / accelVelocities.length
        : 0,
      maxVelocity: accelVelocities.length > 0
        ? Math.max(...accelVelocities.map(v => v.velocity))
        : 0,
      description: 'Rapid acceleration phase with peak velocity achieved',
      insights: [
        `Peak velocity: ${(accelVelocities.length > 0 ? Math.max(...accelVelocities.map(v => v.velocity)) : 0).toFixed(3)} units/s`,
        'Maximum power generation occurs here',
      ],
    });
  }

  // Phase 3: Contact/Extension (peak velocity to 50% after peak)
  const contactStartFrame = peakVelocityFrame + 1;
  const contactEndFrame = Math.min(
    Math.floor(peakVelocityFrame + (endFrame - peakVelocityFrame) * 0.4),
    endFrame
  );
  const contactVelocities = velocityData.filter(v => v.frame >= contactStartFrame && v.frame <= contactEndFrame);
  const contactFrames = frames.filter(f => f.frame_number >= contactStartFrame && f.frame_number <= contactEndFrame);

  if (contactFrames.length > 0) {
    phases.push({
      name: 'Contact',
      startFrame: contactStartFrame,
      endFrame: contactEndFrame,
      duration: contactFrames[contactFrames.length - 1].timestamp - contactFrames[0].timestamp,
      avgVelocity: contactVelocities.length > 0
        ? contactVelocities.reduce((sum, v) => sum + v.velocity, 0) / contactVelocities.length
        : 0,
      maxVelocity: contactVelocities.length > 0
        ? Math.max(...contactVelocities.map(v => v.velocity))
        : 0,
      description: 'Contact point and maximum extension phase',
      insights: [
        'Arm reaches maximum extension',
        'Energy transfer to ball occurs',
      ],
    });
  }

  // Phase 4: Follow-through (after contact to end)
  const followStartFrame = contactEndFrame + 1;
  const followEndFrame = endFrame;
  const followVelocities = velocityData.filter(v => v.frame >= followStartFrame && v.frame <= followEndFrame);
  const followFrames = frames.filter(f => f.frame_number >= followStartFrame && f.frame_number <= followEndFrame);

  if (followFrames.length > 0) {
    phases.push({
      name: 'Follow-through',
      startFrame: followStartFrame,
      endFrame: followEndFrame,
      duration: followFrames[followFrames.length - 1].timestamp - followFrames[0].timestamp,
      avgVelocity: followVelocities.length > 0
        ? followVelocities.reduce((sum, v) => sum + v.velocity, 0) / followVelocities.length
        : 0,
      maxVelocity: followVelocities.length > 0
        ? Math.max(...followVelocities.map(v => v.velocity))
        : 0,
      description: 'Deceleration and recovery phase',
      insights: [
        'Controlled deceleration prevents injury',
        'Body returns to ready position',
      ],
    });
  }

  return phases;
}

/**
 * Calculate key metrics summary
 */
function calculateKeyMetrics(
  frames: FrameData[],
  velocityData: VelocityDataPoint[],
  angleData: AngleDataPoint[]
): KeyMetrics {
  // Velocity metrics
  const peakVelocity = velocityData.length > 0
    ? Math.max(...velocityData.map(v => v.velocity))
    : 0;
  const peakVelocityData = velocityData.find(v => v.velocity === peakVelocity);
  const peakVelocityFrame = peakVelocityData?.frame || 0;
  const averageVelocity = velocityData.length > 0
    ? velocityData.reduce((sum, v) => sum + v.velocity, 0) / velocityData.length
    : 0;

  // Angle metrics (Right Elbow)
  const elbowAngles = angleData
    .filter(a => a.joint === 'Right Elbow' && a.angle !== null)
    .map(a => a.angle!);
  const maxElbowAngle = elbowAngles.length > 0 ? Math.max(...elbowAngles) : null;
  const minElbowAngle = elbowAngles.length > 0 ? Math.min(...elbowAngles) : null;

  // Shoulder angles
  const shoulderAngles = angleData
    .filter(a => a.joint === 'Right Shoulder' && a.angle !== null)
    .map(a => a.angle!);
  const maxShoulderAngle = shoulderAngles.length > 0 ? Math.max(...shoulderAngles) : null;

  // Arm extension range
  const extensions: number[] = [];
  for (const frame of frames) {
    const ext = calculateRightArmExtension(frame.keypoints);
    if (ext !== null) extensions.push(ext);
  }
  const armExtensionRange = {
    min: extensions.length > 0 ? Math.min(...extensions) : 0,
    max: extensions.length > 0 ? Math.max(...extensions) : 0,
    range: extensions.length > 0 ? Math.max(...extensions) - Math.min(...extensions) : 0,
  };

  // Jump height (vertical COM displacement)
  const comYPositions: number[] = [];
  for (const frame of frames) {
    const com = calculateBodyCenterOfMass(frame.keypoints);
    if (com) comYPositions.push(com.y);
  }
  const jumpHeight = comYPositions.length > 0
    ? Math.max(...comYPositions) - Math.min(...comYPositions) // Range of vertical movement
    : null;

  const highestBodyPositionFrame = comYPositions.length > 0
    ? frames[comYPositions.indexOf(Math.min(...comYPositions))].frame_number
    : null;

  const lowestBodyPositionFrame = comYPositions.length > 0
    ? frames[comYPositions.indexOf(Math.max(...comYPositions))].frame_number
    : null;

  // Average torso angle
  const torsoAngles: number[] = [];
  for (const frame of frames) {
    const angle = calculateTorsoAngle(frame.keypoints);
    if (angle !== null) torsoAngles.push(angle);
  }
  const averageTorsoAngle = torsoAngles.length > 0
    ? torsoAngles.reduce((sum, a) => sum + a, 0) / torsoAngles.length
    : null;

  // Shoulder width
  const shoulderWidths: number[] = [];
  for (const frame of frames) {
    const width = calculateShoulderWidth(frame.keypoints);
    if (width !== null) shoulderWidths.push(width);
  }
  const shoulderWidth = shoulderWidths.length > 0
    ? shoulderWidths.reduce((sum, w) => sum + w, 0) / shoulderWidths.length
    : null;

  return {
    peakVelocity,
    peakVelocityFrame,
    averageVelocity,
    maxElbowAngle,
    minElbowAngle,
    maxShoulderAngle,
    armExtensionRange,
    jumpHeight,
    highestBodyPositionFrame,
    lowestBodyPositionFrame,
    averageTorsoAngle,
    shoulderWidth,
  };
}

/**
 * Generate overall insights based on calculated metrics
 */
function generateOverallInsights(
  metrics: KeyMetrics,
  phases: MovementPhase[],
  keyMoments: KeyMoment[]
): string[] {
  const insights: string[] = [];

  // Velocity insights
  if (metrics.peakVelocity > 0) {
    insights.push(`Peak hand velocity of ${metrics.peakVelocity.toFixed(3)} units/s achieved at frame ${metrics.peakVelocityFrame}`);
  }

  // Elbow angle insights
  if (metrics.minElbowAngle !== null && metrics.maxElbowAngle !== null) {
    const elbowRange = metrics.maxElbowAngle - metrics.minElbowAngle;
    insights.push(`Elbow flexion range: ${metrics.minElbowAngle.toFixed(1)}° to ${metrics.maxElbowAngle.toFixed(1)}° (${elbowRange.toFixed(1)}° range)`);

    if (metrics.minElbowAngle < 90) {
      insights.push('Good arm cocking with significant elbow flexion during preparation');
    }
  }

  // Arm extension insights
  if (metrics.armExtensionRange.range > 0) {
    insights.push(`Arm extension range: ${metrics.armExtensionRange.range.toFixed(3)} units (${(metrics.armExtensionRange.range * 100).toFixed(1)}% of normalized space)`);
  }

  // Jump height insights
  if (metrics.jumpHeight !== null && metrics.jumpHeight > 0.1) {
    insights.push(`Vertical movement detected: ${(metrics.jumpHeight * 100).toFixed(1)}% of frame height`);
  }

  // Phase timing insights
  if (phases.length > 0) {
    const totalDuration = phases.reduce((sum, p) => sum + p.duration, 0);
    const accelPhase = phases.find(p => p.name === 'Acceleration');
    if (accelPhase) {
      const accelPercent = (accelPhase.duration / totalDuration) * 100;
      insights.push(`Acceleration phase: ${accelPhase.duration.toFixed(2)}s (${accelPercent.toFixed(1)}% of movement)`);
    }
  }

  // Posture insights
  if (metrics.averageTorsoAngle !== null) {
    if (metrics.averageTorsoAngle < 10) {
      insights.push('Excellent upright posture maintained throughout movement');
    } else if (metrics.averageTorsoAngle < 20) {
      insights.push('Good posture with slight forward lean');
    } else {
      insights.push(`Significant forward lean detected (${metrics.averageTorsoAngle.toFixed(1)}° from vertical)`);
    }
  }

  return insights;
}
