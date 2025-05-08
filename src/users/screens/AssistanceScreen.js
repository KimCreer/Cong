import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Linking,
  SafeAreaView,
  Alert,
  RefreshControl,
  Keyboard,
  LayoutAnimation,
  UIManager
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

// Enable LayoutAnimation for Android
if (UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AssistanceScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const scrollViewRef = useRef(null);
  const modalScrollViewRef = useRef(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [focusedInput, setFocusedInput] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    contactNumber: '',
    email: '',
    address: '',
    medicalCondition: '',
    hospitalName: '',
    estimatedCost: '',
    patientStatus: 'outpatient',
  });

  // Hospital data from route params
  const [hospital, setHospital] = useState(
    route.params?.hospital || {
      id: 0,
      name: 'General Medical Assistance',
      type: 'medical-financial',
      category: 'General Program',
      logo: 'https://via.placeholder.com/150',
      color: '#2196F3',
      requirements: {
        inpatient: [],
        outpatient: []
      },
    }
  );

  // Contact information
  const contactInformation = {
    'guarantee': {
      office: 'Hospital Guarantee Office',
      phone: '(02) 8931-8101',
      email: 'guarantee@muntinlupa.gov.ph'
    },
    'dswd-medical': {
      office: 'DSWD Office',
      phone: '(02) 8931-8101',
      email: 'dswd.medical@muntinlupa.gov.ph'
    },
    'dswd-burial': {
      office: 'DSWD Office',
      phone: '(02) 8931-8101',
      email: 'dswd.burial@muntinlupa.gov.ph'
    },
    default: {
      office: 'City Health Office',
      phone: '(02) 8862-3256',
      email: 'health.office@muntinlupa.gov.ph'
    }
  };

  useEffect(() => {
    if (hospital?.name) {
      setFormData(prev => ({
        ...prev,
        hospitalName: hospital.name
      }));
    }
  }, [hospital]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Alert.alert('Refreshed', 'Application data has been updated');
    }, 1000);
  }, []);

  const validateForm = () => {
    const requiredFields = {
      'dswd-burial': ['fullName', 'contactNumber', 'address', 'medicalCondition'],
      default: ['fullName', 'contactNumber', 'address', 'medicalCondition', 'estimatedCost']
    };

    const fieldsToCheck = hospital.type === 'dswd-burial' 
      ? requiredFields['dswd-burial'] 
      : requiredFields.default;

    return fieldsToCheck.filter(field => !formData[field]);
  };

  const handleSubmit = async () => {
    const missingFields = validateForm();
    
    if (missingFields.length > 0) {
      const fieldNames = missingFields.map(f => 
        f === 'fullName' ? 'full name' :
        f === 'contactNumber' ? 'contact number' :
        f === 'address' ? 'address' :
        f === 'medicalCondition' ? 'medical condition' :
        f === 'estimatedCost' ? 'estimated cost' :
        f.replace(/([A-Z])/g, ' $1').toLowerCase()
      ).join(', ');
      
      Alert.alert(
        'Missing Information',
        `Please provide the following: ${fieldNames}`,
        [{ text: 'OK' }]
      );
      return;
    }

    setIsLoading(true);
    
    try {
      const user = auth().currentUser;
      if (!user) {
        Alert.alert('Error', 'You need to be logged in to submit an application');
        setIsLoading(false);
        return;
      }

      const applicationData = {
        ...formData,
        programType: hospital.type,
        programName: hospital.name,
        programCategory: hospital.category,
        status: 'Pending',
        userId: user.uid,
        userEmail: user.email || '',
        createdAt: firestore.FieldValue.serverTimestamp(),
      };

      await firestore()
        .collection('medicalApplications')
        .add(applicationData);

      const referenceNumber = `APP-${Math.floor(100000 + Math.random() * 900000)}`;
      Alert.alert(
        'Application Submitted',
        `Your application for ${hospital.name} has been submitted!\n\nReference Number: ${referenceNumber}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      
      setFormData({
        fullName: '',
        contactNumber: '',
        email: '',
        address: '',
        medicalCondition: '',
        hospitalName: hospital.name,
        estimatedCost: '',
        patientStatus: 'outpatient',
      });
      
    } catch (error) {
      console.error('Submission error:', error);
      Alert.alert('Error', 'Failed to submit application. Please try again.');
    } finally {
      setIsLoading(false);
      setModalVisible(false);
    }
  };

  const openContact = () => {
    const contact = contactInformation[hospital.type] || contactInformation.default;
    const phoneNumber = contact.phone.replace(/[^\d]/g, '');

    Alert.alert(
      'Contact Information',
      `${hospital.name}\n${contact.office}\nPhone: ${contact.phone}\nEmail: ${contact.email}\n\nFor questions and assistance:`,
      [
        { 
          text: 'Call', 
          onPress: () => Linking.openURL(`tel:${phoneNumber}`) 
        },
        { 
          text: 'Email', 
          onPress: () => Linking.openURL(`mailto:${contact.email}?subject=Question about ${hospital.name}`) 
        },
        { text: 'OK', style: 'cancel' }
      ]
    );
  };

  const getProgramTypeDisplayName = (type) => {
    const typeMap = {
      'guarantee': 'Guarantee Program',
      'dswd-medical': 'DSWD Medical',
      'dswd-burial': 'DSWD Burial',
    };
    
    return typeMap[type] || 'Medical Assistance';
  };

  const renderProgramBadge = () => {
    const badgeColors = {
      'guarantee': '#4CAF50',
      'dswd-medical': '#5E35B1',
      'dswd-burial': '#5E35B1',
      'default': '#2196F3'
    };

    const color = badgeColors[hospital.type] || badgeColors.default;
    const text = getProgramTypeDisplayName(hospital.type);

    return (
      <View style={[styles.badge, { backgroundColor: color }]}>
        <Text style={styles.badgeText}>{text}</Text>
      </View>
    );
  };

  const getCurrentRequirements = () => {
    if (!hospital.requirements) return [];
    
    if (hospital.type === 'dswd-medical' || hospital.type === 'dswd-burial') {
      return hospital.requirements;
    }
    
    return formData.patientStatus === 'inpatient' 
      ? hospital.requirements.inpatient 
      : hospital.requirements.outpatient;
  };

  const renderFormFields = () => {
    if (hospital.type === 'dswd-burial') {
      return (
        <>
          <Text style={styles.label}>Deceased Person's Name *</Text>
          <TextInput
            style={[styles.input, focusedInput === 'medicalCondition' && styles.inputFocused]}
            placeholder="Full name of the deceased"
            value={formData.medicalCondition}
            onChangeText={(text) => handleInputChange('medicalCondition', text)}
            onFocus={() => setFocusedInput('medicalCondition')}
            onBlur={() => setFocusedInput(null)}
            returnKeyType="next"
          />

          <Text style={styles.label}>Funeral Home</Text>
          <TextInput
            style={[styles.input, focusedInput === 'hospitalName' && styles.inputFocused]}
            placeholder="Name of funeral home"
            value={formData.hospitalName}
            onChangeText={(text) => handleInputChange('hospitalName', text)}
            onFocus={() => setFocusedInput('hospitalName')}
            onBlur={() => setFocusedInput(null)}
            returnKeyType="next"
          />

          <Text style={styles.label}>Estimated Burial Costs (₱)</Text>
          <TextInput
            style={[styles.input, focusedInput === 'estimatedCost' && styles.inputFocused]}
            placeholder="Amount needed"
            value={formData.estimatedCost}
            onChangeText={(text) => handleInputChange('estimatedCost', text)}
            onFocus={() => setFocusedInput('estimatedCost')}
            onBlur={() => setFocusedInput(null)}
            keyboardType="numeric"
            returnKeyType="done"
          />
        </>
      );
    }

    return (
      <>
        <Text style={styles.label}>Hospital Name *</Text>
        <TextInput
          style={[styles.input, styles.disabledInput]}
          value={hospital.name}
          editable={false}
        />
        
        {hospital.type !== 'dswd-medical' && (
          <>
            <Text style={styles.label}>Medical Condition *</Text>
            <TextInput
              style={[styles.input, styles.textArea, focusedInput === 'medicalCondition' && styles.inputFocused]}
              placeholder="Describe the medical condition or needed procedure"
              value={formData.medicalCondition}
              onChangeText={(text) => handleInputChange('medicalCondition', text)}
              onFocus={() => setFocusedInput('medicalCondition')}
              onBlur={() => setFocusedInput(null)}
              multiline
              returnKeyType="next"
            />

            <Text style={styles.label}>Estimated Costs (₱) *</Text>
            <TextInput
              style={[styles.input, focusedInput === 'estimatedCost' && styles.inputFocused]}
              placeholder="Amount needed"
              value={formData.estimatedCost}
              onChangeText={(text) => handleInputChange('estimatedCost', text)}
              onFocus={() => setFocusedInput('estimatedCost')}
              onBlur={() => setFocusedInput(null)}
              keyboardType="numeric"
              returnKeyType="done"
            />
          </>
        )}
      </>
    );
  };

  const renderModalContent = () => {
    const requirements = getCurrentRequirements();
    
    return (
      <ScrollView 
        ref={modalScrollViewRef}
        style={styles.modalContent}
        contentContainerStyle={[
          styles.modalContentContainer,
          { paddingBottom: keyboardHeight + 20 }
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.modalSubtitle}>{hospital.name}</Text>

        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={[styles.input, focusedInput === 'fullName' && styles.inputFocused]}
          placeholder={hospital.type === 'dswd-burial' ? "Your full name" : "Patient's name"}
          value={formData.fullName}
          onChangeText={(text) => handleInputChange('fullName', text)}
          onFocus={() => setFocusedInput('fullName')}
          onBlur={() => setFocusedInput(null)}
          returnKeyType="next"
        />
        
        <Text style={styles.label}>Contact Number *</Text>
        <TextInput
          style={[styles.input, focusedInput === 'contactNumber' && styles.inputFocused]}
          placeholder="Your mobile number"
          value={formData.contactNumber}
          onChangeText={(text) => handleInputChange('contactNumber', text)}
          onFocus={() => setFocusedInput('contactNumber')}
          onBlur={() => setFocusedInput(null)}
          keyboardType="phone-pad"
          returnKeyType="next"
        />
        
        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={[styles.input, focusedInput === 'email' && styles.inputFocused]}
          placeholder="Your email address"
          value={formData.email}
          onChangeText={(text) => handleInputChange('email', text)}
          onFocus={() => setFocusedInput('email')}
          onBlur={() => setFocusedInput(null)}
          keyboardType="email-address"
          returnKeyType="next"
        />
        
        <Text style={styles.label}>Complete Address *</Text>
        <TextInput
          style={[styles.input, focusedInput === 'address' && styles.inputFocused]}
          placeholder="Your complete address"
          value={formData.address}
          onChangeText={(text) => handleInputChange('address', text)}
          onFocus={() => setFocusedInput('address')}
          onBlur={() => setFocusedInput(null)}
          returnKeyType="next"
        />

        {renderFormFields()}
        
        {requirements && requirements.length > 0 && (
          <>
            <Text style={styles.requirementsTitle}>Please prepare the following:</Text>
            <View style={styles.requirementsList}>
              {requirements.map((item, index) => (
                <Text key={index} style={styles.requirementModalItem}>• {item}</Text>
              ))}
            </View>
          </>
        )}
        
        <Text style={styles.noteText}>
          {hospital.type === 'guarantee'
            ? 'Hospital guarantee letters need to be reviewed and approved by the office.'
            : 'You can check your application status in the app within 3-5 working days.'}
        </Text>

        <TouchableOpacity 
          style={[styles.button, styles.submitButton, { backgroundColor: hospital.color || '#003580' }]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <FontAwesome5 name="paper-plane" size={16} color="#FFFFFF" />
              <Text style={styles.buttonText}>Submit Application</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#003580']}
            tintColor="#003580"
            progressViewOffset={40}
          />
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
          >
            <FontAwesome5 name="arrow-left" size={20} color="#003580" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{hospital.name}</Text>
        </View>

        <View style={styles.programInfoContainer}>
          <Image 
            source={{ uri: hospital.logo }} 
            style={styles.programImage}
            resizeMode="contain"
          />
          {renderProgramBadge()}
          
          <Text style={styles.programDescription}>
            {hospital.type === 'dswd-burial'
              ? 'Assistance for funeral and burial expenses'
              : hospital.type === 'guarantee'
              ? 'Service for hospital admission guarantee letter'
              : 'Financial assistance for medical treatments and procedures'}
          </Text>
        </View>

        {hospital.requirements && (hospital.requirements.inpatient || hospital.requirements.outpatient) && (
          <View style={styles.selectorContainer}>
            <Text style={styles.selectorLabel}>Patient Status:</Text>
            <View style={styles.selectorButtons}>
              {['outpatient', 'inpatient'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.selectorButton,
                    formData.patientStatus === status && styles.selectorButtonActive,
                    formData.patientStatus === status && { backgroundColor: hospital.color }
                  ]}
                  onPress={() => handleInputChange('patientStatus', status)}
                >
                  <Text style={[
                    styles.selectorButtonText,
                    formData.patientStatus === status && styles.selectorButtonTextActive
                  ]}>
                    {status === 'outpatient' ? 'Outpatient' : 'Inpatient'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Required Documents:</Text>
          {getCurrentRequirements().map((item, index) => (
            <View key={index} style={styles.requirementItem}>
              <FontAwesome5 
                name="check-circle" 
                size={14} 
                color={hospital.color || '#003580'} 
                style={styles.requirementIcon}
              />
              <Text style={styles.requirementText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.noteBox}>
          <FontAwesome5 name="info-circle" size={16} color="#003580" />
          <Text style={styles.noteText}>
            {hospital.type === 'guarantee'
              ? 'Hospital guarantee letters need to be reviewed and approved by the office.'
              : 'Prepare clear scans or pictures of all required documents.'}
          </Text>
        </View>

        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.contactButton]}
            onPress={openContact}
          >
            <FontAwesome5 name="phone-alt" size={14} color="white" />
            <Text style={styles.buttonText}>Call for Assistance</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.applyButton, { backgroundColor: hospital.color || '#003580' }]}
            onPress={() => setModalVisible(true)}
          >
            <FontAwesome5 
              name={hospital.type === 'dswd-burial' ? 'file-signature' : 'heartbeat'} 
              size={14} 
              color="white" 
            />
            <Text style={styles.buttonText}>
              {hospital.type === 'dswd-burial' 
                ? 'Apply for Burial Assistance' 
                : hospital.type === 'guarantee'
                ? 'Request Guarantee Letter'
                : 'Apply for Medical Assistance'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent={true}
        transparent={false}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => {
                Keyboard.dismiss();
                setModalVisible(false);
              }}
            >
              <FontAwesome5 name="times" size={20} color="#003580" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Application Form</Text>
            <View style={{ width: 20 }} />
          </View>
          
          {renderModalContent()}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  container: {
    padding: 20,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold', 
    color: '#003580',
    flex: 1,
  },
  programInfoContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  programImage: {
    width: 120,
    height: 120,
    marginBottom: 15,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
  },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginBottom: 15,
  },
  badgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  programDescription: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 5,
  },
  selectorContainer: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  selectorButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  selectorButton: {
    width: '48%',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#E8EEF7',
    alignItems: 'center',
  },
  selectorButtonActive: {
    backgroundColor: '#003580',
  },
  selectorButtonText: {
    color: '#003580',
    fontWeight: '600',
  },
  selectorButtonTextActive: {
    color: 'white',
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003580',
    marginBottom: 15,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  requirementIcon: {
    marginRight: 10,
    marginTop: 3,
  },
  requirementText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  noteBox: {
    backgroundColor: '#E8EEF7',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 25,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: '#003580',
    marginLeft: 10,
    lineHeight: 20,
  },
  actionButtonsContainer: {
    marginTop: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 15,
    elevation: 2,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 16,
  },
  contactButton: {
    backgroundColor: '#0275d8',
  },
  applyButton: {
    backgroundColor: '#003580',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#003580',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalContentContainer: {
    paddingBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inputFocused: {
    borderColor: '#003580',
    backgroundColor: '#FFFFFF',
    elevation: 3,
  },
  disabledInput: {
    opacity: 0.7,
    backgroundColor: '#EEE',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003580',
    marginTop: 10,
    marginBottom: 15,
  },
  requirementsList: {
    marginBottom: 25,
  },
  requirementModalItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#003580',
    padding: 16,
    marginTop: 10,
    marginBottom: 30,
  },
});

export default AssistanceScreen;