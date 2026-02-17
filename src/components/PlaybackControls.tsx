import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Slider from '@react-native-community/slider';

interface PlaybackControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentFrame: number;
  totalFrames: number;
  speed: number;
  onPlayPause: () => void;
  onSeek: (timeInSeconds: number) => void;
  onPreviousFrame: () => void;
  onNextFrame: () => void;
  onSpeedChange: (speed: number) => void;
}

const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  currentFrame,
  totalFrames,
  speed,
  onPlayPause,
  onSeek,
  onPreviousFrame,
  onNextFrame,
  onSpeedChange,
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Timeline Slider */}
      <View style={styles.timelineContainer}>
        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration}
          value={currentTime}
          onValueChange={onSeek}
          minimumTrackTintColor="#4a4aff"
          maximumTrackTintColor="#333"
          thumbTintColor="#4a4aff"
        />
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>

      {/* Playback Controls */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={styles.frameButton}
          onPress={onPreviousFrame}
        >
          <Text style={styles.frameButtonText}>◀◀</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.playButton}
          onPress={onPlayPause}
        >
          <Text style={styles.playButtonText}>
            {isPlaying ? '⏸' : '▶'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.frameButton}
          onPress={onNextFrame}
        >
          <Text style={styles.frameButtonText}>▶▶</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  timelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  slider: {
    flex: 1,
    marginHorizontal: 8,
    height: 40,
  },
  timeText: {
    color: '#aaa',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    minWidth: 40,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  frameButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  frameButtonText: {
    color: '#aaa',
    fontSize: 14,
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4a4aff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    color: '#fff',
    fontSize: 20,
  },
});

export default PlaybackControls;
