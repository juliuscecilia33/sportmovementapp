import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useHistory, HistoryItem } from '../context/HistoryContext';

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

const HistoryScreen: React.FC<Props> = ({ navigation }) => {
  const { analyses } = useHistory();

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const renderHistoryItem = ({ item }: { item: HistoryItem }) => {
    const { analysisData, keyMetrics, addedAt } = item;
    const { video_info } = analysisData;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('VideoAnalysis', { analysisId: item.id })}
        activeOpacity={0.7}
      >
        {/* Video Thumbnail Placeholder */}
        <View style={styles.thumbnail}>
          <Ionicons name="videocam" size={40} color="#004aad" />
          <Text style={styles.thumbnailText}>
            {video_info.duration_seconds.toFixed(1)}s
          </Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.filename} numberOfLines={1}>
            {analysisData.video_filename}
          </Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoText}>
              {video_info.total_frames} frames • {video_info.fps} fps
            </Text>
            <Text style={styles.dateText}>{formatDate(addedAt)}</Text>
          </View>

          {/* Key Metrics Summary */}
          <View style={styles.metricsRow}>
            <View style={styles.metricBadge}>
              <Ionicons name="speedometer" size={12} color="#004aad" />
              <Text style={styles.metricText}>
                {keyMetrics.peakVelocity.toFixed(1)} m/s
              </Text>
            </View>
            {keyMetrics.maxElbowAngle !== null && (
              <View style={styles.metricBadge}>
                <Ionicons name="analytics" size={12} color="#004aad" />
                <Text style={styles.metricText}>
                  {keyMetrics.maxElbowAngle.toFixed(0)}° elbow
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Chevron */}
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analysis History</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* List */}
      <FlatList
        data={analyses}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={64} color="#666" />
            <Text style={styles.emptyText}>No analysis history yet</Text>
            <Text style={styles.emptyHint}>
              Upload and analyze videos to see them here
            </Text>
          </View>
        }
      />

      {/* Add Video Button */}
      <TouchableOpacity
        style={styles.addButton}
        activeOpacity={0.8}
        onPress={() => {
          // Placeholder - does nothing for now
        }}
      >
        <Ionicons name="add" size={28} color="#fff" />
        <Text style={styles.addButtonText}>Add Video</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
    width: CARD_WIDTH,
  },
  thumbnail: {
    width: 80,
    height: 80,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  thumbnailText: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  filename: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    color: '#888',
    fontSize: 13,
  },
  dateText: {
    color: '#666',
    fontSize: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  metricText: {
    color: '#aaa',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    color: '#aaa',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyHint: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
  },
  addButton: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    backgroundColor: '#004aad',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default HistoryScreen;
