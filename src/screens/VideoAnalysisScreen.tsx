import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Text,
  Dimensions,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import VideoPlayer, { VideoPlayerRef } from '../components/VideoPlayer';
import Skeleton3DView, {
  Skeleton3DViewRef,
} from '../components/Skeleton3DView';
import CameraControls from '../components/CameraControls';
import SpeedControls from '../components/SpeedControls';
import PlaybackControls from '../components/PlaybackControls';
import { useVideoSync } from '../hooks/useVideoSync';
import { loadLatestAnalysis } from '../services/analysisLoader';
import { AnalysisResult, CameraAngle } from '../types/analysis';
import { generateMovementReport } from '../services/movementAnalyzer';
import { MovementReport } from '../types/report';

const { height } = Dimensions.get('window');
const VIDEO_HEIGHT = height * 0.28; // 28% for video
const SKELETON_HEIGHT = height * 0.48; // 48% for 3D skeleton (increased from 40%)

// Helper to get camera angle label
const getCameraAngleLabel = (angle: CameraAngle): string => {
  const labels: Record<CameraAngle, string> = {
    front: 'Front',
    back: 'Back',
    left: 'Left',
    right: 'Right',
    top: 'Top',
    diagonal: '3/4',
  };
  return labels[angle];
};

const VideoAnalysisScreen: React.FC = () => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cameraAngle, setCameraAngle] = useState<CameraAngle>('front');
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [speedModalVisible, setSpeedModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [movementReport, setMovementReport] = useState<MovementReport | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'phases' | 'timeline'>('overview');

  const videoPlayerRef = useRef<VideoPlayerRef>(null);
  const skeleton3DRef = useRef<Skeleton3DViewRef>(null);

  // Animation values for camera modal
  const cameraOverlayOpacity = useRef(new Animated.Value(0)).current;
  const cameraSheetTranslateY = useRef(new Animated.Value(300)).current;

  // Animation values for speed modal
  const speedOverlayOpacity = useRef(new Animated.Value(0)).current;
  const speedSheetTranslateY = useRef(new Animated.Value(300)).current;

  // Animation values for report modal
  const reportOverlayOpacity = useRef(new Animated.Value(0)).current;
  const reportSheetTranslateY = useRef(new Animated.Value(600)).current;

  const {
    currentFrame,
    playbackState,
    handlePlaybackUpdate,
    handleSeek,
    handlePreviousFrame,
    handleNextFrame,
    handleSpeedChange,
  } = useVideoSync(analysis, videoPlayerRef, skeleton3DRef);

  useEffect(() => {
    loadAnalysisData();
  }, []);

  // Animate camera modal open/close
  useEffect(() => {
    if (cameraModalVisible) {
      Animated.parallel([
        Animated.timing(cameraOverlayOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(cameraSheetTranslateY, {
          toValue: 0,
          damping: 20,
          stiffness: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(cameraOverlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(cameraSheetTranslateY, {
          toValue: 300,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [cameraModalVisible]);

  // Animate speed modal open/close
  useEffect(() => {
    if (speedModalVisible) {
      Animated.parallel([
        Animated.timing(speedOverlayOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(speedSheetTranslateY, {
          toValue: 0,
          damping: 20,
          stiffness: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(speedOverlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(speedSheetTranslateY, {
          toValue: 300,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [speedModalVisible]);

  // Animate report modal open/close
  useEffect(() => {
    if (reportModalVisible) {
      Animated.parallel([
        Animated.timing(reportOverlayOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(reportSheetTranslateY, {
          toValue: 0,
          damping: 20,
          stiffness: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(reportOverlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(reportSheetTranslateY, {
          toValue: 600,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [reportModalVisible]);

  const loadAnalysisData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await loadLatestAnalysis();
      if (!data) {
        throw new Error('No analysis data found');
      }

      setAnalysis(data);

      // Generate movement report from analysis data
      const report = generateMovementReport(data);
      setMovementReport(report);
    } catch (err) {
      console.error('Error loading analysis:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = async () => {
    if (!videoPlayerRef.current) return;

    if (playbackState.isPlaying) {
      await videoPlayerRef.current.pause();
    } else {
      await videoPlayerRef.current.play();
    }
  };

  const handleCameraAngleChange = (angle: CameraAngle) => {
    setCameraAngle(angle);
    skeleton3DRef.current?.setCameraAngle(angle);
    setCameraModalVisible(false); // Close modal after selection
  };

  const handleSpeedChangeFromModal = (speed: number) => {
    handleSpeedChange(speed);
    setSpeedModalVisible(false); // Close modal after selection
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#004aad" />
          <Text style={styles.loadingText}>Loading analysis data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !analysis) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>
            {error || 'Failed to load analysis data'}
          </Text>
          <Text style={styles.errorHint}>
            Make sure the test video has been analyzed
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Use bundled video asset instead of absolute path
  const video = require('../../assets/videos/testvideo.mp4');

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
        >
          {/* Video Player Section */}
          <View style={[styles.videoSection, { height: VIDEO_HEIGHT }]}>
            <VideoPlayer
              ref={videoPlayerRef}
              videoUri={video}
              onPlaybackUpdate={handlePlaybackUpdate}
              style={styles.flex}
            />
          </View>

          {/* 3D Skeleton Section */}
          <View style={[styles.skeletonSection, { height: SKELETON_HEIGHT }]}>
            <Skeleton3DView
              ref={skeleton3DRef}
              frameData={currentFrame}
              autoRotate={false}
              style={styles.flex}
            />
            {/* Frame Counter Badge (Left) */}
            <View style={styles.frameBadge}>
              <Text style={styles.frameBadgeText}>
                {playbackState.currentFrame} / {analysis?.video_info.total_frames || 0}
              </Text>
            </View>

            {/* Control Buttons (Right) */}
            <View style={styles.controlButtonsContainer}>
              {/* Report Button */}
              <TouchableOpacity
                style={[styles.controlButton, styles.reportButton]}
                onPress={() => setReportModalVisible(true)}
              >
                <Ionicons name="bar-chart" size={18} color="#fff" />
                <Text style={styles.controlButtonText}>Report</Text>
              </TouchableOpacity>

              {/* Speed Button */}
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => setSpeedModalVisible(true)}
              >
                <Ionicons name="speedometer" size={18} color="#fff" />
                <Text style={styles.controlButtonText}>
                  {playbackState.speed}x
                </Text>
              </TouchableOpacity>

              {/* Camera Button */}
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => setCameraModalVisible(true)}
              >
                <Ionicons name="camera" size={18} color="#fff" />
                <Text style={styles.controlButtonText}>
                  {getCameraAngleLabel(cameraAngle)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Playback Controls */}
          <PlaybackControls
            isPlaying={playbackState.isPlaying}
            currentTime={playbackState.currentTime}
            duration={playbackState.duration}
            currentFrame={playbackState.currentFrame}
            totalFrames={analysis.video_info.total_frames}
            speed={playbackState.speed}
            onPlayPause={handlePlayPause}
            onSeek={handleSeek}
            onPreviousFrame={handlePreviousFrame}
            onNextFrame={handleNextFrame}
            onSpeedChange={handleSpeedChange}
          />
        </ScrollView>

        {/* Camera Angle Modal */}
        <Modal
          visible={cameraModalVisible}
          transparent={true}
          animationType="none"
          onRequestClose={() => setCameraModalVisible(false)}
        >
          <Animated.View
            style={[
              styles.modalOverlay,
              { opacity: cameraOverlayOpacity },
            ]}
          >
            <TouchableOpacity
              style={styles.modalOverlayTouchable}
              activeOpacity={1}
              onPress={() => setCameraModalVisible(false)}
            />
            <Animated.View
              style={[
                styles.modalContent,
                { transform: [{ translateY: cameraSheetTranslateY }] },
              ]}
            >
              <CameraControls
                onAngleChange={handleCameraAngleChange}
                currentAngle={cameraAngle}
              />
            </Animated.View>
          </Animated.View>
        </Modal>

        {/* Speed Modal */}
        <Modal
          visible={speedModalVisible}
          transparent={true}
          animationType="none"
          onRequestClose={() => setSpeedModalVisible(false)}
        >
          <Animated.View
            style={[
              styles.modalOverlay,
              { opacity: speedOverlayOpacity },
            ]}
          >
            <TouchableOpacity
              style={styles.modalOverlayTouchable}
              activeOpacity={1}
              onPress={() => setSpeedModalVisible(false)}
            />
            <Animated.View
              style={[
                styles.modalContent,
                { transform: [{ translateY: speedSheetTranslateY }] },
              ]}
            >
              <SpeedControls
                onSpeedChange={handleSpeedChangeFromModal}
                currentSpeed={playbackState.speed}
              />
            </Animated.View>
          </Animated.View>
        </Modal>

        {/* Report Modal */}
        <Modal
          visible={reportModalVisible}
          transparent={true}
          animationType="none"
          onRequestClose={() => setReportModalVisible(false)}
        >
          <Animated.View
            style={[
              styles.modalOverlay,
              { opacity: reportOverlayOpacity },
            ]}
          >
            <TouchableOpacity
              style={styles.modalOverlayTouchable}
              activeOpacity={1}
              onPress={() => setReportModalVisible(false)}
            />
            <Animated.View
              style={[
                styles.reportModalContent,
                { transform: [{ translateY: reportSheetTranslateY }] },
              ]}
            >
              {/* Header */}
              <View style={styles.reportHeader}>
                <Text style={styles.reportTitle}>Movement Report</Text>
                <TouchableOpacity onPress={() => setReportModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Tab Selector */}
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
                  onPress={() => setActiveTab('overview')}
                >
                  <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
                    Overview
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'phases' && styles.activeTab]}
                  onPress={() => setActiveTab('phases')}
                >
                  <Text style={[styles.tabText, activeTab === 'phases' && styles.activeTabText]}>
                    Phases
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'timeline' && styles.activeTab]}
                  onPress={() => setActiveTab('timeline')}
                >
                  <Text style={[styles.tabText, activeTab === 'timeline' && styles.activeTabText]}>
                    Timeline
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Tab Content */}
              <ScrollView style={styles.reportContent}>
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
                          {movementReport.keyMetrics.armExtensionRange.range.toFixed(1)}°
                        </Text>
                        <Text style={styles.metricHint}>
                          {movementReport.keyMetrics.armExtensionRange.min.toFixed(1)}° - {movementReport.keyMetrics.armExtensionRange.max.toFixed(1)}°
                        </Text>
                      </View>
                      {movementReport.keyMetrics.jumpHeight !== null && (
                        <View style={styles.metricCard}>
                          <Text style={styles.metricLabel}>Jump Height</Text>
                          <Text style={styles.metricValue}>
                            {(movementReport.keyMetrics.jumpHeight * 100).toFixed(1)} cm
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
                    <Text style={styles.sectionTitle}>Frame-by-Frame Analysis</Text>
                    <Text style={styles.placeholderText}>
                      Timeline visualization coming soon
                    </Text>
                  </View>
                )}
              </ScrollView>
            </Animated.View>
          </Animated.View>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContent: {
    flexGrow: 1,
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
    marginBottom: 8,
  },
  errorHint: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
  },
  videoSection: {
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  skeletonSection: {
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    position: 'relative',
  },
  frameBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  frameBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  controlButtonsContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  reportButton: {
    backgroundColor: 'rgba(0, 74, 173, 0.9)',
    borderColor: 'rgba(0, 74, 173, 0.4)',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
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
  },
  reportModalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '85%',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  reportTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#004aad',
  },
  tabText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  reportContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
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
});

export default VideoAnalysisScreen;
