import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from "@expo/vector-icons";
import { APPOINTMENT_TYPES } from '../utils/constants';
import { styles } from '../styles/styles';

const TypeSelection = ({ selectedType, onTypeSelect }) => {
  return (
    <View style={styles.typeGrid}>
      {APPOINTMENT_TYPES.map(({ id, name, icon }) => (
        <TouchableOpacity
          key={id}
          style={[
            styles.typeButton,
            selectedType === name && styles.selectedTypeButton
          ]}
          onPress={() => onTypeSelect(name)}
          activeOpacity={0.7}
        >
          <View style={styles.typeIconContainer}>
            <FontAwesome5 
              name={icon} 
              size={18} 
              color={selectedType === name ? "#FFF" : "#003580"} 
            />
          </View>
          <Text style={[
            styles.typeButtonText,
            selectedType === name && styles.selectedTypeText
          ]}>
            {name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default TypeSelection; 