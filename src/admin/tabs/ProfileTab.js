import React from "react";
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity,
    Image,
    Alert,
    TextInput,
    ActivityIndicator
} from "react-native";
import { getAuth } from "@react-native-firebase/auth";
import { useNavigation } from '@react-navigation/native';
import { Feather, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import * as Animatable from 'react-native-animatable';
import * as SecureStore from 'expo-secure-store';

// Components
import PinModal from './profile/components/PinModal';
import AddAdminModal from './profile/components/AddAdminModal';

// Hooks
import { useProfile } from './profile/hooks/useProfile';
import { useAdminManagement } from './profile/hooks/useAdminManagement';
import { usePinManagement } from './profile/hooks/usePinManagement';

// Utils
import { handlePinInput, handlePinBackspace } from './profile/utils/pinUtils';

const ProfileTab = () => {
    const navigation = useNavigation();
    const auth = getAuth();

    const {
        adminData,
        loading,
        editing,
        setEditing,
        formData,
        setFormData,
        uploading,
        handleUpdateProfile,
        uploadImageToCloudinary,
        updateProfileImage
    } = useProfile();

    const {
        showAddAdminModal,
        setShowAddAdminModal,
        newAdminPhone,
        setNewAdminPhone,
        addingAdmin,
        handleAddAdmin,
        resetAddAdminModal
    } = useAdminManagement(adminData.adminType);

    const {
        showPinModal,
        setShowPinModal,
        currentPin,
        setCurrentPin,
        newPin,
        setNewPin,
        confirmPin,
        setConfirmPin,
        pinStep,
        pinError,
        shakeAnimation,
        handleChangePin,
        resetPinModal
    } = usePinManagement();

    const handleLogout = async () => {
        Alert.alert(
            "Confirm Logout",
            "Are you sure you want to log out?",
            [
                { 
                    text: "Cancel", 
                    style: "cancel" 
                },
                {
                    text: "Logout",
                    onPress: async () => {
                        try {
                            if (auth.currentUser) {
                                await auth.signOut();
                                
                                await Promise.all([
                                    SecureStore.deleteItemAsync('firebaseAuthToken'),
                                    SecureStore.deleteItemAsync('lastLogin'),
                                    SecureStore.deleteItemAsync('userUid')
                                ]);
                            }
                            
                            if (!navigation || !navigation.reset) {
                                throw new Error("Navigation not available");
                            }
                            
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }]
                            });
                            
                        } catch (error) {
                            console.error("Logout error:", error);
                            
                            if (error.code === 'auth/no-current-user') {
                                if (navigation?.reset) {
                                    navigation.reset({
                                        index: 0,
                                        routes: [{ name: 'Login' }]
                                    });
                                }
                            } else {
                                Alert.alert(
                                    "Logout Error", 
                                    error.message || "Failed to logout. Please try again."
                                );
                            }
                        }
                    },
                    style: "destructive",
                }
            ]
        );
    };

    const handleChangeAvatar = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            
            if (permissionResult.granted === false) {
                Alert.alert("Permission required", "We need access to your photos to change your avatar");
                return;
            }

            const pickerResult = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
                const imageUrl = await uploadImageToCloudinary(pickerResult.assets[0].uri);
                await updateProfileImage(imageUrl);
            }
        } catch (error) {
            console.error("Error changing avatar:", error);
            Alert.alert("Error", "Failed to change avatar: " + error.message);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#003366" />
                <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
        );
    }

    return (
        <ScrollView 
            style={styles.container}
            contentContainerStyle={styles.scrollContainer}
        >
            <Animatable.View 
                animation="fadeIn"
                duration={600}
                style={styles.profileHeader}
            >
                <TouchableOpacity onPress={handleChangeAvatar} disabled={uploading}>
                    {adminData.avatarUrl ? (
                        <Image 
                            source={{ uri: adminData.avatarUrl }}
                            style={styles.avatar}
                        />
                    ) : (
                        <Image 
                            source={require('../../../assets/admin-icon1.png')}
                            style={styles.avatar}
                        />
                    )}
                    <View style={styles.editAvatarIcon}>
                        {uploading ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Feather name="edit" size={16} color="white" />
                        )}
                    </View>
                </TouchableOpacity>
                
                <Text style={styles.name}>{adminData.name}</Text>
                <Text style={styles.position}>{adminData.position}</Text>
                <Text style={styles.adminType}>
                    {adminData.adminType === 'superadmin' ? 'Super Admin' : 'Regular Admin'}
                </Text>
            </Animatable.View>

            <Animatable.View 
                animation="fadeInUp"
                duration={800}
                style={styles.section}
            >
                <Text style={styles.sectionTitle}>Account Information</Text>
                
                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Phone</Text>
                    {editing ? (
                        <TextInput
                            style={styles.input}
                            value={formData.phone}
                            onChangeText={(text) => setFormData({...formData, phone: text})}
                            placeholder="Phone number"
                            keyboardType="phone-pad"
                        />
                    ) : (
                        <Text style={styles.infoValue}>{adminData.phone}</Text>
                    )}
                </View>
                
                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Name</Text>
                    {editing ? (
                        <TextInput
                            style={styles.input}
                            value={formData.name}
                            onChangeText={(text) => setFormData({...formData, name: text})}
                            placeholder="Your name"
                        />
                    ) : (
                        <Text style={styles.infoValue}>{adminData.name}</Text>
                    )}
                </View>
                
                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Position</Text>
                    {editing ? (
                        <TextInput
                            style={styles.input}
                            value={formData.position}
                            onChangeText={(text) => setFormData({...formData, position: text})}
                            placeholder="Your position"
                        />
                    ) : (
                        <Text style={styles.infoValue}>{adminData.position}</Text>
                    )}
                </View>

                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Admin Type</Text>
                    <Text style={styles.infoValue}>
                        {adminData.adminType === 'superadmin' ? 'Super Admin' : 'Regular Admin'}
                    </Text>
                </View>
            </Animatable.View>

            <Animatable.View 
                animation="fadeInUp"
                duration={1000}
                style={styles.section}
            >
                <Text style={styles.sectionTitle}>Security</Text>
                
                <TouchableOpacity 
                    style={styles.securityItem} 
                    onPress={() => setShowPinModal(true)}
                >
                    <View style={styles.securityItemLeft}>
                        <MaterialIcons name="security" size={24} color="#003366" />
                        <Text style={styles.securityItemText}>Change PIN</Text>
                    </View>
                    <Feather name="chevron-right" size={20} color="#ccc" />
                </TouchableOpacity>

                {adminData.adminType === 'superadmin' && (
                    <TouchableOpacity 
                        style={styles.securityItem} 
                        onPress={() => setShowAddAdminModal(true)}
                    >
                        <View style={styles.securityItemLeft}>
                            <MaterialIcons name="person-add" size={24} color="#003366" />
                            <Text style={styles.securityItemText}>Add New Admin</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color="#ccc" />
                    </TouchableOpacity>
                )}

                <TouchableOpacity 
                    style={[styles.securityItem, styles.logoutItem]} 
                    onPress={handleLogout}
                >
                    <View style={styles.securityItemLeft}>
                        <MaterialIcons name="logout" size={24} color="#F44336" />
                        <Text style={[styles.securityItemText, styles.logoutText]}>Logout</Text>
                    </View>
                    <Feather name="chevron-right" size={20} color="#ccc" />
                </TouchableOpacity>
            </Animatable.View>

            <Animatable.View 
                animation="fadeInUp"
                duration={1200}
                style={styles.actionsContainer}
            >
                {editing ? (
                    <>
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.saveButton]}
                            onPress={handleUpdateProfile}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.actionButtonText}>Save Changes</Text>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.cancelButton]}
                            onPress={() => setEditing(false)}
                            disabled={loading}
                        >
                            <Text style={styles.actionButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <TouchableOpacity 
                        style={[styles.actionButton, styles.editButton]}
                        onPress={() => setEditing(true)}
                    >
                        <Text style={styles.actionButtonText}>Edit Profile</Text>
                    </TouchableOpacity>
                )}
            </Animatable.View>

            <PinModal
                visible={showPinModal}
                onClose={resetPinModal}
                pinStep={pinStep}
                currentPin={currentPin}
                newPin={newPin}
                confirmPin={confirmPin}
                onNumberPress={(num) => {
                    if (pinStep === 1) {
                        setCurrentPin(prev => handlePinInput(prev, num));
                    } else if (pinStep === 2) {
                        setNewPin(prev => handlePinInput(prev, num));
                    } else {
                        setConfirmPin(prev => handlePinInput(prev, num));
                    }
                }}
                onBackspace={() => {
                    if (pinStep === 1) {
                        setCurrentPin(prev => handlePinBackspace(prev));
                    } else if (pinStep === 2) {
                        setNewPin(prev => handlePinBackspace(prev));
                    } else {
                        setConfirmPin(prev => handlePinBackspace(prev));
                    }
                }}
                onContinue={handleChangePin}
                shakeAnimation={shakeAnimation}
                pinError={pinError}
            />

            <AddAdminModal
                visible={showAddAdminModal}
                onClose={resetAddAdminModal}
                newAdminPhone={newAdminPhone}
                setNewAdminPhone={setNewAdminPhone}
                onAddAdmin={handleAddAdmin}
                addingAdmin={addingAdmin}
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F7FA",
    },
    scrollContainer: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F5F7FA",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: "#003366",
    },
    profileHeader: {
        alignItems: "center",
        marginTop: 20,
        marginBottom: 30,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 15,
    },
    editAvatarIcon: {
        position: "absolute",
        right: 10,
        bottom: 20,
        backgroundColor: "#003366",
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: "center",
        alignItems: "center",
    },
    name: {
        fontSize: 22,
        fontWeight: "700",
        color: "#003366",
        marginBottom: 5,
    },
    position: {
        fontSize: 16,
        color: "#666",
    },
    adminType: {
        fontSize: 16,
        color: "#4CAF50",
        fontWeight: '600'
    },
    section: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#003366",
        marginBottom: 15,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#F0F4F8",
    },
    infoItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15,
    },
    infoLabel: {
        fontSize: 14,
        color: "#666",
        width: "30%",
    },
    infoValue: {
        fontSize: 14,
        color: "#333",
        fontWeight: "500",
        width: "70%",
        textAlign: "right",
    },
    input: {
        backgroundColor: "#F5F7FA",
        borderWidth: 1,
        borderColor: "#E1E5EB",
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
        width: "70%",
    },
    securityItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
    },
    securityItemLeft: {
        flexDirection: "row",
        alignItems: "center",
    },
    securityItemText: {
        fontSize: 14,
        color: "#333",
        marginLeft: 10,
    },
    logoutItem: {
        borderTopWidth: 1,
        borderTopColor: '#F0F4F8',
        marginTop: 10,
        paddingTop: 12,
    },
    logoutText: {
        color: '#F44336',
    },
    actionsContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 10,
    },
    actionButton: {
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 25,
        marginHorizontal: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    editButton: {
        backgroundColor: "#003366",
    },
    saveButton: {
        backgroundColor: "#4CAF50",
    },
    cancelButton: {
        backgroundColor: "#F44336",
    },
    actionButtonText: {
        color: "white",
        fontWeight: "600",
        fontSize: 14,
    },
});

export default ProfileTab;