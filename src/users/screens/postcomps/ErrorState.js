import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ErrorState = ({ error, onRetry, hasCachedData }) => (
  <View style={styles.errorContainer}>
    <Icon name="alert-circle-outline" size={24} color="#ff4444" />
    <Text style={styles.errorText}>Failed to load posts</Text>
    <Text style={styles.errorDetail}>{error?.message || 'Unknown error occurred'}</Text>
    <TouchableOpacity 
      onPress={onRetry} 
      style={styles.retryButton}
      accessibilityLabel="Retry loading posts"
    >
      <Icon name="refresh" size={16} color="white" />
      <Text style={styles.retryButtonText}>Try Again</Text>
    </TouchableOpacity>
    {hasCachedData && (
      <Text style={styles.cachedText}>Showing cached content</Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  errorContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#fff3f3',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff4444',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  errorDetail: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a6da7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  retryButtonText: {
    color: 'white',
    marginLeft: 6,
    fontWeight: '500',
  },
  cachedText: {
    color: '#868e96',
    marginTop: 8,
    fontSize: 12,
  },
});

export default ErrorState;