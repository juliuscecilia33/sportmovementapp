import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { MarkerData } from '../utils/findingHelpers';

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
  markers?: MarkerData[];
  onMarkerPress?: (marker: MarkerData) => void;
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
  markers = [],
  onMarkerPress,
}) => {
  const [sliderWidth, setSliderWidth] = useState(0);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSliderLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    setSliderWidth(width);
  };

  return (
    <View style={styles.container}>
      {/* Timeline Slider */}
      <View style={styles.timelineContainer}>
        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration}
            value={currentTime}
            onValueChange={onSeek}
            onLayout={handleSliderLayout}
            minimumTrackTintColor="#004aad"
            maximumTrackTintColor="#333"
            thumbTintColor="#004aad"
          />
          {/* Timeline Markers */}
          {sliderWidth > 0 && markers.length > 0 && (
            <View style={styles.markersContainer}>
              {markers.map((marker, index) => {
                const position = (marker.frame / totalFrames) * sliderWidth;
                const isActive = Math.abs(currentFrame - marker.frame) <= 2;

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.marker,
                      {
                        left: position - 4,
                        backgroundColor: marker.color,
                        opacity: isActive ? 1 : 0.7,
                        transform: [{ scale: isActive ? 1.2 : 1 }],
                      },
                    ]}
                    onPress={() => onMarkerPress?.(marker)}
                    activeOpacity={0.8}
                  >
                    {isActive && <View style={styles.markerPulse} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
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
  sliderContainer: {
    flex: 1,
    marginHorizontal: 8,
    position: 'relative',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  markersContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    justifyContent: 'center',
    pointerEvents: 'box-none',
  },
  marker: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'auto',
  },
  markerPulse: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  timeText: {
    color: '#aaa',
    fontSize: 12,
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
    backgroundColor: '#004aad',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    color: '#fff',
    fontSize: 20,
  },
});

export default PlaybackControls;
