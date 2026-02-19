import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DrillRecommendation, Drill } from '../types/report';

interface DrillRecommendationCardProps {
  recommendation: DrillRecommendation;
}

const DrillRecommendationCard: React.FC<DrillRecommendationCardProps> = ({ recommendation }) => {
  const [expandedDrillId, setExpandedDrillId] = useState<string | null>(null);

  const toggleDrill = (drillId: string) => {
    setExpandedDrillId(expandedDrillId === drillId ? null : drillId);
  };

  const priorityConfig = getPriorityConfig(recommendation.priority);

  return (
    <View style={styles.container}>
      {/* Header with Priority */}
      <View style={styles.header}>
        <View style={[styles.priorityBadge, { backgroundColor: priorityConfig.bgColor }]}>
          <Text style={[styles.priorityText, { color: priorityConfig.color }]}>
            PRIORITY {recommendation.priority}
          </Text>
        </View>
      </View>

      {/* Weakness Summary */}
      <View style={styles.weaknessSection}>
        <Text style={styles.weaknessLabel}>Addressing:</Text>
        <Text style={styles.weaknessIssue}>{recommendation.weakness.issue}</Text>
      </View>

      {/* Recommended Drills */}
      <Text style={styles.drillsHeader}>
        Recommended Drills ({recommendation.recommendedDrills.length})
      </Text>

      {recommendation.recommendedDrills.map((drill, index) => (
        <DrillItem
          key={drill.id}
          drill={drill}
          index={index}
          expanded={expandedDrillId === drill.id}
          onToggle={() => toggleDrill(drill.id)}
        />
      ))}
    </View>
  );
};

interface DrillItemProps {
  drill: Drill;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}

const DrillItem: React.FC<DrillItemProps> = ({ drill, index, expanded, onToggle }) => {
  const difficultyConfig = getDifficultyConfig(drill.difficulty);

  return (
    <View style={styles.drillContainer}>
      <TouchableOpacity
        style={styles.drillHeader}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={styles.drillHeaderLeft}>
          <View style={styles.drillNumberBadge}>
            <Text style={styles.drillNumber}>{index + 1}</Text>
          </View>
          <View style={styles.drillTitleContainer}>
            <Text style={styles.drillName}>{drill.name}</Text>
            <View style={[styles.difficultyBadge, { backgroundColor: difficultyConfig.bgColor }]}>
              <Text style={[styles.difficultyText, { color: difficultyConfig.color }]}>
                {drill.difficulty}
              </Text>
            </View>
          </View>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color="#004aad"
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.drillDetails}>
          {/* Description */}
          <Text style={styles.drillDescription}>{drill.description}</Text>

          {/* Equipment */}
          {drill.equipment.length > 0 && (
            <View style={styles.detailSection}>
              <View style={styles.detailRow}>
                <Ionicons name="construct-outline" size={16} color="#666" />
                <Text style={styles.detailLabel}>Equipment:</Text>
              </View>
              <View style={styles.equipmentContainer}>
                {drill.equipment.map((item, idx) => (
                  <View key={idx} style={styles.equipmentBadge}>
                    <Text style={styles.equipmentText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Focus Areas */}
          {drill.focusAreas.length > 0 && (
            <View style={styles.detailSection}>
              <View style={styles.detailRow}>
                <Ionicons name="locate-outline" size={16} color="#666" />
                <Text style={styles.detailLabel}>Focus Areas:</Text>
              </View>
              <View style={styles.focusContainer}>
                {drill.focusAreas.map((area, idx) => (
                  <Text key={idx} style={styles.focusItem}>
                    • {area}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {/* Instructions */}
          <View style={styles.detailSection}>
            <View style={styles.detailRow}>
              <Ionicons name="list-outline" size={16} color="#666" />
              <Text style={styles.detailLabel}>Instructions:</Text>
            </View>
            {drill.instructions.map((instruction, idx) => (
              <View key={idx} style={styles.instructionRow}>
                <Text style={styles.instructionNumber}>{idx + 1}.</Text>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))}
          </View>

          {/* Sets/Reps */}
          {drill.sets && (
            <View style={styles.setsContainer}>
              <Ionicons name="fitness-outline" size={18} color="#004aad" />
              <Text style={styles.setsText}>{drill.sets}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

function getPriorityConfig(priority: number) {
  if (priority === 1) {
    return { color: '#ff4444', bgColor: '#ffe6e6' };
  } else if (priority === 2) {
    return { color: '#ff8800', bgColor: '#fff4e6' };
  } else {
    return { color: '#33b5e5', bgColor: '#e6f7ff' };
  }
}

function getDifficultyConfig(difficulty: string) {
  switch (difficulty) {
    case 'beginner':
      return { color: '#00c851', bgColor: '#e6ffe9' };
    case 'intermediate':
      return { color: '#ff8800', bgColor: '#fff4e6' };
    case 'advanced':
      return { color: '#ff4444', bgColor: '#ffe6e6' };
    default:
      return { color: '#888', bgColor: '#f0f0f0' };
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  header: {
    marginBottom: 12,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  weaknessSection: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  weaknessLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  weaknessIssue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  drillsHeader: {
    fontSize: 15,
    fontWeight: '600',
    color: '#004aad',
    marginBottom: 12,
  },
  drillContainer: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    marginBottom: 12,
    overflow: 'hidden',
  },
  drillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#2a2a2a',
  },
  drillHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  drillNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#004aad',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  drillNumber: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  drillTitleContainer: {
    flex: 1,
  },
  drillName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  drillDetails: {
    padding: 16,
    backgroundColor: '#1a1a1a',
  },
  drillDescription: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 16,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 6,
  },
  equipmentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  equipmentBadge: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#004aad',
  },
  equipmentText: {
    fontSize: 13,
    color: '#4a9eff',
    fontWeight: '500',
  },
  focusContainer: {
    marginLeft: 8,
  },
  focusItem: {
    fontSize: 13,
    color: '#ccc',
    marginBottom: 4,
  },
  instructionRow: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  instructionNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#004aad',
    marginRight: 8,
    minWidth: 20,
  },
  instructionText: {
    fontSize: 13,
    color: '#ccc',
    flex: 1,
    lineHeight: 18,
  },
  setsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  setsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#004aad',
    marginLeft: 8,
  },
});

export default DrillRecommendationCard;
