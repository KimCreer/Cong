import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { styles } from '../styles/styles';

const PurposeInput = ({ value, onChangeText }) => {
  return (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Purpose</Text>
      <TextInput
        style={styles.purposeInput}
        placeholder="Describe your purpose..."
        value={value}
        onChangeText={onChangeText}
        multiline
        numberOfLines={3}
        placeholderTextColor="#888"
      />
    </View>
  );
};

export default PurposeInput; 