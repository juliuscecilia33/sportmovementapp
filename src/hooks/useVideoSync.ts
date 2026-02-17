import { useState, useCallback, useRef } from 'react';
import { AnalysisResult, FrameData, PlaybackState } from '../types/analysis';
import {
  getFrameByTimestamp,
  timestampToFrameNumber,
  frameNumberToTimestamp,
} from '../services/analysisLoader';

interface UseVideoSyncResult {
  currentFrame: FrameData | null;
  playbackState: PlaybackState;
  handlePlaybackUpdate: (status: {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
  }) => void;
  handleSeek: (timeInSeconds: number) => void;
  handlePreviousFrame: () => void;
  handleNextFrame: () => void;
  handleSpeedChange: (speed: number) => void;
}

export function useVideoSync(
  analysis: AnalysisResult | null,
  videoPlayerRef: React.RefObject<{
    pause: () => Promise<void>;
    seek: (timeInSeconds: number) => Promise<void>;
    setRate: (rate: number) => Promise<void>;
  }>
): UseVideoSyncResult {
  const [currentFrame, setCurrentFrame] = useState<FrameData | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentFrame: 0,
    currentTime: 0,
    speed: 1,
    duration: 0,
  });

  const isSeekingRef = useRef(false);

  const handlePlaybackUpdate = useCallback(
    (status: {
      isPlaying: boolean;
      currentTime: number;
      duration: number;
    }) => {
      if (!analysis || isSeekingRef.current) {
        return;
      }

      const frameNumber = timestampToFrameNumber(
        status.currentTime,
        analysis.video_info.fps
      );
      const frame = getFrameByTimestamp(analysis, status.currentTime);

      setCurrentFrame(frame);
      setPlaybackState({
        isPlaying: status.isPlaying,
        currentFrame: frameNumber,
        currentTime: status.currentTime,
        speed: playbackState.speed,
        duration: status.duration,
      });
    },
    [analysis, playbackState.speed]
  );

  const handleSeek = useCallback(
    async (timeInSeconds: number) => {
      if (!analysis || !videoPlayerRef.current) {
        return;
      }

      isSeekingRef.current = true;

      await videoPlayerRef.current.pause();
      await videoPlayerRef.current.seek(timeInSeconds);

      const frameNumber = timestampToFrameNumber(
        timeInSeconds,
        analysis.video_info.fps
      );
      const frame = getFrameByTimestamp(analysis, timeInSeconds);

      setCurrentFrame(frame);
      setPlaybackState((prev) => ({
        ...prev,
        isPlaying: false,
        currentFrame: frameNumber,
        currentTime: timeInSeconds,
      }));

      setTimeout(() => {
        isSeekingRef.current = false;
      }, 100);
    },
    [analysis, videoPlayerRef]
  );

  const handlePreviousFrame = useCallback(async () => {
    if (!analysis || !videoPlayerRef.current) {
      return;
    }

    const newFrameNumber = Math.max(0, playbackState.currentFrame - 1);
    const newTime = frameNumberToTimestamp(
      newFrameNumber,
      analysis.video_info.fps
    );

    await handleSeek(newTime);
  }, [analysis, playbackState.currentFrame, handleSeek]);

  const handleNextFrame = useCallback(async () => {
    if (!analysis || !videoPlayerRef.current) {
      return;
    }

    const newFrameNumber = Math.min(
      analysis.video_info.total_frames - 1,
      playbackState.currentFrame + 1
    );
    const newTime = frameNumberToTimestamp(
      newFrameNumber,
      analysis.video_info.fps
    );

    await handleSeek(newTime);
  }, [analysis, playbackState.currentFrame, handleSeek]);

  const handleSpeedChange = useCallback(
    async (speed: number) => {
      if (!videoPlayerRef.current) {
        return;
      }

      await videoPlayerRef.current.setRate(speed);
      setPlaybackState((prev) => ({
        ...prev,
        speed,
      }));
    },
    [videoPlayerRef]
  );

  return {
    currentFrame,
    playbackState,
    handlePlaybackUpdate,
    handleSeek,
    handlePreviousFrame,
    handleNextFrame,
    handleSpeedChange,
  };
}
