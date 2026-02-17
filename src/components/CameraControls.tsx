import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { CameraAngle } from '../types/analysis';

interface CameraControlsProps {
  onAngleChange: (angle: CameraAngle) => void;
  currentAngle?: CameraAngle;
}

const cameraAngles: Array<{ label: string; value: CameraAngle }> = [
  { label: 'Front', value: 'front' },
  { label: 'Back', value: 'back' },
  { label: 'Left', value: 'left' },
  { label: 'Right', value: 'right' },
  { label: 'Top', value: 'top' },
  { label: '3/4 View', value: 'diagonal' },
];

const CameraControls: React.FC<CameraControlsProps> = ({
  onAngleChange,
  currentAngle = 'front',
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Camera Angle</Text>
        <View style={styles.handleBar} />
      </View>
      <View style={styles.gridContainer}>
        {cameraAngles.map((angle) => (
          <TouchableOpacity
            key={angle.value}
            style={[
              styles.button,
              currentAngle === angle.value && styles.buttonActive,
            ]}
            onPress={() => onAngleChange(angle.value)}
          >
            <Text
              style={[
                styles.buttonText,
                currentAngle === angle.value && styles.buttonTextActive,
              ]}
            >
              {angle.label}
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

export default CameraControls;
