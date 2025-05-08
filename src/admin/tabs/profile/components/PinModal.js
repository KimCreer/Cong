import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';
import { Feather, MaterialIcons } from "@expo/vector-icons";

const PIN_LENGTH = 6;

const PinCircle = ({ filled, active, error }) => (
    <View style={[
        styles.pinCircle,
        filled && styles.pinCircleFilled,
        active && styles.pinCircleActive,
        error && styles.pinCircleError
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

const PinModal = ({
    visible,
    onClose,
    pinStep,
    currentPin,
    newPin,
    confirmPin,
    onNumberPress,
    onBackspace,
    onContinue,
    shakeAnimation,
    pinError
}) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <TouchableOpacity 
                        style={styles.modalCloseButton}
                        onPress={onClose}
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
                        onNumberPress={onNumberPress}
                        onBackspace={onBackspace}
                    />

                    <TouchableOpacity
                        style={styles.modalActionButton}
                        onPress={onContinue}
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
    );
};

const styles = StyleSheet.create({
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
});

export default PinModal; 