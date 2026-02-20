import React, { useState, useRef } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import Slider from "@react-native-community/slider";
import { MarkerData } from "../utils/findingHelpers";

interface PlaybackControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentFrame: number;
  totalFrames: number;
  speed: number;
  onPlayPause: () => void;
  onSeek: (timeInSeconds: number) => void;
  onScrub?: (timeInSeconds: number) => void;
  onPreviousFrame: () => void;
  onNextFrame: () => void;
  onSpeedChange: (speed: number) => void;
  markers?: MarkerData[];
  onMarkerPress?: (marker: MarkerData) => void;
  onAddNote?: () => void;
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
  onScrub,
  onPreviousFrame,
  onNextFrame,
  onSpeedChange,
  markers = [],
  onMarkerPress,
  onAddNote,
}) => {
  const [sliderWidth, setSliderWidth] = useState(0);
  const isScrubbingRef = useRef(false);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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
            disabled={false}
            step={0}
            onSlidingStart={() => {
              isScrubbingRef.current = true;
            }}
            onValueChange={(value) => {
              if (isScrubbingRef.current && onScrub) {
                onScrub(value);
              } else if (!isScrubbingRef.current) {
                onSeek(value);
              }
            }}
            onSlidingComplete={(value) => {
              isScrubbingRef.current = false;
              onSeek(value);
            }}
            onLayout={handleSliderLayout}
            minimumTrackTintColor="#004aad"
            maximumTrackTintColor="#333"
            thumbTintColor="#004aad"
          />
          {/* Timeline Markers */}
          {sliderWidth > 0 && markers.length > 0 && (
            <View style={styles.markersContainer} pointerEvents="box-none">
              {markers.map((marker, index) => {
                const position = (marker.frame / totalFrames) * sliderWidth;
                const isActive = Math.abs(currentFrame - marker.frame) <= 2;

                const isNoteMarker = marker.type === 'note';

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.marker,
                      isNoteMarker && styles.noteMarker,
                      {
                        left: position - 7,
                        backgroundColor: marker.color,
                        opacity: isActive ? 1 : 0.85,
                        transform: [
                          { scale: isActive ? 1.3 : 1 },
                          { rotate: isNoteMarker ? '0deg' : '45deg' }
                        ],
                      },
                    ]}
                    onPress={() => {
                      // Jump to the marker's frame
                      const timeInSeconds =
                        (marker.frame / totalFrames) * duration;
                      onSeek(timeInSeconds);
                      // Also open the finding/note modal
                      onMarkerPress?.(marker);
                    }}
                    activeOpacity={0.8}
                  >
                    {isActive && <View style={[styles.markerPulse, isNoteMarker && styles.noteMarkerPulse]} />}
                    {isNoteMarker && (
                      <Ionicons name="create" size={10} color="#fff" style={styles.noteIcon} />
                    )}
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
        <TouchableOpacity style={styles.frameButton} onPress={onPreviousFrame}>
          <Text style={styles.frameButtonText}>◀◀</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.playButton} onPress={onPlayPause}>
          <Text style={styles.playButtonText}>{isPlaying ? "⏸" : "▶"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.frameButton} onPress={onNextFrame}>
          <Text style={styles.frameButtonText}>▶▶</Text>
        </TouchableOpacity>

        {/* Add Note Button (only visible when paused) */}
        {!isPlaying && onAddNote && (
          <TouchableOpacity
            style={styles.noteButton}
            onPress={onAddNote}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1a1a1a",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  timelineContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sliderContainer: {
    flex: 1,
    marginHorizontal: 8,
    position: "relative",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  markersContainer: {
    position: "absolute",
    top: -2,
    left: 0,
    right: 0,
    height: 40,
    justifyContent: "flex-start",
  },
  marker: {
    position: "absolute",
    width: 14,
    height: 18,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  noteMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  noteIcon: {
    position: 'absolute',
  },
  markerPulse: {
    position: "absolute",
    width: 22,
    height: 26,
    borderTopLeftRadius: 11,
    borderTopRightRadius: 11,
    borderBottomLeftRadius: 11,
    borderBottomRightRadius: 11,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  noteMarkerPulse: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  timeText: {
    color: "#aaa",
    fontSize: 12,
    minWidth: 40,
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    position: "relative",
  },
  frameButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  frameButtonText: {
    color: "#aaa",
    fontSize: 14,
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#004aad",
    justifyContent: "center",
    alignItems: "center",
  },
  playButtonText: {
    color: "#fff",
    fontSize: 20,
  },
  noteButton: {
    position: "absolute",
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffbb00",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
});

export default PlaybackControls;
