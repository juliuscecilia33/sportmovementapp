import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AssignPlayerModalProps {
  visible: boolean;
  onClose: () => void;
  onAssign: (playerName: string) => void;
  currentAssignment?: string;
}

// Hardcoded roster for now - can be moved to context/config later
const ROSTER = [
  'Emma Johnson',
  'Sarah Williams',
  'Madison Brown',
  'Olivia Davis',
  'Ava Martinez',
  'Isabella Garcia',
  'Sophia Rodriguez',
  'Mia Wilson',
  'Charlotte Anderson',
  'Amelia Thomas',
  'Harper Taylor',
  'Evelyn Moore',
];

const AssignPlayerModal: React.FC<AssignPlayerModalProps> = ({
  visible,
  onClose,
  onAssign,
  currentAssignment,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [overlayOpacity] = useState(new Animated.Value(0));
  const [sheetTranslateY] = useState(new Animated.Value(500));

  React.useEffect(() => {
    if (visible) {
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
  }, [visible]);

  const filteredRoster = ROSTER.filter((player) =>
    player.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectPlayer = (playerName: string) => {
    onAssign(playerName);
    setSearchQuery(''); // Reset search
    onClose();
  };

  const renderPlayerItem = ({ item }: { item: string }) => {
    const isAssigned = item === currentAssignment;

    return (
      <TouchableOpacity
        style={[styles.playerItem, isAssigned && styles.playerItemAssigned]}
        onPress={() => handleSelectPlayer(item)}
        activeOpacity={0.7}
      >
        <View style={styles.playerInfo}>
          <View style={[styles.playerAvatar, isAssigned && styles.playerAvatarAssigned]}>
            <Text style={[styles.playerInitials, isAssigned && styles.playerInitialsAssigned]}>
              {item.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
          <Text style={[styles.playerName, isAssigned && styles.playerNameAssigned]}>
            {item}
          </Text>
        </View>
        {isAssigned && (
          <Ionicons name="checkmark-circle" size={24} color="#004aad" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
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
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.modalContent,
            { transform: [{ translateY: sheetTranslateY }] },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Assign to Player</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search players..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>

          {/* Player List */}
          <FlatList
            data={filteredRoster}
            renderItem={renderPlayerItem}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="person-outline" size={48} color="#666" />
                <Text style={styles.emptyText}>No players found</Text>
              </View>
            }
          />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    maxHeight: '75%',
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
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
  },
  clearButton: {
    padding: 4,
  },
  listContent: {
    padding: 16,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  playerItemAssigned: {
    backgroundColor: 'rgba(0, 74, 173, 0.15)',
    borderColor: '#004aad',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#404040',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerAvatarAssigned: {
    backgroundColor: 'rgba(0, 74, 173, 0.3)',
  },
  playerInitials: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '700',
  },
  playerInitialsAssigned: {
    color: '#4a9fff',
  },
  playerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  playerNameAssigned: {
    color: '#4a9fff',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    marginTop: 12,
  },
});

export default AssignPlayerModal;
