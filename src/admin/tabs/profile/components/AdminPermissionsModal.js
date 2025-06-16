import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AVAILABLE_TASKS } from '../hooks/useAdminManagement';

const AdminPermissionsModal = ({
    visible,
    onClose,
    admin,
    onUpdateTasks,
    loading
}) => {
    const [selectedTasks, setSelectedTasks] = useState([]);

    useEffect(() => {
        if (admin) {
            setSelectedTasks(admin.tasks || []);
        }
    }, [admin]);

    const handleTaskToggle = (taskKey) => {
        setSelectedTasks(prev => {
            if (prev.includes(taskKey)) {
                return prev.filter(t => t !== taskKey);
            } else {
                return [...prev, taskKey];
            }
        });
    };

    const handleSave = () => {
        if (admin) {
            onUpdateTasks(admin.id, selectedTasks);
        }
    };

    if (!admin) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Manage Admin Permissions</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <MaterialIcons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.adminInfo}>
                        <Text style={styles.adminName}>{admin.name}</Text>
                        <Text style={styles.adminPhone}>{admin.phone}</Text>
                    </View>

                    <ScrollView style={styles.tasksContainer}>
                        <Text style={styles.sectionTitle}>Available Tasks</Text>
                        {Object.entries(AVAILABLE_TASKS).map(([key, task]) => (
                            <TouchableOpacity
                                key={key}
                                style={[
                                    styles.taskItem,
                                    selectedTasks.includes(key) && styles.taskItemSelected
                                ]}
                                onPress={() => handleTaskToggle(key)}
                            >
                                <View style={styles.taskInfo}>
                                    <Text style={styles.taskName}>{task.name}</Text>
                                    <Text style={styles.taskDescription}>{task.description}</Text>
                                </View>
                                <MaterialIcons
                                    name={selectedTasks.includes(key) ? "check-box" : "check-box-outline-blank"}
                                    size={24}
                                    color={selectedTasks.includes(key) ? "#4CAF50" : "#666"}
                                />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={onClose}
                            disabled={loading}
                        >
                            <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.saveButton]}
                            onPress={handleSave}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={[styles.buttonText, styles.saveButtonText]}>Save Changes</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        width: '90%',
        maxHeight: '80%',
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
    },
    closeButton: {
        padding: 4,
    },
    adminInfo: {
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    adminName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    adminPhone: {
        fontSize: 14,
        color: '#666',
    },
    tasksContainer: {
        maxHeight: '60%',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    taskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        marginBottom: 8,
    },
    taskItemSelected: {
        backgroundColor: '#E8F5E9',
    },
    taskInfo: {
        flex: 1,
        marginRight: 12,
    },
    taskName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 4,
    },
    taskDescription: {
        fontSize: 14,
        color: '#666',
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 20,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginLeft: 12,
        minWidth: 100,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#F8F9FA',
        borderWidth: 1,
        borderColor: '#DDD',
    },
    saveButton: {
        backgroundColor: '#4CAF50',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#666',
    },
    saveButtonText: {
        color: '#FFF',
    },
});

export default AdminPermissionsModal; 