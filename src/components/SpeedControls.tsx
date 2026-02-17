import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface SpeedControlsProps {
  onSpeedChange: (speed: number) => void;
  currentSpeed?: number;
}

const speedOptions: Array<{ label: string; value: number }> = [
  { label: '0.25x', value: 0.25 },
  { label: '0.5x', value: 0.5 },
  { label: '1x', value: 1 },
  { label: '2x', value: 2 },
];

const SpeedControls: React.FC<SpeedControlsProps> = ({
  onSpeedChange,
  currentSpeed = 1,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Playback Speed</Text>
        <View style={styles.handleBar} />
      </View>
      <View style={styles.gridContainer}>
        {speedOptions.map((speed) => (
          <TouchableOpacity
            key={speed.value}
            style={[
              styles.button,
              currentSpeed === speed.value && styles.buttonActive,
            ]}
            onPress={() => onSpeedChange(speed.value)}
          >
            <Text
              style={[
                styles.buttonText,
                currentSpeed === speed.value && styles.buttonTextActive,
              ]}
            >
              {speed.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    minWidth: 100,
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: '#4a4aff',
    borderColor: '#6a6aff',
  },
  buttonText: {
    color: '#aaa',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonTextActive: {
    color: '#fff',
  },
});

export default SpeedControls;
