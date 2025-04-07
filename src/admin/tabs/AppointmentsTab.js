import React, { useState, useEffect } from "react";
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    ActivityIndicator,
    RefreshControl,
    Alert,
    Modal,
    Platform
} from "react-native";
import { FontAwesome5, MaterialIcons, Feather } from "@expo/vector-icons";
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
    initNotificationService,
    registerHeadlessTask,
    checkPendingAppointments
} from '../components/NotificationsService';

const APPOINTMENT_TYPES = {
    SOLICITATION: { label: "Solicitation", icon: "file-signature", color: "#4a6da7" },
    COURTESY: { label: "Courtesy", icon: "handshake", color: "#6c5ce7" },
    INVITATION: { label: "Invitation", icon: "calendar-check", color: "#00b894" },
    FINANCE: { label: "Finance/Medical", icon: "file-invoice-dollar", color: "#e84393" },
    OTHER: { label: "Other", icon: "question-circle", color: "#636e72" }
};

const SORT_OPTIONS = [
    { id: 'date_asc', label: 'Time (Earliest First)', icon: 'arrow-down' },
    { id: 'date_desc', label: 'Time (Latest First)', icon: 'arrow-up' }
];

const AppointmentsTab = ({ navigation }) => {
    const [appointments, setAppointments] = useState([]);
    const [filteredAppointments, setFilteredAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userCache, setUserCache] = useState({});
    const [selectedType, setSelectedType] = useState(null);
    const [sortOption, setSortOption] = useState(SORT_OPTIONS[0]);
    const [showTypeFilter, setShowTypeFilter] = useState(false);
    const [showSortOptions, setShowSortOptions] = useState(false);
    const [showActionButtons, setShowActionButtons] = useState({});

    // Initialize notification service
    useEffect(() => {
        let cleanup;
        
        const setupNotifications = async () => {
            const service = await initNotificationService(navigation);
            cleanup = service.cleanup;
            registerHeadlessTask();
        };
        
        setupNotifications();
        
        return () => {
            if (cleanup) cleanup();
        };
    }, [navigation]);

    const fetchUserDetails = async (userId) => {
        try {
            if (userCache[userId]) {
                return userCache[userId];
            }

            const db = firestore();
            const userDoc = await db.collection('users').doc(userId).get();
            
            if (userDoc.exists) {
                const userData = {
                    firstName: userDoc.data()?.firstName || 'Unknown',
                    lastName: userDoc.data()?.lastName || 'User',
                    profileImage: userDoc.data()?.profileImage || null
                };
                
                setUserCache(prev => ({ ...prev, [userId]: userData }));
                return userData;
            }
            return { firstName: 'Unknown', lastName: 'User', profileImage: null };
        } catch (error) {
            console.error("Error fetching user details:", error);
            return { firstName: 'Unknown', lastName: 'User', profileImage: null };
        }
    };

    const fetchAppointments = async () => {
        try {
            setRefreshing(true);
            const db = firestore();
            
            let q;
            const orderDirection = sortOption.id.includes('asc') ? 'asc' : 'desc';
            q = db.collection('appointments')
            .where('status', '==', 'Pending')
            .orderBy('time', orderDirection);
       
            
            const querySnapshot = await q.get();
            const appointmentsData = [];
            
            for (const docSnapshot of querySnapshot.docs) {
                const appointmentData = docSnapshot.data();
                let userDetails = { firstName: 'Unknown', lastName: 'User' };
                
                if (appointmentData.userId) {
                    userDetails = await fetchUserDetails(appointmentData.userId);
                }
                
                const typeKey = appointmentData.type?.toUpperCase() || 'OTHER';
                const typeInfo = APPOINTMENT_TYPES[typeKey] || APPOINTMENT_TYPES.OTHER;
                
                appointmentsData.push({
                    id: docSnapshot.id,
                    ...appointmentData,
                    time: appointmentData.time || "8:00 AM",
                    userFirstName: userDetails.firstName,
                    userLastName: userDetails.lastName,
                    userProfileImage: userDetails.profileImage,
                    typeInfo: typeInfo
                });
            }
            
            setAppointments(appointmentsData);
            applyFilters(appointmentsData, selectedType);
        } catch (error) {
            console.error("Error fetching appointments:", error);
            Alert.alert("Error", "Failed to load appointments");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const applyFilters = (data, typeFilter) => {
        let filtered = [...data];
        
        if (typeFilter) {
            filtered = filtered.filter(app => 
                app.typeInfo.label.toLowerCase() === typeFilter.toLowerCase()
            );
        }
        
        setFilteredAppointments(filtered);
    };

    const toggleActionButtons = (appointmentId) => {
        setShowActionButtons(prev => ({
            ...prev,
            [appointmentId]: !prev[appointmentId]
        }));
    };

    const confirmAppointment = async (appointmentId) => {
        try {
            const db = firestore();
            await db.collection('appointments').doc(appointmentId).update({
                status: "Confirmed",
                updatedAt: firestore.FieldValue.serverTimestamp()
            });
            Alert.alert("Success", "Appointment confirmed successfully");
            setShowActionButtons(prev => ({ ...prev, [appointmentId]: false }));
            fetchAppointments(); // Refresh the list
            
            // Check if there are still pending appointments after this update
            await checkPendingAppointments();
        } catch (error) {
            console.error("Error confirming appointment:", error);
            Alert.alert("Error", "Failed to confirm appointment");
        }
    };

    const rejectAppointment = async (appointmentId) => {
        try {
            const db = firestore();
            await db.collection('appointments').doc(appointmentId).update({
                status: "Rejected",
                updatedAt: firestore.FieldValue.serverTimestamp()
            });
            Alert.alert("Success", "Appointment rejected");
            setShowActionButtons(prev => ({ ...prev, [appointmentId]: false }));
            fetchAppointments(); // Refresh the list
            
            // Check if there are still pending appointments after this update
            await checkPendingAppointments();
        } catch (error) {
            console.error("Error rejecting appointment:", error);
            Alert.alert("Error", "Failed to reject appointment");
        }
    };

  useEffect(() => {
    fetchAppointments();
    
    const db = firestore();
    const orderDirection = sortOption.id.includes('asc') ? 'asc' : 'desc';
    const q = db.collection('appointments')
               .where('status', '==', 'Pending')
               .orderBy('time', orderDirection);
        
        const unsubscribe = q.onSnapshot(async (snapshot) => {
            const updatedAppointments = [];
            
            for (const docSnapshot of snapshot.docs) {
                const appointmentData = docSnapshot.data();
                let userDetails = { firstName: 'Unknown', lastName: 'User' };
                
                if (appointmentData.userId) {
                    userDetails = await fetchUserDetails(appointmentData.userId);
                }
                
                const typeKey = appointmentData.type?.toUpperCase() || 'OTHER';
                const typeInfo = APPOINTMENT_TYPES[typeKey] || APPOINTMENT_TYPES.OTHER;
                
                updatedAppointments.push({
                    id: docSnapshot.id,
                    ...appointmentData,
                    time: appointmentData.time || "8:00 AM",
                    userFirstName: userDetails.firstName,
                    userLastName: userDetails.lastName,
                    userProfileImage: userDetails.profileImage,
                    typeInfo: typeInfo
                });
            }
            
            setAppointments(updatedAppointments);
            applyFilters(updatedAppointments, selectedType);
        });
        
        return () => unsubscribe();
    }, [sortOption]);

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (error) {
            console.error("Error formatting date:", error);
            return 'Invalid date';
        }
    };

    const handleTypeSelect = (type) => {
        setSelectedType(type === selectedType ? null : type);
        applyFilters(appointments, type === selectedType ? null : type);
        setShowTypeFilter(false);
    };

    const handleSortSelect = (option) => {
        setSortOption(option);
        setShowSortOptions(false);
    };

    const AppointmentCard = ({ appointment, onPress }) => (
        <View style={styles.appointmentCard}>
            <TouchableOpacity onPress={() => toggleActionButtons(appointment.id)}>
                <View style={styles.cardHeader}>
                    <View style={[styles.typeIndicator, { backgroundColor: appointment.typeInfo.color }]}>
                        <FontAwesome5 
                            name={appointment.typeInfo.icon} 
                            size={14} 
                            color="#fff" 
                        />
                    </View>
                    <Text style={styles.appointmentTitle}>{appointment.purpose}</Text>
                    <View style={styles.statusBadge}>
                        <Text style={[
                            styles.statusText,
                            appointment.status === 'Pending' && styles.statusPending,
                            appointment.status === 'Approved' && styles.statusApproved,
                            appointment.status === 'Rejected' && styles.statusRejected
                        ]}>
                            {appointment.status}
                        </Text>
                    </View>
                </View>
                
                <View style={styles.appointmentDetails}>
                    <View style={styles.detailRow}>
                        <FontAwesome5 name="calendar-alt" size={14} color="#666" />
                        <Text style={styles.detailText}>
                            Date: {formatDate(appointment.date)}
                        </Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                        <FontAwesome5 name="clock" size={14} color="#666" />
                        <Text style={styles.detailText}>
                            Time: {appointment.time}
                        </Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                        <FontAwesome5 name="user" size={14} color="#666" />
                        <Text style={styles.detailText}>
                            {`${appointment.userFirstName} ${appointment.userLastName}`}
                        </Text>
                    </View>
                    
                    {appointment.notes && (
                        <View style={styles.detailRow}>
                            <FontAwesome5 name="sticky-note" size={14} color="#666" />
                            <Text style={styles.detailText} numberOfLines={1}>
                                {appointment.notes}
                            </Text>
                        </View>
                    )}
                </View>
                
                <View style={styles.cardFooter}>
                    <Text style={styles.typeText}>
                        {appointment.typeInfo.label}
                    </Text>
                    <MaterialIcons name={showActionButtons[appointment.id] ? "expand-less" : "expand-more"} size={20} color="#999" />
                </View>
            </TouchableOpacity>

            {showActionButtons[appointment.id] && (
                <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity 
                        style={[styles.actionButton, styles.confirmButton]}
                        onPress={() => confirmAppointment(appointment.id)}
                    >
                        <Text style={styles.actionButtonText}>Confirm</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => rejectAppointment(appointment.id)}
                    >
                        <Text style={styles.actionButtonText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.actionButton, styles.detailsButton]}
                        onPress={() => navigation.navigate('AppointmentDetail', { 
                            appointment: appointment 
                        })}
                    >
                        <Text style={styles.actionButtonText}>View Details</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.filterBar}>
                <TouchableOpacity 
                    style={styles.filterButton}
                    onPress={() => setShowTypeFilter(true)}
                >
                    <Feather name="filter" size={18} color="#003366" />
                    <Text style={styles.filterButtonText}>
                        {selectedType || "All Types"}
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={styles.filterButton}
                    onPress={() => setShowSortOptions(true)}
                >
                    <Feather name={sortOption.icon} size={18} color="#003366" />
                    <Text style={styles.filterButtonText}>
                        {sortOption.label}
                    </Text>
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <ActivityIndicator size="large" color="#003366" style={styles.loader} />
            ) : (
                <FlatList
                    data={filteredAppointments}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <AppointmentCard 
                            appointment={item}
                            onPress={() => navigation.navigate('AppointmentDetail', { 
                                appointment: item 
                            })}
                        />
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>
                                {selectedType 
                                    ? `No pending ${selectedType.toLowerCase()} appointments`
                                    : "No pending appointments"}
                            </Text>
                        </View>
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={fetchAppointments}
                            colors={["#003366", "#0275d8"]}
                        />
                    }
                    contentContainerStyle={filteredAppointments.length === 0 && styles.listEmptyContainer}
                />
            )}
            
            {/* Type Filter Modal */}
            <Modal
                visible={showTypeFilter}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowTypeFilter(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Filter by Appointment Type</Text>
                        
                        <TouchableOpacity 
                            style={[styles.filterOption, !selectedType && styles.selectedFilterOption]}
                            onPress={() => handleTypeSelect(null)}
                        >
                            <Text style={[styles.filterOptionText, !selectedType && styles.selectedFilterOptionText]}>
                                All Appointment Types
                            </Text>
                        </TouchableOpacity>
                        
                        {Object.values(APPOINTMENT_TYPES).map((type) => (
                            <TouchableOpacity 
                                key={type.label}
                                style={[
                                    styles.filterOption, 
                                    selectedType === type.label && styles.selectedFilterOption
                                ]}
                                onPress={() => handleTypeSelect(type.label)}
                            >
                                <View style={[styles.typeIcon, { backgroundColor: type.color }]}>
                                    <FontAwesome5 name={type.icon} size={14} color="#fff" />
                                </View>
                                <Text style={[
                                    styles.filterOptionText,
                                    selectedType === type.label && styles.selectedFilterOptionText
                                ]}>
                                    {type.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        
                        <TouchableOpacity 
                            style={styles.modalCloseButton}
                            onPress={() => setShowTypeFilter(false)}
                        >
                            <Text style={styles.modalCloseButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            
            {/* Sort Options Modal */}
            <Modal
                visible={showSortOptions}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowSortOptions(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Sort Appointments</Text>
                        
                        {SORT_OPTIONS.map((option) => (
                            <TouchableOpacity 
                                key={option.id}
                                style={[
                                    styles.filterOption, 
                                    sortOption.id === option.id && styles.selectedFilterOption
                                ]}
                                onPress={() => handleSortSelect(option)}
                            >
                                <Feather 
                                    name={option.icon} 
                                    size={18} 
                                    color={sortOption.id === option.id ? "#003366" : "#666"} 
                                />
                                <Text style={[
                                    styles.filterOptionText,
                                    sortOption.id === option.id && styles.selectedFilterOptionText
                                ]}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        
                        <TouchableOpacity 
                            style={styles.modalCloseButton}
                            onPress={() => setShowSortOptions(false)}
                        >
                            <Text style={styles.modalCloseButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    filterBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
    },
    filterButtonText: {
        marginLeft: 8,
        color: '#003366',
        fontWeight: '500',
    },
    loader: {
        marginTop: 50,
    },
    appointmentCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        margin: 10,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    typeIndicator: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    appointmentTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    statusPending: {
        color: '#f39c12',
    },
    statusApproved: {
        color: '#27ae60',
    },
    statusRejected: {
        color: '#e74c3c',
    },
    appointmentDetails: {
        marginBottom: 10,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    detailText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#666',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    typeText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 5,
    },
    confirmButton: {
        backgroundColor: '#27ae60',
    },
    rejectButton: {
        backgroundColor: '#e74c3c',
    },
    detailsButton: {
        backgroundColor: '#3498db',
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    listEmptyContainer: {
        flex: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 20,
        color: '#003366',
        textAlign: 'center',
    },
    filterOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        marginBottom: 5,
        borderRadius: 6,
    },
    selectedFilterOption: {
        backgroundColor: '#e6f2ff',
    },
    filterOptionText: {
        marginLeft: 10,
        fontSize: 16,
        color: '#666',
    },
    selectedFilterOptionText: {
        color: '#003366',
        fontWeight: '500',
    },
    typeIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCloseButton: {
        marginTop: 15,
        padding: 12,
        backgroundColor: '#003366',
        borderRadius: 6,
        alignItems: 'center',
    },
    modalCloseButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
});

export default AppointmentsTab;