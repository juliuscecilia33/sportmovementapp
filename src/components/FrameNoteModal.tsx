import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FrameNote } from '../types/notes';

interface FrameNoteModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (noteText: string) => void;
  onDelete?: () => void;
  existingNote?: FrameNote;
  frameNumber: number;
  timestamp: number;
}

const FrameNoteModal: React.FC<FrameNoteModalProps> = ({
  visible,
  onClose,
  onSave,
  onDelete,
  existingNote,
  frameNumber,
  timestamp,
}) => {
  const [noteText, setNoteText] = useState('');
  const [overlayOpacity] = useState(new Animated.Value(0));
  const [sheetTranslateY] = useState(new Animated.Value(500));

  useEffect(() => {
    if (visible) {
      // Set initial text if editing existing note
      setNoteText(existingNote?.noteText || '');

      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          damping: 20,
          stiffness: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 500,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, existingNote]);

  const handleSave = () => {
    if (noteText.trim()) {
      onSave(noteText.trim());
      setNoteText('');
      onClose();
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      setNoteText('');
      onClose();
    }
  };

  const handleCancel = () => {
    setNoteText('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <Animated.View
          style={[
            styles.modalOverlay,
            { opacity: overlayOpacity },
          ]}
        >
          <TouchableOpacity
            style={styles.modalOverlayTouchable}
            activeOpacity={1}
            onPress={handleCancel}
          />
          <Animated.View
            style={[
              styles.modalContent,
              { transform: [{ translateY: sheetTranslateY }] },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Ionicons name="create-outline" size={24} color="#fff" />
                <View style={styles.headerTextContainer}>
                  <Text style={styles.title}>
                    {existingNote ? 'Edit Note' : 'Add Note'}
                  </Text>
                  <Text style={styles.frameInfo}>
                    Frame {frameNumber} • {timestamp.toFixed(2)}s
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCancel}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Text Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your note here..."
                placeholderTextColor="#666"
                value={noteText}
                onChangeText={setNoteText}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                autoFocus
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              {existingNote && onDelete && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDelete}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={20} color="#ff4444" />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              )}

              <View style={styles.rightButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    !noteText.trim() && styles.saveButtonDisabled,
                  ]}
                  onPress={handleSave}
                  activeOpacity={0.7}
                  disabled={!noteText.trim()}
                >
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalOverlayTouchable: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTextContainer: {
    marginLeft: 12,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  frameInfo: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  inputContainer: {
    padding: 16,
  },
  textInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 15,
    minHeight: 150,
    borderWidth: 1,
    borderColor: '#333',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  deleteButtonText: {
    color: '#ff4444',
    fontSize: 15,
    fontWeight: '600',
  },
  rightButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
  },
  cancelButtonText: {
    color: '#aaa',
    fontSize: 15,
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#004aad',
  },
  saveButtonDisabled: {
    backgroundColor: '#333',
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default FrameNoteModal;
