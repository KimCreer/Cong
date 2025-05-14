import React, { memo, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  TextInput
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import PropTypes from 'prop-types';

// Constants
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/80';
const FILTER_OPTIONS = [
  { id: 'guarantee', label: 'Guarantee Letters', color: '#4CAF50' },
  { id: 'dswd-medical', label: 'DSWD Medical', color: '#5E35B1' },
  { id: 'dswd-burial', label: 'DSWD Burial', color: '#5E35B1' },
];

// Hospital category order and descriptions
const CATEGORY_ORDER = {
  'local hospital': 1,
  'doh hospital': 2,
  'suc hospital': 3
};

const CATEGORY_DESCRIPTIONS = {
  'local hospital': 'City/Municipal Hospital',
  'doh hospital': 'Department of Health Hospital',
  'suc hospital': 'State University Hospital'
};

// Program type descriptions
const PROGRAM_DESCRIPTIONS = {
  'guarantee': 'Hospital admission guarantee letter services for medical assistance',
  'dswd-medical': 'DSWD financial assistance for medical expenses',
  'dswd-burial': 'Assistance for funeral and burial expenses',
  'default': 'Medical financial assistance program'
};

const MedicalFinancialSection = ({ navigation, hospitals = [] }) => {
  const [activeFilter, setActiveFilter] = useState('guarantee');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredHospitals = useMemo(() => {
    if (!hospitals || hospitals.length === 0) return [];
    
    // First filter by type
    let filtered = hospitals.filter(h => h.type === activeFilter);
    
    // Then filter by category if selected and in guarantee letters
    if (selectedCategory && activeFilter === 'guarantee') {
      filtered = filtered.filter(h => 
        (h.category || '').toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    
    // Then filter by search query if exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(h => 
        h.name.toLowerCase().includes(query) ||
        (h.category && h.category.toLowerCase().includes(query))
      );
    }

    // Sort hospitals by category and then alphabetically
    return filtered.sort((a, b) => {
      const aCategory = (a.category || '').toLowerCase();
      const bCategory = (b.category || '').toLowerCase();
      
      const aCategoryOrder = CATEGORY_ORDER[aCategory] || 999;
      const bCategoryOrder = CATEGORY_ORDER[bCategory] || 999;
      
      if (aCategoryOrder !== bCategoryOrder) {
        return aCategoryOrder - bCategoryOrder;
      }
      
      return a.name.localeCompare(b.name);
    });
  }, [hospitals, activeFilter, searchQuery, selectedCategory]);

  // Reset category filter when changing program type
  const handleFilterChange = useCallback((filterId) => {
    setActiveFilter(filterId);
    if (filterId !== 'guarantee') {
      setSelectedCategory(null);
    }
  }, []);

  const navigateToHospital = useCallback((hospital) => {
    if (!hospital) return;
    
    navigation.navigate("AssistanceScreen", { 
      hospital: {
        ...hospital,
        // Ensure requirements are properly structured
        requirements: hospital.requirements || {
          inpatient: [],
          outpatient: []
        }
      },
    });
  }, [navigation]);

  const navigateToFinancialAssistance = useCallback(() => {
    navigation.navigate("FinancialAssistanceScreen");
  }, [navigation]);

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

  const getCategoryColor = (category) => {
    switch ((category || '').toLowerCase()) {
      case 'doh hospital': return '#4CAF50';
      case 'local hospital': return '#2196F3';
      case 'national program': return '#9C27B0';
      case 'suc hospital': return '#FF9800';
      default: return '#607D8B';
    }
  };

  const getCategoryDisplayName = (category) => {
    return CATEGORY_DESCRIPTIONS[category?.toLowerCase()] || category;
  };

  const renderFilterButton = ({ id, label, color }) => (
    <TouchableOpacity
      key={id}
      style={[
        styles.filterButton,
        activeFilter === id && styles.activeFilter,
        { backgroundColor: activeFilter === id ? color : 'rgba(255, 255, 255, 0.2)' }
      ]}
      onPress={() => handleFilterChange(id)}
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

  const renderHospitalCard = useCallback((hospital) => (
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
      
      {hospital.category && (
        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(hospital.category) }]}>
          <Text style={styles.categoryText}>{getCategoryDisplayName(hospital.category)}</Text>
        </View>
      )}
      
      <View style={[styles.requirementBadge, { backgroundColor: hospital.color }]}>
        <Text style={styles.badgeText}>{getRequirementTypeLabel(hospital.type)}</Text>
      </View>
      
      <Text style={styles.hospitalName} numberOfLines={2}>
        {hospital.name}
      </Text>
    </TouchableOpacity>
  ), [navigateToHospital]);

  const getRequirementTypeLabel = (type) => {
    const labels = {
      'guarantee': 'Guarantee Letters',
      'medical-financial': 'Medical',
      'endorsement': 'Endorsement',
      'dswd-medical': 'DSWD Medical',
      'dswd-burial': 'DSWD Burial'
    };
    return labels[type] || type;
  };

  const renderCategoryLegend = () => {
    if (activeFilter !== 'guarantee') return null;

    const categories = [
      { id: 'local hospital', label: 'City/Municipal Hospital', color: '#2196F3', description: 'Local government-operated hospitals' },
      { id: 'doh hospital', label: 'DOH Hospital', color: '#4CAF50', description: 'Department of Health hospitals' },
      { id: 'suc hospital', label: 'State University Hospital', color: '#FF9800', description: 'University-affiliated hospitals' }
    ];

    return (
      <View style={styles.categoryLegend}>
        <Text style={styles.legendTitle}>Hospital Categories:</Text>
        <View style={styles.legendItems}>
          {categories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.legendItem,
                selectedCategory === category.id && styles.selectedLegendItem
              ]}
              onPress={() => setSelectedCategory(
                selectedCategory === category.id ? null : category.id
              )}
              activeOpacity={0.7}
            >
              <View style={[styles.legendColor, { backgroundColor: category.color }]} />
              <View style={styles.legendTextContainer}>
                <Text style={styles.legendText}>{category.label}</Text>
                <Text style={styles.legendDescription}>{category.description}</Text>
              </View>
              {selectedCategory === category.id && (
                <FontAwesome5 name="check-circle" size={16} color="#FFFFFF" style={styles.checkIcon} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.sectionTitle}>Financial Assistance</Text>
        <TouchableOpacity 
          onPress={onRefresh}
          style={styles.refreshButton}
        >
          <FontAwesome5 
            name="sync-alt" 
            size={14} 
            color="#003580" 
            style={refreshing && styles.refreshingIcon}
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.card}>
        {/* Program Description */}
        <Text style={styles.description}>
          {getProgramDescription(activeFilter)}
        </Text>
        
        {/* Search Input */}
        <View style={styles.searchContainer}>
          <FontAwesome5 name="search" size={14} color="rgba(255, 255, 255, 0.7)" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search hospitals..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <FontAwesome5 name="times-circle" size={14} color="rgba(255, 255, 255, 0.7)" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Controls */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {FILTER_OPTIONS.map(renderFilterButton)}
        </ScrollView>

        {/* Category Legend - Now only shows for guarantee letters */}
        {renderCategoryLegend()}

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
                {searchQuery ? 'No hospitals found matching your search' : 'No hospitals found for this category'}
              </Text>
              <Text style={styles.noHospitalsSubText}>
                {searchQuery ? 'Try a different search term' : 'Try selecting a different category'}
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
      category: PropTypes.string,
      logo: PropTypes.string,
      color: PropTypes.string,
      requirements: PropTypes.shape({
        inpatient: PropTypes.arrayOf(PropTypes.string),
        outpatient: PropTypes.arrayOf(PropTypes.string)
      }),
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
    paddingHorizontal: 5,
  },
  refreshButton: {
    padding: 8,
  },
  refreshingIcon: {
    transform: [{ rotate: '360deg' }],
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  card: {
    backgroundColor: '#003580',
    borderRadius: 15,
    padding: 15,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  hospitalsContainer: {
    paddingVertical: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  hospitalCard: {
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 15,
    width: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 8,
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
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  hospitalLogo: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 5,
    alignSelf: 'center',
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  requirementBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
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
  categoryLegend: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  legendTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  legendItems: {
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  selectedLegendItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  checkIcon: {
    marginLeft: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  legendTextContainer: {
    flex: 1,
  },
  legendText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  legendDescription: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 2,
  },
});

export default memo(MedicalFinancialSection);