import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { KeyMoment } from '../types/report';
import { getDisplayMetrics, getColorForFindingType } from '../utils/findingHelpers';

interface FindingBottomSheetProps {
  keyMoment: KeyMoment | null;
  onJumpToFrame?: () => void;
}

const FindingBottomSheet: React.FC<FindingBottomSheetProps> = ({
  keyMoment,
  onJumpToFrame,
}) => {
  if (!keyMoment) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>No Finding Selected</Text>
        </View>
      </View>
    );
  }

  const metrics = getDisplayMetrics(keyMoment);
  const color = getColorForFindingType(keyMoment.label);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="star" size={20} color={color} />
          <Text style={styles.headerTitle}>{keyMoment.label}</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Frame & Time Info */}
        <View style={styles.infoRow}>
          <View style={styles.infoCard}>
            <Ionicons name="film" size={18} color="#888" />
            <Text style={styles.infoLabel}>Frame</Text>
            <Text style={styles.infoValue}>{keyMoment.frame}</Text>
          </View>
          <View style={styles.infoCard}>
            <Ionicons name="time" size={18} color="#888" />
            <Text style={styles.infoLabel}>Time</Text>
            <Text style={styles.infoValue}>{keyMoment.timestamp.toFixed(2)}s</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{keyMoment.description}</Text>
        </View>

        {/* Metrics */}
        {metrics.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Metrics</Text>
            <View style={styles.metricsGrid}>
              {metrics.map((metric, index) => (
                <View key={index} style={styles.metricCard}>
                  <Text style={styles.metricLabel}>{metric.label}</Text>
                  <Text style={[styles.metricValue, { color }]}>
                    {metric.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Jump to Frame Button */}
        {onJumpToFrame && (
          <TouchableOpacity
            style={[styles.jumpButton, { backgroundColor: color }]}
            onPress={onJumpToFrame}
            activeOpacity={0.8}
          >
            <Ionicons name="play-skip-forward" size={20} color="#fff" />
            <Text style={styles.jumpButtonText}>Jump to Frame {keyMoment.frame}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  infoLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  infoValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
  metricsGrid: {
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  metricLabel: {
    color: '#888',
    fontSize: 13,
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  jumpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  jumpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FindingBottomSheet;
