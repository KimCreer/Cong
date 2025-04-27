import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
  Image,
  ActivityIndicator
} from 'react-native';
import { FontAwesome5, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import moment from 'moment';
import { initializeApp } from '@react-native-firebase/app';
import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';

const ApplicationDetails = ({ route, navigation }) => {
  const { application, onGoBack } = route.params;
  const [hospitalDetails, setHospitalDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requirements, setRequirements] = useState([]);

  // Initialize Firebase
  const app = initializeApp();
  const db = getFirestore(app);

  useEffect(() => {
    const fetchHospitalDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch hospital details from Firestore if hospitalId exists
        if (application.hospitalId) {
          const hospitalRef = doc(db, 'hospitals', application.hospitalId);
          const hospitalSnap = await getDoc(hospitalRef);
          
          if (hospitalSnap.exists()) {
            const data = hospitalSnap.data();
            setHospitalDetails({
              id: hospitalSnap.id,
              ...data,
              requirements: data.requirements || getDefaultRequirements(data.type, application.patientStatus)
            });
          } else {
            setHospitalDetails({
              name: application.hospitalName || 'Not specified',
              type: application.programType || 'medical-financial',
              requirements: getDefaultRequirements(application.programType, application.patientStatus)
            });
          }
        } else {
          // Use fallback data if no hospitalId
          setHospitalDetails({
            name: application.hospitalName || 'Not specified',
            type: application.programType || 'medical-financial',
            requirements: getDefaultRequirements(application.programType, application.patientStatus)
          });
        }
      } catch (error) {
        console.error("Error fetching hospital details:", error);
        setHospitalDetails({
          name: application.hospitalName || 'Not specified',
          type: application.programType || 'medical-financial',
          requirements: getDefaultRequirements(application.programType, application.patientStatus)
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHospitalDetails();
  }, [application]);

  const getDefaultRequirements = (type, patientStatus = 'outpatient') => {
    const requirements = {
      'guarantee': [
        'Hospital Guarantee Request Letter',
        'Medical Abstract/Certificate (with doctor\'s signature)',
        'Valid ID (front & back)',
        'Certificate of Indigency (from barangay)',
        'Hospital Bill (if available)'
      ],
      'medical-financial': [
        patientStatus === 'inpatient' 
          ? 'Clinical Abstract (for confined patients)' 
          : 'Medical Certificate (for non-confined patients)',
        'Quotation/Bill/Statement of Account (from hospital)',
        'Valid ID with address',
        'Voter\'s ID / COMELEC Certification (proof of residency)',
        'Certificate of Indigency (from barangay)',
        'Authorization Letter (if applying on behalf)'
      ],
      'dswd-medical': [
        'DSWD Prescribed Request Form (from DSWD office)',
        'Certificate of Indigency (with barangay seal & signature)',
        'Medical Certificate/Abstract (from doctor)',
        'Prescription/Lab Request (2 copies, doctor-signed)',
        'Unpaid Hospital Bill (signed by billing clerk)',
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

    return requirements[type] || requirements['medical-financial'];
  };

  const formatCurrency = (value) => {
    try {
      const num = typeof value === 'string' 
        ? parseFloat(value.replace(/[^0-9.-]/g, '')) 
        : Number(value);
      
      return !isNaN(num) 
        ? new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2
          }).format(num)
        : 'Not specified';
    } catch (e) {
      return 'Not specified';
    }
  };
  
  const formattedApp = {
    ...application,
    createdAt: application.createdAt?.toDate 
      ? application.createdAt.toDate() 
      : application.createdAt,
    formattedDate: application.createdAt 
      ? moment(application.createdAt.toDate()).format('MMMM D, YYYY [at] h:mm A') 
      : 'Date not available',
    estimatedCost: formatCurrency(application.estimatedCost)
  };

  const getStatusColor = () => {
    switch ((application.status || '').toLowerCase()) {
      case 'approved': return '#4CAF50';
      case 'pending': return '#FFC107';
      case 'rejected': return '#F44336';
      case 'processing': return '#2196F3';
      case 'completed': return '#673AB7';
      default: return '#9E9E9E';
    }
  };

  const getProgramTypeName = () => {
    const type = hospitalDetails?.type || application.programType;
    switch (type) {
      case 'guarantee': return 'Guarantee Letter';
      case 'medical-financial': return 'Medical Financial Assistance';
      case 'dswd-medical': return 'DSWD Medical Assistance';
      case 'dswd-burial': return 'DSWD Burial Assistance';
      default: return 'Medical Assistance';
    }
  };

  const handleCall = (phoneNumber) => {
    if (!phoneNumber) return;
    
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }

    Alert.alert(
      "Contact Information",
      `Would you like to call ${phoneNumber}?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Call", 
          onPress: () => Linking.openURL(`tel:${phoneNumber}`)
        }
      ]
    );
  };

  const renderDetailRow = (iconName, label, value, isLast = false) => (
    <View style={[styles.detailRow, isLast && { marginBottom: 0 }]}>
      <View style={styles.detailIconContainer}>
        <MaterialCommunityIcons 
          name={iconName} 
          size={22} 
          color="#555" 
        />
      </View>
      <View style={styles.detailTextContainer}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value || 'Not specified'}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#003580" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => {
              if (onGoBack) onGoBack();
              navigation.goBack();
            }}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={24} color="#003580" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Application Details</Text>
        </View>

        {/* Status Card */}
        <View style={[styles.statusCard, { borderLeftColor: getStatusColor() }]}>
          <View style={styles.statusHeader}>
            <Text style={styles.programName}>{getProgramTypeName()}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
              <Text style={styles.statusText}>{application.status?.toUpperCase() || 'PENDING'}</Text>
            </View>
          </View>

          <Text style={styles.applicationId}>Reference: {application.id}</Text>
          <Text style={styles.applicationDate}>{formattedApp.formattedDate}</Text>
        </View>

        {/* Main Details Section */}
        <View style={styles.detailsCard}>
          {renderDetailRow('account', 'Applicant Name', application.fullName)}
          {renderDetailRow('card-account-details', 'Program Type', getProgramTypeName())}
          
          {hospitalDetails?.type === 'dswd-burial' ? (
            renderDetailRow('account-heart', 'Deceased Name', application.medicalCondition)
          ) : (
            renderDetailRow('hospital', 'Medical Condition', application.medicalCondition)
          )}
          
          {renderDetailRow('cash', 'Estimated Cost', formattedApp.estimatedCost)}
          
          {hospitalDetails?.type === 'dswd-burial' ? (
            renderDetailRow('home-heart', 'Funeral Home', hospitalDetails.name)
          ) : (
            renderDetailRow('home', 'Hospital/Clinic', hospitalDetails?.name)
          )}
          
          {application.patientStatus && renderDetailRow(
            'account-arrow-right', 
            'Patient Status', 
            application.patientStatus === 'inpatient' ? 'In-Patient' : 'Out-Patient'
          )}
        </View>

        {/* Contact Information Section */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          {renderDetailRow('phone', 'Phone Number', application.contactNumber)}
          {renderDetailRow('email', 'Email', application.email)}
          {renderDetailRow('map-marker', 'Address', application.address, true)}
          
          
        </View>

        {/* Requirements Section */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Required Documents</Text>
          {(hospitalDetails?.requirements || []).map((req, index) => (
            <View key={index} style={styles.requirementItem}>
              <MaterialCommunityIcons 
                name="file-document" 
                size={18} 
                color="#555" 
                style={styles.requirementIcon}
              />
              <Text style={styles.requirementText}>{req}</Text>
            </View>
          ))}
        </View>

        {/* Hospital Logo Section */}
        {hospitalDetails?.logo && (
          <View style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>Hospital Logo</Text>
            <Image 
              source={{ uri: hospitalDetails.logo }}
              style={styles.hospitalLogo}
              resizeMode="contain"
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 30
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  backButton: {
    padding: 8,
    marginRight: 10
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#003580'
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  programName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003580',
    flex: 1,
    marginRight: 10
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold'
  },
  applicationId: {
    fontSize: 12,
    color: '#777',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginBottom: 4
  },
  applicationDate: {
    fontSize: 13,
    color: '#555'
  },
  detailsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003580',
    marginBottom: 15
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-start'
  },
  detailIconContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 10
  },
  detailTextContainer: {
    flex: 1
  },
  detailLabel: {
    fontSize: 12,
    color: '#777',
    marginBottom: 2
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE'
  },
  requirementIcon: {
    marginRight: 10
  },
  requirementText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20
  },
  hospitalLogo: {
    width: '100%',
    height: 100,
    marginTop: 10
  },
  callButton: {
    flexDirection: 'row',
    backgroundColor: '#003580',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15
  },
  callButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16
  }
});

export default ApplicationDetails;