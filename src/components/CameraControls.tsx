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
  { label: '3/4', value: 'diagonal' },
];

const CameraControls: React.FC<CameraControlsProps> = ({
  onAngleChange,
  currentAngle = 'front',
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Camera Angle</Text>
      <View style={styles.buttonsRow}>
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
    padding: 12,
    backgroundColor: '#1a1a1a',
  },
  label: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  buttonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  buttonActive: {
    backgroundColor: '#4a4aff',
    borderColor: '#6a6aff',
  },
  buttonText: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '500',
  },
  buttonTextActive: {
    color: '#fff',
  },
});

export default CameraControls;
