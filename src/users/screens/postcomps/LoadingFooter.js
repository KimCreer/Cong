import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

const LoadingFooter = ({ hasMore }) => {
  if (!hasMore) {
    return (
      <View style={styles.footer}>
        <Text style={styles.footerText}>You're all caught up</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.footer}>
      <ActivityIndicator size="small" color="#4a6da7" />
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    color: '#868e96',
    fontSize: 14,
  },
});

export default LoadingFooter;