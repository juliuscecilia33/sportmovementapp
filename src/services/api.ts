import axios from 'axios';
import { AnalyzeVideoResponse } from '../types/pose';
import * as FileSystem from 'expo-file-system';

// Backend API URL - change this to your backend URL
const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes timeout for video processing
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

export interface AnalyzeVideoOptions {
  videoUri: string;
  filename?: string;
}

/**
 * Analyze a video file and extract pose keypoints
 * @param options - Video analysis options
 * @returns Analysis results with frame-by-frame keypoint data
 */
export const analyzeVideo = async (
  options: AnalyzeVideoOptions
): Promise<AnalyzeVideoResponse> => {
  try {
    const { videoUri, filename = 'video.mp4' } = options;

    // Create FormData
    const formData = new FormData();

    // Read the video file and append to FormData
    const fileInfo = await FileSystem.getInfoAsync(videoUri);
    if (!fileInfo.exists) {
      throw new Error('Video file not found');
    }

    // For Expo, we need to create a blob from the file
    const file = {
      uri: videoUri,
      type: 'video/mp4',
      name: filename,
    } as any;

    formData.append('file', file);

    // Make the API request
    const response = await api.post<AnalyzeVideoResponse>(
      '/api/analyze-video',
      formData
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.detail ||
        'Failed to analyze video. Please check if the backend server is running.'
      );
    }
    throw error;
  }
};

/**
 * Check if the backend API is healthy
 * @returns Health status
 */
export const checkHealth = async (): Promise<{ status: string; service: string }> => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    throw new Error('Backend server is not reachable');
  }
};
