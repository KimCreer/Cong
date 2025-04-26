// components/MedicalFinancialSection.js
import React, { memo, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image
} from 'react-native';
import PropTypes from 'prop-types';

// Constants
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/80';
const FILTER_OPTIONS = [
  { id: 'all', label: 'All', color: 'black' },
  { id: 'extensive', label: 'Extensive', color: '#F75A5A' },
  { id: 'standard', label: 'Standard', color: '#F1BA88' },
  { id: 'dswd', label: 'DSWD', color: '#5E35B1' },
];

const MedicalFinancialSection = ({ navigation, hospitals = [] }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  
  const filteredHospitals = useMemo(() => {
    if (!hospitals) return [];
    
    return activeFilter === 'all' 
      ? hospitals 
      : hospitals.filter(h => 
          activeFilter === 'dswd' ? h.type.includes('dswd') : h.type === activeFilter
        );
  }, [hospitals, activeFilter]);

  const navigateToHospital = useCallback((hospital) => {
    navigation.navigate("AssistanceScreen", { 
      hospital,
      requirements: hospital.requirements 
    });
  }, [navigation]);

  const navigateToFinancialAssistance = useCallback(() => {
    navigation.navigate("FinancialAssistanceScreen");
  }, [navigation]);

  const getRequirementTypeLabel = useCallback((type) => {
    if (type === 'extensive') return 'Extensive';
    if (type.includes('dswd')) return 'DSWD';
    return 'Standard';
  }, []);

  const renderFilterButton = ({ id, label, color }) => (
    <TouchableOpacity
      key={id}
      style={[
        styles.filterButton,
        activeFilter === id && styles.activeFilter,
        { backgroundColor: color }
      ]}
      onPress={() => setActiveFilter(id)}
      activeOpacity={0.7}
    >
      <Text style={styles.filterText}>{label}</Text>
    </TouchableOpacity>
  );

  const renderHospitalCard = (hospital) => (
    <View key={hospital.id} style={styles.hospitalCard}>
      <TouchableOpacity 
        style={styles.logoContainer}
        onPress={() => navigateToHospital(hospital)}
        activeOpacity={0.8}
      >
        <Image 
          source={{ uri: hospital.logo || PLACEHOLDER_IMAGE }} 
          style={styles.hospitalLogo}
          resizeMode="contain"
        />
      </TouchableOpacity>
      <View style={[styles.requirementBadge, { backgroundColor: hospital.color }]}>
        <Text style={styles.badgeText}>{getRequirementTypeLabel(hospital.type)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Medical Financial Assistance</Text>
      
      <View style={styles.card}>
        <Text style={styles.description}>
          Tap a hospital logo to view specific requirements
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
              <Text style={styles.noHospitalsText}>
                No hospitals found for this filter
              </Text>
            </View>
          )}
        </ScrollView>
        
        {/* Financial Assistance Button */}
        <TouchableOpacity 
          style={styles.financialAssistanceButton}
          onPress={navigateToFinancialAssistance}
          activeOpacity={0.7}
        >
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
      color: PropTypes.string.isRequired,
      requirements: PropTypes.arrayOf(PropTypes.string).isRequired,
    })
  ),
};

// Styles
const styles = StyleSheet.create({
  container: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    paddingHorizontal: 5,
  },
  card: {
    backgroundColor: '#003580',
    borderRadius: 15,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 20,
  },
  filterContainer: {
    paddingBottom: 10,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginRight: 8,
    opacity: 0.7,
  },
  activeFilter: {
    opacity: 1,
    transform: [{ scale: 1.05 }],
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
    width: 90,
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
  },
  hospitalLogo: {
    width: '100%',
    height: '100%',
  },
  requirementBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  financialAssistanceButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginTop: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  financialAssistanceButtonText: {
    color: '#003580',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noHospitalsContainer: {
    width: '100%',
    padding: 10,
    alignItems: 'center',
  },
  noHospitalsText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
});

export default memo(MedicalFinancialSection);