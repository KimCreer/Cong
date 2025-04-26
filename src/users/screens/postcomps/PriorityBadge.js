import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PRIORITY_COLORS, PRIORITY_TEXT } from './constants';

const PriorityBadge = React.memo(({ priority }) => (
  <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[priority] }]}>
    <Text style={styles.priorityBadgeText}>{PRIORITY_TEXT[priority]}</Text>
  </View>
));

const styles = StyleSheet.create({
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});

export default PriorityBadge;