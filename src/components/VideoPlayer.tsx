import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Video, AVPlaybackStatus, ResizeMode } from 'expo-av';

interface VideoPlayerProps {
  videoUri: string | number; // Support both URI strings and require() numbers
  onPlaybackUpdate?: (status: {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
  }) => void;
  style?: ViewStyle;
}

export interface VideoPlayerRef {
  play: () => Promise<void>;
  pause: () => Promise<void>;
  seek: (timeInSeconds: number) => Promise<void>;
  setRate: (rate: number) => Promise<void>;
  isPlaying: () => boolean;
  getCurrentTime: () => Promise<number>;
}

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ videoUri, onPlaybackUpdate, style }, ref) => {
    const videoRef = useRef<Video>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useImperativeHandle(ref, () => ({
      play: async () => {
        if (videoRef.current) {
          await videoRef.current.playAsync();
          setIsPlaying(true);
        }
      },
      pause: async () => {
        if (videoRef.current) {
          await videoRef.current.pauseAsync();
          setIsPlaying(false);
        }
      },
      seek: async (timeInSeconds: number) => {
        if (videoRef.current) {
          await videoRef.current.setPositionAsync(timeInSeconds * 1000);
        }
      },
      setRate: async (rate: number) => {
        if (videoRef.current) {
          await videoRef.current.setRateAsync(rate, true);
        }
      },
      isPlaying: () => isPlaying,
      getCurrentTime: async () => {
        if (videoRef.current) {
          const status = await videoRef.current.getStatusAsync();
          if (status.isLoaded) {
            return (status.positionMillis ?? 0) / 1000;
          }
        }
        return 0;
      },
    }));

    const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
      if (status.isLoaded) {
        setIsPlaying(status.isPlaying);

        if (onPlaybackUpdate) {
          onPlaybackUpdate({
            isPlaying: status.isPlaying,
            currentTime: (status.positionMillis ?? 0) / 1000,
            duration: (status.durationMillis ?? 0) / 1000,
          });
        }
      }
    };

    return (
      <View style={[styles.container, style]}>
        <Video
          ref={videoRef}
          source={typeof videoUri === 'string' ? { uri: videoUri } : videoUri}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={false}
          isLooping={false}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        />
      </View>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
});

export default VideoPlayer;
