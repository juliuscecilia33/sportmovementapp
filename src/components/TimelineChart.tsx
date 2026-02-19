import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import {
  MovementReport,
  VelocityDataPoint,
  AngleDataPoint,
} from '../types/report';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 40;
const CHART_HEIGHT = 220;

interface TimelineChartProps {
  movementReport: MovementReport;
}

interface ChartDataSeries {
  data: number[];
  color: (opacity: number) => string;
  strokeWidth: number;
}

const TimelineChart: React.FC<TimelineChartProps> = ({ movementReport }) => {
  const [activeMetrics, setActiveMetrics] = useState({
    velocity: true,
    elbowAngle: true,
    shoulderAngle: false,
  });

  // Process and normalize data for charting
  const chartData = useMemo(() => {
    const { velocities, angles } = movementReport.timelineData;

    // Group angles by joint type
    const elbowAngles = angles.filter((a) => a.joint === 'Right Elbow');
    const shoulderAngles = angles.filter((a) => a.joint === 'Right Shoulder');

    // Find common frame range
    const allFrames = [
      ...velocities.map((v) => v.frame),
      ...elbowAngles.map((a) => a.frame),
      ...shoulderAngles.map((a) => a.frame),
    ];
    const minFrame = Math.min(...allFrames);
    const maxFrame = Math.max(...allFrames);

    // Create aligned data arrays
    const frames: number[] = [];
    const velocityData: number[] = [];
    const elbowData: number[] = [];
    const shoulderData: number[] = [];

    for (let frame = minFrame; frame <= maxFrame; frame++) {
      frames.push(frame);

      // Find velocity for this frame
      const velPoint = velocities.find((v) => v.frame === frame);
      velocityData.push(velPoint?.velocity ?? 0);

      // Find elbow angle for this frame
      const elbowPoint = elbowAngles.find((a) => a.frame === frame);
      elbowData.push(elbowPoint?.angle ?? 0);

      // Find shoulder angle for this frame
      const shoulderPoint = shoulderAngles.find((a) => a.frame === frame);
      shoulderData.push(shoulderPoint?.angle ?? 0);
    }

    // Normalize all data to 0-100 scale for unified chart
    const normalize = (arr: number[]) => {
      const min = Math.min(...arr.filter((v) => v > 0));
      const max = Math.max(...arr);
      const range = max - min;
      return arr.map((v) => (range > 0 ? ((v - min) / range) * 100 : 0));
    };

    const normalizedVelocity = normalize(velocityData);
    const normalizedElbow = normalize(elbowData);
    const normalizedShoulder = normalize(shoulderData);

    // Build datasets based on active metrics
    const datasets: ChartDataSeries[] = [];

    if (activeMetrics.velocity) {
      datasets.push({
        data: normalizedVelocity,
        color: (opacity = 1) => `rgba(0, 150, 255, 1)`,
        strokeWidth: 4,
      });
    }

    if (activeMetrics.elbowAngle && elbowAngles.length > 0) {
      datasets.push({
        data: normalizedElbow,
        color: (opacity = 1) => `rgba(255, 179, 102, 1)`,
        strokeWidth: 3,
      });
    }

    if (activeMetrics.shoulderAngle && shoulderAngles.length > 0) {
      datasets.push({
        data: normalizedShoulder,
        color: (opacity = 1) => `rgba(100, 220, 220, 1)`,
        strokeWidth: 3,
      });
    }

    // Create labels (show every Nth frame to avoid clutter)
    const labelInterval = Math.ceil(frames.length / 6);
    const labels = frames.map((f, i) =>
      i % labelInterval === 0 ? f.toString() : ''
    );

    return {
      labels,
      datasets,
      frames,
      rawData: {
        velocity: velocityData,
        elbow: elbowData,
        shoulder: shoulderData,
      },
    };
  }, [movementReport, activeMetrics]);

  // Find key moment positions for markers
  const keyMomentMarkers = useMemo(() => {
    const { keyMoments } = movementReport;
    return keyMoments.map((moment) => {
      const frameIndex = chartData.frames.indexOf(moment.frame);
      if (frameIndex === -1) return null;

      // Calculate X position (approximate)
      const position = (frameIndex / chartData.frames.length) * 100;
      return {
        position,
        label: moment.label,
        frame: moment.frame,
      };
    }).filter((m) => m !== null);
  }, [movementReport, chartData]);

  // Phase color mapping
  const getPhaseColor = (phaseName: string): string => {
    const phaseColors: Record<string, string> = {
      Preparation: 'rgba(108, 117, 125, 0.2)',
      Acceleration: 'rgba(255, 193, 7, 0.2)',
      Contact: 'rgba(220, 53, 69, 0.2)',
      'Follow-through': 'rgba(40, 167, 69, 0.2)',
    };
    return phaseColors[phaseName] || 'rgba(108, 117, 125, 0.1)';
  };

  const toggleMetric = (metric: keyof typeof activeMetrics) => {
    setActiveMetrics((prev) => ({ ...prev, [metric]: !prev[metric] }));
  };

  // Check if we have data
  if (chartData.datasets.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No timeline data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Metric Toggle Buttons */}
      <Text style={styles.sectionTitle}>Metrics</Text>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            activeMetrics.velocity && styles.toggleButtonActive,
            activeMetrics.velocity && { backgroundColor: 'rgba(0, 123, 255, 0.2)', borderColor: '#007bff' },
          ]}
          onPress={() => toggleMetric('velocity')}
        >
          <View
            style={[
              styles.toggleIndicator,
              { backgroundColor: activeMetrics.velocity ? '#007bff' : '#666' },
            ]}
          />
          <Text
            style={[
              styles.toggleText,
              activeMetrics.velocity && styles.toggleTextActive,
            ]}
          >
            Velocity
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            activeMetrics.elbowAngle && styles.toggleButtonActive,
            activeMetrics.elbowAngle && { backgroundColor: 'rgba(255, 159, 64, 0.2)', borderColor: '#ff9f40' },
          ]}
          onPress={() => toggleMetric('elbowAngle')}
        >
          <View
            style={[
              styles.toggleIndicator,
              { backgroundColor: activeMetrics.elbowAngle ? '#ff9f40' : '#666' },
            ]}
          />
          <Text
            style={[
              styles.toggleText,
              activeMetrics.elbowAngle && styles.toggleTextActive,
            ]}
          >
            Elbow Angle
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            activeMetrics.shoulderAngle && styles.toggleButtonActive,
            activeMetrics.shoulderAngle && { backgroundColor: 'rgba(75, 192, 192, 0.2)', borderColor: '#4bc0c0' },
          ]}
          onPress={() => toggleMetric('shoulderAngle')}
        >
          <View
            style={[
              styles.toggleIndicator,
              {
                backgroundColor: activeMetrics.shoulderAngle
                  ? '#4bc0c0'
                  : '#666',
              },
            ]}
          />
          <Text
            style={[
              styles.toggleText,
              activeMetrics.shoulderAngle && styles.toggleTextActive,
            ]}
          >
            Shoulder Angle
          </Text>
        </TouchableOpacity>
      </View>

      {/* Phase Legend */}
      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
        Movement Phases
      </Text>
      <View style={styles.phaseContainer}>
        {movementReport.phases.map((phase, index) => (
          <View key={index} style={styles.phaseLegendItem}>
            <View
              style={[
                styles.phaseLegendColor,
                { backgroundColor: getPhaseColor(phase.name).replace('0.2', '0.8') },
              ]}
            />
            <Text style={styles.phaseLegendText}>{phase.name}</Text>
            <Text style={styles.phaseLegendDuration}>
              {phase.duration.toFixed(1)}s
            </Text>
          </View>
        ))}
      </View>

      {/* Chart */}
      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
        Timeline Visualization
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chartScrollContainer}
      >
        <View style={styles.chartContainer}>
          {/* Phase background regions */}
          <View style={styles.phaseBackgroundContainer}>
            {movementReport.phases.map((phase, index) => {
              const startIndex = chartData.frames.indexOf(phase.startFrame);
              const endIndex = chartData.frames.indexOf(phase.endFrame);
              if (startIndex === -1 || endIndex === -1) return null;

              const left = (startIndex / chartData.frames.length) * CHART_WIDTH;
              const width =
                ((endIndex - startIndex) / chartData.frames.length) *
                CHART_WIDTH;

              return (
                <View
                  key={index}
                  style={[
                    styles.phaseRegion,
                    {
                      left,
                      width,
                      backgroundColor: getPhaseColor(phase.name),
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Key moment markers */}
          <View style={styles.keyMomentContainer}>
            {keyMomentMarkers.map((marker, index) => {
              if (!marker) return null;
              return (
                <View
                  key={index}
                  style={[
                    styles.keyMomentMarker,
                    { left: `${marker.position}%` },
                  ]}
                >
                  <View style={styles.keyMomentLine} />
                  <Text style={styles.keyMomentLabel} numberOfLines={1}>
                    {marker.label}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Line Chart */}
          <LineChart
            data={{
              labels: chartData.labels,
              datasets: chartData.datasets,
            }}
            width={CHART_WIDTH}
            height={CHART_HEIGHT}
            chartConfig={{
              backgroundColor: '#1a1a1a',
              backgroundGradientFrom: '#1a1a1a',
              backgroundGradientTo: '#1a1a1a',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(170, 170, 170, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '0',
              },
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: '#333',
                strokeWidth: 1,
              },
            }}
            bezier
            style={styles.chart}
            withInnerLines={true}
            withOuterLines={true}
            withVerticalLines={false}
            withHorizontalLines={true}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            fromZero={true}
          />
        </View>
      </ScrollView>

      {/* Legend Info */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          X-axis: Frame number • Y-axis: Normalized values (0-100)
        </Text>
        <Text style={styles.infoText}>
          Tap metric buttons to show/hide data series
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#444',
  },
  toggleButtonActive: {
    borderWidth: 2,
  },
  toggleIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  toggleText: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#fff',
  },
  phaseContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  phaseLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  phaseLegendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  phaseLegendText: {
    color: '#ccc',
    fontSize: 13,
  },
  phaseLegendDuration: {
    color: '#888',
    fontSize: 12,
  },
  chartScrollContainer: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  chartContainer: {
    position: 'relative',
    marginVertical: 12,
  },
  phaseBackgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: CHART_HEIGHT,
    zIndex: 1,
  },
  phaseRegion: {
    position: 'absolute',
    top: 0,
    height: CHART_HEIGHT,
  },
  keyMomentContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: CHART_HEIGHT,
    zIndex: 2,
  },
  keyMomentMarker: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    zIndex: 3,
  },
  keyMomentLine: {
    width: 2,
    height: CHART_HEIGHT - 30,
    backgroundColor: '#ff3b30',
    opacity: 0.7,
  },
  keyMomentLabel: {
    color: '#ff3b30',
    fontSize: 10,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
    maxWidth: 80,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    zIndex: 10,
  },
  infoBox: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  infoText: {
    color: '#888',
    fontSize: 12,
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
  },
});

export default TimelineChart;
