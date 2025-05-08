import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Feather } from "@expo/vector-icons";

const AddAdminModal = ({
    visible,
    onClose,
    newAdminPhone,
    setNewAdminPhone,
    onAddAdmin,
    addingAdmin
}) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <TouchableOpacity 
                        style={styles.modalCloseButton}
                        onPress={onClose}
                    >
                        <Feather name="x" size={24} color="#666" />
                    </TouchableOpacity>

                    <Text style={styles.modalTitle}>Add New Admin</Text>
                    <Text style={styles.modalSubtitle}>
                        Enter the phone number of the user you want to make an admin
                    </Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Phone Number</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={newAdminPhone}
                            onChangeText={setNewAdminPhone}
                            placeholder="e.g. +1234567890"
                            keyboardType="phone-pad"
                            autoFocus={true}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.modalActionButton, !newAdminPhone && styles.disabledButton]}
                        onPress={onAddAdmin}
                        disabled={addingAdmin || !newAdminPhone}
                    >
                        {addingAdmin ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.modalActionButtonText}>Add Admin</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        width: '90%',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
    },
    modalCloseButton: {
        alignSelf: 'flex-end',
        padding: 8,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#003366',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 30,
        textAlign: 'center',
    },
    inputContainer: {
        width: '100%',
        marginBottom: 15,
    },
    inputLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    modalInput: {
        backgroundColor: '#F5F7FA',
        borderWidth: 1,
        borderColor: '#E1E5EB',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        width: '100%',
    },
    modalActionButton: {
        backgroundColor: '#003366',
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 25,
        marginTop: 10,
        width: '100%',
        alignItems: 'center',
    },
    modalActionButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
    disabledButton: {
        backgroundColor: '#cccccc',
    },
});

export default AddAdminModal; 