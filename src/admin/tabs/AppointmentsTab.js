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
import { getFirestore, 
         collection, 
         doc, 
         query, 
         where, 
         orderBy, 
         getDoc,
         getDocs, 
         onSnapshot,
         updateDoc,
         serverTimestamp } from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';

const APPOINTMENT_TYPES = {
    COURTESY: { label: "Courtesy (VIP)", icon: "handshake", color: "#6c5ce7" },
    FINANCE: { label: "Finance/Medical", icon: "file-invoice-dollar", color: "#e84393" },
    OTHER: { label: "Other", icon: "question-circle", color: "#636e72" }
};

const STATUS_COLORS = {
    Pending: "#FFA000",
    Confirmed: "#28a745",
    Cancelled: "#dc3545",
    Completed: "#007bff",
    Rejected: "#6c757d"
};

const SORT_OPTIONS = [
    { id: 'date_asc', label: 'Time (Earliest First)', icon: 'arrow-down' },
    { id: 'date_desc', label: 'Time (Latest First)', icon: 'arrow-up' }
];

const safeFormatDate = (dateValue, formatString, fallbackText = 'Not available') => {
    try {
        if (dateValue && typeof dateValue.toDate === 'function') {
            return format(dateValue.toDate(), formatString);
        }
        if (dateValue instanceof Date) {
            return format(dateValue, formatString);
        }
        if (typeof dateValue === 'number') {
            return format(new Date(dateValue), formatString);
        }
        if (typeof dateValue === 'string') {
            const parsedDate = new Date(dateValue);
            if (!isNaN(parsedDate.getTime())) {
                return format(parsedDate, formatString);
            }
        }
        return fallbackText;
    } catch (error) {
        console.log("Date formatting error:", error, "for value:", dateValue);
        return fallbackText;
    }
};

const validateTime = (timeValue) => {
    if (!timeValue) return "Not scheduled";
    if (typeof timeValue !== 'string') return "Invalid time";
    if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9] [AP]M$/i.test(timeValue)) {
        return timeValue;
    }
    return "Invalid time format";
};

const AppointmentsTab = () => {
    const navigation = useNavigation();
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

    const db = getFirestore();

    const fetchUserDetails = async (userId) => {
        try {
            if (userCache[userId]) {
                return userCache[userId];
            }

            const userDoc = await getDoc(doc(db, 'users', userId));
            
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
            const orderDirection = sortOption.id.includes('asc') ? 'asc' : 'desc';
            
            const q = query(
                collection(db, 'appointments'),
                where('status', '==', 'Pending'),
                orderBy('createdAt', orderDirection)
            );
            
            const querySnapshot = await getDocs(q);
            const appointmentsData = [];
            
            for (const docSnapshot of querySnapshot.docs) {
                const appointmentData = docSnapshot.data();
                let userDetails = { firstName: 'Unknown', lastName: 'User' };
                
                if (appointmentData.userId) {
                    userDetails = await fetchUserDetails(appointmentData.userId);
                }
                
                const typeKey = appointmentData.type?.replace(/ \(.*\)$/, '').toUpperCase() || 'OTHER';
                const typeInfo = APPOINTMENT_TYPES[typeKey] || APPOINTMENT_TYPES.OTHER;
                
                const hasValidDate = appointmentData.date && 
                                   !isNaN(new Date(appointmentData.date.toDate()).getTime());
                const isDifferentFromCreated = hasValidDate && 
                                             appointmentData.date.toDate().getTime() !== 
                                             appointmentData.createdAt.toDate().getTime();
                
                appointmentsData.push({
                    id: docSnapshot.id,
                    ...appointmentData,
                    formattedDate: safeFormatDate(appointmentData.date, 'MMM dd, yyyy'),
                    formattedTime: validateTime(appointmentData.time),
                    formattedCreatedAt: safeFormatDate(
                        appointmentData.createdAt, 
                        'MMM dd, yyyy hh:mm a',
                        'Recent'
                    ),
                    userFirstName: userDetails.firstName,
                    userLastName: userDetails.lastName,
                    userProfileImage: userDetails.profileImage,
                    typeInfo: typeInfo,
                    isCourtesy: appointmentData.isCourtesy || false,
                    isScheduled: appointmentData.isCourtesy ? isDifferentFromCreated : hasValidDate
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
            await updateDoc(doc(db, 'appointments', appointmentId), {
                status: "Confirmed",
                updatedAt: serverTimestamp()
            });
            
            Alert.alert("Success", "Appointment confirmed successfully");
            setShowActionButtons(prev => ({ ...prev, [appointmentId]: false }));
            
            setAppointments(prev => prev.filter(app => app.id !== appointmentId));
            setFilteredAppointments(prev => prev.filter(app => app.id !== appointmentId));
        } catch (error) {
            console.error("Error confirming appointment:", error);
            Alert.alert("Error", "Failed to confirm appointment");
            fetchAppointments();
        }
    };

    const rejectAppointment = async (appointmentId) => {
        Alert.alert(
            "Confirm Rejection",
            "Are you sure you want to reject this appointment?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                { 
                    text: "Reject", 
                    onPress: async () => {
                        try {
                            await updateDoc(doc(db, 'appointments', appointmentId), {
                                status: "Rejected",
                                updatedAt: serverTimestamp()
                            });
                            
                            Alert.alert("Success", "Appointment rejected");
                            setShowActionButtons(prev => ({ ...prev, [appointmentId]: false }));
                            
                            setAppointments(prev => prev.filter(app => app.id !== appointmentId));
                            setFilteredAppointments(prev => prev.filter(app => app.id !== appointmentId));
                        } catch (error) {
                            console.error("Error rejecting appointment:", error);
                            Alert.alert("Error", "Failed to reject appointment");
                            fetchAppointments();
                        }
                    },
                    style: "destructive"
                }
            ]
        );
    };

    const handleScheduleCourtesy = (appointmentId) => {
        navigation.navigate('ScheduleCourtesy', { 
            appointmentId
        });
    };

    const handleViewDetails = (appointmentId) => {
        navigation.navigate('AppointmentDetail', { 
            appointmentId
        });
    };

    useEffect(() => {
        fetchAppointments();
        
        const orderDirection = sortOption.id.includes('asc') ? 'asc' : 'desc';
        const q = query(
            collection(db, 'appointments'),
            where('status', '==', 'Pending'),
            orderBy('createdAt', orderDirection)
        );
            
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const updatedAppointments = [];
            
            for (const docSnapshot of snapshot.docs) {
                const appointmentData = docSnapshot.data();
                let userDetails = { firstName: 'Unknown', lastName: 'User' };
                
                if (appointmentData.userId) {
                    userDetails = await fetchUserDetails(appointmentData.userId);
                }
                
                const typeKey = appointmentData.type?.replace(/ \(.*\)$/, '').toUpperCase() || 'OTHER';
                const typeInfo = APPOINTMENT_TYPES[typeKey] || APPOINTMENT_TYPES.OTHER;
                
                const hasValidDate = appointmentData.date && 
                                   !isNaN(new Date(appointmentData.date.toDate()).getTime());
                const isDifferentFromCreated = hasValidDate && 
                                             appointmentData.date.toDate().getTime() !== 
                                             appointmentData.createdAt.toDate().getTime();
                
                updatedAppointments.push({
                    id: docSnapshot.id,
                    ...appointmentData,
                    formattedDate: safeFormatDate(appointmentData.date, 'MMM dd, yyyy'),
                    formattedTime: validateTime(appointmentData.time),
                    formattedCreatedAt: safeFormatDate(
                        appointmentData.createdAt, 
                        'MMM dd, yyyy hh:mm a',
                        'Recent'
                    ),
                    userFirstName: userDetails.firstName,
                    userLastName: userDetails.lastName,
                    userProfileImage: userDetails.profileImage,
                    typeInfo: typeInfo,
                    isCourtesy: appointmentData.isCourtesy || false,
                    isScheduled: appointmentData.isCourtesy ? isDifferentFromCreated : hasValidDate
                });
            }
            
            setAppointments(updatedAppointments);
            applyFilters(updatedAppointments, selectedType);
        }, error => {
            console.error("Firestore snapshot error:", error);
            Alert.alert("Error", "Failed to sync appointments");
        });
        
        return () => unsubscribe();
    }, [sortOption]);

    const handleTypeSelect = (type) => {
        setSelectedType(type === selectedType ? null : type);
        applyFilters(appointments, type === selectedType ? null : type);
        setShowTypeFilter(false);
    };

    const handleSortSelect = (option) => {
        setSortOption(option);
        setShowSortOptions(false);
        fetchAppointments();
    };

    const AppointmentCard = ({ appointment }) => {
        const isActuallyScheduled = appointment.isCourtesy 
            ? appointment.isScheduled && appointment.status === 'Confirmed'
            : appointment.isScheduled;

        return (
            <View style={[
                styles.appointmentCard,
                appointment.isCourtesy && styles.courtesyCard,
                isActuallyScheduled && styles.scheduledCard
            ]}>
                <TouchableOpacity onPress={() => toggleActionButtons(appointment.id)}>
                    <View style={styles.cardHeader}>
                        <View style={[
                            styles.typeIndicator, 
                            { 
                                backgroundColor: appointment.typeInfo.color,
                                width: appointment.isCourtesy ? 30 : 24,
                                height: appointment.isCourtesy ? 30 : 24,
                                borderRadius: appointment.isCourtesy ? 15 : 12
                            }
                        ]}>
                            <FontAwesome5 
                                name={appointment.typeInfo.icon} 
                                size={appointment.isCourtesy ? 16 : 14} 
                                color="#fff" 
                            />
                        </View>
                        <Text style={[
                            styles.appointmentTitle,
                            appointment.isCourtesy && styles.courtesyTitle
                        ]}>
                            {appointment.purpose}
                        </Text>
                        <View style={[
                            styles.statusBadge,
                            { backgroundColor: STATUS_COLORS[appointment.status] || '#FFF9E6' }
                        ]}>
                            <Text style={[
                                styles.statusText,
                                { color: appointment.status === 'Pending' ? 'white' : '#fff' }
                            ]}>
                                {appointment.status}
                            </Text>
                        </View>
                    </View>
                    
                    <View style={styles.appointmentDetails}>
                        {appointment.isCourtesy && (
                            <View style={styles.detailRow}>
                                <FontAwesome5 name="user-tie" size={14} color="#666" />
                                <Text style={styles.detailText}>
                                    Courtesy Request
                                </Text>
                            </View>
                        )}
                        
                        {appointment.date ? (
                            <>
                                <View style={styles.detailRow}>
                                    <FontAwesome5 name="calendar-alt" size={14} color="#666" />
                                    <Text style={styles.detailText}>
                                        {appointment.formattedDate}
                                    </Text>
                                </View>
                                
                                <View style={styles.detailRow}>
                                    <FontAwesome5 name="clock" size={14} color="#666" />
                                    <Text style={styles.detailText}>
                                        {appointment.formattedTime}
                                    </Text>
                                </View>
                            </>
                        ) : (
                            <View style={styles.detailRow}>
                                <FontAwesome5 name="calendar-plus" size={14} color="#666" />
                                <Text style={styles.detailText}>
                                    Date not yet scheduled
                                </Text>
                            </View>
                        )}
                        
                        <View style={styles.detailRow}>
                            <FontAwesome5 name="user" size={14} color="#666" />
                            <Text style={styles.detailText}>
                                {`${appointment.userFirstName} ${appointment.userLastName}`}
                            </Text>
                        </View>
                        
                        <View style={styles.detailRow}>
                            <FontAwesome5 name="calendar-check" size={14} color="#666" />
                            <Text style={styles.detailText}>
                                Submitted: {appointment.formattedCreatedAt}
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
                        <Text style={[
                            styles.typeText,
                            appointment.isCourtesy && styles.courtesyTypeText
                        ]}>
                            {appointment.typeInfo.label}
                        </Text>
                        <MaterialIcons 
                            name={showActionButtons[appointment.id] ? "expand-less" : "expand-more"} 
                            size={20} 
                            color="#999" 
                        />
                    </View>
                </TouchableOpacity>

                {showActionButtons[appointment.id] && (
                    <View style={styles.actionButtonsContainer}>
                        {appointment.isCourtesy ? (
                            <>
                                {!isActuallyScheduled ? (
                                    <TouchableOpacity 
                                        style={[styles.actionButton, styles.scheduleButton]}
                                        onPress={() => handleScheduleCourtesy(appointment.id)}
                                    >
                                        <FontAwesome5 name="calendar-plus" size={14} color="#fff" />
                                        <Text style={styles.actionButtonText}>Schedule</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={styles.scheduledBadge}>
                                        <FontAwesome5 name="calendar-check" size={14} color="#28a745" />
                                        <Text style={styles.scheduledText}>Scheduled</Text>
                                    </View>
                                )}
                                <TouchableOpacity 
                                    style={[styles.actionButton, styles.rejectButton]}
                                    onPress={() => rejectAppointment(appointment.id)}
                                >
                                    <FontAwesome5 name="times" size={14} color="#fff" />
                                    <Text style={styles.actionButtonText}>Reject</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <TouchableOpacity 
                                    style={[styles.actionButton, styles.confirmButton]}
                                    onPress={() => confirmAppointment(appointment.id)}
                                >
                                    <FontAwesome5 name="check" size={14} color="#fff" />
                                    <Text style={styles.actionButtonText}>Confirm</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.actionButton, styles.rejectButton]}
                                    onPress={() => rejectAppointment(appointment.id)}
                                >
                                    <FontAwesome5 name="times" size={14} color="#fff" />
                                    <Text style={styles.actionButtonText}>Reject</Text>
                                </TouchableOpacity>
                            </>
                        )}
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.detailsButton]}
                            onPress={() => handleViewDetails(appointment.id)}
                        >
                            <FontAwesome5 name="info-circle" size={14} color="#fff" />
                            <Text style={styles.actionButtonText}>Details</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

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
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#003366" />
                    <Text style={styles.loadingText}>Loading appointments...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredAppointments}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => <AppointmentCard appointment={item} />}
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
                            tintColor="#003366"
                        />
                    }
                    contentContainerStyle={filteredAppointments.length === 0 ? styles.emptyListContainer : styles.listContainer}
                />
            )}
            
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#003366',
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
    listContainer: {
        paddingBottom: 20,
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
    courtesyCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#6c5ce7',
        backgroundColor: '#f8f5ff'
    },
    scheduledCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#28a745',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    typeIndicator: {
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
    courtesyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#4a3c8a'
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
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
    courtesyTypeText: {
        color: '#6c5ce7',
        fontWeight: '600'
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        flexWrap: 'wrap'
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        justifyContent: 'center',
        marginVertical: 5,
        minWidth: '30%'
    },
    confirmButton: {
        backgroundColor: '#28a745',
    },
    rejectButton: {
        backgroundColor: '#dc3545',
    },
    detailsButton: {
        backgroundColor: '#007bff',
    },
    scheduleButton: {
        backgroundColor: '#6c5ce7',
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 12,
        marginLeft: 5
    },
    scheduledBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8f5e9',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        marginVertical: 5,
        minWidth: '30%'
    },
    scheduledText: {
        color: '#28a745',
        fontWeight: '600',
        fontSize: 12,
        marginLeft: 5
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
    emptyListContainer: {
        flex: 1,
        justifyContent: 'center',
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