import React, { useState, useEffect, useRef } from "react";
import { View, Text, Alert, StyleSheet, Dimensions, Image, TouchableOpacity, Keyboard, Animated } from "react-native";
import { TextInput, Button, ActivityIndicator } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from 'expo-secure-store';
import { getAuth, signInWithPhoneNumber, signOut } from "@react-native-firebase/auth";
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from "@react-native-firebase/firestore";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const { width, height } = Dimensions.get("window");

// PIN-related constants
const MAX_PIN_ATTEMPTS = 5;
const PIN_LENGTH = 6;

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
            <MaterialCommunityIcons name="backspace-outline" size={24} color={disabled ? "#ccc" : "#003580"} />
          ) : (
            <Text style={[styles.numberText, disabled && styles.disabledText]}>{num}</Text>
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
    const [isChangingNumber, setIsChangingNumber] = useState(false);
    const [pinError, setPinError] = useState(false);
    const [activePinIndex, setActivePinIndex] = useState(0);
    const shakeAnimation = useRef(new Animated.Value(0)).current;
    const navigation = useNavigation();
    
    // Initialize Firebase services
    const auth = getAuth();
    const firestore = getFirestore();
    

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

   // In your Login component

useEffect(() => {
    const initialize = async () => {
        try {
            // First check if we should show intro
            await checkIfFirstLaunch();
            
            // Then check auth state
            const lastLogin = await SecureStore.getItemAsync('lastLogin');
            if (!lastLogin) {
                setShowPinScreen(false);
                setShowSetPinScreen(false);
                return;
            }
            
            // Then proceed with normal initialization
            await checkForExistingUser();
        } catch (error) {
            console.error("Initialization error:", error);
        }
    };
    
    initialize();
}, []);

useEffect(() => {
    setActivePinIndex(pin.length);
    
    // Only proceed if we're not already loading and PIN is complete
    if (pin.length === PIN_LENGTH && !loading) {
        if (showPinScreen) {
            verifyPin();
        } else if (showSetPinScreen) {
            handleSetPin();
        }
    }
}, [pin]);

const checkIfFirstLaunch = async () => {
    try {
        const hasLaunchedBefore = await AsyncStorage.getItem("hasLaunchedBefore");
        if (!hasLaunchedBefore) {
            // Mark as launched and show intro
            await AsyncStorage.setItem("hasLaunchedBefore", "true");
            await AsyncStorage.setItem("hasSeenIntro", "false");
            navigation.replace("Intro");
        } else {
            // Check if they've seen intro (for cases where they might have skipped)
            const hasSeenIntro = await AsyncStorage.getItem("hasSeenIntro");
            if (hasSeenIntro === "false") {
                navigation.replace("Intro");
            }
        }
    } catch (error) {
        console.log("Error checking first launch:", error);
        // Default to showing intro if there's an error
        navigation.replace("Intro");
    }
};
    const checkForExistingUser = async () => {
        try {
            const storedPhone = await SecureStore.getItemAsync('userPhone');
            const storedPin = await SecureStore.getItemAsync('userPin');
            const storedUid = await SecureStore.getItemAsync('userUid');
            
            if (storedPhone && storedPin && storedUid) {
                // Format phone number for display (e.g., +1 912 345 6789)
                const formattedDisplay = formatPhoneNumberForDisplay(storedPhone);
                setDisplayPhoneNumber(formattedDisplay);
                setPhoneNumber(storedPhone.replace('+1', ''));
                setShowPinScreen(true);
            }
        } catch (error) {
            console.log("Error checking for existing user:", error);
        }
    };

    const formatPhoneNumber = (input) => {
        let number = input.replace(/\D/g, "");
        if (number.startsWith("0")) {
            number = number.substring(1);
        }
        return `+1${number}`;
    };

    const formatPhoneNumberForDisplay = (phone) => {
        // Format as +1 912 345 6789
        const cleaned = phone.replace(/\D/g, '');
        const match = cleaned.match(/^(\d{1})(\d{3})(\d{3})(\d{4})$/);
        if (match) {
            return `+${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
        }
        return phone;
    };

    const formatPhoneNumberInput = (input) => {
        // Format as user types: 0912 345 6789
        let cleaned = input.replace(/\D/g, '');
        
        // Remove leading 0 if present
        if (cleaned.startsWith('0')) {
            cleaned = cleaned.substring(1);
        }
        
        // Limit to 10 digits
        cleaned = cleaned.substring(0, 10);
        
        const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
        if (match) {
            let formatted = '';
            if (match[1]) formatted += match[1];
            if (match[2]) formatted += ' ' + match[2];
            if (match[3]) formatted += ' ' + match[3];
            return formatted.trim();
        }
        return input;
    };

    const handlePhoneNumberChange = (text) => {
        const formatted = formatPhoneNumberInput(text);
        setPhoneNumber(formatted);
    };

    const handlePinInput = (num) => {
      if (pin.length < PIN_LENGTH && !loading) {
        setPin(prev => prev + num);
      }
    };

    const handlePinBackspace = () => {
      if (pin.length > 0 && !loading) {
        setPin(prev => prev.slice(0, -1));
      }
    };

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

            // Check if this is during PIN reset or number change flow
            if (isResettingPin || isChangingNumber) {
                const confirmation = await signInWithPhoneNumber(auth, formattedPhone);
                setConfirm(confirmation);
                return;
            }

            // Check user role in Firestore
            const [adminSnapshot, userSnapshot] = await Promise.all([
                getDocs(query(collection(firestore, "admin"), where("phone", "==", formattedPhone))),
                getDocs(query(collection(firestore, "users"), where("phoneNumber", "==", formattedPhone)))
            ]);

            if (!adminSnapshot.empty) {
                const adminData = adminSnapshot.docs[0].data();
                await SecureStore.setItemAsync('userUid', adminSnapshot.docs[0].id);
                navigation.navigate("AdminDashboard", { userData: adminData });
                return;
            }

            if (!userSnapshot.empty) {
                const userData = userSnapshot.docs[0].data();
                await SecureStore.setItemAsync('userUid', userSnapshot.docs[0].id);
                navigation.navigate("Dashboard", { userData });
                return;
            }

            // If not found, send OTP
            const confirmation = await signInWithPhoneNumber(auth, formattedPhone);
            setConfirm(confirmation);
        } catch (error) {
            Alert.alert("Error", error.message || "Failed to check user data. Please try again.");
            console.error("Sign in error:", error);
        } finally {
            setLoading(false);
        }
    };

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
            
            // 4. Handle phone number change flow
            if (isChangingNumber) {
                // Clear existing PIN since it's a new number
                await SecureStore.deleteItemAsync('userPin');
                setShowSetPinScreen(true);
                setConfirm(null);
                setCode("");
                setIsChangingNumber(false);
                return;
            }
    
            // 5. Check if user needs to set a PIN
            const hasPin = await SecureStore.getItemAsync('userPin');
            if (!hasPin) {
                setShowSetPinScreen(true);
                return;
            }
    
            // 6. Retrieve and verify user document
            const userDoc = await getDoc(doc(firestore, "users", user.uid));
            
            if (!userDoc.exists) {
                navigation.navigate("Detail", { 
                    uid: user.uid,
                    phoneNumber: formattedPhone
                });
                return;
            }
    
            const userData = userDoc.data();
            
            // 7. Navigate to appropriate dashboard
            navigation.reset({
                index: 0,
                routes: [{
                    name: userData.role === "admin" ? "AdminDashboard" : "Dashboard",
                    params: { userData }
                }]
            });
    
        } catch (error) {
            console.error("OTP Confirmation Error:", error);
            
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

    const handleSetPin = async () => {
        if (pin.length !== PIN_LENGTH) return;
    
        try {
            setLoading(true);
            
            // 1. First store the PIN
            await SecureStore.setItemAsync('userPin', pin);
            setPin("");
    
            // 2. Handle PIN reset flow
            if (isResettingPin) {
                setIsResettingPin(false);
                setShowSetPinScreen(false);
                setShowPinScreen(true);
                Alert.alert("Success", "PIN has been reset successfully");
                return;
            }
    
            // 3. Get user UID with proper error handling
            const userUid = await SecureStore.getItemAsync('userUid');
            
            if (!userUid) {
                console.warn("No UID found in SecureStore");
                // If we don't have a UID, we need to get one
                const formattedPhone = formatPhoneNumber(phoneNumber.replace(/\D/g, ''));
                navigation.navigate("Detail", { phoneNumber: formattedPhone });
                return;
            }
    
            // 4. Try to get user document from Firestore
            try {
                const userDoc = await getDoc(doc(firestore, "users", userUid));
                
                if (userDoc.exists) {
                    navigation.navigate("Dashboard", { userData: userDoc.data() });
                } else {
                    // If document doesn't exist, go to detail screen
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
    const verifyPin = async () => {
        if (pin.length !== PIN_LENGTH) {
            return;
        }
        
        try {
            setLoading(true);
            
            // 1. Retrieve stored credentials
            const [storedPin, storedUid, storedPhone] = await Promise.all([
                SecureStore.getItemAsync('userPin'),
                SecureStore.getItemAsync('userUid'),
                SecureStore.getItemAsync('userPhone')
            ]);
    
            // 2. Verify PIN
            if (pin !== storedPin) {
                handleWrongPinAttempt();
                return;
            }
    
            // 3. Reset attempts and PIN input
            setPinAttempts(0);
            setPin("");
    
            // 4. Get user data directly from Firestore
            let userData = null;
            
            // Try with UID first
            if (storedUid) {
                const userDoc = await getDoc(doc(firestore, "users", storedUid));
                if (userDoc.exists) {
                    userData = userDoc.data();
                    
                    // Update last login time
                    await SecureStore.setItemAsync('lastLogin', new Date().toISOString());
                    
                    navigation.reset({
                        index: 0,
                        routes: [{
                            name: userData.role === "admin" ? "AdminDashboard" : "Dashboard",
                            params: { userData }
                        }]
                    });
                    return;
                }
            }
    
            // Fallback to phone number if UID fails
            if (storedPhone) {
                const querySnapshot = await getDocs(
                    query(
                        collection(firestore, "users"),
                        where("phoneNumber", "==", storedPhone)
                    )
                );
    
                if (!querySnapshot.empty) {
                    const userDoc = querySnapshot.docs[0];
                    userData = userDoc.data();
                    
                    // Update stored UID for future logins
                    await SecureStore.setItemAsync('userUid', userDoc.id);
                    
                    navigation.reset({
                        index: 0,
                        routes: [{
                            name: userData.role === "admin" ? "AdminDashboard" : "Dashboard",
                            params: { userData }
                        }]
                    });
                    return;
                }
            }
    
            // If no user data found, require fresh OTP login
            Alert.alert(
                "Session Expired",
                "Couldn't retrieve your account. Please sign in with OTP.",
                [{ text: "OK", onPress: () => {
                    clearUserSession();
                    setShowPinScreen(false);
                }}]
            );
    
        } catch (error) {
            console.error("PIN Verification Error:", error);
            Alert.alert(
                "Error",
                error.message || "An error occurred during login. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };
    
    const clearUserSession = async () => {
        try {
            await signOut(getAuth());
            await Promise.all([
                SecureStore.deleteItemAsync('userPin'),
                SecureStore.deleteItemAsync('userUid'),
                SecureStore.deleteItemAsync('userPhone'),
                SecureStore.deleteItemAsync('lastLogin'),
                SecureStore.deleteItemAsync('firebaseAuthToken')
            ]);
        } catch (signOutError) {
            console.log("Sign-out error:", signOutError);
        }
    };
    
    const handleWrongPinAttempt = async () => {
        const attemptsLeft = MAX_PIN_ATTEMPTS - pinAttempts - 1;
        
        startShake();
        
        if (attemptsLeft <= 0) {
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

    const handleForgotPin = () => {
        Alert.alert(
            "Reset PIN",
            "To reset your PIN, we need to verify your phone number again.",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                    onPress: () => {} // Just dismiss the alert
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
    const handleChangeNumber = () => {
        Alert.alert(
            "Change Phone Number",
            "You'll need to verify a new phone number.",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                    onPress: () => {} // Just dismiss the alert
                },
                {
                    text: "Continue",
                    onPress: () => {
                        setIsChangingNumber(true);
                        setShowPinScreen(false);
                    }
                }
            ]
        );
    };

    const skipLogin = () => {
        navigation.navigate("Dashboard");
    };

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
                maxLength={12} // For formatted number (3 + 3 + 4 digits with spaces)
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
                    // Return to appropriate screen based on flow
                    if (isResettingPin || isChangingNumber) {
                        setShowPinScreen(true);
                        setIsResettingPin(false);
                        setIsChangingNumber(false);
                    }
                }}
                disabled={loading}
            >
                <Text style={[styles.changeNumberLink, loading && styles.disabledLink]}>
                    {isResettingPin || isChangingNumber ? "Go Back" : "Change phone number"}
                </Text>
            </TouchableOpacity>
        </>
    );

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
                    onPress={handleChangeNumber}
                    style={styles.changeNumberButton}
                    labelStyle={styles.pinActionText}
                    disabled={loading}
                >
                    change Number?
                </Button>
            </View>
    
            <NumberPad 
              onPress={handlePinInput} 
              onBackspace={handlePinBackspace} 
              disabled={loading}
            />
        </View>
    );

    const renderSetPinScreen = () => (
        <View style={styles.pinScreenContainer}>
            <Text style={styles.pinTitle}>Set your {PIN_LENGTH}-digit PIN</Text>
            <Text style={styles.pinSubtitle}>This PIN will be used for quick login on this device</Text>
            
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
                    setShowSetPinScreen(false);
                    if (isResettingPin || isChangingNumber) {
                        setShowPinScreen(true);
                    }
                }}
                disabled={loading}
                style={styles.backButton}
            >
                <MaterialCommunityIcons name="arrow-left" size={24} color="#003580" />
                <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
        </View>
    );

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

            {!showPinScreen && !showSetPinScreen && !confirm && (
                <Button 
                    mode="text" 
                    onPress={skipLogin} 
                    style={styles.skipButton} 
                    labelStyle={styles.skipButtonText}
                    disabled={loading}
                >
                    Skip for Now
                </Button>
            )}

            <Text style={styles.footerText}>
                Need help? <Text style={styles.link}>Contact Support</Text>
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#fff",
    },
    pinScreenContainer: {
        width: '100%',
        alignItems: 'center',
    },
    logo: {
        width: 100,
        height: 100,
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 10,
        textAlign: "center",
        color: "#003580",
    },
    pinTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 5,
        textAlign: "center",
        color: "#003580",
    },
    phoneNumberText: {
        fontSize: 16,
        color: "#003580",
        textAlign: "center",
        marginBottom: 30,
    },
    otpSentText: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        marginBottom: 10,
    },
    pinSubtitle: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        marginBottom: 30,
    },
    description: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        marginBottom: 10,
    },
    input: {
        width: "100%",
        marginBottom: 20,
    },
    button: {
        width: "100%",
        paddingVertical: 8,
        backgroundColor: "#003580",
    },
    buttonDisabled: {
        backgroundColor: "#ccc",
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
    },
    skipButton: {
        marginTop: 10,
    },
    pinContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 40,
    },
    pinCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#003580',
        marginHorizontal: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pinCircleFilled: {
        backgroundColor: '#003580',
    },
    pinCircleActive: {
        borderWidth: 2,
        borderColor: '#002B5C',
    },
    pinCircleError: {
        borderColor: '#FF3B30',
    },
    pinCircleLoading: {
        borderColor: '#ccc',
    },
    pinDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#fff',
    },
    pinActionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 30,
    },
    forgotPinButton: {
        paddingHorizontal: 0,
    },
    changeNumberButton: {
        paddingHorizontal: 0,
    },
    pinActionText: {
        color: "#003580",
        fontSize: 14,
    },
    changeNumberLink: {
        color: "#003580",
        textAlign: 'center',
        marginTop: 15,
        textDecorationLine: 'underline',
    },
    disabledLink: {
        color: '#ccc',
    },
    skipButtonText: {
        color: "#003580",
    },
    footerText: {
        marginTop: 20,
        fontSize: 12,
        color: "#666",
    },
    link: {
        color: "#003580",
        textDecorationLine: "underline",
    },
    numberPad: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        width: '100%',
        maxWidth: 300,
    },
    numberButton: {
        width: 80,
        height: 50,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 10,
        backgroundColor: '#f5f5f5',
    },
    emptyButton: {
        backgroundColor: 'transparent',
    },
    backspaceButton: {
        backgroundColor: '#f5f5f5',
    },
    disabledButton: {
        backgroundColor: '#f9f9f9',
    },
    numberText: {
        fontSize: 24,
        color: '#003580',
    },
    disabledText: {
        color: '#ccc',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
    },
    backButtonText: {
        color: "#003580",
        marginLeft: 5,
        fontSize: 16,
    },
});