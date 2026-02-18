import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { loadLatestAnalysis } from '../services/analysisLoader';
import { generateMovementReport } from '../services/movementAnalyzer';
import { MovementReport, KeyMoment, MovementPhase } from '../types/report';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

type TabType = 'overview' | 'phases' | 'timeline';

const MovementReportScreen: React.FC = () => {
  const navigation = useNavigation();
  const [report, setReport] = useState<MovementReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      const analysis = await loadLatestAnalysis();
      if (!analysis) {
        throw new Error('No analysis data found');
      }

      const generatedReport = generateMovementReport(analysis);
      setReport(generatedReport);
    } catch (err) {
      console.error('Error generating report:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#004aad" />
          <Text style={styles.loadingText}>Generating movement report...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !report) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error || 'Failed to generate report'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Movement Analysis</Text>
        <View style={styles.backButton} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Ionicons
            name="stats-chart"
            size={20}
            color={activeTab === 'overview' ? '#004aad' : '#888'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'overview' && styles.activeTabText,
            ]}
          >
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'phases' && styles.activeTab]}
          onPress={() => setActiveTab('phases')}
        >
          <Ionicons
            name="layers"
            size={20}
            color={activeTab === 'phases' ? '#004aad' : '#888'}
          />
          <Text
            style={[styles.tabText, activeTab === 'phases' && styles.activeTabText]}
          >
            Phases
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'timeline' && styles.activeTab]}
          onPress={() => setActiveTab('timeline')}
        >
          <Ionicons
            name="trending-up"
            size={20}
            color={activeTab === 'timeline' ? '#004aad' : '#888'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'timeline' && styles.activeTabText,
            ]}
          >
            Timeline
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && <OverviewTab report={report} />}
        {activeTab === 'phases' && <PhasesTab report={report} />}
        {activeTab === 'timeline' && <TimelineTab report={report} />}
      </ScrollView>
    </SafeAreaView>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{ report: MovementReport }> = ({ report }) => {
  const { keyMetrics, overallInsights, keyMoments } = report;

  return (
    <View style={styles.tabContent}>
      {/* Key Metrics Cards */}
      <Text style={styles.sectionTitle}>Key Metrics</Text>

      <View style={styles.metricsGrid}>
        <MetricCard
          icon="speedometer"
          label="Peak Velocity"
          value={`${keyMetrics.peakVelocity.toFixed(3)}`}
          unit="units/s"
          color="#004aad"
        />
        <MetricCard
          icon="trending-up"
          label="Avg Velocity"
          value={`${keyMetrics.averageVelocity.toFixed(3)}`}
          unit="units/s"
          color="#00c851"
        />
        {keyMetrics.maxElbowAngle !== null && (
          <MetricCard
            icon="git-compare"
            label="Max Elbow Angle"
            value={`${keyMetrics.maxElbowAngle.toFixed(1)}`}
            unit="degrees"
            color="#ff8800"
          />
        )}
        {keyMetrics.minElbowAngle !== null && (
          <MetricCard
            icon="git-compare"
            label="Min Elbow Angle"
            value={`${keyMetrics.minElbowAngle.toFixed(1)}`}
            unit="degrees"
            color="#ff4444"
          />
        )}
        <MetricCard
          icon="resize"
          label="Arm Extension Range"
          value={`${keyMetrics.armExtensionRange.range.toFixed(3)}`}
          unit="units"
          color="#33b5e5"
        />
        {keyMetrics.jumpHeight !== null && (
          <MetricCard
            icon="arrow-up"
            label="Vertical Movement"
            value={`${(keyMetrics.jumpHeight * 100).toFixed(1)}`}
            unit="% of frame"
            color="#aa66cc"
          />
        )}
      </View>

      {/* Key Moments */}
      <Text style={styles.sectionTitle}>Key Moments</Text>
      {keyMoments.map((moment, index) => (
        <KeyMomentCard key={index} moment={moment} />
      ))}

      {/* Overall Insights */}
      <Text style={styles.sectionTitle}>Overall Insights</Text>
      <View style={styles.insightsContainer}>
        {overallInsights.map((insight, index) => (
          <View key={index} style={styles.insightRow}>
            <Ionicons name="checkmark-circle" size={20} color="#00c851" />
            <Text style={styles.insightText}>{insight}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// Phases Tab Component
const PhasesTab: React.FC<{ report: MovementReport }> = ({ report }) => {
  const { phases } = report;

  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Movement Phases</Text>
      {phases.map((phase, index) => (
        <PhaseCard key={index} phase={phase} />
      ))}
    </View>
  );
};

// Timeline Tab Component
const TimelineTab: React.FC<{ report: MovementReport }> = ({ report }) => {
  const { timelineData } = report;

  // Prepare velocity chart data
  const velocityLabels = timelineData.velocities
    .filter((_, i) => i % Math.ceil(timelineData.velocities.length / 8) === 0)
    .map(v => v.frame.toString());

  const velocityValues = timelineData.velocities.map(v => v.velocity);

  // Prepare angle chart data (Right Elbow)
  const elbowAngles = timelineData.angles
    .filter(a => a.joint === 'Right Elbow' && a.angle !== null);

  const angleLabels = elbowAngles
    .filter((_, i) => i % Math.ceil(elbowAngles.length / 8) === 0)
    .map(a => a.frame.toString());

  const angleValues = elbowAngles.map(a => a.angle || 0);

  return (
    <View style={styles.tabContent}>
      {/* Velocity Chart */}
      <Text style={styles.sectionTitle}>Velocity Over Time</Text>
      <View style={styles.chartContainer}>
        {velocityValues.length > 0 ? (
          <LineChart
            data={{
              labels: velocityLabels,
              datasets: [{ data: velocityValues }],
            }}
            width={width - 40}
            height={220}
            chartConfig={{
              backgroundColor: '#1a1a1a',
              backgroundGradientFrom: '#1a1a1a',
              backgroundGradientTo: '#2a2a2a',
              decimalPlaces: 3,
              color: (opacity = 1) => `rgba(0, 74, 173, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: 3,
                strokeWidth: 2,
                stroke: '#004aad',
              },
            }}
            bezier={true}
            style={styles.chart}
          />
        ) : (
          <Text style={styles.noDataText}>No velocity data available</Text>
        )}
        <Text style={styles.chartLabel}>Frame Number</Text>
        <Text style={styles.chartUnit}>Velocity (units/s)</Text>
      </View>

      {/* Elbow Angle Chart */}
      <Text style={styles.sectionTitle}>Right Elbow Angle Over Time</Text>
      <View style={styles.chartContainer}>
        {angleValues.length > 0 ? (
          <LineChart
            data={{
              labels: angleLabels,
              datasets: [{ data: angleValues }],
            }}
            width={width - 40}
            height={220}
            chartConfig={{
              backgroundColor: '#1a1a1a',
              backgroundGradientFrom: '#1a1a1a',
              backgroundGradientTo: '#2a2a2a',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 136, 0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: 3,
                strokeWidth: 2,
                stroke: '#ff8800',
              },
            }}
            bezier={true}
            style={styles.chart}
          />
        ) : (
          <Text style={styles.noDataText}>No angle data available</Text>
        )}
        <Text style={styles.chartLabel}>Frame Number</Text>
        <Text style={styles.chartUnit}>Angle (degrees)</Text>
      </View>
    </View>
  );
};

// Metric Card Component
const MetricCard: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  unit: string;
  color: string;
}> = ({ icon, label, value, unit, color }) => (
  <View style={styles.metricCard}>
    <Ionicons name={icon} size={24} color={color} />
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricUnit}>{unit}</Text>
  </View>
);

// Key Moment Card Component
const KeyMomentCard: React.FC<{ moment: KeyMoment }> = ({ moment }) => (
  <View style={styles.momentCard}>
    <View style={styles.momentHeader}>
      <View style={styles.momentLabelContainer}>
        <Ionicons name="star" size={18} color="#ffd700" />
        <Text style={styles.momentLabel}>{moment.label}</Text>
      </View>
      <Text style={styles.momentFrame}>Frame {moment.frame}</Text>
    </View>
    <Text style={styles.momentDescription}>{moment.description}</Text>

    {/* Metrics */}
    <View style={styles.momentMetrics}>
      {moment.metrics.velocity !== undefined && (
        <Text style={styles.momentMetric}>
          Velocity: {moment.metrics.velocity.toFixed(3)} units/s
        </Text>
      )}
      {moment.metrics.elbowAngle !== undefined && moment.metrics.elbowAngle !== null && (
        <Text style={styles.momentMetric}>
          Elbow: {moment.metrics.elbowAngle.toFixed(1)}°
        </Text>
      )}
      {moment.metrics.armExtension !== undefined && moment.metrics.armExtension !== null && (
        <Text style={styles.momentMetric}>
          Extension: {moment.metrics.armExtension.toFixed(3)} units
        </Text>
      )}
    </View>
  </View>
);

// Phase Card Component
const PhaseCard: React.FC<{ phase: MovementPhase }> = ({ phase }) => {
  const phaseColors: Record<string, string> = {
    Preparation: '#004aad',
    Acceleration: '#00c851',
    Contact: '#ff8800',
    'Follow-through': '#aa66cc',
  };

  const color = phaseColors[phase.name] || '#888';

  return (
    <View style={styles.phaseCard}>
      <View style={[styles.phaseIndicator, { backgroundColor: color }]} />
      <View style={styles.phaseContent}>
        <Text style={styles.phaseName}>{phase.name}</Text>
        <Text style={styles.phaseDescription}>{phase.description}</Text>

        {/* Phase Info */}
        <View style={styles.phaseInfo}>
          <View style={styles.phaseInfoItem}>
            <Ionicons name="time" size={16} color="#888" />
            <Text style={styles.phaseInfoText}>
              {phase.duration.toFixed(2)}s
            </Text>
          </View>
          <View style={styles.phaseInfoItem}>
            <Ionicons name="film" size={16} color="#888" />
            <Text style={styles.phaseInfoText}>
              Frames {phase.startFrame}-{phase.endFrame}
            </Text>
          </View>
        </View>

        {/* Metrics */}
        <View style={styles.phaseMetrics}>
          <View style={styles.phaseMetricItem}>
            <Text style={styles.phaseMetricLabel}>Avg Velocity</Text>
            <Text style={styles.phaseMetricValue}>
              {phase.avgVelocity.toFixed(3)} units/s
            </Text>
          </View>
          <View style={styles.phaseMetricItem}>
            <Text style={styles.phaseMetricLabel}>Max Velocity</Text>
            <Text style={styles.phaseMetricValue}>
              {phase.maxVelocity.toFixed(3)} units/s
            </Text>
          </View>
        </View>

        {/* Insights */}
        {phase.insights.length > 0 && (
          <View style={styles.phaseInsights}>
            {phase.insights.map((insight, index) => (
              <View key={index} style={styles.phaseInsightRow}>
                <Text style={styles.phaseInsightBullet}>•</Text>
                <Text style={styles.phaseInsightText}>{insight}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#aaa',
    marginTop: 16,
    fontSize: 14,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#004aad',
  },
  tabText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#004aad',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    marginTop: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    width: (width - 52) / 2,
    borderWidth: 1,
    borderColor: '#333',
  },
  metricLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  metricUnit: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  momentCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  momentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  momentLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  momentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  momentFrame: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  momentDescription: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 12,
  },
  momentMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  momentMetric: {
    fontSize: 12,
    color: '#004aad',
    backgroundColor: 'rgba(0, 74, 173, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  insightsContainer: {
    gap: 12,
  },
  insightRow: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: '#ddd',
    lineHeight: 20,
  },
  phaseCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  phaseIndicator: {
    width: 4,
  },
  phaseContent: {
    flex: 1,
    padding: 16,
  },
  phaseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  phaseDescription: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 12,
  },
  phaseInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  phaseInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  phaseInfoText: {
    fontSize: 12,
    color: '#888',
  },
  phaseMetrics: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  phaseMetricItem: {
    flex: 1,
  },
  phaseMetricLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 2,
  },
  phaseMetricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  phaseInsights: {
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  phaseInsightRow: {
    flexDirection: 'row',
    gap: 8,
  },
  phaseInsightBullet: {
    color: '#666',
    fontSize: 14,
  },
  phaseInsightText: {
    flex: 1,
    fontSize: 13,
    color: '#aaa',
    lineHeight: 18,
  },
  chartContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  chartUnit: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  noDataText: {
    fontSize: 14,
    color: '#888',
    padding: 40,
    textAlign: 'center',
  },
});

export default MovementReportScreen;
