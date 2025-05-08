import { useState, useRef } from 'react';
import { Animated, Alert } from 'react-native';
import { verifyCurrentPin, updatePin } from '../utils/pinUtils';

export const usePinManagement = () => {
    const [showPinModal, setShowPinModal] = useState(false);
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [pinStep, setPinStep] = useState(1);
    const [pinError, setPinError] = useState(false);
    const shakeAnimation = useRef(new Animated.Value(0)).current;

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

    const resetPinModal = () => {
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
        setPinStep(1);
        setPinError(false);
        setShowPinModal(false);
    };

    const handleChangePin = async () => {
        if (pinStep === 1) {
            const isValid = await verifyCurrentPin(currentPin);
            if (isValid) {
                setPinStep(2);
                setCurrentPin('');
            } else {
                startShake();
                Alert.alert("Incorrect PIN", "The PIN you entered is incorrect");
                setCurrentPin('');
            }
        } else if (pinStep === 2) {
            if (newPin.length < 6) {
                Alert.alert("Invalid PIN", "PIN must be 6 digits");
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
                await updatePin(newPin);
                Alert.alert("Success", "PIN changed successfully");
                resetPinModal();
            } catch (error) {
                console.error("Error changing PIN:", error);
                Alert.alert("Error", "Failed to change PIN");
            }
        }
    };

    return {
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
    };
}; 