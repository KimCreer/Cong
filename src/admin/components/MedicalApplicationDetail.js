import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    ActivityIndicator,
    Alert,
    Linking
} from 'react-native';
import { 
    FontAwesome5, 
    Feather, 
    MaterialIcons, 
    Ionicons,
    MaterialCommunityIcons 
} from '@expo/vector-icons';
import { getFirestore, doc, getDoc, updateDoc } from '@react-native-firebase/firestore';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';

const MedicalApplicationDetail = () => {
    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const navigation = useNavigation();
    const route = useRoute();
    const { applicationId } = route.params;

    const fetchApplication = async () => {
        try {
            setLoading(true);
            const db = getFirestore();
            const docRef = doc(db, "medicalApplications", applicationId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists) {
                const appData = docSnap.data();
                const createdAt = appData.createdAt?.toDate();
                
                setApplication({
                    id: docSnap.id,
                    ...appData,
                    formattedDate: createdAt ? format(createdAt, 'MMMM dd, yyyy') : 'No date',
                    formattedTime: createdAt ? format(createdAt, 'hh:mm a') : 'No time'
                });
            } else {
                Alert.alert("Error", "Application not found");
                navigation.goBack();
            }
        } catch (error) {
            console.error("Error fetching application:", error);
            Alert.alert("Error", "Failed to load application details");
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleCall = (phoneNumber) => {
        if (phoneNumber) {
            Linking.openURL(`tel:${phoneNumber.replace(/[^0-9]/g, '')}`);
        }
    };

    const handleEmail = (email) => {
        if (email) {
            Linking.openURL(`mailto:${email}`);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        try {
            setProcessing(true);
            const db = getFirestore();
            const docRef = doc(db, "medicalApplications", applicationId);
            
            await updateDoc(docRef, {
                status: newStatus,
                updatedAt: new Date()
            });
            
            setApplication(prev => ({
                ...prev,
                status: newStatus
            }));
            
            Alert.alert("Success", `Application ${newStatus.toLowerCase()}`);
        } catch (error) {
            console.error("Error updating status:", error);
            Alert.alert("Error", `Failed to ${newStatus.toLowerCase()} application`);
        } finally {
            setProcessing(false);
        }
    };

    useEffect(() => {
        fetchApplication();
    }, [applicationId]);

    if (loading || !application) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#003366" />
                <Text style={styles.loadingText}>Loading application details...</Text>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#003366" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Application Details</Text>
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <FontAwesome5 name="hospital-user" size={24} color="#2196F3" />
                    <Text style={styles.programName}>{application.programName || 'No program name'}</Text>
                    <View style={[
                        styles.statusBadge, 
                        { 
                            backgroundColor: application.status === 'Pending' ? '#FF980020' : 
                                            application.status === 'Approved' ? '#4CAF5020' : '#F4433620' 
                        }
                    ]}>
                        <Text style={[
                            styles.statusText, 
                            { 
                                color: application.status === 'Pending' ? '#FF9800' : 
                                       application.status === 'Approved' ? '#4CAF50' : '#F44336' 
                            }
                        ]}>
                            {application.status || 'No status'}
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Patient Information</Text>
                    <DetailRow icon="person" label="Full Name" value={application.fullName || 'Not specified'} />
                    <DetailRow 
                        icon="phone" 
                        label="Contact Number" 
                        value={application.contactNumber || 'Not specified'}
                        isLink={!!application.contactNumber}
                        onPress={() => handleCall(application.contactNumber)}
                    />
                    <DetailRow 
                        icon="mail" 
                        label="Email" 
                        value={application.email || 'Not specified'}
                        isLink={!!application.email}
                        onPress={() => handleEmail(application.email)}
                    />
                    <DetailRow 
                        icon="home" 
                        label="Address" 
                        value={application.address || 'Not specified'} 
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Medical Information</Text>
                    <DetailRow 
                        icon="procedures" 
                        label="Patient Status" 
                        value={application.patientStatus === 'outpatient' ? 'Outpatient' : 'Inpatient' || 'Not specified'} 
                    />
                    <DetailRow 
                        icon="heart" 
                        label="Medical Condition" 
                        value={application.medicalCondition || 'Not specified'} 
                    />
                    <DetailRow 
                        icon="user" 
                        label="Hospital Name" 
                        value={application.hospitalName || 'Not specified'} 
                    />
                    <DetailRow 
                        icon="cash" 
                        label="Estimated Cost" 
                        value={`₱${application.estimatedCost || '0'}`} 
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Program Details</Text>
                    <DetailRow 
                        icon="info" 
                        label="Program Type" 
                        value={application.programType === 'extensive' ? 'Extensive Program' : 'Basic Program' || 'Not specified'} 
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Application Details</Text>
                    <DetailRow 
                        icon="calendar" 
                        label="Date Submitted" 
                        value={`${application.formattedDate} at ${application.formattedTime}`} 
                    />
                </View>

                {application.status === 'Pending' && (
                    <View style={styles.actions}>
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.approveButton]}
                            onPress={() => handleStatusUpdate('Approved')}
                            disabled={processing}
                        >
                            {processing ? (
                                <ActivityIndicator size="small" color="#4CAF50" />
                            ) : (
                                <>
                                    <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                                    <Text style={[styles.actionButtonText, { color: '#4CAF50' }]}>Approve</Text>
                                </>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.rejectButton]}
                            onPress={() => handleStatusUpdate('Rejected')}
                            disabled={processing}
                        >
                            {processing ? (
                                <ActivityIndicator size="small" color="#F44336" />
                            ) : (
                                <>
                                    <MaterialIcons name="cancel" size={20} color="#F44336" />
                                    <Text style={[styles.actionButtonText, { color: '#F44336' }]}>Reject</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </ScrollView>
    );
};

const DetailRow = ({ icon, label, value, isLink = false, onPress }) => {
    const IconComponent = icon === 'procedures' || icon === 'hospital-user' ? FontAwesome5 : 
                         icon === 'person' || icon === 'mail' || icon === 'home' ? MaterialIcons :
                         icon === 'cash' ? MaterialCommunityIcons : Feather;

    return (
        <TouchableOpacity 
            style={styles.detailRow} 
            onPress={isLink ? onPress : null}
            disabled={!isLink}
        >
            <View style={styles.detailIcon}>
                <IconComponent name={icon} size={18} color="#666" />
            </View>
            <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={[styles.detailValue, isLink && styles.linkText]} numberOfLines={1} ellipsizeMode="tail">
                    {value}
                </Text>
            </View>
            {isLink && <Feather name="chevron-right" size={18} color="#0275d8" />}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        paddingBottom: 30,
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    backButton: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#003366',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 15,
    },
    programName: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 10,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#003366',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 8,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    detailIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f0f4f8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 15,
        color: '#333',
    },
    linkText: {
        color: '#0275d8',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        marginHorizontal: 5,
    },
    approveButton: {
        backgroundColor: '#4CAF5020',
        borderWidth: 1,
        borderColor: '#4CAF50',
    },
    rejectButton: {
        backgroundColor: '#F4433620',
        borderWidth: 1,
        borderColor: '#F44336',
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});

export default MedicalApplicationDetail;