import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Weakness } from '../types/report';

interface WeaknessCardProps {
  weakness: Weakness;
}

const WeaknessCard: React.FC<WeaknessCardProps> = ({ weakness }) => {
  const severityConfig = getSeverityConfig(weakness.severity);

  return (
    <View style={[styles.container, { borderLeftColor: severityConfig.color }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name={severityConfig.icon} size={22} color={severityConfig.color} />
          <Text style={styles.issue}>{weakness.issue}</Text>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: severityConfig.bgColor }]}>
          <Text style={[styles.severityText, { color: severityConfig.color }]}>
            {weakness.severity.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Category */}
      <Text style={styles.category}>{weakness.category}</Text>

      {/* Metrics Comparison */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Detected</Text>
          <Text style={[styles.metricValue, { color: severityConfig.color }]}>
            {formatValue(weakness.detectedValue)}
          </Text>
        </View>
        <Ionicons name="arrow-forward" size={20} color="#888" style={styles.arrow} />
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Optimal Range</Text>
          <Text style={styles.metricValue}>
            {formatValue(weakness.optimalRange.min)} - {formatValue(weakness.optimalRange.max)}
          </Text>
        </View>
      </View>

      {/* Explanation */}
      <View style={styles.explanationContainer}>
        <Ionicons name="information-circle-outline" size={18} color="#004aad" />
        <Text style={styles.explanation}>{weakness.explanation}</Text>
      </View>
    </View>
  );
};

/**
 * Get styling configuration based on severity
 */
function getSeverityConfig(severity: 'low' | 'medium' | 'high') {
  switch (severity) {
    case 'high':
      return {
        color: '#ff4444',
        bgColor: '#ffe6e6',
        icon: 'alert-circle' as const,
      };
    case 'medium':
      return {
        color: '#ff8800',
        bgColor: '#fff4e6',
        icon: 'warning' as const,
      };
    case 'low':
      return {
        color: '#33b5e5',
        bgColor: '#e6f7ff',
        icon: 'information-circle' as const,
      };
  }
}

/**
 * Format numeric values for display
 */
function formatValue(value: number): string {
  // If value looks like an angle (reasonable range 0-180)
  if (value >= 0 && value <= 180) {
    return `${value.toFixed(1)}°`;
  }
  // If value is a small decimal (normalized coordinates)
  if (value > 0 && value < 2) {
    return value.toFixed(3);
  }
  // Otherwise, show as is
  return value.toFixed(2);
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  issue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  category: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  metricsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  metricBox: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  arrow: {
    marginHorizontal: 8,
  },
  explanationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
  },
  explanation: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginLeft: 8,
    flex: 1,
  },
});

export default WeaknessCard;
