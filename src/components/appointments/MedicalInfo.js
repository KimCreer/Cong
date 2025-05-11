import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { commonStyles } from '../../styles/commonStyles';

const MedicalInfo = ({
    patientName,
    processorName,
    medicalDetails,
    onPatientNameChange,
    onProcessorNameChange,
    onMedicalDetailsChange
}) => {
    return (
        <View style={styles.container}>
            <Text style={commonStyles.sectionTitle}>Medical Information</Text>
            
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Patient Name</Text>
                <TextInput
                    style={styles.input}
                    value={patientName}
                    onChangeText={onPatientNameChange}
                    placeholder="Enter patient's full name"
                    placeholderTextColor="#999"
                />
            </View>
            
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Processor Name</Text>
                <TextInput
                    style={styles.input}
                    value={processorName}
                    onChangeText={onProcessorNameChange}
                    placeholder="Enter processor's name"
                    placeholderTextColor="#999"
                />
            </View>
            
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Medical Details</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={medicalDetails}
                    onChangeText={onMedicalDetailsChange}
                    placeholder="Enter relevant medical information"
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#F5F7FA',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#333',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
});

export default MedicalInfo; 