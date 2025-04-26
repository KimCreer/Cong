import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
  Platform,
  RefreshControl
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { FontAwesome5, MaterialIcons, Feather } from '@expo/vector-icons';
import { getFirestore, doc, getDoc, updateDoc, onSnapshot, serverTimestamp } from '@react-native-firebase/firestore';
import { format } from 'date-fns';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

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

const AppointmentDetail = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { appointmentId } = route.params;
    
    const [appointment, setAppointment] = useState(null);
    const [userDetails, setUserDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    const db = getFirestore();

    const fetchAppointment = async () => {
        try {
            setRefreshing(true);
            const docRef = doc(db, 'appointments', appointmentId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists) {
                const data = docSnap.data();
                let userData = { firstName: 'Unknown', lastName: 'User', profileImage: null };
                
                if (data.userId) {
                    const userDoc = await getDoc(doc(db, 'users', data.userId));
                    if (userDoc.exists) {
                        userData = {
                            firstName: userDoc.data()?.firstName || 'Unknown',
                            lastName: userDoc.data()?.lastName || 'User',
                            profileImage: userDoc.data()?.profileImage || null,
                            email: userDoc.data()?.email || null,
                            phone: userDoc.data()?.phone || null,
                            address: userDoc.data()?.address || null
                        };
                    }
                }

                const typeKey = data.type?.replace(/ \(.*\)$/, '').toUpperCase() || 'OTHER';
                const typeInfo = APPOINTMENT_TYPES[typeKey] || APPOINTMENT_TYPES.OTHER;
                
                const hasValidDate = data.date && !isNaN(new Date(data.date.toDate()).getTime());
                const isDifferentFromCreated = hasValidDate && 
                    data.date.toDate().getTime() !== data.createdAt.toDate().getTime();

                setAppointment({
                    id: docSnap.id,
                    ...data,
                    formattedDate: safeFormatDate(data.date, 'MMM dd, yyyy'),
                    formattedTime: validateTime(data.time),
                    formattedCreatedAt: safeFormatDate(data.createdAt, 'MMM dd, yyyy hh:mm a'),
                    typeInfo: typeInfo,
                    isScheduled: data.isCourtesy ? isDifferentFromCreated : hasValidDate
                });
                
                setUserDetails(userData);
            } else {
                Alert.alert('Error', 'Appointment not found');
                navigation.goBack();
            }
        } catch (error) {
            console.error('Error fetching appointment:', error);
            Alert.alert('Error', 'Failed to load appointment details');
            navigation.goBack();
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAppointment();
        
        const docRef = doc(db, 'appointments', appointmentId);
        const unsubscribe = onSnapshot(docRef, async (docSnap) => {
            if (docSnap.exists) {
                const data = docSnap.data();
                let userData = { firstName: 'Unknown', lastName: 'User', profileImage: null };
                
                if (data.userId) {
                    const userDoc = await getDoc(doc(db, 'users', data.userId));
                    if (userDoc.exists) {
                        userData = {
                            firstName: userDoc.data()?.firstName || 'Unknown',
                            lastName: userDoc.data()?.lastName || 'User',
                            profileImage: userDoc.data()?.profileImage || null,
                            email: userDoc.data()?.email || null,
                            phone: userDoc.data()?.phone || null,
                            address: userDoc.data()?.address || null
                        };
                    }
                }

                const typeKey = data.type?.replace(/ \(.*\)$/, '').toUpperCase() || 'OTHER';
                const typeInfo = APPOINTMENT_TYPES[typeKey] || APPOINTMENT_TYPES.OTHER;
                
                const hasValidDate = data.date && !isNaN(new Date(data.date.toDate()).getTime());
                const isDifferentFromCreated = hasValidDate && 
                    data.date.toDate().getTime() !== data.createdAt.toDate().getTime();

                setAppointment(prev => ({
                    ...prev,
                    id: docSnap.id,
                    ...data,
                    formattedDate: safeFormatDate(data.date, 'MMM dd, yyyy'),
                    formattedTime: validateTime(data.time),
                    formattedCreatedAt: safeFormatDate(data.createdAt, 'MMM dd, yyyy hh:mm a'),
                    typeInfo: typeInfo,
                    isScheduled: data.isCourtesy ? isDifferentFromCreated : hasValidDate
                }));
                
                setUserDetails(userData);
            }
        }, error => {
            console.error('Snapshot error:', error);
            Alert.alert('Error', 'Failed to sync appointment');
        });

        return () => unsubscribe();
    }, [appointmentId]);

    const handleOpenImage = (url) => {
        if (url) {
            setSelectedImage(url);
            setImageModalVisible(true);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        if (appointment.isCourtesy && newStatus === 'Confirmed') {
            return;
        }

        Alert.alert(
            `Mark as ${newStatus}`,
            `Are you sure you want to mark this appointment as ${newStatus.toLowerCase()}?`,
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                { 
                    text: "Confirm", 
                    onPress: async () => {
                        try {
                            setUpdating(true);
                            await updateDoc(doc(db, 'appointments', appointmentId), {
                                status: newStatus,
                                updatedAt: serverTimestamp()
                            });
                            
                            Alert.alert("Success", `Appointment marked as ${newStatus.toLowerCase()}`);
                            if (newStatus === 'Rejected') {
                                navigation.goBack();
                            }
                        } catch (error) {
                            console.error("Error updating status:", error);
                            Alert.alert("Error", "Failed to update appointment status");
                        } finally {
                            setUpdating(false);
                        }
                    },
                    style: "destructive"
                }
            ]
        );
    };

    const handleScheduleCourtesy = () => {
        navigation.navigate('ScheduleCourtesy', { appointmentId });
    };

    const renderInfoRow = (label, value, iconName, isStatus = false) => (
        <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
                <FontAwesome5 name={iconName} size={16} color="#4A6FA5" />
            </View>
            <Text style={styles.label}>{label}</Text>
            <Text style={[
                styles.value, 
                isStatus && { 
                    color: STATUS_COLORS[value] || '#666',
                    fontWeight: '600'
                }
            ]}>
                {value || 'Not specified'}
            </Text>
        </View>
    );

    const renderImageSection = (title, imageUrl) => {
        if (!imageUrl) return null;
        
        return (
            <View style={styles.imageSection}>
                <Text style={styles.sectionTitle}>
                    <FontAwesome5 name="image" size={16} color="#4A6FA5" style={styles.sectionIcon} />
                    {title}
                </Text>
                <TouchableOpacity 
                    onPress={() => handleOpenImage(imageUrl)}
                    activeOpacity={0.8}
                    style={styles.imageContainer}
                >
                    <Image 
                        source={{ uri: imageUrl }} 
                        style={styles.image}
                        resizeMode="cover"
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.7)']}
                        style={styles.imageOverlay}
                    >
                        <FontAwesome5 name="expand" size={16} color="#fff" />
                        <Text style={styles.imageOverlayText}>Tap to view</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        );
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A6FA5" />
                <Text style={styles.loadingText}>Loading appointment details...</Text>
            </View>
        );
    }

    if (!appointment) return null;

    const isActuallyScheduled = appointment.isCourtesy 
        ? appointment.isScheduled && appointment.status === 'Confirmed'
        : appointment.isScheduled;

    return (
        <View style={styles.container}>
            {/* Header with gradient background */}
            <LinearGradient
                colors={appointment.isCourtesy ? ['#6c5ce7', '#4b3c8a'] : ['#4A6FA5', '#3B5998']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            >
                <TouchableOpacity 
                    onPress={() => navigation.goBack()} 
                    style={styles.backButton}
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                    <FontAwesome5 name="arrow-left" size={20} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {appointment.isCourtesy ? 'Courtesy Request' : 'Appointment Details'}
                </Text>
                <View style={{ width: 24 }} />
            </LinearGradient>

            <ScrollView 
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={fetchAppointment}
                        colors={["#4A6FA5", "#3B5998"]}
                        tintColor="#4A6FA5"
                    />
                }
            >
                <View style={[
                    styles.card,
                    appointment.isCourtesy && styles.courtesyCard,
                    isActuallyScheduled && styles.scheduledCard
                ]}>
                    <View style={styles.cardHeader}>
                        <View style={[
                            styles.typeIndicator, 
                            { 
                                backgroundColor: appointment.typeInfo.color,
                                width: 32,
                                height: 32,
                                borderRadius: 16
                            }
                        ]}>
                            <FontAwesome5 
                                name={appointment.typeInfo.icon} 
                                size={16} 
                                color="#fff" 
                            />
                        </View>
                        <View style={styles.titleContainer}>
                            <Text style={styles.appointmentTitle}>
                                {appointment.purpose}
                            </Text>
                            <View style={[
                                styles.statusBadge,
                                { backgroundColor: STATUS_COLORS[appointment.status] || '#FFF9E6' }
                            ]}>
                                <Text style={[
                                    styles.statusText,
                                    { color: appointment.status === 'Pending' ? '#FFA000' : '#fff' }
                                ]}>
                                    {appointment.status}
                                </Text>
                            </View>
                        </View>
                    </View>
                    
                    <View style={styles.appointmentDetails}>
                        {appointment.isCourtesy && (
                            <View style={styles.detailRow}>
                                <View style={styles.iconContainer}>
                                    <FontAwesome5 name="user-tie" size={16} color="#4A6FA5" />
                                </View>
                                <Text style={styles.detailText}>
                                    Courtesy Request
                                </Text>
                            </View>
                        )}
                        
                        {renderInfoRow('Type', appointment.typeInfo.label, 'tag')}
                        {renderInfoRow('Purpose', appointment.purpose, 'bullseye')}
                        
                        {appointment.date ? (
                            <>
                                {renderInfoRow('Date', appointment.formattedDate, 'calendar-alt')}
                                {renderInfoRow('Time', appointment.formattedTime, 'clock')}
                            </>
                        ) : (
                            <View style={styles.detailRow}>
                                <View style={styles.iconContainer}>
                                    <FontAwesome5 name="calendar-plus" size={16} color="#4A6FA5" />
                                </View>
                                <Text style={styles.detailText}>
                                    Date not yet scheduled
                                </Text>
                            </View>
                        )}
                        
                        {renderInfoRow('Submitted', appointment.formattedCreatedAt, 'calendar-check')}
                        
                        {appointment.notes && (
                            <View style={styles.notesContainer}>
                                <View style={styles.detailRow}>
                                    <View style={styles.iconContainer}>
                                        <FontAwesome5 name="sticky-note" size={16} color="#4A6FA5" />
                                    </View>
                                    <Text style={styles.label}>Notes</Text>
                                </View>
                                <Text style={styles.notesText}>
                                    {appointment.notes}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>
                        <FontAwesome5 name="user" size={16} color="#4A6FA5" style={styles.sectionIcon} />
                        {appointment.isCourtesy ? 'VIP Guest' : 'Client Information'}
                    </Text>
                    
                    {renderInfoRow('Name', `${userDetails?.firstName} ${userDetails?.lastName}`, 'user')}
                    {userDetails?.email && renderInfoRow('Email', userDetails.email, 'envelope')}
                    {userDetails?.phone && renderInfoRow('Phone', userDetails.phone, 'phone')}
                    {userDetails?.address && renderInfoRow('Address', userDetails.address, 'map-marker-alt')}
                </View>

                {/* Profile Image */}
                {renderImageSection('Profile Photo', userDetails?.profileImage)}
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionBar}>
                {appointment.isCourtesy ? (
                    <>
                        {!isActuallyScheduled ? (
                            <TouchableOpacity 
                                style={[styles.actionButton, styles.scheduleButton]}
                                onPress={handleScheduleCourtesy}
                                disabled={updating}
                            >
                                {updating ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <>
                                        <FontAwesome5 name="calendar-plus" size={16} color="#fff" />
                                        <Text style={styles.actionButtonText}>Schedule</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.scheduledBadge}>
                                <FontAwesome5 name="calendar-check" size={16} color="#28a745" />
                                <Text style={styles.scheduledText}>Scheduled</Text>
                            </View>
                        )}
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.rejectButton]}
                            onPress={() => handleStatusUpdate('Rejected')}
                            disabled={updating}
                        >
                            {updating ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <>
                                    <FontAwesome5 name="times" size={16} color="#fff" />
                                    <Text style={styles.actionButtonText}>Reject</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        {appointment.status === 'Pending' && (
                            <>
                                <TouchableOpacity 
                                    style={[styles.actionButton, styles.rejectButton]}
                                    onPress={() => handleStatusUpdate('Rejected')}
                                    disabled={updating}
                                >
                                    {updating ? (
                                        <ActivityIndicator size="small" color="#FFF" />
                                    ) : (
                                        <>
                                            <FontAwesome5 name="times" size={16} color="#fff" />
                                            <Text style={styles.actionButtonText}>Reject</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.actionButton, styles.confirmButton]}
                                    onPress={() => handleStatusUpdate('Confirmed')}
                                    disabled={updating}
                                >
                                    {updating ? (
                                        <ActivityIndicator size="small" color="#FFF" />
                                    ) : (
                                        <>
                                            <FontAwesome5 name="check" size={16} color="#fff" />
                                            <Text style={styles.actionButtonText}>Confirm</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </>
                        )}
                    </>
                )}
            </View>

            {/* Image Modal */}
            <Modal
                visible={imageModalVisible}
                transparent={true}
                onRequestClose={() => setImageModalVisible(false)}
            >
                <View style={styles.imageModalOverlay}>
                    <Image 
                        source={{ uri: selectedImage }} 
                        style={styles.fullImage}
                        resizeMode="contain"
                    />
                    <TouchableOpacity 
                        style={styles.closeButton}
                        onPress={() => setImageModalVisible(false)}
                    >
                        <FontAwesome5 name="times" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
    },
    loadingText: {
        marginTop: 16,
        color: '#4A6FA5',
        fontSize: 16,
        fontWeight: '500',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingBottom: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
        textAlign: 'center',
        flex: 1,
    },
    contentContainer: {
        paddingBottom: 100,
        paddingTop: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
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
        marginBottom: 16,
    },
    typeIndicator: {
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    titleContainer: {
        flex: 1,
    },
    appointmentTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2C3E50',
        marginBottom: 4,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    appointmentDetails: {
        marginBottom: 8,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        width: 24,
        alignItems: 'center',
        marginRight: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#718096',
        width: 100,
    },
    value: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        color: '#2D3748',
        textAlign: 'right',
    },
    detailText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#2D3748',
        flex: 1,
    },
    notesContainer: {
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        padding: 12,
        marginTop: 8,
    },
    notesText: {
        fontSize: 14,
        color: '#4A5568',
        marginTop: 8,
        lineHeight: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2C3E50',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EDF2F7',
        paddingBottom: 8,
    },
    sectionIcon: {
        marginRight: 8,
    },
    imageSection: {
        marginHorizontal: 16,
        marginBottom: 16,
    },
    imageContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 8,
    },
    image: {
        width: '100%',
        height: 200,
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageOverlayText: {
        color: '#fff',
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '500',
    },
    actionBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#FFF',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginHorizontal: 6,
    },
    confirmButton: {
        backgroundColor: '#28A745',
    },
    rejectButton: {
        backgroundColor: '#DC3545',
    },
    scheduleButton: {
        backgroundColor: '#6c5ce7',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    scheduledBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8f5e9',
        padding: 12,
        borderRadius: 8,
        marginHorizontal: 6,
        flex: 1,
        justifyContent: 'center',
    },
    scheduledText: {
        color: '#28a745',
        fontWeight: '600',
        fontSize: 16,
        marginLeft: 8,
    },
    imageModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImage: {
        width: width - 40,
        height: height - 100,
        borderRadius: 8,
    },
    closeButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 30,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        padding: 8,
    },
});

export default AppointmentDetail;