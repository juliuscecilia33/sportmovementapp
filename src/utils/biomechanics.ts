import { Keypoint, FrameData } from '../types/analysis';

/**
 * Vector mathematics utilities for biomechanical calculations
 */

interface Vector3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Calculate the angle between three points (in degrees)
 * @param point1 First point (e.g., shoulder)
 * @param vertex Middle point/vertex (e.g., elbow)
 * @param point2 Third point (e.g., wrist)
 * @returns Angle in degrees (0-180)
 */
export function calculateAngle(
  point1: Keypoint,
  vertex: Keypoint,
  point2: Keypoint
): number {
  // Create vectors from vertex to each point
  const vector1 = {
    x: point1.x - vertex.x,
    y: point1.y - vertex.y,
    z: point1.z - vertex.z,
  };

  const vector2 = {
    x: point2.x - vertex.x,
    y: point2.y - vertex.y,
    z: point2.z - vertex.z,
  };

  // Calculate dot product
  const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y + vector1.z * vector2.z;

  // Calculate magnitudes
  const magnitude1 = Math.sqrt(
    vector1.x * vector1.x + vector1.y * vector1.y + vector1.z * vector1.z
  );
  const magnitude2 = Math.sqrt(
    vector2.x * vector2.x + vector2.y * vector2.y + vector2.z * vector2.z
  );

  // Calculate angle in radians, then convert to degrees
  const cosAngle = dotProduct / (magnitude1 * magnitude2);
  const angleRad = Math.acos(Math.max(-1, Math.min(1, cosAngle))); // Clamp to [-1, 1]
  const angleDeg = (angleRad * 180) / Math.PI;

  return angleDeg;
}

/**
 * Calculate distance between two keypoints
 */
export function calculateDistance(point1: Keypoint, point2: Keypoint): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  const dz = point2.z - point1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculate 2D distance (ignoring z-coordinate)
 */
export function calculate2DDistance(point1: Keypoint, point2: Keypoint): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate velocity between two frames
 * @param point1 Keypoint at time t
 * @param point2 Keypoint at time t+1
 * @param deltaTime Time difference in seconds
 * @returns Velocity in units per second
 */
export function calculateVelocity(
  point1: Keypoint,
  point2: Keypoint,
  deltaTime: number
): number {
  if (deltaTime === 0) return 0;
  const distance = calculateDistance(point1, point2);
  return distance / deltaTime;
}

/**
 * Calculate velocity as a vector
 */
export function calculateVelocityVector(
  point1: Keypoint,
  point2: Keypoint,
  deltaTime: number
): Vector3D {
  if (deltaTime === 0) return { x: 0, y: 0, z: 0 };

  return {
    x: (point2.x - point1.x) / deltaTime,
    y: (point2.y - point1.y) / deltaTime,
    z: (point2.z - point1.z) / deltaTime,
  };
}

/**
 * Calculate acceleration between three frames
 * @param point1 Keypoint at time t-1
 * @param point2 Keypoint at time t
 * @param point3 Keypoint at time t+1
 * @param deltaTime Time difference in seconds
 */
export function calculateAcceleration(
  point1: Keypoint,
  point2: Keypoint,
  point3: Keypoint,
  deltaTime: number
): number {
  if (deltaTime === 0) return 0;

  const velocity1 = calculateVelocity(point1, point2, deltaTime);
  const velocity2 = calculateVelocity(point2, point3, deltaTime);

  return (velocity2 - velocity1) / deltaTime;
}

/**
 * Calculate center of mass from multiple keypoints
 */
export function calculateCenterOfMass(keypoints: Keypoint[]): Vector3D {
  if (keypoints.length === 0) {
    return { x: 0, y: 0, z: 0 };
  }

  const sum = keypoints.reduce(
    (acc, kp) => ({
      x: acc.x + kp.x,
      y: acc.y + kp.y,
      z: acc.z + kp.z,
    }),
    { x: 0, y: 0, z: 0 }
  );

  return {
    x: sum.x / keypoints.length,
    y: sum.y / keypoints.length,
    z: sum.z / keypoints.length,
  };
}

/**
 * Common joint angle calculations for volleyball analysis
 */

export function calculateRightElbowAngle(keypoints: Keypoint[]): number | null {
  const shoulder = keypoints.find(kp => kp.id === 12); // RIGHT_SHOULDER
  const elbow = keypoints.find(kp => kp.id === 14); // RIGHT_ELBOW
  const wrist = keypoints.find(kp => kp.id === 16); // RIGHT_WRIST

  if (!shoulder || !elbow || !wrist) return null;
  if (shoulder.visibility < 0.5 || elbow.visibility < 0.5 || wrist.visibility < 0.5) {
    return null;
  }

  return calculateAngle(shoulder, elbow, wrist);
}

export function calculateLeftElbowAngle(keypoints: Keypoint[]): number | null {
  const shoulder = keypoints.find(kp => kp.id === 11); // LEFT_SHOULDER
  const elbow = keypoints.find(kp => kp.id === 13); // LEFT_ELBOW
  const wrist = keypoints.find(kp => kp.id === 15); // LEFT_WRIST

  if (!shoulder || !elbow || !wrist) return null;
  if (shoulder.visibility < 0.5 || elbow.visibility < 0.5 || wrist.visibility < 0.5) {
    return null;
  }

  return calculateAngle(shoulder, elbow, wrist);
}

export function calculateRightShoulderAngle(keypoints: Keypoint[]): number | null {
  const elbow = keypoints.find(kp => kp.id === 14); // RIGHT_ELBOW
  const shoulder = keypoints.find(kp => kp.id === 12); // RIGHT_SHOULDER
  const hip = keypoints.find(kp => kp.id === 24); // RIGHT_HIP

  if (!elbow || !shoulder || !hip) return null;
  if (elbow.visibility < 0.5 || shoulder.visibility < 0.5 || hip.visibility < 0.5) {
    return null;
  }

  return calculateAngle(elbow, shoulder, hip);
}

export function calculateLeftShoulderAngle(keypoints: Keypoint[]): number | null {
  const elbow = keypoints.find(kp => kp.id === 13); // LEFT_ELBOW
  const shoulder = keypoints.find(kp => kp.id === 11); // LEFT_SHOULDER
  const hip = keypoints.find(kp => kp.id === 23); // LEFT_HIP

  if (!elbow || !shoulder || !hip) return null;
  if (elbow.visibility < 0.5 || shoulder.visibility < 0.5 || hip.visibility < 0.5) {
    return null;
  }

  return calculateAngle(elbow, shoulder, hip);
}

export function calculateRightKneeAngle(keypoints: Keypoint[]): number | null {
  const hip = keypoints.find(kp => kp.id === 24); // RIGHT_HIP
  const knee = keypoints.find(kp => kp.id === 26); // RIGHT_KNEE
  const ankle = keypoints.find(kp => kp.id === 28); // RIGHT_ANKLE

  if (!hip || !knee || !ankle) return null;
  if (hip.visibility < 0.5 || knee.visibility < 0.5 || ankle.visibility < 0.5) {
    return null;
  }

  return calculateAngle(hip, knee, ankle);
}

export function calculateLeftKneeAngle(keypoints: Keypoint[]): number | null {
  const hip = keypoints.find(kp => kp.id === 23); // LEFT_HIP
  const knee = keypoints.find(kp => kp.id === 25); // LEFT_KNEE
  const ankle = keypoints.find(kp => kp.id === 27); // LEFT_ANKLE

  if (!hip || !knee || !ankle) return null;
  if (hip.visibility < 0.5 || knee.visibility < 0.5 || ankle.visibility < 0.5) {
    return null;
  }

  return calculateAngle(hip, knee, ankle);
}

export function calculateRightHipAngle(keypoints: Keypoint[]): number | null {
  const shoulder = keypoints.find(kp => kp.id === 12); // RIGHT_SHOULDER
  const hip = keypoints.find(kp => kp.id === 24); // RIGHT_HIP
  const knee = keypoints.find(kp => kp.id === 26); // RIGHT_KNEE

  if (!shoulder || !hip || !knee) return null;
  if (shoulder.visibility < 0.5 || hip.visibility < 0.5 || knee.visibility < 0.5) {
    return null;
  }

  return calculateAngle(shoulder, hip, knee);
}

export function calculateLeftHipAngle(keypoints: Keypoint[]): number | null {
  const shoulder = keypoints.find(kp => kp.id === 11); // LEFT_SHOULDER
  const hip = keypoints.find(kp => kp.id === 23); // LEFT_HIP
  const knee = keypoints.find(kp => kp.id === 25); // LEFT_KNEE

  if (!shoulder || !hip || !knee) return null;
  if (shoulder.visibility < 0.5 || hip.visibility < 0.5 || knee.visibility < 0.5) {
    return null;
  }

  return calculateAngle(shoulder, hip, knee);
}

/**
 * Calculate torso angle relative to vertical
 */
export function calculateTorsoAngle(keypoints: Keypoint[]): number | null {
  const leftShoulder = keypoints.find(kp => kp.id === 11);
  const rightShoulder = keypoints.find(kp => kp.id === 12);
  const leftHip = keypoints.find(kp => kp.id === 23);
  const rightHip = keypoints.find(kp => kp.id === 24);

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return null;
  if (leftShoulder.visibility < 0.5 || rightShoulder.visibility < 0.5 ||
      leftHip.visibility < 0.5 || rightHip.visibility < 0.5) {
    return null;
  }

  // Calculate midpoints
  const shoulderMid = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
    z: (leftShoulder.z + rightShoulder.z) / 2,
  };

  const hipMid = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
    z: (leftHip.z + rightHip.z) / 2,
  };

  // Calculate angle from vertical (y-axis)
  const dy = shoulderMid.y - hipMid.y;
  const dx = shoulderMid.x - hipMid.x;

  const angleRad = Math.atan2(Math.abs(dx), Math.abs(dy));
  const angleDeg = (angleRad * 180) / Math.PI;

  return angleDeg;
}

/**
 * Calculate body center of mass (using hips and shoulders)
 */
export function calculateBodyCenterOfMass(keypoints: Keypoint[]): Vector3D | null {
  const leftShoulder = keypoints.find(kp => kp.id === 11);
  const rightShoulder = keypoints.find(kp => kp.id === 12);
  const leftHip = keypoints.find(kp => kp.id === 23);
  const rightHip = keypoints.find(kp => kp.id === 24);

  const validPoints = [leftShoulder, rightShoulder, leftHip, rightHip].filter(
    kp => kp && kp.visibility >= 0.5
  ) as Keypoint[];

  if (validPoints.length < 2) return null;

  return calculateCenterOfMass(validPoints);
}

/**
 * Calculate shoulder width
 */
export function calculateShoulderWidth(keypoints: Keypoint[]): number | null {
  const leftShoulder = keypoints.find(kp => kp.id === 11);
  const rightShoulder = keypoints.find(kp => kp.id === 12);

  if (!leftShoulder || !rightShoulder) return null;
  if (leftShoulder.visibility < 0.5 || rightShoulder.visibility < 0.5) return null;

  return calculate2DDistance(leftShoulder, rightShoulder);
}

/**
 * Calculate hip width
 */
export function calculateHipWidth(keypoints: Keypoint[]): number | null {
  const leftHip = keypoints.find(kp => kp.id === 23);
  const rightHip = keypoints.find(kp => kp.id === 24);

  if (!leftHip || !rightHip) return null;
  if (leftHip.visibility < 0.5 || rightHip.visibility < 0.5) return null;

  return calculate2DDistance(leftHip, rightHip);
}

/**
 * Calculate arm extension (shoulder to wrist distance)
 */
export function calculateRightArmExtension(keypoints: Keypoint[]): number | null {
  const shoulder = keypoints.find(kp => kp.id === 12);
  const wrist = keypoints.find(kp => kp.id === 16);

  if (!shoulder || !wrist) return null;
  if (shoulder.visibility < 0.5 || wrist.visibility < 0.5) return null;

  return calculateDistance(shoulder, wrist);
}

export function calculateLeftArmExtension(keypoints: Keypoint[]): number | null {
  const shoulder = keypoints.find(kp => kp.id === 11);
  const wrist = keypoints.find(kp => kp.id === 15);

  if (!shoulder || !wrist) return null;
  if (shoulder.visibility < 0.5 || wrist.visibility < 0.5) return null;

  return calculateDistance(shoulder, wrist);
}
