import { Drill } from '../types/report';

/**
 * Comprehensive database of volleyball-specific training drills
 * Organized by category to address different biomechanical weaknesses
 */
export const DRILL_DATABASE: Drill[] = [
  // ARM MECHANICS DRILLS
  {
    id: 'wall_touches',
    name: 'Wall Touches',
    description: 'Practice reaching high contact point against a wall to develop proper arm extension and contact height.',
    category: 'Arm Mechanics',
    difficulty: 'beginner',
    equipment: ['Wall'],
    focusAreas: ['Contact height', 'Arm extension', 'Reach', 'Shoulder mobility'],
    instructions: [
      'Stand facing a wall with feet shoulder-width apart',
      'Raise your hitting arm and touch the wall at the highest point possible',
      'Ensure your elbow is fully extended at contact',
      'Hold for 1 second, then lower and repeat',
      'Focus on consistent high contact point'
    ],
    sets: '3 sets of 20 repetitions'
  },
  {
    id: 'medicine_ball_throws',
    name: 'Overhead Medicine Ball Throws',
    description: 'Develop explosive arm extension and power generation through overhead throwing motion.',
    category: 'Arm Mechanics',
    difficulty: 'intermediate',
    equipment: ['Medicine ball (2-4kg)', 'Wall or partner'],
    focusAreas: ['Arm extension', 'Power generation', 'Explosive strength', 'Follow-through'],
    instructions: [
      'Hold medicine ball overhead with both hands',
      'Step forward with opposite foot',
      'Explosively throw ball forward and downward',
      'Focus on full arm extension at release',
      'Follow through completely'
    ],
    sets: '4 sets of 10 throws'
  },
  {
    id: 'resistance_band_extensions',
    name: 'Resistance Band Arm Extensions',
    description: 'Strengthen arm extension mechanics and build muscle memory for proper hitting motion.',
    category: 'Arm Mechanics',
    difficulty: 'beginner',
    equipment: ['Resistance band'],
    focusAreas: ['Elbow extension', 'Arm strength', 'Movement pattern'],
    instructions: [
      'Anchor resistance band at shoulder height',
      'Start with elbow bent at 90 degrees',
      'Extend arm fully in hitting motion',
      'Control the return slowly',
      'Maintain consistent speed throughout'
    ],
    sets: '3 sets of 15 repetitions per arm'
  },
  {
    id: 'platform_hitting',
    name: 'Platform Hitting',
    description: 'Practice hitting from elevated platform to develop high contact point without jumping.',
    category: 'Arm Mechanics',
    difficulty: 'intermediate',
    equipment: ['Platform/box', 'Ball', 'Net'],
    focusAreas: ['Contact point', 'Arm swing', 'Timing'],
    instructions: [
      'Stand on elevated platform near net',
      'Have partner toss balls to hitting position',
      'Focus solely on arm mechanics and contact point',
      'Hit 10 balls, focusing on consistent high contact',
      'Gradually increase power while maintaining form'
    ],
    sets: '5 sets of 10 hits'
  },

  // POWER GENERATION DRILLS
  {
    id: 'hip_rotation_throws',
    name: 'Rotational Medicine Ball Throws',
    description: 'Develop hip and core rotation power that transfers through the kinetic chain to the arm.',
    category: 'Power Generation',
    difficulty: 'intermediate',
    equipment: ['Medicine ball (3-5kg)', 'Wall'],
    focusAreas: ['Hip rotation', 'Core power', 'Energy transfer', 'Torso rotation'],
    instructions: [
      'Stand sideways to wall with medicine ball',
      'Rotate hips and torso explosively',
      'Throw ball into wall with side-throw motion',
      'Catch and repeat immediately',
      'Focus on initiating power from hips'
    ],
    sets: '3 sets of 12 throws per side'
  },
  {
    id: 'approach_jumps',
    name: 'Approach Jump Training',
    description: 'Build explosive power and proper approach mechanics for generating maximum vertical force.',
    category: 'Power Generation',
    difficulty: 'intermediate',
    equipment: ['Court space', 'Optional: measuring tape'],
    focusAreas: ['Approach speed', 'Jump height', 'Power generation', 'Timing'],
    instructions: [
      'Practice full approach (3 or 4 steps)',
      'Focus on accelerating through approach',
      'Convert horizontal momentum to vertical',
      'Swing arms explosively upward',
      'Land softly with controlled knee bend'
    ],
    sets: '5 sets of 5 approaches'
  },
  {
    id: 'box_jumps',
    name: 'Box Jumps',
    description: 'Develop explosive leg power and vertical jumping ability critical for high contact point.',
    category: 'Power Generation',
    difficulty: 'intermediate',
    equipment: ['Plyo box or platform (18-30 inches)'],
    focusAreas: ['Explosive power', 'Jump height', 'Leg strength'],
    instructions: [
      'Start in athletic stance facing box',
      'Swing arms back then explosively forward',
      'Jump onto box with both feet',
      'Land softly with knees bent',
      'Step down carefully, reset, and repeat'
    ],
    sets: '4 sets of 8 jumps'
  },
  {
    id: 'kettlebell_swings',
    name: 'Kettlebell Swings',
    description: 'Build posterior chain power and hip drive that translates to explosive hitting motion.',
    category: 'Power Generation',
    difficulty: 'advanced',
    equipment: ['Kettlebell (8-16kg)'],
    focusAreas: ['Hip power', 'Posterior chain', 'Explosive strength'],
    instructions: [
      'Stand with feet shoulder-width apart',
      'Hinge at hips, swing kettlebell between legs',
      'Explosively drive hips forward',
      'Swing kettlebell to chest/shoulder height',
      'Let momentum carry it, do not lift with arms'
    ],
    sets: '4 sets of 15 swings'
  },

  // TIMING DRILLS
  {
    id: 'ball_drop_hits',
    name: 'Ball Drop Hitting',
    description: 'Improve hand-eye coordination and timing by hitting balls dropped from various heights.',
    category: 'Timing',
    difficulty: 'beginner',
    equipment: ['Ball', 'Partner or ball machine'],
    focusAreas: ['Timing', 'Hand-eye coordination', 'Reaction time'],
    instructions: [
      'Partner holds ball at net height',
      'Partner drops ball',
      'Time your approach and swing to hit ball mid-drop',
      'Focus on contact timing and consistency',
      'Gradually increase drop complexity'
    ],
    sets: '4 sets of 15 drops'
  },
  {
    id: 'self_toss_hitting',
    name: 'Self-Toss Hitting',
    description: 'Develop timing consistency and arm swing mechanics through self-controlled hitting.',
    category: 'Timing',
    difficulty: 'beginner',
    equipment: ['Ball', 'Net'],
    focusAreas: ['Timing', 'Arm swing', 'Self-awareness', 'Consistency'],
    instructions: [
      'Toss ball up with non-hitting hand',
      'Time approach and swing',
      'Hit ball at peak of toss',
      'Focus on consistent toss height',
      'Gradually add approach steps'
    ],
    sets: '5 sets of 10 hits'
  },
  {
    id: 'rhythm_approaches',
    name: 'Rhythm Approach Practice',
    description: 'Develop consistent approach timing and footwork rhythm without the ball.',
    category: 'Timing',
    difficulty: 'beginner',
    equipment: ['Court space'],
    focusAreas: ['Approach timing', 'Footwork rhythm', 'Consistency'],
    instructions: [
      'Practice approach footwork repeatedly',
      'Count rhythm out loud (e.g., "1-2-3")',
      'Focus on consistent timing',
      'Gradually increase speed',
      'Add arm swing without ball'
    ],
    sets: '10 sets of 5 approaches'
  },

  // BODY POSITIONING DRILLS
  {
    id: 'core_rotation_exercises',
    name: 'Russian Twists',
    description: 'Strengthen core rotational strength essential for powerful hitting motion.',
    category: 'Body Positioning',
    difficulty: 'beginner',
    equipment: ['Optional: medicine ball or weight'],
    focusAreas: ['Core strength', 'Rotational power', 'Torso control'],
    instructions: [
      'Sit on floor with knees bent, feet elevated',
      'Hold weight or medicine ball at chest',
      'Rotate torso side to side',
      'Touch weight to floor on each side',
      'Keep core engaged throughout'
    ],
    sets: '3 sets of 30 twists (15 each side)'
  },
  {
    id: 'plank_variations',
    name: 'Plank Hold Variations',
    description: 'Build core stability and posture control necessary for maintaining proper body position.',
    category: 'Body Positioning',
    difficulty: 'beginner',
    equipment: ['Mat (optional)'],
    focusAreas: ['Core stability', 'Posture', 'Body control'],
    instructions: [
      'Hold forearm plank position',
      'Keep body straight from head to heels',
      'Engage core, avoid sagging or raising hips',
      'Breathe steadily',
      'Alternate with side planks'
    ],
    sets: '3 sets of 45-60 seconds per position'
  },
  {
    id: 'balance_single_leg',
    name: 'Single-Leg Balance Exercises',
    description: 'Improve balance and body control during approach and landing.',
    category: 'Body Positioning',
    difficulty: 'beginner',
    equipment: ['Balance board (optional)'],
    focusAreas: ['Balance', 'Body control', 'Stability'],
    instructions: [
      'Stand on one leg',
      'Maintain balance for 30 seconds',
      'Add arm swing movements',
      'Close eyes for increased difficulty',
      'Switch legs and repeat'
    ],
    sets: '3 sets of 30 seconds per leg'
  },

  // SHOULDER & MOBILITY DRILLS
  {
    id: 'shoulder_circles',
    name: 'Dynamic Shoulder Circles',
    description: 'Improve shoulder mobility and prepare shoulder joint for explosive hitting motion.',
    category: 'Shoulder Mechanics',
    difficulty: 'beginner',
    equipment: ['None'],
    focusAreas: ['Shoulder mobility', 'Range of motion', 'Warm-up'],
    instructions: [
      'Stand with arms extended to sides',
      'Make large circles forward for 30 seconds',
      'Reverse direction for 30 seconds',
      'Gradually increase circle size',
      'Keep movements controlled'
    ],
    sets: '3 sets of 30 seconds each direction'
  },
  {
    id: 'arm_swing_practice',
    name: 'Shadow Arm Swing',
    description: 'Practice and refine arm swing mechanics without ball to develop muscle memory.',
    category: 'Shoulder Mechanics',
    difficulty: 'beginner',
    equipment: ['Mirror (optional)'],
    focusAreas: ['Arm swing path', 'Shoulder mechanics', 'Movement pattern'],
    instructions: [
      'Stand in front of mirror if available',
      'Practice full arm swing motion slowly',
      'Focus on proper arm path and elbow position',
      'Gradually increase speed',
      'Perform 50 perfect swings'
    ],
    sets: '3 sets of 50 swings'
  },

  // FOLLOW-THROUGH & DECELERATION DRILLS
  {
    id: 'controlled_follow_through',
    name: 'Controlled Follow-Through Practice',
    description: 'Develop proper follow-through mechanics to prevent injury and maintain power.',
    category: 'Follow-Through',
    difficulty: 'intermediate',
    equipment: ['Ball', 'Net'],
    focusAreas: ['Follow-through', 'Deceleration', 'Injury prevention'],
    instructions: [
      'Hit ball with focus on complete follow-through',
      'Allow arm to swing naturally across body',
      'Control deceleration of arm',
      'Land balanced and ready',
      'Never stop arm abruptly'
    ],
    sets: '4 sets of 12 hits'
  },
  {
    id: 'eccentric_arm_strengthening',
    name: 'Eccentric Arm Lowering',
    description: 'Build strength in the deceleration phase to protect shoulder and improve control.',
    category: 'Follow-Through',
    difficulty: 'intermediate',
    equipment: ['Light dumbbell (1-3kg)'],
    focusAreas: ['Eccentric strength', 'Shoulder protection', 'Deceleration control'],
    instructions: [
      'Hold light dumbbell in hitting hand',
      'Raise arm to hitting position',
      'Lower arm very slowly (5 seconds)',
      'Follow natural hitting path',
      'Repeat for 10 reps'
    ],
    sets: '3 sets of 10 repetitions'
  },

  // CONSISTENCY & REPEATABILITY DRILLS
  {
    id: 'repetitive_hitting',
    name: 'High-Volume Hitting',
    description: 'Build consistency through high-repetition hitting focusing on repeatable mechanics.',
    category: 'Consistency',
    difficulty: 'intermediate',
    equipment: ['Ball', 'Net', 'Setter or ball machine'],
    focusAreas: ['Consistency', 'Repeatability', 'Muscle memory'],
    instructions: [
      'Have setter provide consistent sets',
      'Focus on identical approach and swing each time',
      'Aim for same target spot',
      'Monitor fatigue and maintain form',
      'Take brief breaks between sets'
    ],
    sets: '5 sets of 20 hits'
  },
  {
    id: 'target_hitting',
    name: 'Target Zone Hitting',
    description: 'Improve accuracy and consistency by hitting to specific court zones repeatedly.',
    category: 'Consistency',
    difficulty: 'intermediate',
    equipment: ['Ball', 'Net', 'Target markers'],
    focusAreas: ['Accuracy', 'Consistency', 'Control'],
    instructions: [
      'Place targets in different court zones',
      'Hit 10 balls to each target zone',
      'Focus on consistent mechanics to each zone',
      'Adjust approach angle, not swing mechanics',
      'Track success rate'
    ],
    sets: '4 sets to 3 different zones'
  },

  // ADVANCED COMBINATION DRILLS
  {
    id: 'plyometric_hitting',
    name: 'Plyometric Box Hitting',
    description: 'Advanced drill combining explosive jumping with hitting mechanics.',
    category: 'Power Generation',
    difficulty: 'advanced',
    equipment: ['Plyo box', 'Ball', 'Net', 'Setter'],
    focusAreas: ['Explosive power', 'Timing', 'Coordination'],
    instructions: [
      'Start on plyo box',
      'Jump off box as setter tosses',
      'Time approach to meet ball at peak',
      'Focus on explosive power and timing',
      'Land safely with bent knees'
    ],
    sets: '4 sets of 8 hits'
  },
  {
    id: 'weighted_ball_training',
    name: 'Weighted Ball Hitting',
    description: 'Build arm strength and power using slightly heavier volleyball.',
    category: 'Power Generation',
    difficulty: 'advanced',
    equipment: ['Weighted volleyball (6-7 oz)', 'Net'],
    focusAreas: ['Arm strength', 'Power', 'Contact strength'],
    instructions: [
      'Use volleyball 1-2 oz heavier than standard',
      'Perform normal hitting routine',
      'Focus on maintaining form despite added weight',
      'Limit reps to prevent fatigue',
      'Alternate with standard ball'
    ],
    sets: '3 sets of 10 hits'
  },
  {
    id: 'live_game_simulation',
    name: 'Game Situation Hitting',
    description: 'Practice hitting in realistic game scenarios to transfer training to competition.',
    category: 'Consistency',
    difficulty: 'advanced',
    equipment: ['Full team setup', 'Ball', 'Net'],
    focusAreas: ['Game application', 'Decision making', 'Consistency under pressure'],
    instructions: [
      'Set up realistic game scenarios',
      'Practice hitting with blockers',
      'Make decisions about shot placement',
      'Maintain mechanics under pressure',
      'Simulate fatigue conditions'
    ],
    sets: 'Variable based on drill'
  }
];

/**
 * Get drills by category
 */
export function getDrillsByCategory(category: string): Drill[] {
  return DRILL_DATABASE.filter(drill => drill.category === category);
}

/**
 * Get drills by difficulty
 */
export function getDrillsByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): Drill[] {
  return DRILL_DATABASE.filter(drill => drill.difficulty === difficulty);
}

/**
 * Get drill by ID
 */
export function getDrillById(id: string): Drill | undefined {
  return DRILL_DATABASE.find(drill => drill.id === id);
}
