import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Text,
  Dimensions,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import VideoPlayer, { VideoPlayerRef } from '../components/VideoPlayer';
import Skeleton3DView, {
  Skeleton3DViewRef,
} from '../components/Skeleton3DView';
import CameraControls from '../components/CameraControls';
import PlaybackControls from '../components/PlaybackControls';
import { useVideoSync } from '../hooks/useVideoSync';
import { loadLatestAnalysis } from '../services/analysisLoader';
import { AnalysisResult, CameraAngle } from '../types/analysis';

const { height } = Dimensions.get('window');
const VIDEO_HEIGHT = height * 0.28; // 28% for video
const SKELETON_HEIGHT = height * 0.40; // 40% for 3D skeleton

const VideoAnalysisScreen: React.FC = () => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cameraAngle, setCameraAngle] = useState<CameraAngle>('diagonal');

  const videoPlayerRef = useRef<VideoPlayerRef>(null);
  const skeleton3DRef = useRef<Skeleton3DViewRef>(null);

  const {
    currentFrame,
    playbackState,
    handlePlaybackUpdate,
    handleSeek,
    handlePreviousFrame,
    handleNextFrame,
    handleSpeedChange,
  } = useVideoSync(analysis, videoPlayerRef);

  useEffect(() => {
    loadAnalysisData();
  }, []);

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
          </View>

          {/* Camera Controls */}
          <CameraControls
            onAngleChange={handleCameraAngleChange}
            currentAngle={cameraAngle}
          />

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
