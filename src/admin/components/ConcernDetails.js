import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Pressable,
    Dimensions,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
    getFirestore, 
    doc, 
    getDoc,
    updateDoc 
} from '@react-native-firebase/firestore';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

const ConcernDetails = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { concernId } = route.params;
    const [concern, setConcern] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [imageModalVisible, setImageModalVisible] = useState(false);

    const fetchConcern = async () => {
        try {
            setLoading(true);
            const db = getFirestore();
            const docRef = doc(db, "concerns", concernId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists) {
                const concernData = docSnap.data();
                
                // Fetch user details if userId exists
                let userFirstName = '';
                let userLastName = '';
                let profilePicture = null;
                let userRole = '';
                
                if (concernData.userId) {
                    const userRef = doc(db, "users", concernData.userId);
                    const userSnap = await getDoc(userRef);
                    
                    if (userSnap.exists) {
                        const userData = userSnap.data();
                        userFirstName = userData.firstName || '';
                        userLastName = userData.lastName || '';
                        profilePicture = userData.profilePicture || null;
                        userRole = userData.role || '';
                    }
                }
                
                setConcern({
                    id: docSnap.id,
                    ...concernData,
                    userFirstName,
                    userLastName,
                    profilePicture,
                    userRole,
                    formattedDate: concernData.createdAt ? format(concernData.createdAt.toDate(), 'MMMM dd, yyyy') : 'No date',
                    formattedTime: concernData.createdAt ? format(concernData.createdAt.toDate(), 'hh:mm a') : 'No time',
                    formattedUpdatedDate: concernData.updatedAt ? format(concernData.updatedAt.toDate(), 'MMMM dd, yyyy') : null,
                    formattedUpdatedTime: concernData.updatedAt ? format(concernData.updatedAt.toDate(), 'hh:mm a') : null
                });
            } else {
                Alert.alert("Error", "Concern not found");
                navigation.goBack();
            }
        } catch (error) {
            console.error("Error fetching concern:", error);
            Alert.alert("Error", "Failed to load concern details");
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        try {
            setUpdating(true);
            const db = getFirestore();
            const docRef = doc(db, "concerns", concernId);
            
            await updateDoc(docRef, {
                status: newStatus,
                updatedAt: new Date()
            });
            
            setConcern(prev => ({
                ...prev,
                status: newStatus,
                formattedUpdatedDate: format(new Date(), 'MMMM dd, yyyy'),
                formattedUpdatedTime: format(new Date(), 'hh:mm a')
            }));
            
            Alert.alert("Success", `Concern marked as ${newStatus.toLowerCase()}`);
        } catch (error) {
            console.error("Error updating status:", error);
            Alert.alert("Error", `Failed to update concern status`);
        } finally {
            setUpdating(false);
        }
    };

    const confirmResolve = () => {
        Alert.alert(
            "Confirm Resolution",
            "Are you sure you want to mark this concern as resolved?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                { 
                    text: "Resolve", 
                    onPress: () => handleStatusUpdate('Resolved'),
                    style: "destructive"
                }
            ]
        );
    };

    const getStatusColor = (status) => {
        if (!status) return '#9E9E9E';
        switch(status.toLowerCase()) {
            case 'pending': return '#FF9800';
            case 'in progress': return '#2196F3';
            case 'resolved': return '#4CAF50';
            default: return '#9E9E9E';
        }
    };

    const getStatusIcon = (status) => {
        if (!status) return 'help-circle-outline';
        switch(status.toLowerCase()) {
            case 'pending': return 'alert-circle-outline';
            case 'in progress': return 'sync-circle-outline';
            case 'resolved': return 'checkmark-circle-outline';
            default: return 'help-circle-outline';
        }
    };

    useEffect(() => {
        fetchConcern();
    }, [concernId]);

    if (loading || !concern) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
                <Text style={styles.loadingText}>Loading concern details...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView 
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Header with gradient background */}
                <LinearGradient
                    colors={['#4A90E2', '#3B82F6']}
                    style={styles.header}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()} 
                        style={styles.backButton}
                        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    >
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Concern Details</Text>
                    <View style={{ width: 24 }} />
                </LinearGradient>

                <View style={styles.card}>
                    {/* Status section with icon */}
                    <View style={styles.statusContainer}>
                        <View style={styles.statusLeft}>
                            <Ionicons 
                                name={getStatusIcon(concern.status)} 
                                size={24} 
                                color={getStatusColor(concern.status)} 
                                style={styles.statusIcon}
                            />
                            <View>
                                <Text style={styles.statusLabel}>STATUS</Text>
                                <Text style={[styles.statusText, { color: getStatusColor(concern.status) }]}>
                                    {concern.status}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.statusRight}>
                            <Text style={styles.dateText}>
                                {concern.formattedDate}
                            </Text>
                            <Text style={styles.timeText}>
                                {concern.formattedTime}
                            </Text>
                        </View>
                    </View>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Title and Description */}
                    <Text style={styles.title}>{concern.title || 'No title'}</Text>
                    <Text style={styles.description}>{concern.description || 'No description'}</Text>

                    {/* Image with improved styling */}
                    {concern.imageUrl && (
                        <TouchableOpacity 
                            style={styles.imageContainer}
                            onPress={() => setImageModalVisible(true)}
                            activeOpacity={0.8}
                        >
                            <Image 
                                source={{ uri: concern.imageUrl }} 
                                style={styles.image}
                                resizeMode="cover"
                            />
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.7)']}
                                style={styles.imageOverlay}
                            >
                                <Ionicons name="expand" size={24} color="#FFF" />
                                <Text style={styles.imageText}>Tap to expand</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}

                    {/* Submitted By section with avatar */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Submitted By</Text>
                        <View style={styles.userContainer}>
                            {concern.profilePicture ? (
                                <Image 
                                    source={{ uri: concern.profilePicture }} 
                                    style={styles.userAvatar}
                                    onError={(e) => console.log('Error loading profile picture:', e.nativeEvent.error)}
                                />
                            ) : (
                                <LinearGradient
                                    colors={['#4A90E2', '#3B82F6']}
                                    style={styles.userAvatarPlaceholder}
                                >
                                    <Ionicons name="person" size={24} color="#FFF" />
                                </LinearGradient>
                            )}
                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>
                                    {concern.userFirstName} {concern.userLastName}
                                </Text>
                                {concern.userRole && (
                                    <Text style={styles.userRole}>{concern.userRole}</Text>
                                )}
                                {concern.userEmail && (
                                    <Text style={styles.userEmail}>{concern.userEmail}</Text>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Location section */}
                    {concern.location && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Location</Text>
                            <View style={styles.detailRow}>
                                <Ionicons name="location-outline" size={20} color="#4A90E2" />
                                <Text style={styles.detailText}>{concern.location}</Text>
                            </View>
                        </View>
                    )}

                    {/* Last updated section */}
                    {concern.formattedUpdatedDate && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Last Updated</Text>
                            <View style={styles.detailRow}>
                                <Ionicons name="time-outline" size={20} color="#4A90E2" />
                                <Text style={styles.detailText}>
                                    {concern.formattedUpdatedDate} at {concern.formattedUpdatedTime}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Remarks section */}
                    {concern.remarks && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Remarks</Text>
                            <View style={styles.remarksContainer}>
                                <Text style={styles.remarksText}>{concern.remarks}</Text>
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Action buttons */}
            {concern.status !== 'Resolved' && (
                <View style={styles.actionBar}>
                    {concern.status === 'Pending' && (
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.progressButton]}
                            onPress={() => handleStatusUpdate('In Progress')}
                            disabled={updating}
                        >
                            {updating ? (
                                <ActivityIndicator size="small" color="#2196F3" />
                            ) : (
                                <>
                                    <Ionicons name="sync-circle-outline" size={20} color="#2196F3" />
                                    <Text style={[styles.actionButtonText, { color: '#2196F3' }]}>In Progress</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                        style={[styles.actionButton, styles.resolveButton]}
                        onPress={confirmResolve}
                        disabled={updating}
                    >
                        {updating ? (
                            <ActivityIndicator size="small" color="#4CAF50" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle-outline" size={20} color="#4CAF50" />
                                <Text style={[styles.actionButtonText, { color: '#4CAF50' }]}>Resolve</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* Image Modal */}
            <Modal
                visible={imageModalVisible}
                transparent={true}
                onRequestClose={() => setImageModalVisible(false)}
            >
                <Pressable 
                    style={styles.imageModalOverlay}
                    onPress={() => setImageModalVisible(false)}
                >
                    <Image 
                        source={{ uri: concern.imageUrl }} 
                        style={styles.fullImage}
                        resizeMode="contain"
                    />
                    <TouchableOpacity 
                        style={styles.closeButton}
                        onPress={() => setImageModalVisible(false)}
                    >
                        <Ionicons name="close" size={28} color="#FFF" />
                    </TouchableOpacity>
                </Pressable>
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
        color: '#4A90E2',
        fontSize: 16,
        fontWeight: '500',
    },
    scrollContainer: {
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
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
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        margin: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    statusContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    statusLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusIcon: {
        marginRight: 12,
    },
    statusLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#888',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statusText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 2,
    },
    statusRight: {
        alignItems: 'flex-end',
    },
    dateText: {
        color: '#555',
        fontSize: 14,
        fontWeight: '500',
    },
    timeText: {
        color: '#888',
        fontSize: 13,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: '#EEE',
        marginVertical: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 12,
        lineHeight: 28,
    },
    description: {
        fontSize: 16,
        color: '#555',
        lineHeight: 24,
        marginBottom: 20,
    },
    imageContainer: {
        marginBottom: 20,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
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
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 8,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4A90E2',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    userContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        marginRight: 12,
    },
    userAvatarPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2C3E50',
        marginBottom: 4,
    },
    userRole: {
        fontSize: 14,
        color: '#4A90E2',
        fontWeight: '500',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailText: {
        fontSize: 16,
        color: '#555',
        marginLeft: 10,
    },
    remarksContainer: {
        backgroundColor: '#F5F7FA',
        borderRadius: 8,
        padding: 16,
    },
    remarksText: {
        fontSize: 15,
        color: '#555',
        lineHeight: 22,
    },
    actionBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
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
        backgroundColor: '#FFF',
        borderWidth: 1,
    },
    progressButton: {
        borderColor: '#2196F3',
    },
    resolveButton: {
        borderColor: '#4CAF50',
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
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
        height: height - 200,
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

export default ConcernDetails;