import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const EmptyState = ({ activeCategory, onRefresh }) => (
  <View style={styles.emptyContainer}>
    <Icon name="newspaper-variant-outline" size={64} color="#adb5bd" />
    <Text style={styles.emptyText}>No posts found</Text>
    <Text style={styles.emptySubtext}>
      {activeCategory !== 'All' ? 
        `No posts in the ${activeCategory} category` : 
        "When new posts are available, they'll appear here"}
    </Text>
    <TouchableOpacity 
      onPress={onRefresh} 
      style={styles.refreshButton}
      accessibilityLabel="Refresh posts"
    >
      <Icon name="refresh" size={20} color="#4a6da7" />
      <Text style={styles.refreshButtonText}>Refresh</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  emptyContainer: {
    margin: 16,
    padding: 24,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#495057',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#868e96',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 24,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
  },
  refreshButtonText: {
    color: '#4a6da7',
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default EmptyState;