import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert
} from "react-native";
import { getAuth, onAuthStateChanged } from "@react-native-firebase/auth";
import { getFirestore, doc, getDoc, updateDoc, setDoc } from "@react-native-firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';
import { uploadToCloudinary, CLOUDINARY_FOLDERS } from '../../config/cloudinary';

// Components
import ProfileHeader from './profilecomps/ProfileHeader';
import ProfileCard from './profilecomps/ProfileCard';
import UserDetailsSection from './profilecomps/UserDetailsSection';
import EmergencyContactSection from './profilecomps/EmergencyContactSection';
import ChangePinModal from './profilecomps/ChangePinModal';

// Styles
import styles from './profilecomps/ProfileScreenStyles';

// Config
import { CLOUDINARY_URL, CLOUDINARY_UPLOAD_PRESET } from '../../../data/cloudinaryConfig';

const PIN_LENGTH = 4;

const ProfileScreen = () => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updatedUser, setUpdatedUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [pictureChanged, setPictureChanged] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");
  const [pinStep, setPinStep] = useState(1);

  const navigation = useNavigation();

  // Security functions
  const generateDeviceSalt = async () => {
    try {
      let salt = await SecureStore.getItemAsync('deviceSalt');
      if (!salt) {
        const randomBytes = new Uint8Array(16);
        await Crypto.getRandomValuesAsync(randomBytes);
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

  // Image handling functions
  const handleProfilePictureUpdate = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "You need to grant gallery access to update your profile picture.");
      return;
    }
    
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    
    if (!result.canceled) {
      setUpdatedUser(prev => ({ ...prev, profilePicture: result.assets[0].uri }));
      setPictureChanged(true);
    }
  };

  const uploadProfileImageToCloudinary = async (imageUri) => {
    if (!imageUri) return null;

    try {
      const secureUrl = await uploadToCloudinary(imageUri, CLOUDINARY_FOLDERS.PROFILE_PICTURES);
      return secureUrl;
    } catch (error) {
      console.error("Error uploading profile image:", error);
      Alert.alert(
        "Upload Error", 
        "Failed to upload profile image. Please try again."
      );
      return null;
    }
  };

  const handleSaveProfilePicture = async () => {
    try {
      setIsLoading(true);
      const cloudinaryUrl = await uploadProfileImageToCloudinary(updatedUser.profilePicture);
      
      if (cloudinaryUrl) {
        const auth = getAuth();
        const db = getFirestore();
        const userRef = doc(db, "users", auth.currentUser.uid);
        
        await updateDoc(userRef, {
          profilePicture: cloudinaryUrl
        });
        
        setUser(prev => ({ ...prev, profilePicture: cloudinaryUrl }));
        setUpdatedUser(prev => ({ ...prev, profilePicture: cloudinaryUrl }));
        setPictureChanged(false);
        
        Alert.alert("Success", "Profile picture updated successfully");
      }
    } catch (error) {
      console.error("Error saving profile picture:", error);
      Alert.alert("Error", "Failed to update profile picture");
    } finally {
      setIsLoading(false);
    }
  };

  // User data functions
  const fetchUserData = async (currentUser) => {
    try {
      const db = getFirestore();
      const userRef = doc(db, "users", currentUser.uid);
      const userSnapshot = await getDoc(userRef);

      if (userSnapshot.exists) {
        let userData = userSnapshot.data();
        
        if (userData.phone && typeof userData.phone === "string" && userData.phone.startsWith("+1")) {
          userData.phone = userData.phone.replace("+1", "0");
        }

        setUser(userData);
        setUpdatedUser(userData);

        if (!userData.phone) {
          await updateDoc(userRef, { phone: currentUser.phoneNumber });
          setUser(prev => ({ ...prev, phone: currentUser.phoneNumber }));
          setUpdatedUser(prev => ({ ...prev, phone: currentUser.phoneNumber }));
        }
      } else {
        const newUser = {
          firstName: "",
          lastName: "",
          email: currentUser.email || "",
          dob: "",
          gender: "",
          address: "",
          barangay: "",
          phone: currentUser.phoneNumber || "",
          profilePicture: "",
          occupation: "",
          nationality: "",
          Name: "",
          Phone: "",
          Relationship: "",
        };

        await setDoc(userRef, newUser);
        setUser(newUser);
        setUpdatedUser(newUser);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      Alert.alert("Error", "Failed to load profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const authInstance = getAuth();
    const unsubscribe = onAuthStateChanged(authInstance, async (currentUser) => {
      if (currentUser) {
        await fetchUserData(currentUser);
      } else {
        setUser(null);
        navigation.replace("Login");
      }
    });

    return unsubscribe;
  }, [navigation]);

  // Pin change functions
  const handleChangePin = async () => {
    try {
      setIsLoading(true);
      
      const authInstance = getAuth();
      const currentUser = authInstance.currentUser;
      if (!currentUser) throw new Error("User not authenticated");

      const userId = await SecureStore.getItemAsync('userUid');
      if (!userId) throw new Error("User session expired. Please login again.");

      const salt = await generateDeviceSalt();
      
      if (pinStep === 1) {
        const storedPinHash = await SecureStore.getItemAsync(`userPinHash_${userId}`);
        const currentPinHash = await hashPin(currentPin, salt, userId);
        
        if (currentPinHash !== storedPinHash) {
          Alert.alert("Error", "Current PIN is incorrect");
          return;
        }
        
        setPinStep(2);
        setCurrentPin("");
        return;
      }
      
      if (pinStep === 2) {
        if (newPin.length !== PIN_LENGTH) {
          Alert.alert("Error", `PIN must be ${PIN_LENGTH} digits`);
          return;
        }
        
        setPinStep(3);
        return;
      }
      
      if (pinStep === 3) {
        if (newPin !== confirmNewPin) {
          Alert.alert("Error", "New PINs don't match");
          return;
        }
        
        const newPinHash = await hashPin(newPin, salt, userId);
        await SecureStore.setItemAsync(`userPinHash_${userId}`, newPinHash);
        
        Alert.alert("Success", "PIN changed successfully");
        setShowChangePinModal(false);
        resetPinChangeForm();
      }
    } catch (error) {
      console.error("Error changing PIN:", error);
      Alert.alert("Error", error.message || "Failed to change PIN");
    } finally {
      setIsLoading(false);
    }
  };

  const resetPinChangeForm = () => {
    setCurrentPin("");
    setNewPin("");
    setConfirmNewPin("");
    setPinStep(1);
  };

  // Profile functions
  const handleEditPress = () => {
    if (isEditing) {
      handleSaveChanges();
    }
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = async () => {
    const authInstance = getAuth();
    const currentUser = authInstance.currentUser;
    if (currentUser) {
      try {
        if (pictureChanged) {
          setIsLoading(true);
          const cloudinaryUrl = await uploadProfileImageToCloudinary(updatedUser.profilePicture);
          
          if (cloudinaryUrl) {
            updatedUser.profilePicture = cloudinaryUrl;
          }
          setIsLoading(false);
        }
        
        const db = getFirestore();
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, updatedUser);
        setUser(updatedUser);
        setPictureChanged(false);
        Alert.alert("Success", "Profile updated successfully");
      } catch (error) {
        console.log("Error updating profile:", error);
        Alert.alert("Error", "Failed to update profile. Please try again.");
      }
    }
  };

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
              setIsLoading(true);
              const auth = getAuth();
              
              if (auth.currentUser) {
                await auth.signOut();
                
                await Promise.all([
                  SecureStore.deleteItemAsync('firebaseAuthToken'),
                  SecureStore.deleteItemAsync('lastLogin')
                ]);
              }
              
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }]
              });
              
            } catch (error) {
              console.error("Logout error:", error);
              
              if (error.code === 'auth/no-current-user') {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }]
                });
              } else {
                Alert.alert(
                  "Logout Error", 
                  error.message || "Failed to logout. Please try again."
                );
              }
            } finally {
              setIsLoading(false);
            }
          },
          style: "destructive",
        }
      ]
    );
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
    <LinearGradient colors={['#E0F7FA', '#C5CAE9']} style={styles.gradientContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        <ProfileHeader 
          onLockPress={() => setShowChangePinModal(true)}
          onLogoutPress={handleLogout}
          isLoading={isLoading}
        />

        {user ? (
          <>
            <ProfileCard 
              user={updatedUser}
              pictureChanged={pictureChanged}
              isLoading={isLoading}
              isEditing={isEditing}
              onPictureUpdate={handleProfilePictureUpdate}
              onSavePicture={handleSaveProfilePicture}
              onEditPress={handleEditPress}
            />

            <UserDetailsSection 
              user={user}
              updatedUser={updatedUser}
              isEditing={isEditing}
              setUpdatedUser={setUpdatedUser}
            />

            <EmergencyContactSection 
              user={user}
              updatedUser={updatedUser}
              isEditing={isEditing}
              setUpdatedUser={setUpdatedUser}
            />

            <ChangePinModal
              visible={showChangePinModal}
              onClose={() => {
                setShowChangePinModal(false);
                resetPinChangeForm();
              }}
              pinStep={pinStep}
              currentPin={currentPin}
              newPin={newPin}
              confirmNewPin={confirmNewPin}
              onNumberPress={(num) => {
                if (pinStep === 1) {
                  if (currentPin.length < PIN_LENGTH) {
                    setCurrentPin(prev => prev + num);
                  }
                } else if (pinStep === 2) {
                  if (newPin.length < PIN_LENGTH) {
                    setNewPin(prev => prev + num);
                  }
                } else {
                  if (confirmNewPin.length < PIN_LENGTH) {
                    setConfirmNewPin(prev => prev + num);
                  }
                }
              }}
              onBackspace={() => {
                if (pinStep === 1) {
                  setCurrentPin(prev => prev.slice(0, -1));
                } else if (pinStep === 2) {
                  setNewPin(prev => prev.slice(0, -1));
                } else {
                  setConfirmNewPin(prev => prev.slice(0, -1));
                }
              }}
              onChangePin={handleChangePin}
              isLoading={isLoading}
            />
          </>
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#003366" />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

export default ProfileScreen;