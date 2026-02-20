import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Text,
  Dimensions,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import VideoPlayer, { VideoPlayerRef } from '../components/VideoPlayer';
import Skeleton3DView, {
  Skeleton3DViewRef,
} from '../components/Skeleton3DView';
import CameraControls from '../components/CameraControls';
import SpeedControls from '../components/SpeedControls';
import PlaybackControls from '../components/PlaybackControls';
import FindingBottomSheet from '../components/FindingBottomSheet';
import MovementReportModal from '../components/MovementReportModal';
import FrameNoteModal from '../components/FrameNoteModal';
import { useVideoSync } from '../hooks/useVideoSync';
import { loadLatestAnalysis } from '../services/analysisLoader';
import { AnalysisResult, CameraAngle } from '../types/analysis';
import { generateMovementReport } from '../services/movementAnalyzer';
import { MovementReport, KeyMoment } from '../types/report';
import {
  MarkerData,
  getJointsForFinding,
  getColorForFindingType,
  getNoteMarkerColor,
} from '../utils/findingHelpers';
import { useHistory } from '../context/HistoryContext';
import { FrameNote } from '../types/notes';

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

type Props = NativeStackScreenProps<RootStackParamList, 'VideoAnalysis'>;

const VideoAnalysisScreen: React.FC<Props> = ({ navigation, route }) => {
  console.log('[VideoAnalysisScreen] Component rendering with route params:', route.params);
  const { getAnalysisById, addFrameNote, updateFrameNote, deleteFrameNote } = useHistory();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [videoPath, setVideoPath] = useState<any>(require('../../assets/videos/testvideo.mp4'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cameraAngle, setCameraAngle] = useState<CameraAngle>('front');
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [speedModalVisible, setSpeedModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [movementReport, setMovementReport] = useState<MovementReport | null>(null);

  // New state for visual indicators
  const [timelineMarkers, setTimelineMarkers] = useState<MarkerData[]>([]);
  const [highlightedJoints, setHighlightedJoints] = useState<number[]>([]);
  const [findingModalVisible, setFindingModalVisible] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<KeyMoment | null>(null);

  // Frame note state
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<FrameNote | null>(null);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);

  // Animation values for finding modal
  const findingOverlayOpacity = useRef(new Animated.Value(0)).current;
  const findingSheetTranslateY = useRef(new Animated.Value(400)).current;

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
    handleScrub,
    handlePreviousFrame,
    handleNextFrame,
    handleSpeedChange,
  } = useVideoSync(analysis, videoPlayerRef, skeleton3DRef);

  useEffect(() => {
    loadAnalysisData();
  }, [route.params?.analysisId]);

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

  // Animate finding modal open/close
  useEffect(() => {
    if (findingModalVisible) {
      Animated.parallel([
        Animated.timing(findingOverlayOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(findingSheetTranslateY, {
          toValue: 0,
          damping: 20,
          stiffness: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(findingOverlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(findingSheetTranslateY, {
          toValue: 400,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [findingModalVisible]);

  const loadAnalysisData = async () => {
    console.log('[VideoAnalysisScreen] loadAnalysisData started');
    try {
      setLoading(true);
      setError(null);

      const analysisId = route.params?.analysisId;
      console.log('[VideoAnalysisScreen] Analysis ID:', analysisId);
      setCurrentAnalysisId(analysisId || '20260217_124527_testvideo'); // Default ID
      let data: AnalysisResult | null = null;
      let video: any = require('../../assets/videos/testvideo.mp4');

      if (analysisId) {
        console.log('[VideoAnalysisScreen] Loading from history context...');
        // Load from history context
        const historyItem = getAnalysisById(analysisId);
        if (historyItem) {
          console.log('[VideoAnalysisScreen] Found history item:', historyItem.id);
          data = historyItem.analysisData;
          video = historyItem.videoPath;
        } else {
          console.log('[VideoAnalysisScreen] History item not found for ID:', analysisId);
        }
      } else {
        console.log('[VideoAnalysisScreen] Loading default bundled analysis...');
        // Load default bundled analysis
        data = await loadLatestAnalysis();
        console.log('[VideoAnalysisScreen] Default analysis loaded');
      }

      if (!data) {
        throw new Error('No analysis data found');
      }

      console.log('[VideoAnalysisScreen] Setting analysis and video path');
      setAnalysis(data);
      setVideoPath(video);

      // Generate movement report from analysis data
      console.log('[VideoAnalysisScreen] Generating movement report...');
      const report = generateMovementReport(data);
      setMovementReport(report);
      console.log('[VideoAnalysisScreen] Movement report generated');
    } catch (err) {
      console.error('[VideoAnalysisScreen] Error loading analysis:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analysis');
    } finally {
      setLoading(false);
      console.log('[VideoAnalysisScreen] loadAnalysisData completed');
    }
  };

  // Generate timeline markers from key moments and notes
  useEffect(() => {
    if (movementReport) {
      const markers: MarkerData[] = movementReport.keyMoments.map((moment) => ({
        frame: moment.frame,
        color: getColorForFindingType(moment.label),
        type: 'keyMoment' as const,
        label: moment.label,
        keyMoment: moment,
      }));

      // Add note markers
      if (analysis?.frameNotes) {
        const noteMarkers: MarkerData[] = analysis.frameNotes.map((note) => ({
          frame: note.frameNumber,
          color: getNoteMarkerColor(),
          type: 'note' as const,
          label: `Note: ${note.noteText.substring(0, 30)}...`,
          frameNote: note,
        }));
        markers.push(...noteMarkers);
      }

      setTimelineMarkers(markers);
    }
  }, [movementReport, analysis?.frameNotes]);

  // Auto-highlight joints based on current frame
  useEffect(() => {
    if (!movementReport || !playbackState) return;

    // Find if current frame is near a key moment (within 2 frames)
    const nearbyMoment = movementReport.keyMoments.find(
      (moment) => Math.abs(moment.frame - playbackState.currentFrame) <= 2
    );

    if (nearbyMoment) {
      const joints = getJointsForFinding(nearbyMoment.label);
      setHighlightedJoints(joints);
    } else {
      setHighlightedJoints([]);
    }
  }, [movementReport, playbackState.currentFrame]);

  const handlePlayPause = async () => {
    if (!videoPlayerRef.current) return;

    if (playbackState.isPlaying) {
      await videoPlayerRef.current.pause();
    } else {
      // If at end of video, reset to start before playing
      if (playbackState.currentTime >= playbackState.duration - 0.1) {
        await videoPlayerRef.current.seek(0);
      }
      await videoPlayerRef.current.play();
    }
  };

  const handleCameraAngleChange = (angle: CameraAngle) => {
    setCameraAngle(angle);
    skeleton3DRef.current?.setCameraAngle(angle);
    setCameraModalVisible(false); // Close modal after selection
  };

  const handleResetCamera = () => {
    skeleton3DRef.current?.resetCameraView();
    setCameraAngle('front'); // Update state to reflect reset
    setCameraModalVisible(false); // Close modal after reset
  };

  const handleSpeedChangeFromModal = (speed: number) => {
    handleSpeedChange(speed);
    setSpeedModalVisible(false); // Close modal after selection
  };

  const handleMarkerPress = (marker: MarkerData) => {
    if (marker.keyMoment) {
      setSelectedFinding(marker.keyMoment);
      setFindingModalVisible(true);
    } else if (marker.frameNote) {
      // Open note modal for editing
      setEditingNote(marker.frameNote);
      setNoteModalVisible(true);
    }
  };

  const handleAddNotePress = () => {
    if (!playbackState.isPlaying) {
      setEditingNote(null);
      setNoteModalVisible(true);
    }
  };

  const handleSaveNote = (noteText: string) => {
    if (!currentAnalysisId) return;

    if (editingNote) {
      // Update existing note
      updateFrameNote(currentAnalysisId, editingNote.id, noteText);
    } else {
      // Add new note
      addFrameNote(currentAnalysisId, {
        frameNumber: playbackState.currentFrame,
        timestamp: playbackState.currentTime,
        noteText,
        createdBy: 'Coach',
      });
    }

    // Reload analysis data to update markers
    loadAnalysisData();
  };

  const handleDeleteNote = () => {
    if (!currentAnalysisId || !editingNote) return;
    deleteFrameNote(currentAnalysisId, editingNote.id);
    loadAnalysisData();
  };

  const handleJointPress = (jointId: number) => {
    console.log('[VideoAnalysisScreen] Joint pressed:', {
      jointId,
      currentFrame: playbackState.currentFrame,
      hasMovementReport: !!movementReport
    });

    if (!movementReport) return;

    // Find the key moment associated with this highlighted joint
    const nearbyMoment = movementReport.keyMoments.find(
      (moment) => Math.abs(moment.frame - playbackState.currentFrame) <= 2
    );

    console.log('[VideoAnalysisScreen] Nearby moment:', {
      found: !!nearbyMoment,
      moment: nearbyMoment
    });

    if (nearbyMoment) {
      setSelectedFinding(nearbyMoment);
      setFindingModalVisible(true);
      console.log('[VideoAnalysisScreen] Opening finding modal');
    } else {
      console.log('[VideoAnalysisScreen] No nearby moment found within 2 frames');
    }
  };

  const handleJumpToFrame = () => {
    if (selectedFinding && analysis) {
      const timeInSeconds = selectedFinding.timestamp;
      handleSeek(timeInSeconds);
      setFindingModalVisible(false);
    }
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
              videoUri={videoPath}
              onPlaybackUpdate={handlePlaybackUpdate}
              style={styles.flex}
            />
            {/* History Button Overlay */}
            <TouchableOpacity
              style={styles.videoHistoryButton}
              onPress={() => navigation.navigate('History')}
            >
              <Ionicons name="time" size={18} color="#fff" />
              <Text style={styles.controlButtonText}>History</Text>
            </TouchableOpacity>
          </View>

          {/* 3D Skeleton Section */}
          <View style={[styles.skeletonSection, { height: SKELETON_HEIGHT }]}>
            <Skeleton3DView
              ref={skeleton3DRef}
              frameData={currentFrame}
              autoRotate={false}
              style={styles.flex}
              highlightedJoints={highlightedJoints}
              onJointPress={handleJointPress}
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
            onScrub={handleScrub}
            onPreviousFrame={handlePreviousFrame}
            onNextFrame={handleNextFrame}
            onSpeedChange={handleSpeedChange}
            markers={timelineMarkers}
            onMarkerPress={handleMarkerPress}
            onAddNote={handleAddNotePress}
          />
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
                onReset={handleResetCamera}
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

        {/* Report Modal */}
        <MovementReportModal
          visible={reportModalVisible}
          movementReport={movementReport}
          onClose={() => setReportModalVisible(false)}
        />

        {/* Finding Modal */}
        <Modal
          visible={findingModalVisible}
          transparent
          animationType="none"
          onRequestClose={() => setFindingModalVisible(false)}
        >
          <Animated.View
            style={[
              styles.modalOverlay,
              { opacity: findingOverlayOpacity },
            ]}
          >
            <TouchableOpacity
              style={styles.modalOverlayTouchable}
              activeOpacity={1}
              onPress={() => setFindingModalVisible(false)}
            />
            <Animated.View
              style={[
                styles.modalContent,
                { transform: [{ translateY: findingSheetTranslateY }] },
              ]}
            >
              <FindingBottomSheet
                keyMoment={selectedFinding}
                onJumpToFrame={handleJumpToFrame}
              />
            </Animated.View>
          </Animated.View>
        </Modal>

        {/* Frame Note Modal */}
        <FrameNoteModal
          visible={noteModalVisible}
          onClose={() => {
            setNoteModalVisible(false);
            setEditingNote(null);
          }}
          onSave={handleSaveNote}
          onDelete={editingNote ? handleDeleteNote : undefined}
          existingNote={editingNote || undefined}
          frameNumber={playbackState.currentFrame}
          timestamp={playbackState.currentTime}
        />
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
    position: 'relative',
  },
  videoHistoryButton: {
    position: 'absolute',
    top: 12,
    right: 12,
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
    maxHeight: '70%',
  },
});

export default VideoAnalysisScreen;
