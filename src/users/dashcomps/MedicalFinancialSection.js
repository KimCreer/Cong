// components/MedicalFinancialSection.js
import React, { memo, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import PropTypes from 'prop-types';

// Constants
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/80';
const FILTER_OPTIONS = [
  { id: 'guarantee', label: 'Guarantee', color: '#4CAF50' },
  { id: 'medical-financial', label: 'Medical Financial', color: '#2196F3' },
  { id: 'dswd-medical', label: 'DSWD Medical', color: '#5E35B1' },
  { id: 'dswd-burial', label: 'DSWD Burial', color: '#5E35B1' },
];

// Program type descriptions
const PROGRAM_DESCRIPTIONS = {
  'guarantee': 'Hospital admission guarantee letter services',
  'medical-financial': 'Financial assistance for medical treatments and procedures',
  'dswd-medical': 'DSWD financial assistance for medical expenses',
  'dswd-burial': 'Assistance for funeral and burial expenses',
  'default': 'Medical financial assistance program'
};

const MedicalFinancialSection = ({ navigation, hospitals = [] }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  
  const filteredHospitals = useMemo(() => {
    if (!hospitals || hospitals.length === 0) return [];
    
    return activeFilter === 'all' 
      ? hospitals 
      : hospitals.filter(h => h.type === activeFilter);
  }, [hospitals, activeFilter]);

  const navigateToHospital = useCallback((hospital) => {
    if (!hospital) return;
    
    // Add default requirements based on type if not provided
    const enhancedHospital = {
      ...hospital,
      requirements: hospital.requirements || getRequirements(hospital.type, 'outpatient')
    };
    
    navigation.navigate("AssistanceScreen", { 
      hospital: enhancedHospital,
    });
  }, [navigation]);

  const navigateToFinancialAssistance = useCallback(() => {
    navigation.navigate("FinancialAssistanceScreen");
  }, [navigation]);

  // Helper function to get requirements (matching the one in AssistanceScreen)
  function getRequirements(type, patientStatus) {
    const requirements = {
      'guarantee': [
        'Hospital Guarantee Request Letter',
        'Medical Abstract/Certificate (with doctor\'s signature)',
        'Valid ID (front & back)',
        'Certificate of Indigency (from barangay)',
        'Certificate of Employment/Income (if applicable)',
        'Hospital Bill (if available)'
      ],
      'medical-financial': [
        patientStatus === 'inpatient' 
          ? 'Clinical Abstract (for confined patients)' 
          : 'Medical Certificate (for non-confined patients)',
        'Quotation/Bill/Statement of Account (from hospital)',
        'Valid ID with Muntinlupa address',
        'Voter\'s ID / COMELEC Certification (proof of residency)',
        'Certificate of Indigency (from barangay)',
        'Authorization Letter (if applying on behalf)'
      ],
      'endorsement': [
        'Endorsement Request Letter',
        'Medical Certificate (updated within 3 months)',
        'Valid ID (front & back)',
        'Certificate of Indigency (from barangay)',
        'Laboratory results (if available)',
        'Treatment plan from doctor'
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
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Alert.alert('Refreshed', 'Hospital data has been updated');
    }, 1000);
  }, []);

  const getProgramDescription = (type) => {
    return PROGRAM_DESCRIPTIONS[type] || PROGRAM_DESCRIPTIONS.default;
  };

  const renderFilterButton = ({ id, label, color }) => (
    <TouchableOpacity
      key={id}
      style={[
        styles.filterButton,
        activeFilter === id && styles.activeFilter,
        { backgroundColor: activeFilter === id ? color : 'rgba(255, 255, 255, 0.2)' }
      ]}
      onPress={() => setActiveFilter(id)}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.filterText,
        activeFilter !== id && { color: '#FFF' }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderHospitalCard = (hospital) => (
    <TouchableOpacity 
      key={hospital.id} 
      style={styles.hospitalCard}
      onPress={() => navigateToHospital(hospital)}
      activeOpacity={0.8}
    >
      <View style={styles.logoContainer}>
        <Image 
          source={{ uri: hospital.logo || PLACEHOLDER_IMAGE }} 
          style={styles.hospitalLogo}
          resizeMode="contain"
        />
      </View>
      <View style={[styles.requirementBadge, { backgroundColor: hospital.color }]}>
        <Text style={styles.badgeText}>{getRequirementTypeLabel(hospital.type)}</Text>
      </View>
      <Text style={styles.hospitalName} numberOfLines={2}>
        {hospital.name}
      </Text>
    </TouchableOpacity>
  );

  const getRequirementTypeLabel = (type) => {
    const labels = {
      'guarantee': 'Guarantee',
      'medical-financial': 'Medical',
      'endorsement': 'Endorsement',
      'dswd-medical': 'DSWD Medical',
      'dswd-burial': 'DSWD Burial'
    };
    return labels[type] || type;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.sectionTitle}> Financial Assistance</Text>
        <TouchableOpacity 
          onPress={onRefresh}
          style={styles.refreshButton}
        >
          <FontAwesome5 name="sync-alt" size={14} color="#003580" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.card}>
        {/* Program Description */}
        <Text style={styles.description}>
          {activeFilter === 'all' 
            ? 'Access various medical assistance programs offered by the city and partner hospitals.'
            : getProgramDescription(activeFilter)}
        </Text>
        
        {/* Filter Controls */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {FILTER_OPTIONS.map(renderFilterButton)}
        </ScrollView>

        {/* Hospitals Grid */}
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hospitalsContainer}
        >
          {filteredHospitals.length > 0 ? (
            filteredHospitals.map(renderHospitalCard)
          ) : (
            <View style={styles.noHospitalsContainer}>
              <FontAwesome5 name="hospital" size={24} color="rgba(255, 255, 255, 0.6)" />
              <Text style={styles.noHospitalsText}>
                No hospitals found for this category
              </Text>
              <Text style={styles.noHospitalsSubText}>
                Try selecting a different category
              </Text>
            </View>
          )}
        </ScrollView>
        
        {/* Important Notes */}
        <View style={styles.noteBox}>
          <FontAwesome5 name="info-circle" size={16} color="#FFF" style={styles.noteIcon} />
          <Text style={styles.noteText}>
            Tap a hospital logo to view specific requirements and application details.
          </Text>
        </View>
        
        {/* Financial Assistance Button */}
        <TouchableOpacity 
          style={styles.financialAssistanceButton}
          onPress={navigateToFinancialAssistance}
          activeOpacity={0.7}
        >
          <FontAwesome5 name="folder-open" size={16} color="#003580" style={styles.buttonIcon} />
          <Text style={styles.financialAssistanceButtonText}>My Financial Assistance</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

MedicalFinancialSection.propTypes = {
  navigation: PropTypes.object.isRequired,
  hospitals: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      logo: PropTypes.string,
      color: PropTypes.string,
      requirements: PropTypes.arrayOf(PropTypes.string),
    })
  ),
};

// Enhanced Styles
const styles = StyleSheet.create({
  container: {
    marginBottom: 25,
    paddingHorizontal: -10,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  refreshButton: {
    padding: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  card: {
    backgroundColor: '#003580',
    borderRadius: 15,
    padding: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 20,
  },
  filterContainer: {
    paddingBottom: 15,
    paddingTop: 5,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeFilter: {
    opacity: 1,
    transform: [{ scale: 1.05 }],
    borderColor: 'transparent',
  },
  filterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  hospitalsContainer: {
    paddingVertical: 10,
  },
  hospitalCard: {
    alignItems: 'center',
    marginRight: 15,
    width: 100,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    elevation: 2,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  hospitalLogo: {
    width: '100%',
    height: '100%',
  },
  requirementBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 5,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  hospitalName: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 3,
    fontWeight: '500',
  },
  noHospitalsContainer: {
    width: 280,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 10,
    height: 150,
  },
  noHospitalsText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 15,
    fontWeight: 'bold',
  },
  noHospitalsSubText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 5,
  },
  noteBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 15,
  },
  noteIcon: {
    marginTop: 2,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: '#FFFFFF',
    marginLeft: 10,
    lineHeight: 20,
  },
  financialAssistanceButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginTop: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  buttonIcon: {
    marginRight: 10,
  },
  financialAssistanceButtonText: {
    color: '#003580',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default memo(MedicalFinancialSection);