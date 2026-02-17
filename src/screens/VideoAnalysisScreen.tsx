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

const { height } = Dimensions.get('window');
const VIDEO_HEIGHT = height * 0.28; // 28% for video
const SKELETON_HEIGHT = height * 0.40; // 40% for 3D skeleton

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

  const videoPlayerRef = useRef<VideoPlayerRef>(null);
  const skeleton3DRef = useRef<Skeleton3DViewRef>(null);

  // Animation values for camera modal
  const cameraOverlayOpacity = useRef(new Animated.Value(0)).current;
  const cameraSheetTranslateY = useRef(new Animated.Value(300)).current;

  // Animation values for speed modal
  const speedOverlayOpacity = useRef(new Animated.Value(0)).current;
  const speedSheetTranslateY = useRef(new Animated.Value(300)).current;

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

  const loadAnalysisData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await loadLatestAnalysis();
      if (!data) {
        throw new Error('No analysis data found');
      }

      setAnalysis(data);
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
          <ActivityIndicator size="large" color="#4a4aff" />
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

          {/* Info Bar */}
          <View style={styles.infoBar}>
            <Text style={styles.infoText}>
              {analysis.video_filename} • {analysis.video_info.fps} FPS •{' '}
              {analysis.video_info.total_frames} frames
            </Text>
            {currentFrame && (
              <Text style={styles.infoText}>
                {currentFrame.keypoints.length} keypoints detected
              </Text>
            )}
          </View>
        </ScrollView>

        {/* Camera Angle Modal */}
        <Modal
          visible={cameraModalVisible}
          transparent
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
          transparent
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
    fontVariant: ['tabular-nums'],
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
  infoBar: {
    backgroundColor: '#0a0a0a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  infoText: {
    color: '#666',
    fontSize: 11,
    textAlign: 'center',
  },
});

export default VideoAnalysisScreen;
