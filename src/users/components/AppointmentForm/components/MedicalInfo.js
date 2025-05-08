import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { FontAwesome5 } from "@expo/vector-icons";
import { styles } from '../styles/styles';

const MedicalInfo = ({
  patientName,
  processorName,
  medicalDetails,
  onPatientNameChange,
  onProcessorNameChange,
  onMedicalDetailsChange
}) => {
  return (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Medical Information</Text>
      <View style={styles.cardContainer}>
        <View style={styles.inputGroup}>
          <FontAwesome5 name="user" size={16} color="#003580" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Patient Name"
            value={patientName}
            onChangeText={onPatientNameChange}
            placeholderTextColor="#888"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <FontAwesome5 name="user-md" size={16} color="#003580" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Processor Name"
            value={processorName}
            onChangeText={onProcessorNameChange}
            placeholderTextColor="#888"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <FontAwesome5 name="notes-medical" size={16} color="#003580" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { height: 80 }]}
            placeholder="Medical Details"
            value={medicalDetails}
            onChangeText={onMedicalDetailsChange}
            multiline
            placeholderTextColor="#888"
          />
        </View>
      </View>
    </View>
  );
};

export default MedicalInfo; 