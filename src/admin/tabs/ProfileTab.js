import { CLOUDINARY_URL, CLOUDINARY_UPLOAD_PRESET } from '../../../data/cloudinaryConfig';
import React, { useState, useEffect, useRef } from "react";
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity,
    Image,
    Alert,
    TextInput,
    ActivityIndicator,
    Modal,
    Animated
} from "react-native";
import { getAuth } from "@react-native-firebase/auth";
import { useNavigation } from '@react-navigation/native';
import { getFirestore, doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs } from "@react-native-firebase/firestore";
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome5, Feather, MaterialIcons } from "@expo/vector-icons";
import * as Animatable from 'react-native-animatable';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const PIN_LENGTH = 6;

const ProfileTab = () => {
    const navigation = useNavigation();

    const [adminData, setAdminData] = useState({
        name: 'Loading...',
        phone: 'Loading...',
        position: 'Loading...',
        avatarUrl: null,
        adminType: 'regular'
    });
    
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        position: ''
    });
    const [showPinModal, setShowPinModal] = useState(false);
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [pinStep, setPinStep] = useState(1);
    const [pinError, setPinError] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showAddAdminModal, setShowAddAdminModal] = useState(false);
    const [newAdminPhone, setNewAdminPhone] = useState('');
    const [newAdminName, setNewAdminName] = useState('');
    const [newAdminPosition, setNewAdminPosition] = useState('');
    const [addingAdmin, setAddingAdmin] = useState(false);
    const shakeAnimation = useRef(new Animated.Value(0)).current;

    const auth = getAuth();
    const db = getFirestore();

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
                            setLoading(true);
                            const auth = getAuth();
                            
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
                        } finally {
                            setLoading(false);
                        }
                    },
                    style: "destructive",
                }
            ]
        );
    };

    const fetchAdminProfile = async () => {
        try {
            setLoading(true);
            const currentUser = auth.currentUser;
            
            if (!currentUser || !currentUser.uid) {
                throw new Error("User not authenticated or missing UID");
            }
        
            const adminRef = doc(db, "admins", currentUser.uid);
            const adminSnap = await getDoc(adminRef);
        
            // Change this check
            if (adminSnap && adminSnap.exists) {
                const data = adminSnap.data();
                
                if (!data) {
                    throw new Error("Document exists but has no data");
                }
        
                const validatedData = {
                    name: data.name?.trim() || 'Not set',
                    phone: data.phone?.trim() || 'Not set',
                    position: data.position?.trim() || 'Not set',
                    avatarUrl: data.avatarUrl || null,
                    adminType: data.adminType || 'regular'
                };
                
                setAdminData(validatedData);
                setFormData({
                    name: validatedData.name,
                    phone: validatedData.phone,
                    position: validatedData.position
                });
            } else {
                // For new admins, default to regular admin type
                const defaultData = {
                    name: currentUser.displayName || 'Not set',
                    phone: currentUser.phoneNumber || 'Not set',
                    position: 'Administrator',
                    avatarUrl: null,
                    createdAt: new Date(),
                    adminType: 'regular'
                };
                
                await setDoc(adminRef, defaultData);
                setAdminData(defaultData);
                setFormData({
                    name: defaultData.name,
                    phone: defaultData.phone,
                    position: defaultData.position
                });
            }
        } catch (error) {
            console.error("Profile fetch error:", error);
            Alert.alert(
                "Profile Error",
                error.message || "Failed to load admin profile"
            );
            setAdminData({
                name: 'Error loading',
                phone: 'Error loading',
                position: 'Error loading',
                avatarUrl: null,
                adminType: 'regular'
            });
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                fetchAdminProfile();
            } else {
                setLoading(false);
                navigation.navigate('Login');
            }
        });
    
        return () => unsubscribe();
    }, []);

    const uploadImageToCloudinary = async (imageUri) => {
        try {
            setUploading(true);
            
            const formData = new FormData();
            formData.append('file', {
                uri: imageUri,
                type: 'image/jpeg',
                name: 'profile.jpg'
            });
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            
            const response = await fetch(CLOUDINARY_URL, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to upload image');
            }
            
            return data.secure_url;
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        } finally {
            setUploading(false);
        }
    };

    const updateProfileImage = async (imageUrl) => {
        try {
            setLoading(true);
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error("User not authenticated");
            }

            const adminRef = doc(db, "admins", currentUser.uid);
            await updateDoc(adminRef, {
                avatarUrl: imageUrl
            });
            
            setAdminData(prev => ({ 
                ...prev,
                avatarUrl: imageUrl
            }));
            
            Alert.alert("Success", "Profile image updated successfully");
        } catch (error) {
            console.error("Error updating profile image:", error);
            Alert.alert("Error", "Failed to update profile image");
        } finally {
            setLoading(false);
        }
    };

    const validateFormData = () => {
        if (!formData.name.trim()) {
            Alert.alert("Validation Error", "Please enter your name");
            return false;
        }
        if (!formData.position.trim()) {
            Alert.alert("Validation Error", "Please enter your position");
            return false;
        }
        return true;
    };

    const handleUpdateProfile = async () => {
        if (!validateFormData()) return;

        try {
            setLoading(true);
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error("User not authenticated");
            }

            const adminRef = doc(db, "admins", currentUser.uid);
            await updateDoc(adminRef, {
                name: formData.name.trim(),
                phone: formData.phone.trim(),
                position: formData.position.trim()
            });
            
            setAdminData({ 
                ...adminData,
                name: formData.name.trim(),
                phone: formData.phone.trim(),
                position: formData.position.trim()
            });
            setEditing(false);
            Alert.alert("Success", "Profile updated successfully");
        } catch (error) {
            console.error("Error updating profile:", error);
            Alert.alert("Error", "Failed to update profile");
        } finally {
            setLoading(false);
        }
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

    const startShake = () => {
        setPinError(true);
        Animated.sequence([
            Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true })
        ]).start(() => {
            setTimeout(() => setPinError(false), 500);
        });
    };

    const handlePinInput = (pin, num) => {
        if (pin.length < PIN_LENGTH) {
            return pin + num;
        }
        return pin;
    };

    const handlePinBackspace = (pin) => {
        if (pin.length > 0) {
            return pin.slice(0, -1);
        }
        return pin;
    };

    const generateDeviceSalt = async () => {
        try {
            let salt = await SecureStore.getItemAsync('deviceSalt');
            if (!salt) {
                const randomBytes = new Uint8Array(16);
                await Crypto.getRandomValues(randomBytes);
                salt = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
                await SecureStore.setItemAsync('deviceSalt', salt);
            }
            return salt;
        } catch (error) {
            console.error("Salt generation error:", error);
            throw error;
        }
    };

    const hashPin = async (pin, salt, userId) => {
        try {
            const encoder = new TextEncoder();
            const keyMaterial = await Crypto.digest(
                'SHA-256',
                encoder.encode(pin + salt + userId)
            );
            return Array.from(new Uint8Array(keyMaterial)).map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (error) {
            console.error("Hashing error:", error);
            throw error;
        }
    };

    const verifyCurrentPin = async () => {
        try {
            const userId = await SecureStore.getItemAsync('userUid');
            if (!userId) {
                throw new Error("User session expired");
            }

            const salt = await generateDeviceSalt();
            const storedPinHash = await SecureStore.getItemAsync(`adminPinHash_${userId}`);
            const currentPinHash = await hashPin(currentPin, salt, userId);

            if (currentPinHash !== storedPinHash) {
                startShake();
                Alert.alert("Incorrect PIN", "The PIN you entered is incorrect");
                setCurrentPin('');
                return false;
            }

            return true;
        } catch (error) {
            console.error("PIN verification error:", error);
            Alert.alert("Error", "Failed to verify PIN");
            return false;
        }
    };

    const handleChangePin = async () => {
        if (pinStep === 1) {
            const isValid = await verifyCurrentPin();
            if (isValid) {
                setPinStep(2);
                setCurrentPin('');
            }
        } else if (pinStep === 2) {
            if (newPin.length < PIN_LENGTH) {
                Alert.alert("Invalid PIN", `PIN must be ${PIN_LENGTH} digits`);
                return;
            }
            setPinStep(3);
        } else if (pinStep === 3) {
            if (newPin !== confirmPin) {
                startShake();
                Alert.alert("PIN Mismatch", "The PINs you entered don't match");
                setNewPin('');
                setConfirmPin('');
                setPinStep(2);
                return;
            }

            try {
                const userId = await SecureStore.getItemAsync('userUid');
                if (!userId) {
                    throw new Error("User session expired");
                }

                const salt = await generateDeviceSalt();
                const newPinHash = await hashPin(newPin, salt, userId);
                await SecureStore.setItemAsync(`adminPinHash_${userId}`, newPinHash);

                Alert.alert("Success", "PIN changed successfully");
                resetPinModal();
            } catch (error) {
                console.error("Error changing PIN:", error);
                Alert.alert("Error", "Failed to change PIN");
            }
        }
    };

    const resetPinModal = () => {
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
        setPinStep(1);
        setPinError(false);
        setShowPinModal(false);
    };

    const resetAddAdminModal = () => {
        setNewAdminPhone('');
        setNewAdminName('');
        setNewAdminPosition('');
        setShowAddAdminModal(false);
    };

    const validateNewAdminData = () => {
        if (!newAdminPhone.trim()) {
            Alert.alert("Validation Error", "Please enter phone number");
            return false;
        }
        if (!newAdminName.trim()) {
            Alert.alert("Validation Error", "Please enter admin name");
            return false;
        }
        return true;
    };

    const handleAddAdmin = async () => {
        if (!newAdminPhone.trim()) {
            Alert.alert("Validation Error", "Please enter a valid phone number");
            return;
        }
    
        // Check if current user is superadmin
        if (adminData.adminType !== 'superadmin') {
            Alert.alert(
                "Permission Denied",
                "Only superadmins can create new admin accounts"
            );
            return;
        }
    
        try {
            setAddingAdmin(true);
            
            // Check if phone is already an admin
            const adminsRef = collection(db, "admins");
            const adminQ = query(adminsRef, where("phone", "==", newAdminPhone.trim()));
            const adminSnapshot = await getDocs(adminQ);
            
            if (!adminSnapshot.empty) {
                throw new Error("This phone number is already registered as an admin");
            }
            
            // Generate a new document ID for the admin
            const adminDocRef = doc(adminsRef);
            
            // Add to admins collection with default values
            await setDoc(adminDocRef, {
                phone: newAdminPhone.trim(),
                name: "New Admin", // Default name
                position: "Administrator", // Default position
                createdAt: new Date(),
                addedBy: auth.currentUser.uid,
                adminType: 'regular' // New admins are always regular by default
            });
            
            Alert.alert("Success", "New admin added successfully");
            resetAddAdminModal();
        } catch (error) {
            console.error("Error adding admin:", error);
            Alert.alert("Error", error.message || "Failed to add admin");
        } finally {
            setAddingAdmin(false);
        }
    };

    const PinCircle = ({ filled, active }) => (
        <View style={[
            styles.pinCircle,
            filled && styles.pinCircleFilled,
            active && styles.pinCircleActive,
            pinError && styles.pinCircleError
        ]}>
            {filled && <View style={styles.pinDot} />}
        </View>
    );

    const PinDisplay = ({ pin, activeIndex }) => (
        <View style={styles.pinContainer}>
            {Array(PIN_LENGTH).fill().map((_, index) => (
                <PinCircle
                    key={index}
                    filled={pin.length > index}
                    active={index === activeIndex}
                />
            ))}
        </View>
    );

    const NumberButton = ({ number, onPress }) => (
        <TouchableOpacity
            style={styles.numberButton}
            onPress={() => onPress(number)}
            activeOpacity={0.7}
        >
            <Text style={styles.numberText}>{number}</Text>
        </TouchableOpacity>
    );

    const BackspaceButton = ({ onPress }) => (
        <TouchableOpacity
            style={styles.backspaceButton}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <MaterialIcons name="backspace" size={24} color="#003366" />
        </TouchableOpacity>
    );

    const NumberPad = ({ onNumberPress, onBackspace }) => (
        <View style={styles.numberPad}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <NumberButton 
                    key={num} 
                    number={num} 
                    onPress={onNumberPress} 
                />
            ))}
            <View style={styles.emptyButton} />
            <NumberButton number={0} onPress={onNumberPress} />
            <BackspaceButton onPress={onBackspace} />
        </View>
    );

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

            {/* PIN Change Modal */}
            <Modal
                visible={showPinModal}
                transparent={true}
                animationType="slide"
                onRequestClose={resetPinModal}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity 
                            style={styles.modalCloseButton}
                            onPress={resetPinModal}
                        >
                            <Feather name="x" size={24} color="#666" />
                        </TouchableOpacity>

                        <Text style={styles.modalTitle}>
                            {pinStep === 1 ? 'Enter Current PIN' : 
                             pinStep === 2 ? 'Enter New PIN' : 'Confirm New PIN'}
                        </Text>
                        
                        <Text style={styles.modalSubtitle}>
                            {pinStep === 1 ? 'Enter your current 6-digit PIN to continue' :
                             pinStep === 2 ? 'Create a new 6-digit PIN' : 
                             'Re-enter your new PIN to confirm'}
                        </Text>

                        <Animated.View style={{ transform: [{ translateX: shakeAnimation }] }}>
                            <PinDisplay 
                                pin={pinStep === 1 ? currentPin : pinStep === 2 ? newPin : confirmPin}
                                activeIndex={
                                    pinStep === 1 ? currentPin.length : 
                                    pinStep === 2 ? newPin.length : 
                                    confirmPin.length
                                }
                            />
                        </Animated.View>

                        <NumberPad
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
                        />

                        <TouchableOpacity
                            style={styles.modalActionButton}
                            onPress={handleChangePin}
                            disabled={
                                (pinStep === 1 && currentPin.length < PIN_LENGTH) ||
                                (pinStep === 2 && newPin.length < PIN_LENGTH) ||
                                (pinStep === 3 && confirmPin.length < PIN_LENGTH)
                            }
                        >
                            <Text style={styles.modalActionButtonText}>
                                {pinStep === 3 ? 'Confirm Change' : 'Continue'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Add Admin Modal */}
            <Modal
    visible={showAddAdminModal}
    transparent={true}
    animationType="slide"
    onRequestClose={resetAddAdminModal}
>
    <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
            <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={resetAddAdminModal}
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
                onPress={handleAddAdmin}
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
    pinContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 30,
    },
    pinCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#003366',
        marginHorizontal: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pinCircleFilled: {
        backgroundColor: '#003366',
    },
    pinCircleActive: {
        borderWidth: 2,
        borderColor: '#002B5C',
    },
    pinCircleError: {
        borderColor: '#F44336',
    },
    pinDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#fff',
    },
    numberPad: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        width: '100%',
        marginBottom: 20,
    },
    numberButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 5,
        backgroundColor: '#F5F7FA',
    },
    numberText: {
        fontSize: 24,
        fontWeight: '600',
        color: '#003366',
    },
    backspaceButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 5,
        backgroundColor: '#EDF2F7',
    },
    emptyButton: {
        width: 70,
        height: 70,
        margin: 5,
        backgroundColor: 'transparent',
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
    disabledButton: {
        backgroundColor: '#cccccc',
    },
});

export default ProfileTab;