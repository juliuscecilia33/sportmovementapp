import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { analyzeVideo } from '../services/api';
import { AnalysisResult } from '../types/pose';
import * as FileSystem from 'expo-file-system';

export default function HomeScreen() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyzeVideo = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      // Path to the test video in assets
      const videoPath = `${FileSystem.documentDirectory}../../../assets/videos/testvideo.mp4`;

      console.log('Analyzing video at:', videoPath);

      // Call the API to analyze the video
      const response = await analyzeVideo({
        videoUri: videoPath,
        filename: 'testvideo.mp4',
      });

      console.log('Analysis complete:', response);

      setResult(response.analysis);
      Alert.alert('Success', 'Video analyzed successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error analyzing video:', err);
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <Text style={styles.title}>Sports Movement Analysis</Text>
        <Text style={styles.subtitle}>Pose Detection & Analysis</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAnalyzeVideo}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Analyze Test Video</Text>
          )}
        </TouchableOpacity>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Processing video...</Text>
            <Text style={styles.loadingSubtext}>
              Extracting frames and detecting pose keypoints
            </Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Error</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorHint}>
              Make sure the backend server is running on http://localhost:8000
            </Text>
          </View>
        )}

        {result && (
          <ScrollView style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Analysis Results</Text>

            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Video Information</Text>
              <Text style={styles.infoText}>
                • File: {result.video_filename}
              </Text>
              <Text style={styles.infoText}>
                • Duration: {result.video_info.duration_seconds.toFixed(2)}s
              </Text>
              <Text style={styles.infoText}>
                • FPS: {result.video_info.fps.toFixed(2)}
              </Text>
              <Text style={styles.infoText}>
                • Total Frames: {result.video_info.total_frames}
              </Text>
              <Text style={styles.infoText}>
                • Resolution: {result.video_info.width}x{result.video_info.height}
              </Text>
              <Text style={styles.infoText}>
                • Keypoints per Frame: {result.keypoints_per_frame}
              </Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Sample Frame (Frame 0)</Text>
              {result.frames[0]?.keypoints.slice(0, 5).map((kp) => (
                <Text key={kp.id} style={styles.keypointText}>
                  • {kp.name}: ({kp.x.toFixed(3)}, {kp.y.toFixed(3)}, {kp.z.toFixed(3)})
                  - Visibility: {kp.visibility.toFixed(3)}
                </Text>
              ))}
              <Text style={styles.moreText}>
                ...and {result.frames[0]?.keypoints.length - 5} more keypoints
              </Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Full JSON Data</Text>
              <ScrollView horizontal>
                <Text style={styles.jsonText}>
                  {JSON.stringify(result, null, 2)}
                </Text>
              </ScrollView>
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  loadingSubtext: {
    marginTop: 5,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff3b30',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff3b30',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  errorHint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  resultsContainer: {
    marginTop: 20,
    flex: 1,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  keypointText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  moreText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 5,
  },
  jsonText: {
    fontSize: 11,
    color: '#333',
    fontFamily: 'monospace',
  },
});
