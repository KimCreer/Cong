import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const EmptyState = ({ searchQuery, activeFilter }) => {
  const hasFilters = searchQuery || activeFilter !== "all";
  
  return (
    <View style={styles.emptyState}>
      <Icon name="clipboard-text-outline" size={80} color="#E0E0E0" />
      <Text style={styles.emptyStateText}>
        {hasFilters ? "No matching reports found" : "No Reports Yet"}
      </Text>
      <Text style={styles.emptyStateSubText}>
        {hasFilters
          ? "Try adjusting your search or filter criteria"
          : "Tap the + button below to report an issue in your community"}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
    marginTop: 16,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    maxWidth: '80%',
  },
});

export default EmptyState;