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
    TextInput,
    Animated,
    Easing
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

const STATUS_COLUMNS = {
    pending: {
        title: 'Pending',
        statuses: ['Pending'],
        color: '#FFA000',
        description: 'New requests waiting for action'
    },
    confirmed: {
        title: 'Confirmed',
        statuses: ['Confirmed'],
        color: '#28a745',
        description: 'Scheduled appointments'
    },
    cancelled: {
        title: 'Cancelled',
        statuses: ['Cancelled', 'Rejected'],
        color: '#dc3545',
        description: 'Cancelled or rejected appointments'
    },
    history: {
        title: 'History',
        statuses: ['Confirmed', 'Cancelled', 'Rejected'],
        color: '#6c757d',
        description: 'Past appointments'
    }
};

const AppointmentsTab = () => {
    const navigation = useNavigation();
    const [appointments, setAppointments] = useState([]);
    const [blockedDates, setBlockedDates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userCache, setUserCache] = useState({});
    const [selectedType, setSelectedType] = useState(null);
    const [showTypeFilter, setShowTypeFilter] = useState(false);
    const [showActionButtons, setShowActionButtons] = useState({});
    const [activeTab, setActiveTab] = useState('appointments');
    const [showBlockDateModal, setShowBlockDateModal] = useState(false);
    const [newBlockedDate, setNewBlockedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [reason, setReason] = useState('');
    const [showStatusUpdateModal, setShowStatusUpdateModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [nameFilter, setNameFilter] = useState('');
    const [showNameFilter, setShowNameFilter] = useState(false);
    const [scaleAnim] = useState(new Animated.Value(1));
    const [fadeAnim] = useState(new Animated.Value(1));
    const [slideAnim] = useState(new Animated.Value(0));
    const [showHistory, setShowHistory] = useState(false);

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
            
            // Fetch all appointments
            const appointmentsQuery = query(
                collection(db, 'appointments'),
                orderBy('createdAt', 'desc')
            );
            
            const snapshot = await getDocs(appointmentsQuery);
            
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
                
                // Check if appointment is in the past
                const isPastAppointment = hasValidDate && 
                    appointmentData.date.toDate() < new Date();

                // For courtesy appointments that are in the past, allow rescheduling
                if (isPastAppointment && appointmentData.isCourtesy && appointmentData.status === 'Confirmed') {
                    try {
                        await updateDoc(doc(db, 'appointments', docSnapshot.id), {
                            status: 'Pending',
                            updatedAt: serverTimestamp()
                        });
                        appointmentData.status = 'Pending';
                    } catch (error) {
                        console.error("Error updating past courtesy appointment status:", error);
                    }
                }
                
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
                    isScheduled: appointmentData.isCourtesy ? isDifferentFromCreated : hasValidDate,
                    isPast: isPastAppointment
                };
            };
            
            const allAppointments = [];
            for (const docSnapshot of snapshot.docs) {
                allAppointments.push(await processAppointment(docSnapshot));
            }
            
            setAppointments(allAppointments);
        } catch (error) {
            console.error("Error fetching appointments:", error);
            Alert.alert("Error", "Failed to load appointments");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
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

    const handleCancelAppointment = async (appointmentId) => {
        try {
            await updateDoc(doc(db, 'appointments', appointmentId), {
                status: "Cancelled",
                updatedAt: serverTimestamp()
            });
            Alert.alert("Success", "Appointment cancelled");
            setShowActionButtons(prev => ({ ...prev, [appointmentId]: false }));
        } catch (error) {
            console.error("Error cancelling appointment:", error);
            Alert.alert("Error", "Failed to cancel appointment");
        }
    };

    const handleStatusUpdate = async (appointmentId, newStatus) => {
        try {
            await updateDoc(doc(db, 'appointments', appointmentId), {
                status: newStatus,
                updatedAt: serverTimestamp()
            });
            
            Alert.alert("Success", "Appointment status updated successfully");
            setShowStatusUpdateModal(false);
            setSelectedAppointment(null);
        } catch (error) {
            console.error("Error updating appointment status:", error);
            Alert.alert("Error", "Failed to update appointment status");
        }
    };
        
    const animateFilter = (isActive) => {
        Animated.parallel([
            Animated.timing(scaleAnim, {
                toValue: isActive ? 1.02 : 1,
                duration: 300,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: isActive ? 0.95 : 1,
                duration: 300,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: isActive ? 1 : 0,
                duration: 300,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
                useNativeDriver: true,
            })
        ]).start();
        };

    const handleTypeSelect = (type) => {
        const newSelectedType = type === selectedType ? null : type;
        setSelectedType(newSelectedType);
        setShowTypeFilter(false);
        animateFilter(newSelectedType !== null);
    };

    const handleNameFilter = (text) => {
        setNameFilter(text);
        animateFilter(text !== '');
    };

    const renderKanbanColumn = (columnKey) => {
        const column = STATUS_COLUMNS[columnKey];
        const currentDate = new Date();
        
        const filteredAppointments = appointments.filter(app => {
            const statusMatch = column.statuses.includes(app.status);
            const typeMatch = selectedType 
                ? app.typeInfo.label.toLowerCase() === selectedType.toLowerCase()
                : true;
            const nameMatch = nameFilter 
                ? `${app.userFirstName} ${app.userLastName}`.toLowerCase().includes(nameFilter.toLowerCase())
                : true;
            
            // For history column, only show past appointments
            if (columnKey === 'history') {
                const appointmentDate = app.date?.toDate();
                return statusMatch && typeMatch && nameMatch && appointmentDate && appointmentDate < currentDate;
            }
            
            // For other columns, only show current/future appointments
            if (columnKey !== 'history') {
                const appointmentDate = app.date?.toDate();
                return statusMatch && typeMatch && nameMatch && (!appointmentDate || appointmentDate >= currentDate);
            }
            
            return statusMatch && typeMatch && nameMatch;
        });

        const totalAppointments = appointments.filter(app => 
            column.statuses.includes(app.status)
        ).length;

        return (
            <Animated.View 
                key={columnKey}
                style={[
                    styles.kanbanColumn,
                    {
                        transform: [
                            { scale: scaleAnim },
                            { translateX: slideAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 10]
                            })}
                        ],
                        opacity: fadeAnim
                    }
                ]}
            >
                <View style={[styles.columnHeader, { backgroundColor: column.color }]}>
                    <View>
                        <Text style={styles.columnTitle}>{column.title}</Text>
                        <Text style={styles.columnDescription}>
                            {selectedType || nameFilter
                                ? `${filteredAppointments.length} of ${totalAppointments} ${selectedType ? selectedType.toLowerCase() : ''}`
                                : column.description}
                        </Text>
                    </View>
                    <Animated.View 
                        style={[
                            styles.columnCountContainer,
                            {
                                transform: [{ scale: scaleAnim }],
                                opacity: fadeAnim
                            }
                        ]}
                    >
                        <Text style={styles.columnCount}>{filteredAppointments.length}</Text>
                        {(selectedType || nameFilter) && totalAppointments > filteredAppointments.length && (
                            <Text style={styles.columnCountSubtext}>
                                of {totalAppointments}
                            </Text>
                        )}
                    </Animated.View>
                </View>
                <ScrollView 
                    style={styles.columnContent}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    contentContainerStyle={styles.columnContentContainer}
                >
                    {filteredAppointments.length > 0 ? (
                        filteredAppointments.map((appointment, index) => (
                            <Animated.View
                                key={appointment.id}
                                style={{
                                    opacity: fadeAnim,
                                    transform: [
                                        { scale: scaleAnim },
                                        { translateY: slideAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0, index * 5]
                                        })}
                                    ]
                                }}
                            >
                                <AppointmentCard 
                                    appointment={appointment}
                                    showActionButtons={showActionButtons}
                                    onToggleActions={toggleActionButtons}
                                    onConfirm={confirmAppointment}
                                    onReject={rejectAppointment}
                                    onSchedule={handleScheduleCourtesy}
                                    onViewDetails={handleViewDetails}
                                    onStatusUpdate={() => {
                                        setSelectedAppointment(appointment);
                                        setShowStatusUpdateModal(true);
                                    }}
                                    allowHistoryActions={columnKey === 'history'}
                                    onCancel={handleCancelAppointment}
                                />
                            </Animated.View>
                        ))
                    ) : (
                        <Animated.View 
                            style={[
                                styles.emptyColumnContainer,
                                {
                                    opacity: fadeAnim,
                                    transform: [
                                        { scale: scaleAnim },
                                        { translateY: slideAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0, 20]
                                        })}
                                    ]
                                }
                            ]}
                        >
                            <Feather 
                                name="inbox" 
                                size={24} 
                                color="#999" 
                                style={styles.emptyColumnIcon}
                            />
                            <Text style={styles.emptyColumnText}>
                                {selectedType || nameFilter
                                    ? `No ${selectedType ? selectedType.toLowerCase() : ''} appointments ${nameFilter ? `for "${nameFilter}"` : ''} in ${column.title.toLowerCase()}`
                                    : `No appointments in ${column.title.toLowerCase()}`}
                            </Text>
                        </Animated.View>
                    )}
                </ScrollView>
            </Animated.View>
        );
    };

    useEffect(() => {
        fetchAppointments();
        fetchBlockedDates();
    }, []);

    return (
        <View style={styles.container}>
            {/* Tab Selector */}
            <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[
                            styles.tabButton,
                        activeTab === 'appointments' && styles.activeTabButton
                        ]}
                    onPress={() => setActiveTab('appointments')}
                    >
                        <Text style={[
                            styles.tabButtonText,
                        activeTab === 'appointments' && styles.activeTabButtonText
                        ]}>
                        Appointments
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.tabButton,
                        activeTab === 'blocked' && styles.activeTabButton
                        ]}
                    onPress={() => setActiveTab('blocked')}
                    >
                        <Text style={[
                            styles.tabButtonText,
                        activeTab === 'blocked' && styles.activeTabButtonText
                        ]}>
                        Blocked Dates
                        </Text>
                    </TouchableOpacity>
            </View>

            {activeTab === 'appointments' && (
                <View style={styles.filterBar}>
                    <View style={styles.filterButtonsContainer}>
                        <View style={styles.leftFilters}>
                            <TouchableOpacity 
                                style={[
                                    styles.filterButton,
                                    selectedType && styles.activeFilterButton
                                ]}
                                onPress={() => setShowTypeFilter(true)}
                            >
                                <Feather 
                                    name="filter" 
                                    size={18} 
                                    color={selectedType ? "#fff" : "#003366"} 
                                />
                                <Text style={[
                                    styles.filterButtonText,
                                    selectedType && styles.activeFilterButtonText
                                ]}>
                                    {selectedType || "All Types"}
                                </Text>
                                {selectedType && (
                                    <TouchableOpacity 
                                        style={styles.clearFilterButton}
                                        onPress={() => setSelectedType(null)}
                                    >
                                        <Feather name="x" size={16} color="#fff" />
                                    </TouchableOpacity>
                                )}
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.rightFilters}>
                            <View style={[
                                styles.searchContainer,
                                nameFilter && styles.activeSearchContainer
                            ]}>
                                <Feather 
                                    name="search" 
                                    size={18} 
                                    color={nameFilter ? "#fff" : "#003366"} 
                                    style={styles.searchIcon}
                                />
                                <TextInput
                                    style={[
                                        styles.searchInput,
                                        nameFilter && styles.activeSearchInput
                                    ]}
                                    placeholder="Search by name..."
                                    placeholderTextColor={nameFilter ? "#fff" : "#666"}
                                    value={nameFilter}
                                    onChangeText={handleNameFilter}
                                    onFocus={() => setShowNameFilter(true)}
                                />
                                {nameFilter && (
                                    <TouchableOpacity 
                                        style={styles.clearSearchButton}
                                        onPress={() => {
                                            setNameFilter('');
                                            animateFilter(false);
                                        }}
                                    >
                                        <Feather name="x" size={16} color="#fff" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>
                </View>
            )}

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#003366" />
                    <Text style={styles.loadingText}>Loading appointments...</Text>
                </View>
            ) : (
                <>
                    {activeTab === 'appointments' ? (
                        <ScrollView 
                            horizontal 
                            style={styles.kanbanContainer}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={fetchAppointments}
                                    colors={["#003366", "#0275d8"]}
                                    tintColor="#003366"
                                />
                            }
                        >
                            {Object.keys(STATUS_COLUMNS).map(columnKey => (
                                <View key={columnKey}>
                                    {renderKanbanColumn(columnKey)}
                                </View>
                            ))}
                        </ScrollView>
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
                    <Animated.View 
                        style={[
                            styles.filterModalContent,
                            {
                                transform: [
                                    { scale: scaleAnim },
                                    { translateY: slideAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [50, 0]
                                    })}
                                ],
                                opacity: fadeAnim
                            }
                        ]}
                    >
                        <Text style={styles.filterModalTitle}>Filter by Appointment Type</Text>
                        <Text style={styles.filterModalSubtitle}>
                            Select a type to filter appointments
                        </Text>
                        
                        <View style={styles.filterOptionsContainer}>
                            <TouchableOpacity 
                                style={[styles.filterOption, !selectedType && styles.selectedFilterOption]}
                                onPress={() => handleTypeSelect(null)}
                            >
                                <View style={[styles.typeIcon, { backgroundColor: '#6c757d' }]}>
                                    <Feather name="list" size={16} color="#fff" />
                                </View>
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
                                        <FontAwesome5 name={type.icon} size={16} color="#fff" />
                                    </View>
                                    <Text style={[
                                        styles.filterOptionText,
                                        selectedType === type.label && styles.selectedFilterOptionText
                                    ]}>
                                        {type.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        
                        <TouchableOpacity 
                            style={styles.modalCloseButton}
                            onPress={() => setShowTypeFilter(false)}
                        >
                            <Text style={styles.modalCloseButtonText}>Close</Text>
                        </TouchableOpacity>
                    </Animated.View>
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

            {/* Status Update Modal */}
            <Modal
                visible={showStatusUpdateModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowStatusUpdateModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Update Appointment Status</Text>
                        
                        {Object.keys(STATUS_COLUMNS).map(columnKey => (
                            <TouchableOpacity 
                                key={`status-${columnKey}`}
                                style={[
                                    styles.statusOption,
                                    { backgroundColor: STATUS_COLUMNS[columnKey].color }
                                ]}
                                onPress={() => handleStatusUpdate(selectedAppointment?.id, STATUS_COLUMNS[columnKey].title)}
                            >
                                <Text style={styles.statusOptionText}>
                                    {STATUS_COLUMNS[columnKey].title}
                                </Text>
                            </TouchableOpacity>
                        ))}
                        
                        <TouchableOpacity 
                            style={styles.modalCloseButton}
                            onPress={() => {
                                setShowStatusUpdateModal(false);
                                setSelectedAppointment(null);
                            }}
                        >
                            <Text style={styles.modalCloseButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Name Filter Modal */}
            <Modal
                visible={showNameFilter}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowNameFilter(false)}
            >
                <View style={styles.modalOverlay}>
                    <Animated.View 
                        style={[
                            styles.modalContent,
                            {
                                transform: [
                                    { scale: scaleAnim },
                                    { translateY: slideAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [50, 0]
                                    })}
                                ],
                                opacity: fadeAnim
                            }
                        ]}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Search by Name</Text>
                            <TouchableOpacity 
                                style={styles.modalCloseIcon}
                                onPress={() => setShowNameFilter(false)}
                            >
                                <Feather name="x" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.searchModalContainer}>
                            <View style={styles.searchInputContainer}>
                                <Feather name="search" size={20} color="#003366" />
                                <TextInput
                                    style={styles.modalSearchInput}
                                    placeholder="Enter first or last name"
                                    value={nameFilter}
                                    onChangeText={handleNameFilter}
                                    autoCapitalize="words"
                                    autoCorrect={false}
                                    autoFocus={true}
                                />
                            </View>
                            
                            <View style={styles.searchResultsContainer}>
                                {appointments
                                    .filter(app => 
                                        `${app.userFirstName} ${app.userLastName}`
                                            .toLowerCase()
                                            .includes(nameFilter.toLowerCase())
                                    )
                                    .slice(0, 5)
                                    .map(app => (
                                        <TouchableOpacity
                                            key={app.id}
                                            style={styles.searchResultItem}
                                            onPress={() => {
                                                setNameFilter(`${app.userFirstName} ${app.userLastName}`);
                                                setShowNameFilter(false);
                                            }}
                                        >
                                            <Text style={styles.searchResultName}>
                                                {app.userFirstName} {app.userLastName}
                                            </Text>
                                            <Text style={styles.searchResultType}>
                                                {app.typeInfo.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                            </View>
                        </View>
                        
                        <View style={styles.modalButtonRow}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setShowNameFilter(false);
                                    setNameFilter('');
                                    animateFilter(false);
                                }}
                            >
                                <Text style={styles.modalButtonText}>Clear</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={() => setShowNameFilter(false)}
                            >
                                <Text style={styles.modalButtonText}>Apply</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
};

export default AppointmentsTab;