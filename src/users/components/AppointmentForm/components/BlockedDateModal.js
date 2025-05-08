import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { styles } from '../styles/styles';

const BlockedDateModal = ({ visible, onClose, blockedDate }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.blockedReasonModal}>
        <View style={styles.blockedReasonContainer}>
          <Text style={styles.blockedReasonTitle}>Date Blocked</Text>
          <Text style={styles.blockedReasonText}>
            {blockedDate?.reason || 'No reason provided'}
          </Text>
          <TouchableOpacity
            style={styles.blockedReasonButton}
            onPress={onClose}
          >
            <Text style={styles.blockedReasonButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default BlockedDateModal; 