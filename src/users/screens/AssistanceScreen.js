import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getFirestore, collection, addDoc, serverTimestamp } from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';

const AssistanceScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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

  // Initialize Firebase services
  const db = getFirestore();
  const auth = getAuth();

  // Get hospital data from route params
  const [hospital, setHospital] = useState(
    route.params?.hospital || {
      id: 0,
      name: 'General Medical Assistance',
      type: 'standard',
      logo: 'https://via.placeholder.com/150',
      color: '#003580',
      requirements: getRequirements('standard', 'outpatient')
    }
  );

  // Function to get requirements based on program type (in Taglish)
  function getRequirements(type, patientStatus) {
    const baseRequirements = {
      extensive: [
        patientStatus === 'inpatient' 
          ? 'Clinical Abstract (para sa mga naka-confine)' 
          : 'Medical Certificate (para sa mga hindi naka-confine)',
        'Certification from OSMUN/Public Hospital (kung walang available na service)',
        'Social Case Study (kailangan ng social worker assessment)',
        'Valid ID na may Muntinlupa address',
        'Voter\'s ID / COMELEC Certification (proof na residente ka ng Muntinlupa)',
        'Certificate of Indigency (kailangan mula sa barangay)',
        'Laboratory and Diagnostic Results (latest medical tests)'
      ],
      standard: [
        'Medical Certificate (within 3 months, dapat updated)',
        'Quotation/Bill/Statement of Account (from hospital)',
        'Valid ID na may Muntinlupa address',
        'Voter\'s ID / COMELEC Certification (proof na residente ka ng Muntinlupa)',
        'Certificate of Indigency (kailangan mula sa barangay)',
        'Authorization Letter (kung hindi ikaw ang mag-aapply)'
      ],
      'dswd-medical': [
        'DSWD Prescribed Request Form (kukunin sa DSWD office)',
        'Certificate of Indigency (with seal & signature ng barangay)',
        'Medical Certificate/Abstract (from doctor)',
        'Prescription/Lab Request (2 copies, dapat signed ng doctor)',
        'Unpaid Hospital Bill (dapat signed ng billing clerk)',
        'Social Case Study (required for dialysis/cancer patients)'
      ],
      'dswd-burial': [
        'Death Certificate (Certified True Copy + photocopy)',
        'Funeral Contract (Original + photocopy)',
        'Promissory Note / Certificate of Balance (from funeral home)',
        'Valid ID of Claimant (2 photocopies)',
        'Certificate of Indigency (from barangay)'
      ]
    };

    return baseRequirements[type] || baseRequirements.standard;
  }

  // Update requirements when patient status changes
  useEffect(() => {
    if (hospital.type) {
      const updatedRequirements = getRequirements(hospital.type, formData.patientStatus);
      setHospital(prev => ({
        ...prev,
        requirements: updatedRequirements
      }));
    }
  }, [formData.patientStatus, hospital.type]);

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate data refresh
    setTimeout(() => {
      setRefreshing(false);
      Alert.alert('Refreshed', 'Data has been updated');
    }, 1000);
  };

  const handleSubmit = async () => {
    const requiredFields = {
      'dswd-burial': ['fullName', 'contactNumber', 'address'],
      default: ['fullName', 'contactNumber', 'address', 'medicalCondition']
    };

    const fieldsToCheck = hospital.type === 'dswd-burial' 
      ? requiredFields['dswd-burial'] 
      : requiredFields.default;

    const missingFields = fieldsToCheck.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      const fieldNames = missingFields.map(f => 
        f.replace(/([A-Z])/g, ' $1').toLowerCase()
      ).join(', ');
      
      Alert.alert(
        'Kulang ang impormasyon',
        `Pakilagay ang: ${fieldNames}`,
        [{ text: 'OK' }]
      );
      return;
    }

    setIsLoading(true);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You must be logged in to submit an application');
        return;
      }

      // Prepare the data for Firestore
      const applicationData = {
        ...formData,
        programType: hospital.type,
        programName: hospital.name,
        status: 'Pending',
        userId: user.uid,
        userEmail: user.email || '',
        createdAt: serverTimestamp(),
      };

      // Save to Firestore
      const applicationsRef = collection(db, 'medicalApplications');
      await addDoc(applicationsRef, applicationData);

      // Show success message
      const referenceNumber = `#${Math.floor(100000 + Math.random() * 900000)}`;
      Alert.alert(
        'Application Submitted',
        `Ang iyong application para sa ${hospital.name} ay successful!\n\nReference Number: ${referenceNumber}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      
      // Reset form
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
      console.error('Error submitting application:', error);
      Alert.alert('Error', 'There was a problem submitting your application');
    } finally {
      setIsLoading(false);
      setModalVisible(false);
    }
  };

  const openContact = () => {
    const contacts = {
      'dswd-medical': 'DSWD Office | (02) 8931-8101',
      'dswd-burial': 'DSWD Office | (02) 8931-8101',
      default: 'DOH-MAIP Office | (02) 8123-4567'
    };
    
    const contactInfo = contacts[hospital.type] || contacts.default;
    const phoneNumber = contactInfo.match(/\(([^)]+)\)/)[1].replace(/-/g, '');

    Alert.alert(
      'Contact Information',
      `${hospital.name}\n${contactInfo}\n\nPwede kang tumawag para sa karagdagang impormasyon`,
      [
        { text: 'Tawagan', onPress: () => Linking.openURL(`tel:${phoneNumber}`) },
        { text: 'OK', style: 'cancel' }
      ]
    );
  };

  // Render badge based on program type
  const renderProgramBadge = () => {
    const badgeConfig = {
      extensive: { color: '#F75A5A', text: 'Extensive' },
      'dswd-medical': { color: '#5E35B1', text: 'DSWD Medical' },
      'dswd-burial': { color: '#5E35B1', text: 'DSWD Burial' },
      default: { color: '#F1BA88', text: 'Standard' }
    };

    const { color, text } = badgeConfig[hospital.type] || badgeConfig.default;

    return (
      <View style={[styles.badge, { backgroundColor: color }]}>
        <Text style={styles.badgeText}>{text} Requirements</Text>
      </View>
    );
  };

  // Render appropriate form fields based on program type
  const renderFormFields = () => {
    if (hospital.type === 'dswd-burial') {
      return (
        <>
          <Text style={styles.label}>Pangalan ng Namatay *</Text>
          <TextInput
            style={styles.input}
            placeholder="Buong pangalan ng namatay"
            value={formData.medicalCondition}
            onChangeText={(text) => handleInputChange('medicalCondition', text)}
          />

          <Text style={styles.label}>Funeral Home</Text>
          <TextInput
            style={styles.input}
            placeholder="Pangalan ng funeral home"
            value={formData.hospitalName}
            onChangeText={(text) => handleInputChange('hospitalName', text)}
          />

          <Text style={styles.label}>Estimated Burial Costs (₱)</Text>
          <TextInput
            style={styles.input}
            placeholder="Halaga ng gastos"
            value={formData.estimatedCost}
            onChangeText={(text) => handleInputChange('estimatedCost', text)}
            keyboardType="numeric"
          />
        </>
      );
    }

    return (
      <>
        <Text style={styles.label}>Pangalan ng Hospital *</Text>
        <Text style={styles.hospitalNameText}>{hospital.name}</Text>

        <TextInput
          style={[styles.input, styles.disabledInput]}
          value={hospital.name}
          editable={false}
        />
        
        <Text style={styles.label}>Medical Condition *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Ilagay ang medical condition o procedure na kailangan"
          value={formData.medicalCondition}
          onChangeText={(text) => handleInputChange('medicalCondition', text)}
          multiline
        />

        <Text style={styles.label}>Estimated Costs (₱) *</Text>
        <TextInput
          style={styles.input}
          placeholder="Halaga ng gastos"
          value={formData.estimatedCost}
          onChangeText={(text) => handleInputChange('estimatedCost', text)}
          keyboardType="numeric"
        />
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#003580']}
            tintColor="#003580"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <FontAwesome5 name="arrow-left" size={20} color="#003580" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{hospital.name}</Text>
        </View>

        {/* Hospital Info */}
        <View style={styles.hospitalContainer}>
          <Image 
            source={{ uri: hospital.logo }} 
            style={styles.hospitalImage}
            resizeMode="contain"
          />
          {renderProgramBadge()}
        </View>

        <Text style={styles.description}>
          {hospital.type === 'dswd-burial'
            ? 'Tulong para sa funeral at burial expenses'
            : 'Financial assistance para sa medical treatments at procedures'}
        </Text>

        {/* Patient Status Selector (for medical programs) */}
        {hospital.type !== 'dswd-burial' && (
          <View style={styles.selectorContainer}>
            <Text style={styles.selectorLabel}>Patient Status:</Text>
            <View style={styles.selectorButtons}>
              {['outpatient', 'inpatient'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.selectorButton,
                    formData.patientStatus === status && styles.selectorButtonActive
                  ]}
                  onPress={() => handleInputChange('patientStatus', status)}
                >
                  <Text style={[
                    styles.selectorButtonText,
                    formData.patientStatus === status && styles.selectorButtonTextActive
                  ]}>
                    {status === 'outpatient' ? 'Out-Patient' : 'In- Patient'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Requirements List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mga Kailangang Dokumento:</Text>
          {hospital.requirements.map((item, index) => (
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

        {/* Important Notes */}
        <View style={styles.noteBox}>
          <FontAwesome5 name="info-circle" size={16} color="#003580" />
          <Text style={styles.noteText}>
            {hospital.type === 'extensive'
              ? 'Para sa extensive requirements, pumunta sa opisina para sa tulong sa documentation.'
              : 'Maghanda ng malinaw na scans o pictures ng lahat ng required documents.'}
          </Text>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity 
          style={[styles.button, styles.contactButton]}
          onPress={openContact}
        >
          <FontAwesome5 name="phone-alt" size={14} color="white" />
          <Text style={styles.buttonText}>Tumawag para sa Tulong</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.applyButton]}
          onPress={() => setModalVisible(true)}
        >
          <FontAwesome5 name="file-signature" size={14} color="white" />
          <Text style={styles.buttonText}>
            {hospital.type === 'dswd-burial' 
              ? 'Mag-apply para sa Burial Assistance' 
              : 'Mag-apply para sa Medical Assistance'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Application Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <FontAwesome5 name="times" size={20} color="#003580" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Application Form</Text>
            <View style={{ width: 20 }} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>{hospital.name}</Text>

            {/* Common Fields */}
            <Text style={styles.label}>Buong Pangalan *</Text>
            <TextInput
              style={styles.input}
              placeholder={hospital.type === 'dswd-burial' ? "Iyong buong pangalan" : "Pangalan ng pasyente"}
              value={formData.fullName}
              onChangeText={(text) => handleInputChange('fullName', text)}
            />
            
            <Text style={styles.label}>Contact Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="Iyong mobile number"
              value={formData.contactNumber}
              onChangeText={(text) => handleInputChange('contactNumber', text)}
              keyboardType="phone-pad"
            />
            
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Iyong email address"
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              keyboardType="email-address"
            />
            
            <Text style={styles.label}>Kompletong Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="Iyong buong address"
              value={formData.address}
              onChangeText={(text) => handleInputChange('address', text)}
            />

            {/* Program-specific Fields */}
            {renderFormFields()}
            
            {/* Requirements Reminder */}
            <Text style={styles.requirementsTitle}>Tandaan na ihanda ang:</Text>
            <View style={styles.requirementsList}>
              {hospital.requirements.map((item, index) => (
                <Text key={index} style={styles.requirementModalItem}>• {item}</Text>
              ))}
            </View>
            
            <Text style={styles.noteText}>
              {hospital.type === 'extensive'
                ? 'Tatawagan ka ng social worker within 2-3 working days.'
                : 'Aasahan ang response within 3-5 working days.'}
            </Text>
            
            {/* Submit Button */}
            <TouchableOpacity 
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <FontAwesome5 name="paper-plane" size={16} color="#FFFFFF" />
                  <Text style={styles.buttonText}>I-submit ang Application</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

// Styles remain the same as in your original code
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
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#003580',
    flex: 1,
  },
  hospitalContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  hospitalImage: {
    width: 120,
    height: 120,
    marginBottom: 15,
  },
  badge: {
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 15,
  },
  badgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  description: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 24,
  },
  selectorContainer: {
    marginBottom: 20,
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
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 15,
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
    padding: 20,
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
  },
  disabledInput: {
    opacity: 0.7,
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
  },
  hospitalNameText: {
    fontSize: 16,
    padding: 15,
    marginBottom: 20,
    color: '#333',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
});

export default AssistanceScreen;