import { Weakness, DrillRecommendation, Drill } from '../types/report';
import { DRILL_DATABASE } from '../data/drills';

/**
 * Mapping of weakness issues to drill categories
 * This ensures weaknesses are matched with drills that specifically address them
 */
const WEAKNESS_TO_CATEGORY_MAP: Record<string, string[]> = {
  'Low Contact Point': ['Arm Mechanics', 'Power Generation'],
  'Incomplete Arm Extension': ['Arm Mechanics', 'Shoulder Mechanics'],
  'Insufficient Arm Cocking': ['Arm Mechanics', 'Shoulder Mechanics'],
  'Limited Arm Extension Range': ['Arm Mechanics', 'Shoulder Mechanics'],
  'Low Hand Speed': ['Power Generation', 'Arm Mechanics'],
  'Poor Velocity Timing': ['Timing', 'Consistency'],
  'Limited Vertical Jump': ['Power Generation'],
  'Excessive Forward Lean': ['Body Positioning', 'Consistency'],
  'Slow Acceleration Phase': ['Timing', 'Power Generation'],
  'Prolonged Preparation': ['Timing', 'Consistency'],
  'Weak Acceleration': ['Power Generation', 'Arm Mechanics'],
  'Limited Shoulder Range': ['Shoulder Mechanics', 'Arm Mechanics'],
};

/**
 * Specific drill recommendations for each weakness type
 * Maps weakness issues to most effective drill IDs (in priority order)
 */
const WEAKNESS_TO_DRILL_MAP: Record<string, string[]> = {
  'Low Contact Point': [
    'wall_touches',
    'platform_hitting',
    'box_jumps',
    'approach_jumps'
  ],
  'Incomplete Arm Extension': [
    'resistance_band_extensions',
    'wall_touches',
    'medicine_ball_throws',
    'arm_swing_practice'
  ],
  'Insufficient Arm Cocking': [
    'arm_swing_practice',
    'shoulder_circles',
    'resistance_band_extensions',
    'medicine_ball_throws'
  ],
  'Limited Arm Extension Range': [
    'shoulder_circles',
    'arm_swing_practice',
    'wall_touches',
    'medicine_ball_throws'
  ],
  'Low Hand Speed': [
    'medicine_ball_throws',
    'hip_rotation_throws',
    'box_jumps',
    'kettlebell_swings'
  ],
  'Poor Velocity Timing': [
    'ball_drop_hits',
    'self_toss_hitting',
    'rhythm_approaches',
    'repetitive_hitting'
  ],
  'Limited Vertical Jump': [
    'box_jumps',
    'approach_jumps',
    'plyometric_hitting',
    'kettlebell_swings'
  ],
  'Excessive Forward Lean': [
    'core_rotation_exercises',
    'plank_variations',
    'balance_single_leg',
    'arm_swing_practice'
  ],
  'Slow Acceleration Phase': [
    'medicine_ball_throws',
    'hip_rotation_throws',
    'rhythm_approaches',
    'ball_drop_hits'
  ],
  'Prolonged Preparation': [
    'rhythm_approaches',
    'self_toss_hitting',
    'ball_drop_hits',
    'repetitive_hitting'
  ],
  'Weak Acceleration': [
    'medicine_ball_throws',
    'hip_rotation_throws',
    'resistance_band_extensions',
    'kettlebell_swings'
  ],
  'Limited Shoulder Range': [
    'shoulder_circles',
    'arm_swing_practice',
    'resistance_band_extensions',
    'medicine_ball_throws'
  ],
};

/**
 * Generate drill recommendations based on detected weaknesses
 * Returns up to 5 prioritized recommendations with 2-3 drills each
 */
export function generateDrillRecommendations(
  weaknesses: Weakness[]
): DrillRecommendation[] {
  const recommendations: DrillRecommendation[] = [];

  // Process up to 5 most severe weaknesses
  const topWeaknesses = weaknesses.slice(0, 5);

  topWeaknesses.forEach((weakness, index) => {
    const recommendedDrills = selectDrillsForWeakness(weakness);

    if (recommendedDrills.length > 0) {
      recommendations.push({
        weakness,
        recommendedDrills,
        priority: index + 1,
      });
    }
  });

  return recommendations;
}

/**
 * Select best drills for a specific weakness
 * Returns 2-3 drills prioritized by effectiveness and difficulty progression
 */
function selectDrillsForWeakness(weakness: Weakness): Drill[] {
  const drills: Drill[] = [];

  // Strategy 1: Use specific drill mapping if available
  const specificDrillIds = WEAKNESS_TO_DRILL_MAP[weakness.issue];
  if (specificDrillIds) {
    specificDrillIds.slice(0, 3).forEach(drillId => {
      const drill = DRILL_DATABASE.find(d => d.id === drillId);
      if (drill) drills.push(drill);
    });
  }

  // Strategy 2: If not enough specific drills, find by category
  if (drills.length < 3) {
    const categories = WEAKNESS_TO_CATEGORY_MAP[weakness.issue] || [weakness.category];
    const categoryDrills = DRILL_DATABASE.filter(drill =>
      categories.includes(drill.category) && !drills.find(d => d.id === drill.id)
    );

    // Add drills in difficulty progression (beginner -> intermediate)
    const beginnerDrills = categoryDrills.filter(d => d.difficulty === 'beginner');
    const intermediateDrills = categoryDrills.filter(d => d.difficulty === 'intermediate');

    if (drills.length === 0 && beginnerDrills.length > 0) {
      drills.push(beginnerDrills[0]);
    }

    if (drills.length < 3 && intermediateDrills.length > 0) {
      drills.push(intermediateDrills[0]);
    }

    // Add one more if still needed
    if (drills.length < 3 && categoryDrills.length > 0) {
      const remaining = categoryDrills.filter(d => !drills.find(existing => existing.id === d.id));
      if (remaining.length > 0) {
        drills.push(remaining[0]);
      }
    }
  }

  return drills.slice(0, 3); // Maximum 3 drills per weakness
}

/**
 * Get all unique drills from recommendations (for creating a training plan)
 */
export function getAllRecommendedDrills(recommendations: DrillRecommendation[]): Drill[] {
  const drillMap = new Map<string, Drill>();

  recommendations.forEach(rec => {
    rec.recommendedDrills.forEach(drill => {
      if (!drillMap.has(drill.id)) {
        drillMap.set(drill.id, drill);
      }
    });
  });

  return Array.from(drillMap.values());
}

/**
 * Filter recommendations by severity
 */
export function getRecommendationsBySeverity(
  recommendations: DrillRecommendation[],
  severity: 'high' | 'medium' | 'low'
): DrillRecommendation[] {
  return recommendations.filter(rec => rec.weakness.severity === severity);
}

/**
 * Get total number of drills recommended
 */
export function getTotalDrillCount(recommendations: DrillRecommendation[]): number {
  return getAllRecommendedDrills(recommendations).length;
}

/**
 * Generate a training session plan from recommendations
 * Groups drills by category for efficient training
 */
export function generateTrainingPlan(recommendations: DrillRecommendation[]): {
  category: string;
  drills: Drill[];
}[] {
  const allDrills = getAllRecommendedDrills(recommendations);
  const categoryMap = new Map<string, Drill[]>();

  allDrills.forEach(drill => {
    const category = drill.category;
    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }
    categoryMap.get(category)!.push(drill);
  });

  return Array.from(categoryMap.entries()).map(([category, drills]) => ({
    category,
    drills,
  }));
}
