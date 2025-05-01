import React, { useState, useEffect, useRef } from "react";
import { View, Text, Alert, StyleSheet, Dimensions, Image, TouchableOpacity, Keyboard, Animated } from "react-native";
import { TextInput, Button, ActivityIndicator } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from 'expo-secure-store';
import { getAuth, signInWithPhoneNumber, signOut } from "@react-native-firebase/auth";
import { getFirestore, collection, query, where, getDocs, doc, getDoc, setDoc } from "@react-native-firebase/firestore";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import * as LocalAuthentication from 'expo-local-authentication';
import * as DeviceInfo from 'expo-device';
import * as Crypto from 'expo-crypto';


import styles from './styles/LoginStyles';

const { width, height } = Dimensions.get("window");

// Security constants
const MAX_PIN_ATTEMPTS = 5;
const PIN_LENGTH = 4;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes

// Security helper functions
const generateDeviceSalt = async () => {
    try {
      let salt = await SecureStore.getItemAsync('deviceSalt');
      if (!salt) {
        // Use the correct method from expo-crypto
        const randomBytes = await Crypto.getRandomBytesAsync(16);
        salt = Array.from(new Uint8Array(randomBytes))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
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
      const message = pin + salt + userId;
      // Use digestStringAsync instead of digest
      const digest = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        message
      );
      return digest;
    } catch (error) {
      console.error("Hashing error:", error);
      throw error;
    }
  };
  

const generateDeviceFingerprint = async () => {
  try {
    const deviceId = await DeviceInfo.getDeviceIdAsync();
    const salt = await generateDeviceSalt();
    const hashedFingerprint = await hashPin(deviceId, salt, 'device');
    await SecureStore.setItemAsync('deviceFingerprint', hashedFingerprint);
    return hashedFingerprint;
  } catch (error) {
    console.error("Device fingerprint error:", error);
    throw error;
  }
};

const verifyDevice = async () => {
  try {
    const currentFingerprint = await DeviceInfo.getDeviceIdAsync();
    const storedFingerprint = await SecureStore.getItemAsync('deviceFingerprint');
    
    if (!storedFingerprint) {
      await generateDeviceFingerprint();
      return true;
    }
    
    const salt = await generateDeviceSalt();
    const currentHash = await hashPin(currentFingerprint, salt, 'device');
    
    if (currentHash !== storedFingerprint) {
      logSecurityEvent("DEVICE_MISMATCH");
      await clearUserSession();
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Device verification error:", error);
    return false;
  }
};

const NumberPad = ({ onPress, onBackspace, disabled }) => {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'backspace'];

  return (
    <View style={styles.numberPad}>
      {numbers.map((num, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.numberButton,
            num === '' && styles.emptyButton,
            num === 'backspace' && styles.backspaceButton,
            disabled && styles.disabledButton
          ]}
          onPress={() => {
            if (num === 'backspace') {
              onBackspace();
            } else if (typeof num === 'number') {
              onPress(num.toString());
            }
          }}
          disabled={disabled || num === ''}
          activeOpacity={0.7}
        >
          {num === 'backspace' ? (
            <MaterialCommunityIcons 
              name="backspace-outline" 
              size={24} 
              color={disabled ? "#ccc" : "#003580"} 
            />
          ) : (
            <Text style={[styles.numberText, disabled && styles.disabledText]}>
              {num}
            </Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const PinInput = ({ pin, length, activeIndex, error, loading }) => {
  return (
    <View style={styles.pinContainer}>
      {Array(length).fill().map((_, index) => (
        <View 
          key={index} 
          style={[
            styles.pinCircle,
            pin.length > index && styles.pinCircleFilled,
            activeIndex === index && styles.pinCircleActive,
            error && styles.pinCircleError,
            loading && styles.pinCircleLoading
          ]}
        >
          {pin.length > index && (
            <View style={styles.pinDot} />
          )}
          {loading && activeIndex === index && (
            <ActivityIndicator size="small" color="#003580" />
          )}
        </View>
      ))}
    </View>
  );
};

export default function Login() {
    // State variables
    const [phoneNumber, setPhoneNumber] = useState("");
    const [displayPhoneNumber, setDisplayPhoneNumber] = useState("");
    const [code, setCode] = useState("");
    const [pin, setPin] = useState("");
    const [confirm, setConfirm] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPinScreen, setShowPinScreen] = useState(false);
    const [showSetPinScreen, setShowSetPinScreen] = useState(false);
    const [pinAttempts, setPinAttempts] = useState(0);
    const [isResettingPin, setIsResettingPin] = useState(false);
    const [pinError, setPinError] = useState(false);
    const [activePinIndex, setActivePinIndex] = useState(0);
    const [confirmPin, setConfirmPin] = useState("");
    const [pinStep, setPinStep] = useState(1);
    const [lockoutUntil, setLockoutUntil] = useState(null);
    const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
    const shakeAnimation = useRef(new Animated.Value(0)).current;
    const navigation = useNavigation();
    
    // Firebase services
    const auth = getAuth();
    const firestore = getFirestore();

    // Check biometric availability
    useEffect(() => {
        const checkBiometrics = async () => {
            try {
                const hasHardware = await LocalAuthentication.hasHardwareAsync();
                const isEnrolled = await LocalAuthentication.isEnrolledAsync();
                setIsBiometricAvailable(hasHardware && isEnrolled);
            } catch (error) {
                console.error("Biometric check error:", error);
                logSecurityEvent("BIOMETRIC_CHECK_ERROR", error.message);
            }
        };
        checkBiometrics();
    }, []);

    // Check for lockout status
    useEffect(() => {
        const checkLockout = async () => {
            try {
                const lockoutTime = await SecureStore.getItemAsync('lockoutUntil');
                
                if (lockoutTime) {
                    const lockoutDate = new Date(parseInt(lockoutTime));
                    if (lockoutDate > new Date()) {
                        setLockoutUntil(lockoutDate);
                    } else {
                        await SecureStore.deleteItemAsync('lockoutUntil');
                    }
                }
            } catch (error) {
                console.error("Lockout check error:", error);
                logSecurityEvent("LOCKOUT_CHECK_ERROR", error.message);
            }
        };
        checkLockout();
    }, []);

    // Initialize the login state
    useEffect(() => {
        const initialize = async () => {
            try {
                const lastLogin = await SecureStore.getItemAsync('lastLogin');
                if (!lastLogin) {
                    setShowPinScreen(false);
                    setShowSetPinScreen(false);
                    return;
                }
                
                await checkForExistingUser();
            } catch (error) {
                console.error("Initialization error:", error);
                logSecurityEvent("INIT_ERROR", error.message);
            }
        };
        
        initialize();
    }, []);

    // Handle PIN input changes
    useEffect(() => {
        setActivePinIndex(pin.length);
        
        if (pin.length === PIN_LENGTH && !loading) {
            if (showPinScreen) {
                verifyPin();
            } else if (showSetPinScreen) {
                handleSetPin();
            }
        }
    }, [pin]);

    // Log security events
    const logSecurityEvent = async (eventType, details = "") => {
        try {
            const timestamp = new Date().toISOString();
            const deviceId = await SecureStore.getItemAsync('deviceId') || 'unknown';
            const userId = await SecureStore.getItemAsync('userUid') || 'unknown';
            
            const event = {
                type: eventType,
                timestamp,
                details,
                deviceId,
                userId,
                ipAddress: 'unknown'
            };
            
            console.log("SECURITY_EVENT:", event);
        } catch (error) {
            console.error("Error logging security event:", error);
        }
    };

    // Shake animation for wrong PIN attempts
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

    // Check if user exists in SecureStore
    const checkForExistingUser = async () => {
        try {
            const [storedPhone, storedUid] = await Promise.all([
                SecureStore.getItemAsync('userPhone'),
                SecureStore.getItemAsync('userUid')
            ]);
            
            if (storedPhone && storedUid) {
                const formattedDisplay = formatPhoneNumberForDisplay(storedPhone);
                setDisplayPhoneNumber(formattedDisplay);
                setPhoneNumber(storedPhone.replace('+1', ''));
                
                // Check if this user has a PIN set
                const pinHash = await SecureStore.getItemAsync(`userPinHash_${storedUid}`);
                if (pinHash) {
                    setShowPinScreen(true);
                } else {
                    setShowSetPinScreen(true);
                }
            }
        } catch (error) {
            console.log("Error checking for existing user:", error);
            logSecurityEvent("USER_CHECK_ERROR", error.message);
        }
    };

    // Format phone number for Firebase
    const formatPhoneNumber = (input) => {
        let number = input.replace(/\D/g, "");
        if (number.startsWith("0")) {
            number = number.substring(1);
        }
        return `+1${number}`;
    };

    // Format phone number for display
    const formatPhoneNumberForDisplay = (phone) => {
        const cleaned = phone.replace(/\D/g, '');
        const match = cleaned.match(/^(\d{1})(\d{3})(\d{3})(\d{4})$/);
        if (match) {
            return `+${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
        }
        return phone;
    };

    // Format phone number as user types
    const formatPhoneNumberInput = (text) => {
        let cleaned = text.replace(/\D/g, '');
        if (cleaned.startsWith('0')) {
            cleaned = cleaned.substring(1);
        }
        cleaned = cleaned.substring(0, 10);
        
        const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
        if (match) {
            let formatted = '';
            if (match[1]) formatted += match[1];
            if (match[2]) formatted += ' ' + match[2];
            if (match[3]) formatted += ' ' + match[3];
            return formatted.trim();
        }
        return text;
    };

    // Handle phone number input changes
    const handlePhoneNumberChange = (text) => {
        const formatted = formatPhoneNumberInput(text);
        setPhoneNumber(formatted);
    };

    // Handle PIN number input
    const handlePinInput = (num) => {
        if (pin.length < PIN_LENGTH && !loading) {
            setPin(prev => prev + num);
        }
    };

    // Handle PIN backspace
    const handlePinBackspace = () => {
        if (pin.length > 0 && !loading) {
            setPin(prev => prev.slice(0, -1));
        }
    };

    // Biometric authentication handler

    // Clear user session data
    const clearUserSession = async () => {
        try {
            await signOut(auth);
            await Promise.all([
                SecureStore.deleteItemAsync('userUid'),
                SecureStore.deleteItemAsync('userPhone'),
                SecureStore.deleteItemAsync('lastLogin'),
                SecureStore.deleteItemAsync('isAdmin'),
                SecureStore.deleteItemAsync('lockoutUntil')
            ]);
            
            // Note: We don't delete the PIN hash here because it's tied to the user
            // and might be needed if they log back in on the same device
        } catch (error) {
            console.log("Sign-out error:", error);
            logSecurityEvent("LOGOUT_ERROR", error.message);
        }
    };
    
    // Verify regular PIN
    const verifyPin = async () => {
        if (pin.length !== PIN_LENGTH) return;
        
        try {
            setLoading(true);
            
            const [storedUid, storedPhone] = await Promise.all([
                SecureStore.getItemAsync('userUid'),
                SecureStore.getItemAsync('userPhone')
            ]);

            if (!storedUid) {
                throw new Error("User session expired. Please login again.");
            }
    
            // Get the stored PIN hash for this user
            const salt = await generateDeviceSalt();
            const storedPinHash = await SecureStore.getItemAsync(`userPinHash_${storedUid}`);
            const currentPinHash = await hashPin(pin, salt, storedUid);
            
            if (currentPinHash !== storedPinHash) {
                handleWrongPinAttempt();
                return;
            }
    
            // Reset attempts and PIN input
            setPinAttempts(0);
            setPin("");
            
            // For regular users, proceed to dashboard
            const userDoc = await getDoc(doc(firestore, "users", storedUid));
            if (!userDoc.exists) {
                throw new Error("User record not found");
            }
            
            const userData = userDoc.data();
            
            await logSecurityEvent("USER_LOGIN_SUCCESS");
            await SecureStore.setItemAsync('lastLogin', new Date().toISOString());
            
            // Reset navigation stack completely to prevent going back
            navigation.reset({
                index: 0,
                routes: [{
                    name: "Dashboard",
                    params: { userData }
                }]
            });
            
        } catch (error) {
            console.error("PIN Verification Error:", error);
            logSecurityEvent("PIN_VERIFICATION_ERROR", error.message);
            Alert.alert(
                "Error",
                error.message || "An error occurred during login."
            );
        } finally {
            setLoading(false);
        }
    };

    // Handle wrong PIN attempts
    const handleWrongPinAttempt = async () => {
        const attemptsLeft = MAX_PIN_ATTEMPTS - pinAttempts - 1;
        
        startShake();
        
        if (attemptsLeft <= 0) {
            const lockoutTime = new Date(Date.now() + LOCKOUT_DURATION);
            setLockoutUntil(lockoutTime);
            await SecureStore.setItemAsync('lockoutUntil', lockoutTime.getTime().toString());
            
            logSecurityEvent("USER_LOCKOUT");
            
            Alert.alert(
                "Security Lock",
                "Too many failed attempts. Please sign in with OTP.",
                [{
                    text: "OK",
                    onPress: async () => {
                        await clearUserSession();
                        setShowPinScreen(false);
                        setPinAttempts(0);
                    }
                }]
            );
        } else {
            Alert.alert(
                "Incorrect PIN",
                `You have ${attemptsLeft} attempt${attemptsLeft > 1 ? 's' : ''} remaining`
            );
            setPinAttempts(prev => prev + 1);
        }
        setPin("");
    };

    // Handle phone number sign in
    const signInWithPhoneNumberHandler = async () => {
        const cleanedNumber = phoneNumber.replace(/\D/g, '');
        if (!cleanedNumber || cleanedNumber.length < 10) {
            Alert.alert("Error", "Please enter a valid 10-digit phone number.");
            return;
        }
    
        const formattedPhone = formatPhoneNumber(cleanedNumber);
    
        try {
            setLoading(true);
            Keyboard.dismiss();
    
            // Check if this is during PIN reset flow
            if (isResettingPin) {
                const confirmation = await signInWithPhoneNumber(auth, formattedPhone);
                setConfirm(confirmation);
                return;
            }
    
            // Check user role in Firestore - this replaces the ADMIN_PHONES check
            const [adminSnapshot, userSnapshot] = await Promise.all([
                getDocs(query(collection(firestore, "admins"), where("phone", "==", formattedPhone))),
                getDocs(query(collection(firestore, "users"), where("phoneNumber", "==", formattedPhone)))
            ]);
            
    
            if (!adminSnapshot.empty) {
                const adminDoc = adminSnapshot.docs[0];
                const adminData = adminDoc.data();
                
                // Verify admin phone matches database
                if (adminData.phone !== formattedPhone) {
                    Alert.alert("Unauthorized", "This phone number is not registered as an admin.");
                    return;
                }
    
                // Store admin credentials
                await Promise.all([
                    SecureStore.setItemAsync('userUid', adminDoc.id),
                    SecureStore.setItemAsync('isAdmin', 'true'),
                    SecureStore.setItemAsync('adminPhone', formattedPhone)
                ]);
                
                // Navigate to admin setup if first time
                const adminPinHash = await SecureStore.getItemAsync('adminPinHash');
                
                if (!adminPinHash) {
                    navigation.navigate("AdminSetup", { 
                        adminData,
                        phoneNumber: formattedPhone,
                        isInitialSetup: true
                    });
                    return;
                }
                
                // For existing admin, proceed with normal login flow
                await SecureStore.setItemAsync('userPhone', formattedPhone);
                setDisplayPhoneNumber(formatPhoneNumberForDisplay(formattedPhone));
                setShowPinScreen(true);
                return;
            }

            if (!userSnapshot.empty) {
                const userDoc = userSnapshot.docs[0];
                const userData = userDoc.data();
                
                // Verify user phone matches database
                if (userData.phoneNumber !== formattedPhone) {
                    Alert.alert("Verification Failed", "Phone number doesn't match user records");
                    return;
                }

                await Promise.all([
                    SecureStore.setItemAsync('userUid', userDoc.id),
                    SecureStore.setItemAsync('isAdmin', 'false'),
                    SecureStore.setItemAsync('userPhone', formattedPhone)
                ]);
                
                // Check if user has a PIN set
                const pinHash = await SecureStore.getItemAsync(`userPinHash_${userDoc.id}`);
                if (pinHash) {
                    setDisplayPhoneNumber(formatPhoneNumberForDisplay(formattedPhone));
                    setShowPinScreen(true);
                } else {
                    setShowSetPinScreen(true);
                }
                return;
            }

            // If not found, send OTP
            const confirmation = await signInWithPhoneNumber(auth, formattedPhone);
            setConfirm(confirmation);
        } catch (error) {
            logSecurityEvent("LOGIN_ERROR", error.message);
            Alert.alert("Error", error.message || "Failed to check user data. Please try again.");
            console.error("Sign in error:", error);
        } finally {
            setLoading(false);
        }
    };

    // Confirm OTP code
    const confirmCode = async () => {
        if (!code.trim()) {
            Alert.alert("OTP Required", "Please enter the verification code sent to your phone");
            return;
        }
    
        try {
            setLoading(true);
            Keyboard.dismiss();
            
            // 1. Confirm the OTP code with Firebase
            const userCredential = await confirm.confirm(code);
            const user = userCredential.user;
    
            // 2. Store essential user identifiers
            const formattedPhone = formatPhoneNumber(phoneNumber.replace(/\D/g, ''));
            await Promise.all([
                SecureStore.setItemAsync('userPhone', formattedPhone),
                SecureStore.setItemAsync('userUid', user.uid),
                SecureStore.setItemAsync('lastLogin', new Date().toISOString())
            ]);
    
            // 3. Handle PIN reset flow
            if (isResettingPin) {
                setShowSetPinScreen(true);
                setConfirm(null);
                setCode("");
                setIsResettingPin(false);
                return;
            }
    
            // 4. Check if user needs to set a PIN
            const pinHash = await SecureStore.getItemAsync(`userPinHash_${user.uid}`);
            if (!pinHash) {
                setShowSetPinScreen(true);
                return;
            }
    
            // 5. Retrieve and verify user document
            const userDoc = await getDoc(doc(firestore, "users", user.uid));
            
            if (!userDoc.exists) {
                navigation.navigate("Detail", { 
                    uid: user.uid,
                    phoneNumber: formattedPhone
                });
                return;
            }
    
            const userData = userDoc.data();
            
            // 6. Navigate to appropriate dashboard with reset stack
            navigation.reset({
                index: 0,
                routes: [{
                    name: userData.role === "admin" ? "AdminDashboard" : "Dashboard",
                    params: { userData }
                }]
            });
    
        } catch (error) {
            console.error("OTP Confirmation Error:", error);
            logSecurityEvent("OTP_ERROR", error.message);
            
            let errorMessage = "Invalid verification code";
            if (error.code === 'auth/invalid-verification-code') {
                errorMessage = "The code you entered is incorrect or expired";
            } else if (error.code === 'auth/code-expired') {
                errorMessage = "This code has expired. Please request a new one";
            }
    
            Alert.alert("Verification Failed", errorMessage, [
                { text: "OK", onPress: () => setCode("") }
            ]);
    
        } finally {
            setLoading(false);
        }
    };

    // Handle setting PIN
    const handleSetPin = async () => {
        if (pin.length !== PIN_LENGTH) return;
    
        if (pinStep === 1) {
            setConfirmPin(pin);
            setPin("");
            setPinStep(2);
            return;
        }
    
        // Verify the PIN matches
        if (pin !== confirmPin) {
            startShake();
            Alert.alert("PIN Mismatch", "The PINs you entered don't match. Please try again.");
            setPin("");
            setPinStep(1);
            return;
        }
    
        try {
            setLoading(true);
            
            // Get user UID and generate salt
            const userUid = await SecureStore.getItemAsync('userUid');
            if (!userUid) {
                throw new Error("User session expired. Please login again.");
            }
            
            const salt = await generateDeviceSalt();
            const pinHash = await hashPin(pin, salt, userUid);
            
            // Store the hashed PIN with user-specific key
            await SecureStore.setItemAsync(`userPinHash_${userUid}`, pinHash);
            
            setPin("");
            setConfirmPin("");
            setPinStep(1);
    
            // Handle PIN reset flow
            if (isResettingPin) {
                setIsResettingPin(false);
                setShowSetPinScreen(false);
                setShowPinScreen(true);
                Alert.alert("Success", "PIN has been reset successfully");
                return;
            }
    
            // Try to get user document from Firestore
            try {
                const userDoc = await getDoc(doc(firestore, "users", userUid));
                
                if (userDoc.exists) {
                    // Reset navigation stack completely to prevent going back
                    navigation.reset({
                        index: 0,
                        routes: [{
                            name: "Dashboard",
                            params: { userData: userDoc.data() }
                        }]
                    });
                } else {
                    const formattedPhone = formatPhoneNumber(phoneNumber.replace(/\D/g, ''));
                    navigation.navigate("Detail", { 
                        uid: userUid,
                        phoneNumber: formattedPhone
                    });
                }
            } catch (firestoreError) {
                console.error("Firestore error:", firestoreError);
                Alert.alert(
                    "Error",
                    "Couldn't verify your account. Please try again.",
                    [{
                        text: "OK",
                        onPress: () => {
                            clearUserSession();
                            setShowSetPinScreen(false);
                        }
                    }]
                );
            }
    
        } catch (error) {
            console.error("Set PIN error:", error);
            Alert.alert(
                "Error",
                error.message || "Failed to set PIN. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    // Handle forgot PIN flow
    const handleForgotPin = () => {
        Alert.alert(
            "Reset PIN",
            "To reset your PIN, we need to verify your phone number again.",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                    onPress: () => {}
                },
                {
                    text: "Continue",
                    onPress: () => {
                        setIsResettingPin(true);
                        setShowPinScreen(false);
                        signInWithPhoneNumberHandler();
                    }
                }
            ]
        );
    };

  // Update the skipLogin function to reset navigation stack
const skipLogin = () => {
    navigation.reset({
        index: 0,
        routes: [{ name: "Dashboard" }]
    });
};

    // Render phone input screen
    const renderPhoneInput = () => (
        <>
            <TextInput
                label="Phone Number"
                mode="outlined"
                value={phoneNumber}
                onChangeText={handlePhoneNumberChange}
                keyboardType="phone-pad"
                autoCompleteType="tel"
                textContentType="telephoneNumber"
                left={
                    <TextInput.Icon
                        icon={() => <MaterialCommunityIcons name="phone" size={24} color="#003580" />}
                    />
                }
                style={styles.input}
                outlineColor="#003580"
                activeOutlineColor="#002B5C"
                placeholder="912 345 6789"
                maxLength={12}
                disabled={loading}
            />

            <Button
                mode="contained"
                onPress={signInWithPhoneNumberHandler}
                style={[styles.button, (loading || phoneNumber.replace(/\D/g, '').length < 10) && styles.buttonDisabled]}
                labelStyle={styles.buttonText}
                disabled={loading || phoneNumber.replace(/\D/g, '').length < 10}
            >
                {loading ? <ActivityIndicator color="white" size="small" /> : "Send Code"}
            </Button>
        </>
    );

    // Render OTP input screen
    const renderOTPInput = () => (
        <>
            <Text style={styles.otpSentText}>
                Code sent to {formatPhoneNumberForDisplay(formatPhoneNumber(phoneNumber.replace(/\D/g, '')))}
            </Text>
            
            <TextInput
                label="Enter OTP Code"
                mode="outlined"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                autoCompleteType="sms-otp"
                textContentType="oneTimeCode"
                left={
                    <TextInput.Icon
                        icon={() => <MaterialCommunityIcons name="lock" size={24} color="#003580" />}
                    />
                }
                style={styles.input}
                outlineColor="#003580"
                activeOutlineColor="#002B5C"
                disabled={loading}
            />
    
            <Button
                mode="contained"
                onPress={confirmCode}
                style={[styles.button, loading && styles.buttonDisabled]}
                labelStyle={styles.buttonText}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="white" size="small" /> : "Verify OTP"}
            </Button>
            
            <TouchableOpacity 
                onPress={() => {
                    setConfirm(null);
                    setCode("");
                    if (isResettingPin) {
                        setShowPinScreen(true);
                        setIsResettingPin(false);
                    }
                }}
                disabled={loading}
            >
                <Text style={[styles.changeNumberLink, loading && styles.disabledLink]}>
                    {isResettingPin ? "Go Back" : "Change phone number"}
                </Text>
            </TouchableOpacity>
        </>
    );

    // Render PIN input screen
    const renderPinInput = () => (
        <View style={styles.pinScreenContainer}>
            <Text style={styles.pinTitle}>Enter your {PIN_LENGTH}-digit PIN</Text>
            <Text style={styles.phoneNumberText}>{displayPhoneNumber}</Text>
            
            <Animated.View style={{ transform: [{ translateX: shakeAnimation }] }}>
              <PinInput 
                pin={pin} 
                length={PIN_LENGTH} 
                activeIndex={activePinIndex}
                error={pinError}
                loading={loading}
              />
            </Animated.View>
    
    
            <View style={styles.pinActionsContainer}>
                <Button 
                    mode="text" 
                    onPress={handleForgotPin}
                    style={styles.forgotPinButton}
                    labelStyle={styles.pinActionText}
                    disabled={loading}
                >
                    Forgot PIN?
                </Button>
                <Button 
                    mode="text" 
                    onPress={() => {
                        setPin("");
                        setShowPinScreen(false);
                    }}
                    style={styles.changeNumberButton}
                    labelStyle={styles.pinActionText}
                    disabled={loading}
                >
                    Change number
                </Button>
            </View>
    
            <NumberPad 
              onPress={handlePinInput} 
              onBackspace={handlePinBackspace} 
              disabled={loading}
            />
        </View>
    );

    // Render set PIN screen
    const renderSetPinScreen = () => (
        <View style={styles.pinScreenContainer}>
            <Text style={styles.pinTitle}>
                {pinStep === 1 
                    ? `Set your ${PIN_LENGTH}-digit PIN`
                    : `Confirm your ${PIN_LENGTH}-digit PIN`}
            </Text>
            <Text style={styles.pinSubtitle}>
                {pinStep === 1
                    ? "This PIN will be used for quick login on this device"
                    : "Re-enter your PIN to confirm"}
            </Text>
            
            <PinInput 
              pin={pin} 
              length={PIN_LENGTH} 
              activeIndex={activePinIndex}
              error={pinError}
              loading={loading}
            />
    
            <NumberPad 
              onPress={handlePinInput} 
              onBackspace={handlePinBackspace} 
              disabled={loading}
            />
    
            <TouchableOpacity 
                onPress={() => {
                    if (pinStep === 2) {
                        setPinStep(1);
                        setPin("");
                    } else {
                        setShowSetPinScreen(false);
                        if (isResettingPin) {
                            setShowPinScreen(true);
                        }
                    }
                }}
                disabled={loading}
                style={styles.backButton}
            >
                <MaterialCommunityIcons name="arrow-left" size={24} color="#003580" />
                <Text style={styles.backButtonText}>
                    {pinStep === 2 ? "Re-enter PIN" : "Go Back"}
                </Text>
            </TouchableOpacity>
        </View>
    );

    // Main render function
    return (
        <View style={styles.container}>
            <Image source={require("../../assets/cong.png")} style={styles.logo} />
            <Text style={styles.title}>Welcome to MUNTINLUPA DISTRICT OFFICE</Text>
            <Text style={styles.description}>
                {showPinScreen 
                    ? "Enter your PIN for quick access"
                    : showSetPinScreen
                        ? "Create a secure PIN for this device"
                        : "Securely sign in with your phone number. A one-time password (OTP) will be sent via SMS."
                }
            </Text>

            {showPinScreen 
                ? renderPinInput()
                : showSetPinScreen
                    ? renderSetPinScreen()
                    : confirm
                        ? renderOTPInput()
                        : renderPhoneInput()
            }

            <Text style={styles.footerText}>
                Need help? <Text style={styles.link}>Contact Support</Text>
            </Text>
        </View>
    );
}
