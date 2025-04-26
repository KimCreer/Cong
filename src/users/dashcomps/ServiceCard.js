// components/ServiceCard.js
import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import PropTypes from 'prop-types';

const ServiceCard = ({ item, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`Navigate to ${item.name}`}
      accessibilityRole="button"
    >
      <View style={[styles.serviceIconContainer, { backgroundColor: item.color }]}>
        <FontAwesome5 
          name={item.icon} 
          size={24} 
          color="#FFFFFF" 
          style={styles.serviceIcon}
        />
      </View>
      <Text style={styles.serviceTitle} numberOfLines={2}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );
};

ServiceCard.propTypes = {
  item: PropTypes.shape({
    name: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    color: PropTypes.string,
    screen: PropTypes.string.isRequired,
  }).isRequired,
  onPress: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  serviceCard: {
    width: '31%',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    marginTop: 12,
    borderRadius: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  serviceIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceIcon: {
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
});

// Using memo to prevent unnecessary re-renders
export default memo(ServiceCard);