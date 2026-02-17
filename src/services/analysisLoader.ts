import { AnalysisResult, FrameData } from '../types/analysis';

// Import the bundled analysis JSON directly
import analysisData from '../../assets/analysis/20260217_124527_testvideo_analysis.json';

/**
 * Loads analysis results from bundled assets
 * The JSON file is bundled with the app at build time
 */
export async function loadLatestAnalysis(): Promise<AnalysisResult | null> {
  try {
    // Return the imported JSON data directly
    // TypeScript will ensure it matches the AnalysisResult type
    return analysisData as AnalysisResult;
  } catch (error) {
    console.error('Error loading analysis:', error);
    return null;
  }
}

/**
 * Gets a frame by frame number
 * Returns null if frame doesn't exist or has no keypoints
 */
export function getFrameByNumber(
  analysis: AnalysisResult,
  frameNumber: number
): FrameData | null {
  const frame = analysis.frames.find((f) => f.frame_number === frameNumber);
  if (!frame || frame.keypoints.length === 0) {
    return null;
  }
  return frame;
}

/**
 * Gets a frame by timestamp (in seconds)
 * Returns the closest frame to the given timestamp
 * Uses binary search for O(log n) performance instead of O(n)
 */
export function getFrameByTimestamp(
  analysis: AnalysisResult,
  timestamp: number
): FrameData | null {
  if (analysis.frames.length === 0) {
    return null;
  }

  const frames = analysis.frames;

  // Binary search to find closest frame (frames are sorted by timestamp)
  let left = 0;
  let right = frames.length - 1;
  let closestIdx = 0;
  let minDiff = Math.abs(timestamp - frames[0].timestamp);

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const diff = Math.abs(timestamp - frames[mid].timestamp);

    if (diff < minDiff) {
      minDiff = diff;
      closestIdx = mid;
    }

    if (frames[mid].timestamp < timestamp) {
      left = mid + 1;
    } else if (frames[mid].timestamp > timestamp) {
      right = mid - 1;
    } else {
      // Exact match
      closestIdx = mid;
      break;
    }
  }

  const closestFrame = frames[closestIdx];

  // Only return if the frame has keypoints
  if (closestFrame.keypoints.length === 0) {
    return null;
  }

  return closestFrame;
}

/**
 * Gets the range of valid frames (frames with keypoints)
 */
export function getValidFrameRange(
  analysis: AnalysisResult
): { start: number; end: number } {
  const validFrames = analysis.frames.filter((f) => f.keypoints.length > 0);

  if (validFrames.length === 0) {
    return { start: 0, end: 0 };
  }

  const start = validFrames[0].frame_number;
  const end = validFrames[validFrames.length - 1].frame_number;

  return { start, end };
}

/**
 * Calculates frame number from timestamp
 */
export function timestampToFrameNumber(
  timestamp: number,
  fps: number
): number {
  return Math.floor(timestamp * fps);
}

/**
 * Calculates timestamp from frame number
 */
export function frameNumberToTimestamp(
  frameNumber: number,
  fps: number
): number {
  return frameNumber / fps;
}

/**
 * Gets all frames with valid keypoints
 */
export function getValidFrames(analysis: AnalysisResult): FrameData[] {
  return analysis.frames.filter((f) => f.keypoints.length > 0);
}
