import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Keyboard, Animated, Image, Dimensions } from 'react-native';
import { Button, ActivityIndicator, TextInput } from 'react-native-paper';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { MaterialIcons } from '@expo/vector-icons';
import { getAuth, signInWithPhoneNumber } from "@react-native-firebase/auth";
import { StatusBar } from 'expo-status-bar';
import { getFirestore, doc, getDoc } from "@react-native-firebase/firestore";
import styles from './styles/AdminSetupStyles';

// Constants
const ADMIN_PIN_LENGTH = 6;
const MAX_PIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes
const { width } = Dimensions.get('window');
const PIN_CIRCLE_SIZE = width > 380 ? 20 : 16;
const NUM_PAD_BUTTON_SIZE = width > 380 ? 70 : 60;

export default function AdminSetup({ route, navigation }) {
    const { phoneNumber } = route.params;
    
    // Authentication state
    const [authState, setAuthState] = useState({
        isAuthenticated: false,
        phoneVerified: false,
        hasExistingPin: false,
        lockoutUntil: null,
        pinAttempts: 0,
        isResettingPin: false
    });
    
    // PIN state
    const [adminPin, setAdminPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [step, setStep] = useState(0); // 0 = phone auth, 1 = create pin, 2 = confirm pin
    
    // Verification state
    const [confirmation, setConfirmation] = useState(null);
    const [verificationCode, setVerificationCode] = useState('');
    
    // UI state
    const [loading, setLoading] = useState(false);
    const [phoneAuthLoading, setPhoneAuthLoading] = useState(false);
    const [pinError, setPinError] = useState(false);
    const [activePinIndex, setActivePinIndex] = useState(0);
    
    // Animations
    const shakeAnimation = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    
    const auth = getAuth();
    const firestore = getFirestore();

    // Initialize on mount
    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();

        checkAuthState();
    }, []);

    // Check authentication state
    const checkAuthState = async () => {
        try {
            const userId = await SecureStore.getItemAsync('userUid');
            if (!userId) {
                navigation.navigate('Login');
                return;
            }
            
            // Check for existing PIN
            const existingPin = await SecureStore.getItemAsync(`adminPinHash_${userId}`);
            const lockoutStatus = await checkLockoutStatus(userId);
            
            setAuthState(prev => ({
                ...prev,
                hasExistingPin: !!existingPin,
                lockoutUntil: lockoutStatus
            }));
            
            // Start phone auth if not locked out
            if (!lockoutStatus) {
                await handleInitialAuthentication();
            }
        } catch (error) {
            console.error("Error checking auth state:", error);
            Alert.alert("Error", "Failed to check authentication status");
        }
    };

    // Check if user is locked out
    const checkLockoutStatus = async (userId) => {
        const lockoutTime = await SecureStore.getItemAsync(`adminLockoutUntil_${userId}`);
        if (lockoutTime) {
            const lockoutDate = new Date(parseInt(lockoutTime));
            return lockoutDate > new Date() ? lockoutDate : null;
        }
        return null;
    };

    // Handle phone number verification
    const handleInitialAuthentication = async () => {
        try {
            setPhoneAuthLoading(true);
            const formattedPhone = `+1${phoneNumber.replace(/\D/g, '')}`;
            const confirmation = await signInWithPhoneNumber(auth, formattedPhone);
            setConfirmation(confirmation);
        } catch (error) {
            console.error("Phone verification error:", error);
            Alert.alert("Authentication Error", "Failed to send verification code. Please try again.");
        } finally {
            setPhoneAuthLoading(false);
        }
    };

    // Verify SMS code
    const verifyAuthCode = async () => {
        try {
            setPhoneAuthLoading(true);
            await confirmation.confirm(verificationCode);
            
            // Mark phone as verified
            setAuthState(prev => ({
                ...prev,
                phoneVerified: true
            }));
            
            setConfirmation(null);
            setVerificationCode('');
            
            // For new admins, proceed to PIN creation
            if (!authState.hasExistingPin) {
                setStep(1); // Show PIN creation screen
            }
            
        } catch (error) {
            console.error("Code verification error:", error);
            Alert.alert("Error", "Invalid verification code. Please try again.");
        } finally {
            setPhoneAuthLoading(false);
        }
    };

    // Handle PIN input
    const handlePinInput = (num) => {
        if (adminPin.length < ADMIN_PIN_LENGTH && !loading) {
            setAdminPin(prev => prev + num);
        }
    };

    // Handle backspace
    const handlePinBackspace = () => {
        if (adminPin.length > 0 && !loading) {
            setAdminPin(prev => prev.slice(0, -1));
        }
    };

    // Verify admin PIN
    const handleVerifyAdminPin = async () => {
        try {
            setLoading(true);
            const userId = await SecureStore.getItemAsync('userUid');
            if (!userId) {
                throw new Error("User session expired. Please login again.");
            }
            
            const storedPinHash = await SecureStore.getItemAsync(`adminPinHash_${userId}`);
            if (!storedPinHash) {
                Alert.alert("No PIN Found", "No admin PIN found. Please setup a new PIN.");
                setAuthState(prev => ({ ...prev, hasExistingPin: false }));
                return;
            }

            const salt = await generateDeviceSalt();
            const currentPinHash = await hashPin(adminPin, salt, userId);
            
            if (currentPinHash !== storedPinHash) {
                handleWrongPinAttempt();
                return;
            }

            // Successful verification
            setAuthState(prev => ({
                ...prev,
                pinAttempts: 0,
                isAuthenticated: true
            }));
            
            await SecureStore.deleteItemAsync(`adminLockoutUntil_${userId}`);
            
            navigation.reset({
                index: 0,
                routes: [{ name: 'AdminDashboard' }]
            });
        } catch (error) {
            console.error("PIN verification error:", error);
            Alert.alert("Verification Error", "We couldn't verify your PIN. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Handle wrong PIN attempts
    const handleWrongPinAttempt = async () => {
        const attemptsLeft = MAX_PIN_ATTEMPTS - authState.pinAttempts - 1;
        
        startShake();
        
        if (attemptsLeft <= 0) {
            const userId = await SecureStore.getItemAsync('userUid');
            const lockoutTime = new Date(Date.now() + LOCKOUT_DURATION);
            
            await SecureStore.setItemAsync(
                `adminLockoutUntil_${userId}`, 
                lockoutTime.getTime().toString()
            );
            
            setAuthState(prev => ({
                ...prev,
                lockoutUntil: lockoutTime,
                pinAttempts: 0
            }));
            
            Alert.alert(
                "Security Lock",
                "Too many failed attempts. Please verify your identity to continue."
            );
        } else {
            Alert.alert(
                "Incorrect PIN",
                `You have ${attemptsLeft} attempt${attemptsLeft > 1 ? 's' : ''} remaining`
            );
            
            setAuthState(prev => ({
                ...prev,
                pinAttempts: prev.pinAttempts + 1
            }));
        }
        
        setAdminPin('');
    };

    // Setup new admin PIN
    const handleSetupAdminPin = async () => {
        if (adminPin !== confirmPin) {
            startShake();
            Alert.alert("PIN Mismatch", "The PINs you entered don't match. Please try again.");
            setStep(1);
            setAdminPin('');
            return;
        }

        try {
            setLoading(true);
            const userId = await SecureStore.getItemAsync('userUid');
            if (!userId) {
                throw new Error("User session expired. Please login again.");
            }
            
            const salt = await generateDeviceSalt();
            const pinHash = await hashPin(adminPin, salt, userId);
            
            await SecureStore.setItemAsync(`adminPinHash_${userId}`, pinHash);
            
            setAuthState(prev => ({
                ...prev,
                isAuthenticated: true,
                hasExistingPin: true,
                pinAttempts: 0
            }));
            
            await SecureStore.deleteItemAsync(`adminLockoutUntil_${userId}`);
            
            navigation.reset({
                index: 0,
                routes: [{ name: 'AdminDashboard' }]
            });
        } catch (error) {
            console.error("Admin setup error:", error);
            Alert.alert("Setup Failed", "We couldn't complete your admin setup. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Forgot PIN flow
    const handleForgotPin = async () => {
        Alert.alert(
            "Reset Admin PIN",
            "To reset your admin PIN, we need to verify your identity with your phone number. A verification code will be sent.",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Continue", 
                    onPress: async () => {
                        try {
                            setAuthState(prev => ({
                                ...prev,
                                isResettingPin: true,
                                phoneVerified: false // Force re-authentication
                            }));
                            
                            setPhoneAuthLoading(true);
                            const formattedPhone = `+1${phoneNumber.replace(/\D/g, '')}`;
                            const confirmation = await signInWithPhoneNumber(auth, formattedPhone);
                            setConfirmation(confirmation);
                        } catch (error) {
                            console.error("Phone verification error:", error);
                            Alert.alert("Verification Error", "Failed to send verification code. Please try again.");
                            setAuthState(prev => ({
                                ...prev,
                                isResettingPin: false
                            }));
                        } finally {
                            setPhoneAuthLoading(false);
                        }
                    } 
                }
            ]
        );
    };

    // Reset PIN after verification
    const resetAdminPin = async () => {
        try {
            setPhoneAuthLoading(true);
            await confirmation.confirm(verificationCode);
            
            const userId = await SecureStore.getItemAsync('userUid');
            if (!userId) {
                throw new Error("User session expired. Please login again.");
            }
            
            // Clear existing PIN and lockout status
            await SecureStore.deleteItemAsync(`adminPinHash_${userId}`);
            await SecureStore.deleteItemAsync(`adminLockoutUntil_${userId}`);
            
            // Reset state
            setAuthState(prev => ({
                ...prev,
                hasExistingPin: false,
                isResettingPin: false,
                pinAttempts: 0,
                lockoutUntil: null,
                phoneVerified: true
            }));
            
            setConfirmation(null);
            setVerificationCode('');
            setAdminPin('');
            setStep(1); // Go to PIN creation
            
            Alert.alert("Success", "You can now set a new admin PIN.");
        } catch (error) {
            console.error("Code verification error:", error);
            Alert.alert("Error", "Invalid verification code. Please try again.");
            setAuthState(prev => ({
                ...prev,
                isResettingPin: false
            }));
        } finally {
            setPhoneAuthLoading(false);
        }
    };

    // Shake animation for errors
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

    // Security helper functions
    const generateDeviceSalt = async () => {
        let salt = await SecureStore.getItemAsync('deviceSalt');
        if (!salt) {
            const randomBytes = new Uint8Array(16);
            await Crypto.getRandomValues(randomBytes);
            salt = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
            await SecureStore.setItemAsync('deviceSalt', salt);
        }
        return salt;
    };

    const hashPin = async (pin, salt, userId) => {
        const encoder = new TextEncoder();
        const keyMaterial = await Crypto.digest(
            'SHA-256',
            encoder.encode(pin + salt + userId)
        );
        return Array.from(new Uint8Array(keyMaterial)).map(b => b.toString(16).padStart(2, '0')).join('');
    };

    // Auto-submit when PIN is complete
    useEffect(() => {
        setActivePinIndex(adminPin.length);
        
        if (adminPin.length === ADMIN_PIN_LENGTH && !loading) {
            if (authState.hasExistingPin) {
                handleVerifyAdminPin();
            } else if (step === 1) {
                setStep(2);
                setConfirmPin(adminPin);
                setAdminPin('');
            } else if (step === 2) {
                handleSetupAdminPin();
            }
        }
    }, [adminPin]);

    // Render different screens based on auth state
    // Render different screens based on auth state
if (authState.lockoutUntil) {
    return (
        <LockoutScreen 
            lockoutUntil={authState.lockoutUntil} 
            onForgotPin={handleForgotPin} 
        />
    );
}

if (!authState.phoneVerified || (authState.isResettingPin && !authState.phoneVerified)) {
    return confirmation ? (
        <PhoneVerificationScreen 
            verificationCode={verificationCode}
            setVerificationCode={setVerificationCode}
            onVerify={authState.isResettingPin ? resetAdminPin : verifyAuthCode}
            onCancel={() => {
                setConfirmation(null);
                setVerificationCode('');
                setAuthState(prev => ({
                    ...prev,
                    isResettingPin: false
                }));
            }}
            loading={phoneAuthLoading}
            isResetting={authState.isResettingPin}
        />
    ) : (
        <InitialAuthScreen 
            onAuthenticate={handleInitialAuthentication} 
            loading={phoneAuthLoading}
        />
    );
}

if (authState.hasExistingPin) {
    return (
        <PinEntryScreen 
            pin={adminPin}
            onPinInput={handlePinInput}
            onBackspace={handlePinBackspace}
            onForgotPin={handleForgotPin}
            loading={loading}
            error={pinError}
            shakeAnimation={shakeAnimation}
            activePinIndex={activePinIndex}
        />
    );
}

return (
    <PinCreationScreen 
        step={step}
        pin={adminPin}
        onPinInput={handlePinInput}
        onBackspace={handlePinBackspace}
        loading={loading}
        error={pinError}
        shakeAnimation={shakeAnimation}
        activePinIndex={activePinIndex}
        onBack={() => {
            setStep(1);
            setAdminPin('');
        }}
    />
);
}

// Sub-components
const HeaderSection = () => (
    <>
        <StatusBar style="dark" />
        <View style={styles.headerContainer}>
            <Image 
                source={require('../../assets/cong.png')} 
                style={styles.logo} 
                resizeMode="contain"
            />
        </View>
    </>
);

const LockoutScreen = ({ lockoutUntil, onForgotPin }) => {
    const minutesLeft = Math.ceil((lockoutUntil - new Date()) / 60000);
    
    return (
        <View style={styles.container}>
            <HeaderSection />
            <View style={styles.content}>
                <View style={styles.lockIconContainer}>
                    <MaterialIcons name="lock" size={60} color="#0033A0" />
                </View>
                <Text style={styles.title}>Account Locked</Text>
                <Text style={styles.subtitle}>
                    Too many incorrect attempts. Please try again in {minutesLeft} minute{minutesLeft !== 1 ? 's' : ''}.
                </Text>
            </View>
            <View style={styles.footer}>
                <Button 
                    mode="contained" 
                    onPress={onForgotPin}
                    style={styles.primaryButton}
                    labelStyle={styles.buttonLabel}
                    icon="phone-message"
                >
                    Verify Identity
                </Button>
            </View>
        </View>
    );
};

const InitialAuthScreen = ({ onAuthenticate, loading }) => (
    <View style={styles.container}>
        <HeaderSection />
        <View style={styles.content}>
            <View style={styles.lockIconContainer}>
                <MaterialIcons name="admin-panel-settings" size={60} color="#0033A0" />
            </View>
            <Text style={styles.title}>Admin Authentication</Text>
            <Text style={styles.subtitle}>
                Before accessing admin features, we need to verify your identity. 
                A verification code will be sent to your admin phone number.
            </Text>
        </View>
        <View style={styles.footer}>
            <Button 
                mode="contained" 
                onPress={onAuthenticate}
                loading={loading}
                disabled={loading}
                style={styles.primaryButton}
                labelStyle={styles.buttonLabel}
                icon="shield-lock"
            >
                Send Verification Code
            </Button>
        </View>
    </View>
);
const PhoneVerificationScreen = ({ 
    verificationCode, 
    setVerificationCode, 
    onVerify, 
    onCancel,
    loading,
    isResetting
}) => (
    <View style={styles.container}>
        <HeaderSection />
        <View style={styles.content}>
            <Text style={styles.title}>
                {isResetting ? "Reset Admin PIN" : "Verify Your Identity"}
            </Text>
            <Text style={styles.subtitle}>
                {isResetting 
                    ? "Enter the verification code sent to your phone to reset your admin PIN"
                    : "Enter the verification code sent to your phone"}
            </Text>
            <TextInput
                label="Verification Code"
                value={verificationCode}
                onChangeText={setVerificationCode}
                keyboardType="number-pad"
                style={styles.codeInput}
                mode="outlined"
                autoFocus
                maxLength={6}
            />
        </View>
        <View style={styles.footer}>
            <Button 
                mode="contained" 
                onPress={onVerify}
                loading={loading}
                disabled={!verificationCode || loading}
                style={styles.primaryButton}
                labelStyle={styles.buttonLabel}
            >
                {isResetting ? "Reset PIN" : "Verify Code"}
            </Button>
            <Button 
                mode="text" 
                onPress={onCancel}
                style={styles.secondaryButton}
                labelStyle={styles.secondaryButtonText}
            >
                Cancel
            </Button>
        </View>
    </View>
);

const PinEntryScreen = ({ 
    pin, 
    onPinInput, 
    onBackspace, 
    onForgotPin,
    loading,
    error,
    shakeAnimation,
    activePinIndex
}) => (
    <View style={styles.container}>
        <HeaderSection />
        <View style={styles.content}>
            <Text style={styles.title}>Enter Admin PIN</Text>
            <Text style={styles.subtitle}>
                Enter your {ADMIN_PIN_LENGTH}-digit PIN to continue
            </Text>
            
            <Animated.View style={{ transform: [{ translateX: shakeAnimation }] }}>
                <PinInput 
                    pin={pin} 
                    length={ADMIN_PIN_LENGTH} 
                    activeIndex={activePinIndex}
                    error={error}
                    loading={loading}
                />
            </Animated.View>
        </View>
        
        <View style={styles.keyboardContainer}>
            <NumberPad 
                onPress={onPinInput} 
                onBackspace={onBackspace} 
                disabled={loading}
            />
        </View>
        
        <View style={styles.footer}>
            <TouchableOpacity 
                style={styles.forgotPinButton}
                onPress={onForgotPin}
            >
                <Text style={styles.forgotPinText}>Forgot PIN?</Text>
            </TouchableOpacity>
        </View>
    </View>
);

const PinCreationScreen = ({ 
    step, 
    pin, 
    onPinInput, 
    onBackspace, 
    loading,
    error,
    shakeAnimation,
    activePinIndex,
    onBack
}) => (
    <View style={styles.container}>
        <HeaderSection />
        <View style={styles.content}>
            <Text style={styles.title}>
                {step === 1 ? "Create Admin PIN" : "Confirm Admin PIN"}
            </Text>
            <Text style={styles.subtitle}>
                {step === 1 
                    ? `Create a secure ${ADMIN_PIN_LENGTH}-digit PIN for admin access`
                    : "Re-enter your PIN to confirm"}
            </Text>
            
            <Animated.View style={{ transform: [{ translateX: shakeAnimation }] }}>
                <PinInput 
                    pin={pin} 
                    length={ADMIN_PIN_LENGTH} 
                    activeIndex={activePinIndex}
                    error={error}
                    loading={loading}
                />
            </Animated.View>
        </View>
        
        <View style={styles.keyboardContainer}>
            <NumberPad 
                onPress={onPinInput} 
                onBackspace={onBackspace} 
                disabled={loading}
            />
        </View>
        
        {step === 2 && (
            <View style={styles.footer}>
                <Button 
                    mode="text" 
                    onPress={onBack}
                    style={styles.secondaryButton}
                    labelStyle={styles.secondaryButtonText}
                >
                    Go Back
                </Button>
            </View>
        )}
    </View>
);

const PinInput = ({ pin, length, activeIndex, error, loading }) => {
    return (
        <View style={styles.pinContainer}>
            {Array(length).fill().map((_, index) => (
                <View key={index} style={styles.pinCircleContainer}>
                    <View
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
                            <ActivityIndicator size="small" color="#0033A0" />
                        )}
                    </View>
                </View>
            ))}
        </View>
    );
};

const NumberPad = ({ onPress, onBackspace, disabled }) => {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'backspace'];
    
    return (
        <View style={styles.numberPad}>
            {numbers.map((num, index) => (
                <View key={index} style={num === '' ? { opacity: 0 } : null}>
                    <TouchableOpacity
                        style={[
                            styles.numberButton,
                            num === '' && styles.emptyButton,
                            num === 'backspace' && styles.backspaceButton,
                            disabled && styles.disabledButton
                        ]}
                        onPress={() => num === 'backspace' ? onBackspace() : onPress(num)}
                        disabled={disabled || num === ''}
                        activeOpacity={0.8}
                    >
                        {num === 'backspace' ? (
                            <MaterialIcons 
                                name="backspace" 
                                size={24} 
                                color={disabled ? "#A0AEC0" : "#0033A0"} 
                            />
                        ) : (
                            <Text style={[styles.numberText, disabled && styles.disabledText]}>
                                {num}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            ))}
        </View>
    );
};
