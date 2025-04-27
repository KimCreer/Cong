import React, { useState, useEffect, useCallback } from 'react';
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
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const AssistanceScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
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

  // Hospital data
  const [hospital, setHospital] = useState(
    route.params?.hospital || {
      id: 0,
      name: 'General Medical Assistance',
      type: 'medical-financial',
      logo: 'https://via.placeholder.com/150',
      color: '#2196F3',
      requirements: getRequirements('medical-financial', 'outpatient'),
      contact: 'DOH-MAIP Office | (02) 8123-4567'
    }
  );

  // Contact information
  const contactInformation = {
    'guarantee': {
      office: 'Hospital Guarantee Office',
      phone: '(02) 8931-8101',
      email: 'guarantee@muntinlupa.gov.ph'
    },
    'medical-financial': {
      office: 'City Health Office',
      phone: '(02) 8862-3256',
      email: 'health.office@muntinlupa.gov.ph'
    },
    'endorsement': {
      office: 'Hospital Endorsement Office',
      phone: '(02) 8862-1234',
      email: 'endorsement@muntinlupa.gov.ph'
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
      office: 'DOH-MAIP Office',
      phone: '(02) 8123-4567',
      email: 'maip.office@muntinlupa.gov.ph'
    }
  };

  // Function to get requirements
  function getRequirements(type, patientStatus) {
    const requirements = {
      'guarantee': [
        'Hospital Guarantee Request Letter (Liham ng Kahilingan para sa Guarantee)',
        'Medical Abstract/Certificate (may pirma ng doktor)',
        'Valid ID (harap at likod)',
        'Certificate of Indigency (mula sa barangay)',
        'Certificate of Employment/Income (kung empleyado)',
        'Hospital Bill (kung available)'
      ],
      'medical-financial': [
        patientStatus === 'inpatient' 
          ? 'Clinical Abstract (para sa confined patients)' 
          : 'Medical Certificate (para sa outpatient)',
        'Quotation/Bill/Statement of Account (mula sa hospital)',
        'Valid ID na may Muntinlupa address',
        'Voter\'s ID / COMELEC Certification (patunay ng residency)',
        'Certificate of Indigency (mula sa barangay)',
        'Authorization Letter (kung ikaw ay representative)'
      ],
      'endorsement': [
        'Endorsement Request Letter (Liham ng Endorsement)',
        'Medical Certificate (updated within 3 months)',
        'Valid ID (harap at likod)',
        'Certificate of Indigency (mula sa barangay)',
        'Laboratory results (kung available)',
        'Treatment plan from doctor'
      ],
      'dswd-medical': [
        'DSWD Prescribed Request Form (mula sa DSWD office)',
        'Certificate of Indigency (may barangay seal at pirma)',
        'Medical Certificate/Abstract (mula sa doktor)',
        'Prescription/Lab Request (2 copies, may pirma ng doktor)',
        'Unpaid Hospital Bill (may pirma ng billing clerk)',
        'Social Case Study (kailangan para sa dialysis/cancer patients)'
      ],
      'dswd-burial': [
        'Death Certificate (Certified True Copy + photocopy)',
        'Funeral Contract (Original + photocopy)',
        'Promissory Note / Certificate of Balance (mula sa funeral home)',
        'Valid ID of Claimant (2 photocopies)',
        'Certificate of Indigency (mula sa barangay)'
      ]
    };

    return requirements[type] || requirements['medical-financial'];
  }

  useEffect(() => {
    // Only update requirements for types that use patient status
    if (hospital.type && ['medical-financial', 'endorsement'].includes(hospital.type)) {
      const updatedRequirements = getRequirements(hospital.type, formData.patientStatus);
      setHospital(prev => ({
        ...prev,
        requirements: updatedRequirements
      }));
    }
  }, [formData.patientStatus, hospital.type]);

  useEffect(() => {
    if (hospital?.name) {
      setFormData(prev => ({
        ...prev,
        hospitalName: hospital.name
      }));
    }
  }, [hospital]);

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Alert.alert('Na-refresh', 'Na-update na ang application data');
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
        f === 'fullName' ? 'buong pangalan' :
        f === 'contactNumber' ? 'numero ng telepono' :
        f === 'address' ? 'address' :
        f === 'medicalCondition' ? 'medical condition' :
        f === 'estimatedCost' ? 'estimated cost' :
        f.replace(/([A-Z])/g, ' $1').toLowerCase()
      ).join(', ');
      
      Alert.alert(
        'Kulang ang Impormasyon',
        `Pakiprovide ang mga sumusunod: ${fieldNames}`,
        [{ text: 'Sige' }]
      );
      return;
    }

    setIsLoading(true);
    
    try {
      const user = auth().currentUser;
      if (!user) {
        Alert.alert('Error', 'Kailangan mong mag-log in para makapag-submit ng application');
        setIsLoading(false);
        return;
      }

      const applicationData = {
        ...formData,
        programType: hospital.type,
        programName: hospital.name,
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
        'Na-submit ang Application',
        `Ang iyong application para sa ${hospital.name} ay na-submit na!\n\nReference Number: ${referenceNumber}`,
        [{ text: 'Sige', onPress: () => navigation.goBack() }]
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
      Alert.alert('Error', 'Hindi na-submit ang application. Pakisubukan ulit.');
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
      `${hospital.name}\n${contact.office}\nTelepono: ${contact.phone}\nEmail: ${contact.email}\n\nPara sa mga tanong at assistance:`,
      [
        { 
          text: 'Tawagan', 
          onPress: () => Linking.openURL(`tel:${phoneNumber}`) 
        },
        { 
          text: 'I-email', 
          onPress: () => Linking.openURL(`mailto:${contact.email}?subject=Tanong tungkol sa ${hospital.name}`) 
        },
        { text: 'Sige', style: 'cancel' }
      ]
    );
  };

  const getProgramTypeDisplayName = (type) => {
    const typeMap = {
      'guarantee': 'Guarantee Program',
      'medical-financial': 'Medical Financial',
      'endorsement': 'Hospital Endorsement',
      'dswd-medical': 'DSWD Medical',
      'dswd-burial': 'DSWD Burial',
    };
    
    return typeMap[type] || 'Standard Program';
  };

  const renderProgramBadge = () => {
    const badgeColors = {
      'guarantee': '#4CAF50',
      'medical-financial': '#2196F3',
      'endorsement': '#9C27B0',
      'dswd-medical': '#5E35B1',
      'dswd-burial': '#5E35B1',
      'extensive': '#F75A5A',
      'standard': '#F1BA88'
    };

    const color = badgeColors[hospital.type] || badgeColors.standard;
    const text = getProgramTypeDisplayName(hospital.type);

    return (
      <View style={[styles.badge, { backgroundColor: color || hospital.color }]}>
        <Text style={styles.badgeText}>{text}</Text>
      </View>
    );
  };

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
            placeholder="Halaga ng kailangan"
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
        <TextInput
          style={[styles.input, styles.disabledInput]}
          value={hospital.name}
          editable={false}
        />
        
        <Text style={styles.label}>Medical Condition *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Ilarawan ang medical condition o kailangang procedure"
          value={formData.medicalCondition}
          onChangeText={(text) => handleInputChange('medicalCondition', text)}
          multiline
        />

        <Text style={styles.label}>Estimated Costs (₱) *</Text>
        <TextInput
          style={styles.input}
          placeholder="Halaga ng kailangan"
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
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
          >
            <FontAwesome5 name="arrow-left" size={20} color="#003580" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{hospital.name}</Text>
        </View>

        {/* Program Info Section */}
        <View style={styles.programInfoContainer}>
          <Image 
            source={{ uri: hospital.logo }} 
            style={styles.programImage}
            resizeMode="contain"
          />
          {renderProgramBadge()}
          
          <Text style={styles.programDescription}>
            {hospital.type === 'dswd-burial'
              ? 'Tulong para sa funeral at burial expenses'
              : hospital.type === 'guarantee'
              ? 'Serbisyo para sa hospital admission guarantee letter'
              : hospital.type === 'endorsement'
              ? 'Serbisyo para sa hospital referral at endorsement'
              : 'Financial assistance para sa medical treatments at procedures'}
          </Text>
        </View>

        {/* Patient Status Selector - Only show for medical-financial and endorsement */}
        {['medical-financial', 'endorsement'].includes(hospital.type) && (
          <View style={styles.selectorContainer}>
            <Text style={styles.selectorLabel}>Status ng Pasyente:</Text>
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

        {/* Requirements Section */}
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
            {hospital.type === 'extensive' || hospital.type === 'endorsement'
              ? 'Para sa mas kumpletong requirements, pumunta sa opisina para sa assistance sa documentation.'
              : hospital.type === 'guarantee'
              ? 'Ang hospital guarantee letters ay kailangang i-review at i-approve ng opisina.'
              : 'Maghanda ng malinaw na scans o pictures ng lahat ng required documents.'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.contactButton]}
            onPress={openContact}
          >
            <FontAwesome5 name="phone-alt" size={14} color="white" />
            <Text style={styles.buttonText}>Tumawag para sa Assistance</Text>
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
                ? 'Mag-apply para sa Burial Assistance' 
                : hospital.type === 'guarantee'
                ? 'Humiling ng Guarantee Letter'
                : hospital.type === 'endorsement'
                ? 'Humiling ng Hospital Endorsement'
                : 'Mag-apply para sa Medical Assistance'}
            </Text>
          </TouchableOpacity>
        </View>
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
            
            <Text style={styles.label}>Numero ng Telepono *</Text>
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
              placeholder="Iyong kompletong address"
              value={formData.address}
              onChangeText={(text) => handleInputChange('address', text)}
            />

            {/* Program-specific Fields */}
            {renderFormFields()}
            
            {/* Requirements Reminder */}
            <Text style={styles.requirementsTitle}>Pakihanda ang mga sumusunod:</Text>
            <View style={styles.requirementsList}>
              {hospital.requirements.map((item, index) => (
                <Text key={index} style={styles.requirementModalItem}>• {item}</Text>
              ))}
            </View>
            
            <Text style={styles.noteText}>
          {hospital.type === 'extensive' || hospital.type === 'endorsement'
            ? 'I-check ang status ng inyong application sa app within 2-3 working days.'
            : hospital.type === 'guarantee'
            ? 'Ang guarantee letter requests ay ipro-process at makikita sa app within 1-2 working days.'
            : 'Maari ninyong i-check ang inyong application status sa app within 3-5 working days.'}
        </Text>

            
            {/* Submit Button */}
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
    padding: 20,
    paddingBottom: 30,
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
  },
});

export default AssistanceScreen;