import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
  Image
} from 'react-native';
import { FontAwesome5, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import moment from 'moment';

const ApplicationDetails = ({ route, navigation }) => {
  const { application } = route.params;

  // Format the application data for display
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

  // Get requirements based on program type
  const getRequirements = () => {
    const type = application.programType;
    const patientStatus = application.patientStatus || 'outpatient';
    
    const requirements = {
      extensive: [
        patientStatus === 'inpatient' 
          ? 'Clinical Abstract (para sa mga naka-confine)' 
          : 'Medical Certificate (para sa mga hindi naka-confine)',
        'Certification from OSMUN/Public Hospital',
        'Social Case Study',
        'Valid ID na may Muntinlupa address',
        'Voter\'s ID / COMELEC Certification',
        'Certificate of Indigency',
        'Laboratory and Diagnostic Results'
      ],
      standard: [
        'Medical Certificate (within 3 months)',
        'Quotation/Bill/Statement of Account',
        'Valid ID na may Muntinlupa address',
        'Voter\'s ID / COMELEC Certification',
        'Certificate of Indigency',
        'Authorization Letter (if applicable)'
      ],
      'dswd-medical': [
        'DSWD Prescribed Request Form',
        'Certificate of Indigency',
        'Medical Certificate/Abstract',
        'Prescription/Lab Request (2 copies)',
        'Unpaid Hospital Bill',
        'Social Case Study (for dialysis/cancer patients)'
      ],
      'dswd-burial': [
        'Death Certificate (Certified True Copy)',
        'Funeral Contract (Original + photocopy)',
        'Promissory Note / Certificate of Balance',
        'Valid ID of Claimant (2 photocopies)',
        'Certificate of Indigency'
      ]
    };

    return requirements[type] || requirements.standard;
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

  const getProgramColor = () => {
    switch (application.programType) {
      case 'extensive': return '#F75A5A';
      case 'dswd-medical': return '#5E35B1';
      case 'dswd-burial': return '#5E35B1';
      default: return '#003580';
    }
  };

  const handleCall = (phoneNumber) => {
    if (!phoneNumber) return;
    
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }

    Alert.alert(
      "Contact Applicant",
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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={24} color="#003580" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Application Details</Text>
        </View>

        {/* Status Card */}
        <View style={[styles.statusCard, { borderLeftColor: getProgramColor() }]}>
          <View style={styles.statusHeader}>
            <Text style={styles.programName}>{application.programName}</Text>
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
          {renderDetailRow('card-account-details', 'Program Type', 
            application.programType === 'extensive' ? 'Extensive Medical' :
            application.programType === 'dswd-medical' ? 'DSWD Medical' :
            application.programType === 'dswd-burial' ? 'DSWD Burial' : 'Standard Medical'
          )}
          
          {application.programType === 'dswd-burial' ? (
            renderDetailRow('account-heart', 'Deceased Name', application.medicalCondition)
          ) : (
            renderDetailRow('hospital', 'Medical Condition', application.medicalCondition)
          )}
          
          {renderDetailRow('cash', 'Estimated Cost', formattedApp.estimatedCost)}
          
          {application.programType === 'dswd-burial' ? (
            renderDetailRow('home-heart', 'Funeral Home', application.hospitalName)
          ) : (
            renderDetailRow('home', 'Hospital/Clinic', application.programName)
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
          {getRequirements().map((req, index) => (
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
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA'
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
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  callButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8
  }
});

export default ApplicationDetails;