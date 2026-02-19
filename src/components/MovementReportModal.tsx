import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MovementReport } from '../types/report';
import WeaknessCard from './WeaknessCard';
import DrillRecommendationCard from './DrillRecommendationCard';

const { width } = Dimensions.get('window');

interface MovementReportModalProps {
  visible: boolean;
  movementReport: MovementReport | null;
  onClose: () => void;
}

type TabType = 'overview' | 'phases' | 'timeline' | 'recommendations';

const MovementReportModal: React.FC<MovementReportModalProps> = ({
  visible,
  movementReport,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Animation values
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(600)).current;

  // Animate modal open/close
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          damping: 20,
          stiffness: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 600,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        style={[styles.modalOverlay, { opacity: overlayOpacity }]}
      >
        <TouchableOpacity
          style={styles.modalOverlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.modalContent,
            { transform: [{ translateY: sheetTranslateY }] },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Movement Report</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Tab Selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabScrollContainer}
            contentContainerStyle={styles.tabContainer}
          >
            <TouchableOpacity
              style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
              onPress={() => setActiveTab('overview')}
            >
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
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'phases' && styles.activeTabText,
                ]}
              >
                Phases
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'timeline' && styles.activeTab,
              ]}
              onPress={() => setActiveTab('timeline')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'timeline' && styles.activeTabText,
                ]}
              >
                Timeline
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'recommendations' && styles.activeTab,
              ]}
              onPress={() => setActiveTab('recommendations')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'recommendations' && styles.activeTabText,
                ]}
              >
                Drills
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Tab Content */}
          <ScrollView style={styles.content}>
            {activeTab === 'overview' && movementReport && (
              <View>
                {/* Key Metrics */}
                <Text style={styles.sectionTitle}>Key Metrics</Text>
                <View style={styles.metricsGrid}>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>Peak Velocity</Text>
                    <Text style={styles.metricValue}>
                      {movementReport.keyMetrics.peakVelocity.toFixed(2)} m/s
                    </Text>
                    <Text style={styles.metricHint}>
                      Frame {movementReport.keyMetrics.peakVelocityFrame}
                    </Text>
                  </View>
                  {movementReport.keyMetrics.maxElbowAngle !== null && (
                    <View style={styles.metricCard}>
                      <Text style={styles.metricLabel}>Max Elbow Angle</Text>
                      <Text style={styles.metricValue}>
                        {movementReport.keyMetrics.maxElbowAngle.toFixed(1)}°
                      </Text>
                    </View>
                  )}
                  <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>Arm Extension</Text>
                    <Text style={styles.metricValue}>
                      {movementReport.keyMetrics.armExtensionRange.range.toFixed(
                        1
                      )}
                      °
                    </Text>
                    <Text style={styles.metricHint}>
                      {movementReport.keyMetrics.armExtensionRange.min.toFixed(
                        1
                      )}
                      ° -{' '}
                      {movementReport.keyMetrics.armExtensionRange.max.toFixed(
                        1
                      )}
                      °
                    </Text>
                  </View>
                  {movementReport.keyMetrics.jumpHeight !== null && (
                    <View style={styles.metricCard}>
                      <Text style={styles.metricLabel}>Jump Height</Text>
                      <Text style={styles.metricValue}>
                        {(movementReport.keyMetrics.jumpHeight * 100).toFixed(
                          1
                        )}{' '}
                        cm
                      </Text>
                    </View>
                  )}
                </View>

                {/* Summary Insights */}
                <Text style={styles.sectionTitle}>Summary</Text>
                {movementReport.overallInsights.map((insight, index) => (
                  <View key={index} style={styles.insightItem}>
                    <Text style={styles.insightBullet}>•</Text>
                    <Text style={styles.insightText}>{insight}</Text>
                  </View>
                ))}
              </View>
            )}

            {activeTab === 'phases' && movementReport && (
              <View>
                {movementReport.phases.map((phase, index) => (
                  <View key={index} style={styles.phaseCard}>
                    <View style={styles.phaseHeader}>
                      <Text style={styles.phaseName}>{phase.name}</Text>
                      <Text style={styles.phaseDuration}>
                        {phase.duration.toFixed(2)}s
                      </Text>
                    </View>
                    <Text style={styles.phaseFrames}>
                      Frames {phase.startFrame} - {phase.endFrame}
                    </Text>
                    {phase.insights.map((insight, idx) => (
                      <View key={idx} style={styles.insightItem}>
                        <Text style={styles.insightBullet}>•</Text>
                        <Text style={styles.insightText}>{insight}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            )}

            {activeTab === 'timeline' && movementReport && (
              <View>
                <Text style={styles.sectionTitle}>
                  Frame-by-Frame Analysis
                </Text>
                <Text style={styles.placeholderText}>
                  Timeline visualization coming soon
                </Text>
              </View>
            )}

            {activeTab === 'recommendations' && movementReport && (
              <View>
                {movementReport.weaknesses.length > 0 ? (
                  <>
                    {/* Weaknesses Section */}
                    <Text style={styles.sectionTitle}>
                      Areas for Improvement
                    </Text>
                    <Text style={styles.sectionSubtitle}>
                      {movementReport.weaknesses.length} area
                      {movementReport.weaknesses.length > 1 ? 's' : ''}{' '}
                      identified
                    </Text>
                    {movementReport.weaknesses.map((weakness, index) => (
                      <WeaknessCard key={index} weakness={weakness} />
                    ))}

                    {/* Drill Recommendations */}
                    <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
                      Recommended Drills
                    </Text>
                    <Text style={styles.sectionSubtitle}>
                      Targeted exercises to improve your technique
                    </Text>
                    {movementReport.drillRecommendations.map(
                      (recommendation, index) => (
                        <DrillRecommendationCard
                          key={index}
                          recommendation={recommendation}
                        />
                      )
                    )}
                  </>
                ) : (
                  <View style={styles.noWeaknessesContainer}>
                    <Ionicons name="trophy" size={48} color="#00c851" />
                    <Text style={styles.noWeaknessesTitle}>Excellent Form!</Text>
                    <Text style={styles.noWeaknessesText}>
                      No significant weaknesses detected. Keep up the great
                      work!
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalOverlayTouchable: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '85%',
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
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  tabScrollContainer: {
    paddingLeft: 20,
    paddingTop: 16,
    paddingBottom: 12,
    flexGrow: 0,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 20,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  activeTab: {
    backgroundColor: '#004aad',
  },
  tabText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionSubtitle: {
    color: '#888',
    fontSize: 13,
    marginBottom: 16,
    marginTop: -8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    borderWidth: 1,
    borderColor: '#333',
  },
  metricLabel: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 8,
  },
  metricValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  metricHint: {
    color: '#666',
    fontSize: 11,
    marginTop: 4,
  },
  insightItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingRight: 20,
  },
  insightBullet: {
    color: '#004aad',
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  insightText: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  phaseCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  phaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  phaseName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  phaseDuration: {
    color: '#004aad',
    fontSize: 14,
    fontWeight: '600',
  },
  phaseFrames: {
    color: '#888',
    fontSize: 12,
    marginBottom: 12,
  },
  placeholderText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 40,
  },
  noWeaknessesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noWeaknessesTitle: {
    color: '#00c851',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  noWeaknessesText: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});

export default MovementReportModal;
