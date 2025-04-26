import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import PropTypes from 'prop-types';

const PinCircle = ({ filled = false, active = false }) => (
  <View style={[
    styles.pinCircle,
    filled && styles.pinCircleFilled,
    active && styles.pinCircleActive,
  ]}>
    {filled && <View style={styles.pinDot} />}
  </View>
);

PinCircle.propTypes = {
  filled: PropTypes.bool,
  active: PropTypes.bool,
};

const PinDisplay = ({ pin, activeIndex }) => (
  <View style={styles.pinContainer}>
    {Array(4).fill().map((_, index) => (
      <PinCircle
        key={index}
        filled={pin.length > index}
        active={index === activeIndex}
      />
    ))}
  </View>
);

PinDisplay.propTypes = {
  pin: PropTypes.string.isRequired,
  activeIndex: PropTypes.number.isRequired,
};

const NumberButton = ({ number, onPress }) => (
  <TouchableOpacity
    style={styles.numberButton}
    onPress={() => onPress(number)}
    activeOpacity={0.7}
  >
    <Text style={styles.numberText}>{number}</Text>
  </TouchableOpacity>
);

NumberButton.propTypes = {
  number: PropTypes.number.isRequired,
  onPress: PropTypes.func.isRequired,
};

const BackspaceButton = ({ onPress }) => (
  <TouchableOpacity
    style={styles.backspaceButton}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <MaterialIcons name="backspace" size={24} color="#003366" />
  </TouchableOpacity>
);

BackspaceButton.propTypes = {
  onPress: PropTypes.func.isRequired,
};

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

NumberPad.propTypes = {
  onNumberPress: PropTypes.func.isRequired,
  onBackspace: PropTypes.func.isRequired,
};

const ChangePinModal = ({ 
  visible, 
  onClose, 
  pinStep, 
  currentPin, 
  newPin, 
  confirmNewPin, 
  onNumberPress, 
  onBackspace, 
  onChangePin, 
  isLoading = false  // This is now a default parameter
}) => {
  if (!visible) return null;

  return (
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
          {pinStep === 1 ? 'Enter your current 4-digit PIN to continue' :
           pinStep === 2 ? 'Create a new 4-digit PIN' : 
           'Re-enter your new PIN to confirm'}
        </Text>

        <PinDisplay 
          pin={pinStep === 1 ? currentPin : pinStep === 2 ? newPin : confirmNewPin}
          activeIndex={
            pinStep === 1 ? currentPin.length : 
            pinStep === 2 ? newPin.length : 
            confirmNewPin.length
          }
        />

        <NumberPad
          onNumberPress={onNumberPress}
          onBackspace={onBackspace}
        />

        <TouchableOpacity
          style={styles.modalActionButton}
          onPress={onChangePin}
          disabled={
            (pinStep === 1 && currentPin.length < 4) ||
            (pinStep === 2 && newPin.length < 4) ||
            (pinStep === 3 && confirmNewPin.length < 4)
          }
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.modalActionButtonText}>
              {pinStep === 3 ? 'Confirm Change' : 'Continue'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

ChangePinModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  pinStep: PropTypes.number.isRequired,
  currentPin: PropTypes.string.isRequired,
  newPin: PropTypes.string.isRequired,
  confirmNewPin: PropTypes.string.isRequired,
  onNumberPress: PropTypes.func.isRequired,
  onBackspace: PropTypes.func.isRequired,
  onChangePin: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};



const styles = {
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    position: 'absolute',
    top: -150,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
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
};

export default ChangePinModal;