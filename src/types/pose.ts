import { FrameNote } from './notes';

export interface Keypoint {
  id: number;
  name: string;
  x: number;  // Normalized [0, 1]
  y: number;  // Normalized [0, 1]
  z: number;  // Depth relative to hips
  visibility: number;  // Confidence [0, 1]
}

export interface FrameData {
  frame_number: number;
  timestamp: number;
  keypoints: Keypoint[];
}

export interface VideoInfo {
  fps: number;
  total_frames: number;
  width: number;
  height: number;
  duration_seconds: number;
}

export interface AnalysisResult {
  video_filename: string;
  processed_at: string;
  video_info: VideoInfo;
  keypoints_per_frame: number;
  frames: FrameData[];
  frameNotes?: FrameNote[]; // Optional array of coach/player notes for specific frames
}

export interface AnalyzeVideoResponse {
  success: boolean;
  message: string;
  result_file: string;
  analysis: AnalysisResult;
}
