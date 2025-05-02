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

// Security Constants
const ADMIN_PIN_LENGTH = 6;
const MAX_PIN_ATTEMPTS = 5;
const MAX_OTP_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes
const OTP_LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

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
        otpAttempts: 0,
        otpLockoutUntil: null,
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

    // Security helper functions
    const generateDeviceSalt = async () => {
        let salt = await SecureStore.getItemAsync('deviceSalt');
        if (!salt) {
            const randomBytes = await Crypto.getRandomBytesAsync(16);
            salt = Array.from(new Uint8Array(randomBytes)).map(b => b.toString(16).padStart(2, '0')).join('');
            await SecureStore.setItemAsync('deviceSalt', salt);
        }
        return salt;
    };

    const hashPin = async (pin, salt, userId) => {
        const message = pin + salt + userId;
        const digest = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            message
        );
        return digest;
    };

    // PIN input handlers
    const handlePinInput = (num) => {
        if (adminPin.length < ADMIN_PIN_LENGTH && !loading) {
            setAdminPin(prev => prev + num);
        }
    };

    const handlePinBackspace = () => {
        if (adminPin.length > 0 && !loading) {
            setAdminPin(prev => prev.slice(0, -1));
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
            
            // Check for existing PIN and lockout status
            const [existingPin, pinLockout, otpLockout] = await Promise.all([
                SecureStore.getItemAsync(`adminPinHash_${userId}`),
                SecureStore.getItemAsync(`adminLockoutUntil_${userId}`),
                SecureStore.getItemAsync(`adminOtpLockoutUntil_${userId}`)
            ]);
            
            const lockoutStatus = pinLockout ? new Date(parseInt(pinLockout)) : null;
            const otpLockoutStatus = otpLockout ? new Date(parseInt(otpLockout)) : null;
            
            setAuthState(prev => ({
                ...prev,
                hasExistingPin: !!existingPin,
                lockoutUntil: lockoutStatus && lockoutStatus > new Date() ? lockoutStatus : null,
                otpLockoutUntil: otpLockoutStatus && otpLockoutStatus > new Date() ? otpLockoutStatus : null
            }));
            
            // Start phone auth if not locked out
            if (!lockoutStatus && !otpLockoutStatus) {
                await handleInitialAuthentication();
            }
        } catch (error) {
            console.error("Error checking auth state:", error);
            Alert.alert("Error", "Failed to check authentication status");
        }
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

    // Verify SMS code with OTP attempt limiting
    const verifyAuthCode = async () => {
        try {
            // Check OTP lockout first
            if (authState.otpLockoutUntil && authState.otpLockoutUntil > new Date()) {
                const minutesLeft = Math.ceil((authState.otpLockoutUntil - new Date()) / 60000);
                Alert.alert(
                    "Too Many Attempts",
                    `You've exceeded the maximum OTP attempts. Please try again in ${minutesLeft} minute(s).`
                );
                return;
            }

            setPhoneAuthLoading(true);
            await confirmation.confirm(verificationCode);
            
            // Reset OTP attempts on success
            const userId = await SecureStore.getItemAsync('userUid');
            await SecureStore.deleteItemAsync(`adminOtpLockoutUntil_${userId}`);
            
            setAuthState(prev => ({
                ...prev,
                phoneVerified: true,
                otpAttempts: 0,
                otpLockoutUntil: null
            }));
            
            setConfirmation(null);
            setVerificationCode('');
            
            // For new admins, proceed to PIN creation
            if (!authState.hasExistingPin) {
                setStep(1);
            }
            
        } catch (error) {
            console.error("Code verification error:", error);
            
            // Handle OTP attempt limiting
            const attemptsLeft = MAX_OTP_ATTEMPTS - authState.otpAttempts - 1;
            setAuthState(prev => ({
                ...prev,
                otpAttempts: prev.otpAttempts + 1
            }));

            if (attemptsLeft <= 0) {
                const userId = await SecureStore.getItemAsync('userUid');
                const lockoutTime = new Date(Date.now() + OTP_LOCKOUT_DURATION);
                
                await SecureStore.setItemAsync(
                    `adminOtpLockoutUntil_${userId}`,
                    lockoutTime.getTime().toString()
                );
                
                setAuthState(prev => ({
                    ...prev,
                    otpLockoutUntil: lockoutTime,
                    otpAttempts: 0
                }));
                
                Alert.alert(
                    "Too Many Attempts",
                    `You've exceeded the maximum OTP attempts. Please try again in ${OTP_LOCKOUT_DURATION / 60000} minutes.`
                );
            } else {
                let errorMessage = "Invalid verification code";
                if (error.code === 'auth/invalid-verification-code') {
                    errorMessage = `The code you entered is incorrect (${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining)`;
                } else if (error.code === 'auth/code-expired') {
                    errorMessage = "This code has expired. Please request a new one";
                }

                Alert.alert("Verification Failed", errorMessage);
            }
        } finally {
            setPhoneAuthLoading(false);
        }
    };

    // Reset PIN after verification with OTP attempt limiting
    const resetAdminPin = async () => {
        try {
            // Check OTP lockout first
            if (authState.otpLockoutUntil && authState.otpLockoutUntil > new Date()) {
                const minutesLeft = Math.ceil((authState.otpLockoutUntil - new Date()) / 60000);
                Alert.alert(
                    "Too Many Attempts",
                    `You've exceeded the maximum OTP attempts. Please try again in ${minutesLeft} minute(s).`
                );
                return;
            }

            setPhoneAuthLoading(true);
            await confirmation.confirm(verificationCode);
            
            const userId = await SecureStore.getItemAsync('userUid');
            if (!userId) {
                throw new Error("User session expired. Please login again.");
            }
            
            // Reset OTP attempts on success
            await SecureStore.deleteItemAsync(`adminOtpLockoutUntil_${userId}`);
            
            // Clear existing PIN and lockout status
            await Promise.all([
                SecureStore.deleteItemAsync(`adminPinHash_${userId}`),
                SecureStore.deleteItemAsync(`adminLockoutUntil_${userId}`)
            ]);
            
            // Reset state
            setAuthState(prev => ({
                ...prev,
                hasExistingPin: false,
                isResettingPin: false,
                pinAttempts: 0,
                lockoutUntil: null,
                phoneVerified: true,
                otpAttempts: 0,
                otpLockoutUntil: null
            }));
            
            setConfirmation(null);
            setVerificationCode('');
            setAdminPin('');
            setStep(1); // Go to PIN creation
            
            Alert.alert("Success", "You can now set a new admin PIN.");
        } catch (error) {
            console.error("Code verification error:", error);
            
            // Handle OTP attempt limiting
            const attemptsLeft = MAX_OTP_ATTEMPTS - authState.otpAttempts - 1;
            setAuthState(prev => ({
                ...prev,
                otpAttempts: prev.otpAttempts + 1,
                isResettingPin: attemptsLeft > 0 // Only keep in reset mode if attempts remain
            }));

            if (attemptsLeft <= 0) {
                const userId = await SecureStore.getItemAsync('userUid');
                const lockoutTime = new Date(Date.now() + OTP_LOCKOUT_DURATION);
                
                await SecureStore.setItemAsync(
                    `adminOtpLockoutUntil_${userId}`,
                    lockoutTime.getTime().toString()
                );
                
                setAuthState(prev => ({
                    ...prev,
                    otpLockoutUntil: lockoutTime,
                    otpAttempts: 0,
                    isResettingPin: false
                }));
                
                Alert.alert(
                    "Too Many Attempts",
                    `You've exceeded the maximum OTP attempts. Please try again in ${OTP_LOCKOUT_DURATION / 60000} minutes.`
                );
            } else {
                let errorMessage = "Invalid verification code";
                if (error.code === 'auth/invalid-verification-code') {
                    errorMessage = `The code you entered is incorrect (${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining)`;
                } else if (error.code === 'auth/code-expired') {
                    errorMessage = "This code has expired. Please request a new one";
                }

                Alert.alert("Verification Failed", errorMessage);
            }
        } finally {
            setPhoneAuthLoading(false);
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
    if (authState.lockoutUntil) {
        return (
            <LockoutScreen 
                lockoutUntil={authState.lockoutUntil} 
                onForgotPin={handleForgotPin} 
            />
        );
    }

    if (authState.otpLockoutUntil) {
        return (
            <OtpLockoutScreen 
                lockoutUntil={authState.otpLockoutUntil} 
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
                attemptsLeft={MAX_OTP_ATTEMPTS - authState.otpAttempts}
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
                attemptsLeft={MAX_PIN_ATTEMPTS - authState.pinAttempts}
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
                    Too many incorrect PIN attempts. Please try again in {minutesLeft} minute{minutesLeft !== 1 ? 's' : ''}.
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

const OtpLockoutScreen = ({ lockoutUntil }) => {
    const minutesLeft = Math.ceil((lockoutUntil - new Date()) / 60000);
    
    return (
        <View style={styles.container}>
            <HeaderSection />
            <View style={styles.content}>
                <View style={styles.lockIconContainer}>
                    <MaterialIcons name="lock-clock" size={60} color="#0033A0" />
                </View>
                <Text style={styles.title}>Verification Locked</Text>
                <Text style={styles.subtitle}>
                    Too many incorrect OTP attempts. Please try again in {minutesLeft} minute{minutesLeft !== 1 ? 's' : ''}.
                </Text>
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
    isResetting,
    attemptsLeft
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
            
            {attemptsLeft < MAX_OTP_ATTEMPTS && (
                <Text style={styles.attemptsText}>
                    Attempts remaining: {attemptsLeft}
                </Text>
            )}
            
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
    activePinIndex,
    attemptsLeft
}) => (
    <View style={styles.container}>
        <HeaderSection />
        <View style={styles.content}>
            <Text style={styles.title}>Enter Admin PIN</Text>
            <Text style={styles.subtitle}>
                Enter your {ADMIN_PIN_LENGTH}-digit PIN to continue
            </Text>
            
            {attemptsLeft < MAX_PIN_ATTEMPTS && (
                <Text style={styles.attemptsText}>
                    Attempts remaining: {attemptsLeft}
                </Text>
            )}
            
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