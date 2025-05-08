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
    Platform,
    ScrollView,
    TextInput
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
         addDoc,
         deleteDoc,
         serverTimestamp } from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { format, isSameDay, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';

// Import components
import AppointmentCard from './appointments/components/AppointmentCard';
import BlockedDateItem from './appointments/components/BlockedDateItem';
import Calendar from './appointments/components/Calendar';

// Import constants
import { 
    APPOINTMENT_TYPES, 
    STATUS_COLORS, 
    SORT_OPTIONS, 
    TAB_OPTIONS 
} from './appointments/constants';

// Import utilities
import { 
    safeFormatDate, 
    validateTime, 
    isDateInPast, 
    isDateBlocked, 
    isDateSelectable 
} from './appointments/utils/dateUtils';

// Import styles
import { styles } from './appointments/styles/AppointmentsTab.styles';

const AppointmentsTab = () => {
    const navigation = useNavigation();
    const [appointments, setAppointments] = useState([]);
    const [historyAppointments, setHistoryAppointments] = useState([]);
    const [filteredAppointments, setFilteredAppointments] = useState([]);
    const [blockedDates, setBlockedDates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userCache, setUserCache] = useState({});
    const [selectedType, setSelectedType] = useState(null);
    const [sortOption, setSortOption] = useState(SORT_OPTIONS[0]);
    const [showTypeFilter, setShowTypeFilter] = useState(false);
    const [showSortOptions, setShowSortOptions] = useState(false);
    const [showActionButtons, setShowActionButtons] = useState({});
    const [activeTab, setActiveTab] = useState('pending');
    const [showBlockDateModal, setShowBlockDateModal] = useState(false);
    const [newBlockedDate, setNewBlockedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [reason, setReason] = useState('');

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

    const fetchBlockedDates = async () => {
        try {
            const blockedDatesQuery = query(
                collection(db, 'blockedDates'),
                orderBy('date', 'asc')
            );
            
            const snapshot = await getDocs(blockedDatesQuery);
            const dates = snapshot.docs.map(doc => ({
                id: doc.id,
                date: doc.data().date.toDate(),
                reason: doc.data().reason || 'No reason provided'
            }));
            setBlockedDates(dates);
        } catch (error) {
            console.error("Error fetching blocked dates:", error);
            Alert.alert("Error", "Failed to load blocked dates");
        }
    };

    const fetchAppointments = async () => {
        try {
            setRefreshing(true);
            const orderDirection = sortOption.id.includes('asc') ? 'asc' : 'desc';
            
            // Fetch pending appointments
            const pendingQuery = query(
                collection(db, 'appointments'),
                where('status', '==', 'Pending'),
                orderBy('createdAt', orderDirection)
            );
            
            // Fetch historical appointments (all except pending)
            const historyQuery = query(
                collection(db, 'appointments'),
                where('status', 'in', ['Confirmed', 'Cancelled', 'Completed', 'Rejected']),
                orderBy('updatedAt', 'desc')
            );
            
            const [pendingSnapshot, historySnapshot] = await Promise.all([
                getDocs(pendingQuery),
                getDocs(historyQuery)
            ]);
            
            const processAppointment = async (docSnapshot) => {
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
                
                return {
                    id: docSnapshot.id,
                    ...appointmentData,
                    formattedDate: safeFormatDate(appointmentData.date, 'MMM dd, yyyy'),
                    formattedTime: validateTime(appointmentData.time),
                    formattedCreatedAt: safeFormatDate(
                        appointmentData.createdAt, 
                        'MMM dd, yyyy hh:mm a',
                        'Recent'
                    ),
                    formattedUpdatedAt: safeFormatDate(
                        appointmentData.updatedAt || appointmentData.createdAt,
                        'MMM dd, yyyy hh:mm a',
                        'Recent'
                    ),
                    userFirstName: userDetails.firstName,
                    userLastName: userDetails.lastName,
                    userProfileImage: userDetails.profileImage,
                    typeInfo: typeInfo,
                    isCourtesy: appointmentData.isCourtesy || false,
                    isScheduled: appointmentData.isCourtesy ? isDifferentFromCreated : hasValidDate
                };
            };
            
            const pendingAppointments = [];
            for (const docSnapshot of pendingSnapshot.docs) {
                pendingAppointments.push(await processAppointment(docSnapshot));
            }
            
            const historyAppointments = [];
            for (const docSnapshot of historySnapshot.docs) {
                historyAppointments.push(await processAppointment(docSnapshot));
            }
            
            setAppointments(pendingAppointments);
            setHistoryAppointments(historyAppointments);
            applyFiltersToCurrentTab(pendingAppointments, historyAppointments);
        } catch (error) {
            console.error("Error fetching appointments:", error);
            Alert.alert("Error", "Failed to load appointments");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const applyFiltersToCurrentTab = (pendingData, historyData) => {
        if (activeTab === 'pending') {
            setFilteredAppointments(applyTypeFilter(pendingData, selectedType));
        } else {
            setFilteredAppointments(applyTypeFilter(historyData, selectedType));
        }
    };

    const applyTypeFilter = (data, typeFilter) => {
        let filtered = [...data];
        
        if (typeFilter) {
            filtered = filtered.filter(app => 
                app.typeInfo.label.toLowerCase() === typeFilter.toLowerCase()
            );
        }
        
        return filtered;
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
        } catch (error) {
            console.error("Error confirming appointment:", error);
            Alert.alert("Error", "Failed to confirm appointment");
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
                        } catch (error) {
                            console.error("Error rejecting appointment:", error);
                            Alert.alert("Error", "Failed to reject appointment");
                        }
                    },
                    style: "destructive"
                }
            ]
        );
    };

    const handleScheduleCourtesy = (appointmentId) => {
        const serializedBlockedDates = blockedDates.map(date => ({
            ...date,
            date: date.date.toISOString()
        }));

        navigation.navigate('ScheduleCourtesy', { 
            appointmentId,
            blockedDates: serializedBlockedDates
        });
    };

    const handleViewDetails = (appointmentId) => {
        navigation.navigate('AppointmentDetail', { 
            appointmentId
        });
    };

    const handleBlockDate = async () => {
        try {
            await addDoc(collection(db, 'blockedDates'), {
                date: newBlockedDate,
                reason: reason || 'Admin blocked',
                createdAt: serverTimestamp()
            });
            setShowBlockDateModal(false);
            setReason('');
            fetchBlockedDates();
            Alert.alert("Success", "Date blocked successfully");
        } catch (error) {
            console.error("Error blocking date:", error);
            Alert.alert("Error", "Failed to block date");
        }
    };

    const handleUnblockDate = async (dateId) => {
        Alert.alert(
            "Confirm Unblock",
            "Are you sure you want to unblock this date?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Unblock", 
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'blockedDates', dateId));
                            fetchBlockedDates();
                            Alert.alert("Success", "Date unblocked");
                        } catch (error) {
                            console.error("Error unblocking date:", error);
                            Alert.alert("Error", "Failed to unblock date");
                        }
                    },
                    style: "destructive"
                }
            ]
        );
    };

    const navigateMonth = (direction) => {
        setCurrentMonth(direction === 'next' 
            ? addMonths(currentMonth, 1) 
            : subMonths(currentMonth, 1)
        );
    };

    useEffect(() => {
        fetchAppointments();
        fetchBlockedDates();
        
        const orderDirection = sortOption.id.includes('asc') ? 'asc' : 'desc';
        const pendingQuery = query(
            collection(db, 'appointments'),
            where('status', '==', 'Pending'),
            orderBy('createdAt', orderDirection)
        );
            
        const historyQuery = query(
            collection(db, 'appointments'),
            where('status', 'in', ['Confirmed', 'Cancelled', 'Completed', 'Rejected']),
            orderBy('updatedAt', 'desc')
        );
            
        const unsubscribePending = onSnapshot(pendingQuery, async (snapshot) => {
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
            if (activeTab === 'pending') {
                setFilteredAppointments(applyTypeFilter(updatedAppointments, selectedType));
            }
        }, error => {
            console.error("Firestore snapshot error (pending):", error);
            Alert.alert("Error", "Failed to sync pending appointments");
        });
        
        const unsubscribeHistory = onSnapshot(historyQuery, async (snapshot) => {
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
                    formattedUpdatedAt: safeFormatDate(
                        appointmentData.updatedAt || appointmentData.createdAt,
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
            
            setHistoryAppointments(updatedAppointments);
            if (activeTab === 'history') {
                setFilteredAppointments(applyTypeFilter(updatedAppointments, selectedType));
            }
        }, error => {
            console.error("Firestore snapshot error (history):", error);
            Alert.alert("Error", "Failed to sync history appointments");
        });
        
        const unsubscribeBlockedDates = onSnapshot(
            query(collection(db, 'blockedDates'), orderBy('date', 'asc')),
            (snapshot) => {
                const dates = snapshot.docs.map(doc => ({
                    id: doc.id,
                    date: doc.data().date.toDate(),
                    reason: doc.data().reason || 'No reason provided'
                }));
                setBlockedDates(dates);
            },
            (error) => {
                console.error("Blocked dates snapshot error:", error);
            }
        );
        
        return () => {
            unsubscribePending();
            unsubscribeHistory();
            unsubscribeBlockedDates();
        };
    }, [sortOption]);

    const handleTypeSelect = (type) => {
        const newSelectedType = type === selectedType ? null : type;
        setSelectedType(newSelectedType);
        
        if (activeTab === 'pending') {
            setFilteredAppointments(applyTypeFilter(appointments, newSelectedType));
        } else {
            setFilteredAppointments(applyTypeFilter(historyAppointments, newSelectedType));
        }
        setShowTypeFilter(false);
    };

    const handleSortSelect = (option) => {
        setSortOption(option);
        setShowSortOptions(false);
    };

    const handleTabSelect = (tabId) => {
        setActiveTab(tabId);
        if (tabId === 'pending') {
            setFilteredAppointments(applyTypeFilter(appointments, selectedType));
        } else {
            setFilteredAppointments(applyTypeFilter(historyAppointments, selectedType));
        }
    };

    return (
        <View style={styles.container}>
            {/* Tab Selector */}
            <View style={styles.tabContainer}>
                {TAB_OPTIONS.map((tab) => (
                    <TouchableOpacity
                        key={tab.id}
                        style={[
                            styles.tabButton,
                            activeTab === tab.id && styles.activeTabButton
                        ]}
                        onPress={() => handleTabSelect(tab.id)}
                    >
                        <Text style={[
                            styles.tabButtonText,
                            activeTab === tab.id && styles.activeTabButtonText
                        ]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {activeTab !== 'blocked' && (
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
            )}

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#003366" />
                    <Text style={styles.loadingText}>Loading appointments...</Text>
                </View>
            ) : (
                <>
                    {activeTab === 'pending' ? (
                        <FlatList
                            data={filteredAppointments}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <AppointmentCard 
                                    appointment={item}
                                    showActionButtons={showActionButtons}
                                    onToggleActions={toggleActionButtons}
                                    onConfirm={confirmAppointment}
                                    onReject={rejectAppointment}
                                    onSchedule={handleScheduleCourtesy}
                                    onViewDetails={handleViewDetails}
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
                                    tintColor="#003366"
                                />
                            }
                            contentContainerStyle={filteredAppointments.length === 0 ? styles.emptyListContainer : styles.listContainer}
                        />
                    ) : activeTab === 'history' ? (
                        <FlatList
                            data={filteredAppointments}
                            keyExtractor={item => item.id}
                            renderItem={({ item }) => (
                                <AppointmentCard 
                                    appointment={item}
                                    isHistory={true}
                                    showActionButtons={showActionButtons}
                                    onToggleActions={toggleActionButtons}
                                    onConfirm={confirmAppointment}
                                    onReject={rejectAppointment}
                                    onSchedule={handleScheduleCourtesy}
                                    onViewDetails={handleViewDetails}
                                />
                            )}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>
                                        {selectedType 
                                            ? `No historical ${selectedType.toLowerCase()} appointments`
                                            : "No historical appointments found"}
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
                    ) : (
                        <View style={styles.blockedDatesContainer}>
                            <TouchableOpacity 
                                style={styles.addBlockedDateButton}
                                onPress={() => {
                                    setNewBlockedDate(new Date());
                                    setShowBlockDateModal(true);
                                }}
                            >
                                <FontAwesome5 name="plus" size={16} color="#fff" />
                                <Text style={styles.addBlockedDateButtonText}>Block New Date</Text>
                            </TouchableOpacity>
                            
                            {blockedDates.length > 0 ? (
                                <FlatList
                                    data={blockedDates}
                                    keyExtractor={item => item.id}
                                    renderItem={({ item }) => (
                                        <BlockedDateItem 
                                            date={item.date}
                                            reason={item.reason}
                                            onRemove={() => handleUnblockDate(item.id)}
                                        />
                                    )}
                                    contentContainerStyle={styles.blockedDatesList}
                                />
                            ) : (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>No dates currently blocked</Text>
                                </View>
                            )}
                        </View>
                    )}
                </>
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

            {/* Block Date Modal */}
            <Modal
                visible={showBlockDateModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowBlockDateModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Block Appointment Date</Text>
                        
                        <Calendar
                            currentMonth={currentMonth}
                            onNavigateMonth={navigateMonth}
                            selectedDate={newBlockedDate}
                            onSelectDate={setNewBlockedDate}
                            blockedDates={blockedDates}
                        />
                        
                        <TextInput
                            style={styles.reasonInput}
                            placeholder="Reason for blocking (optional)"
                            value={reason}
                            onChangeText={setReason}
                        />
                        
                        <View style={styles.modalButtonRow}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setShowBlockDateModal(false);
                                    setReason('');
                                }}
                            >
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={handleBlockDate}
                                disabled={isDateBlocked(newBlockedDate, blockedDates)}
                            >
                                <Text style={styles.modalButtonText}>Block Date</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default AppointmentsTab;