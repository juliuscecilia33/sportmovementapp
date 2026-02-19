import { KeyMetrics, MovementPhase, KeyMoment, Weakness } from '../types/report';

/**
 * Severity priority for sorting weaknesses
 */
const SEVERITY_PRIORITY = {
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Detect biomechanical weaknesses based on analysis metrics
 * Returns array of weaknesses sorted by severity (high to low)
 */
export function detectWeaknesses(
  metrics: KeyMetrics,
  phases: MovementPhase[],
  keyMoments: KeyMoment[]
): Weakness[] {
  const weaknesses: Weakness[] = [];

  // Find key moments for reference
  const contactMoment = keyMoments.find(m => m.label === 'Maximum Extension');
  const peakVelocityMoment = keyMoments.find(m => m.label === 'Peak Velocity');
  const preparationPhase = phases.find(p => p.name === 'Preparation');
  const accelerationPhase = phases.find(p => p.name === 'Acceleration');

  // RULE 1: Low Contact Point
  // Optimal wrist height at contact should be in upper 35% of frame (y < 0.4 in normalized coords)
  if (contactMoment?.metrics.bodyHeight && contactMoment.metrics.bodyHeight > 0.45) {
    weaknesses.push({
      category: 'Arm Mechanics',
      issue: 'Low Contact Point',
      severity: contactMoment.metrics.bodyHeight > 0.55 ? 'high' : 'medium',
      detectedValue: contactMoment.metrics.bodyHeight,
      optimalRange: { min: 0.25, max: 0.45 },
      explanation: 'Contact point is below optimal height. Higher contact creates better attack angles and increases power. This limits your ability to hit downward and makes it easier for blockers.'
    });
  }

  // RULE 2: Insufficient Arm Extension at Contact
  // Optimal elbow angle at contact: 160-175 degrees (nearly full extension)
  if (contactMoment?.metrics.elbowAngle !== null &&
      contactMoment?.metrics.elbowAngle !== undefined &&
      contactMoment.metrics.elbowAngle < 160) {
    const severity = contactMoment.metrics.elbowAngle < 150 ? 'high' :
                     contactMoment.metrics.elbowAngle < 155 ? 'medium' : 'low';

    weaknesses.push({
      category: 'Arm Mechanics',
      issue: 'Incomplete Arm Extension',
      severity,
      detectedValue: contactMoment.metrics.elbowAngle,
      optimalRange: { min: 160, max: 175 },
      explanation: 'Arm is not fully extended at contact. Full extension maximizes reach and power transfer. A bent elbow reduces contact height and hitting power.'
    });
  }

  // RULE 3: Overall Low Elbow Angles (Poor Arm Cocking)
  // Should have significant elbow flexion during preparation (< 100 degrees)
  if (metrics.minElbowAngle !== null && metrics.minElbowAngle > 100) {
    weaknesses.push({
      category: 'Arm Mechanics',
      issue: 'Insufficient Arm Cocking',
      severity: metrics.minElbowAngle > 120 ? 'high' : 'medium',
      detectedValue: metrics.minElbowAngle,
      optimalRange: { min: 60, max: 100 },
      explanation: 'Elbow not bending enough during preparation phase. Proper arm cocking (drawing elbow back) is essential for generating power and achieving full range of motion.'
    });
  }

  // RULE 4: Limited Arm Extension Range
  // Should have at least 0.3 units of extension range (30% of normalized space)
  if (metrics.armExtensionRange.range < 0.25) {
    weaknesses.push({
      category: 'Arm Mechanics',
      issue: 'Limited Arm Extension Range',
      severity: metrics.armExtensionRange.range < 0.2 ? 'high' : 'medium',
      detectedValue: metrics.armExtensionRange.range,
      optimalRange: { min: 0.25, max: 0.5 },
      explanation: 'Limited range of arm movement from preparation to contact. Greater extension range indicates better preparation and more powerful swing mechanics.'
    });
  }

  // RULE 5: Low Peak Velocity
  // Peak velocity should be > 1.0 units/s for effective hitting
  if (metrics.peakVelocity < 0.8) {
    weaknesses.push({
      category: 'Power Generation',
      issue: 'Low Hand Speed',
      severity: metrics.peakVelocity < 0.5 ? 'high' : 'medium',
      detectedValue: metrics.peakVelocity,
      optimalRange: { min: 0.8, max: 2.0 },
      explanation: 'Hand speed at contact is below optimal. Higher hand velocity generates more ball speed and power. This suggests lack of explosive power or inefficient kinetic chain.'
    });
  }

  // RULE 6: Velocity Not at Contact Point
  // Peak velocity should occur close to maximum extension (within ~0.1 seconds)
  if (peakVelocityMoment && contactMoment) {
    const timeDifference = Math.abs(peakVelocityMoment.timestamp - contactMoment.timestamp);
    if (timeDifference > 0.15) {
      weaknesses.push({
        category: 'Timing',
        issue: 'Poor Velocity Timing',
        severity: timeDifference > 0.25 ? 'high' : 'medium',
        detectedValue: timeDifference,
        optimalRange: { min: 0, max: 0.1 },
        explanation: 'Peak hand speed does not align with contact point. Maximum velocity should occur at or just before ball contact for optimal power transfer. This suggests timing issues or premature deceleration.'
      });
    }
  }

  // RULE 7: Insufficient Vertical Movement (Jump Height)
  // Should have at least 10% vertical displacement for proper hitting
  if (metrics.jumpHeight !== null && metrics.jumpHeight < 0.08) {
    weaknesses.push({
      category: 'Power Generation',
      issue: 'Limited Vertical Jump',
      severity: metrics.jumpHeight < 0.05 ? 'medium' : 'low',
      detectedValue: metrics.jumpHeight,
      optimalRange: { min: 0.08, max: 0.25 },
      explanation: 'Limited vertical jump height reduces contact point elevation. Higher jumps allow hitting from greater height, creating better angles and more power.'
    });
  }

  // RULE 8: Poor Posture (Excessive Forward Lean)
  // Torso should be relatively upright (< 20 degrees from vertical)
  if (metrics.averageTorsoAngle !== null && metrics.averageTorsoAngle > 25) {
    weaknesses.push({
      category: 'Body Positioning',
      issue: 'Excessive Forward Lean',
      severity: metrics.averageTorsoAngle > 35 ? 'high' : 'medium',
      detectedValue: metrics.averageTorsoAngle,
      optimalRange: { min: 0, max: 20 },
      explanation: 'Excessive forward torso lean during hitting motion. Too much forward lean can compromise power generation, reduce contact height, and affect balance. Maintain more upright posture.'
    });
  }

  // RULE 9: Slow Acceleration Phase
  // Acceleration should be short and explosive (< 0.5 seconds typically)
  if (accelerationPhase && accelerationPhase.duration > 0.6) {
    weaknesses.push({
      category: 'Timing',
      issue: 'Slow Acceleration Phase',
      severity: accelerationPhase.duration > 0.8 ? 'medium' : 'low',
      detectedValue: accelerationPhase.duration,
      optimalRange: { min: 0.2, max: 0.5 },
      explanation: 'Acceleration phase is taking too long. A quick, explosive acceleration generates more power. Prolonged acceleration suggests lack of explosive strength or timing issues.'
    });
  }

  // RULE 10: Long Preparation Phase (Overthinking/Hesitation)
  // Preparation should be efficient (< 1.0 seconds)
  if (preparationPhase && preparationPhase.duration > 1.2) {
    weaknesses.push({
      category: 'Timing',
      issue: 'Prolonged Preparation',
      severity: 'low',
      detectedValue: preparationPhase.duration,
      optimalRange: { min: 0.3, max: 1.0 },
      explanation: 'Preparation phase is longer than optimal. While proper preparation is important, excessive time can indicate hesitation or inefficient movement patterns.'
    });
  }

  // RULE 11: Low Average Velocity During Acceleration
  // Acceleration phase should have high average velocity (> 0.5 units/s)
  if (accelerationPhase && accelerationPhase.avgVelocity < 0.4) {
    weaknesses.push({
      category: 'Power Generation',
      issue: 'Weak Acceleration',
      severity: accelerationPhase.avgVelocity < 0.3 ? 'high' : 'medium',
      detectedValue: accelerationPhase.avgVelocity,
      optimalRange: { min: 0.5, max: 1.5 },
      explanation: 'Arm speed during acceleration phase is below optimal. This phase should be explosive and fast. Low velocity suggests weak power generation or incomplete kinetic chain engagement.'
    });
  }

  // RULE 12: Shoulder Angle Issues
  // Maximum shoulder angle should be > 130 degrees for proper mechanics
  if (metrics.maxShoulderAngle !== null && metrics.maxShoulderAngle < 120) {
    weaknesses.push({
      category: 'Shoulder Mechanics',
      issue: 'Limited Shoulder Range',
      severity: metrics.maxShoulderAngle < 100 ? 'high' : 'medium',
      detectedValue: metrics.maxShoulderAngle,
      optimalRange: { min: 130, max: 180 },
      explanation: 'Limited shoulder range of motion restricts arm swing path and reduces power. Full shoulder mobility is essential for optimal hitting mechanics and injury prevention.'
    });
  }

  // Sort by severity (high > medium > low) and return
  return weaknesses.sort((a, b) =>
    SEVERITY_PRIORITY[b.severity] - SEVERITY_PRIORITY[a.severity]
  );
}

/**
 * Get human-readable summary of detected weaknesses
 */
export function getWeaknessSummary(weaknesses: Weakness[]): string {
  if (weaknesses.length === 0) {
    return 'Excellent mechanics detected! No significant weaknesses identified.';
  }

  const highSeverity = weaknesses.filter(w => w.severity === 'high').length;
  const mediumSeverity = weaknesses.filter(w => w.severity === 'medium').length;
  const lowSeverity = weaknesses.filter(w => w.severity === 'low').length;

  const parts: string[] = [];
  if (highSeverity > 0) parts.push(`${highSeverity} high-priority issue${highSeverity > 1 ? 's' : ''}`);
  if (mediumSeverity > 0) parts.push(`${mediumSeverity} medium-priority issue${mediumSeverity > 1 ? 's' : ''}`);
  if (lowSeverity > 0) parts.push(`${lowSeverity} minor issue${lowSeverity > 1 ? 's' : ''}`);

  return `Detected ${parts.join(', ')}.`;
}
