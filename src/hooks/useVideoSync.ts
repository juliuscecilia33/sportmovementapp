import { useState, useCallback, useRef, useEffect } from 'react';
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
  handleScrub: (timeInSeconds: number) => void;
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
  }>,
  skeleton3DRef?: React.RefObject<{
    updateSkeletonDirect: (frameData: FrameData | null) => void;
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
  const animationFrameRef = useRef<number | null>(null);
  const playbackStartTimeRef = useRef<number>(0);
  const playbackStartPositionRef = useRef<number>(0);
  const isPlayingRef = useRef(false);
  const playbackSpeedRef = useRef(1);
  const lastUIUpdateRef = useRef<number>(0);
  const lastSkeletonUpdateRef = useRef<number>(0);

  // Continuous RAF loop with throttling for performance
  useEffect(() => {
    if (!analysis) return;

    const UI_UPDATE_INTERVAL = 100; // Update UI state at 10 FPS (sufficient for controls)
    const SKELETON_UPDATE_INTERVAL = 1000 / 30; // Update skeleton at 30 FPS

    const updateFrame = () => {
      const now = Date.now();

      // Only update if actually playing
      if (isPlayingRef.current) {
        // Estimate current video time based on elapsed time and playback speed
        const elapsedSeconds = (now - playbackStartTimeRef.current) / 1000;
        const estimatedTime = playbackStartPositionRef.current + (elapsedSeconds * playbackSpeedRef.current);

        // Get frame for estimated timestamp
        const frame = getFrameByTimestamp(analysis, estimatedTime);
        const frameNumber = timestampToFrameNumber(estimatedTime, analysis.video_info.fps);

        // Update skeleton directly at 30 FPS (bypass React)
        if (frame && skeleton3DRef?.current && now - lastSkeletonUpdateRef.current >= SKELETON_UPDATE_INTERVAL) {
          skeleton3DRef.current.updateSkeletonDirect(frame);
          lastSkeletonUpdateRef.current = now;
        }

        // Update UI state at 10 FPS (React state for playback controls)
        if (now - lastUIUpdateRef.current >= UI_UPDATE_INTERVAL) {
          setCurrentFrame(frame);
          setPlaybackState((prev) => ({
            ...prev,
            currentFrame: frameNumber,
            currentTime: estimatedTime,
          }));
          lastUIUpdateRef.current = now;
        }
      }

      // Continue loop regardless of playing state
      animationFrameRef.current = requestAnimationFrame(updateFrame);
    };

    // Start the continuous loop
    animationFrameRef.current = requestAnimationFrame(updateFrame);

    // Cleanup on unmount only
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [analysis, skeleton3DRef]); // Depend on skeleton3DRef too

  const handlePlaybackUpdate = useCallback(
    (status: {
      isPlaying: boolean;
      currentTime: number;
      duration: number;
    }) => {
      if (!analysis || isSeekingRef.current) {
        return;
      }

      // Always re-anchor RAF estimation to actual video time to prevent drift
      // This ensures skeleton stays perfectly in sync with video
      isPlayingRef.current = status.isPlaying;
      playbackSpeedRef.current = playbackState.speed;
      playbackStartTimeRef.current = Date.now();
      playbackStartPositionRef.current = status.currentTime; // Anchor to actual video time

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

      try {
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
      } catch (error) {
        console.error('Seek operation failed:', error);
      } finally {
        setTimeout(() => {
          isSeekingRef.current = false;
        }, 100);
      }
    },
    [analysis, videoPlayerRef]
  );

  const handleScrub = useCallback(
    (timeInSeconds: number) => {
      if (!analysis) {
        return;
      }

      const frameNumber = timestampToFrameNumber(
        timeInSeconds,
        analysis.video_info.fps
      );
      const frame = getFrameByTimestamp(analysis, timeInSeconds);

      // Update skeleton directly for instant feedback
      if (skeleton3DRef?.current && frame) {
        skeleton3DRef.current.updateSkeletonDirect(frame);
      }

      // Update React state for UI
      setCurrentFrame(frame);
      setPlaybackState((prev) => ({
        ...prev,
        currentFrame: frameNumber,
        currentTime: timeInSeconds,
      }));
    },
    [analysis, skeleton3DRef]
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

      // Update ref for RAF loop
      playbackSpeedRef.current = speed;

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
    handleScrub,
    handlePreviousFrame,
    handleNextFrame,
    handleSpeedChange,
  };
}
