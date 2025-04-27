import React from 'react';
import { View, Text, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import PropTypes from 'prop-types';
import Animated from 'react-native-reanimated';

const EmergencyContactSection = ({ 
  user = {}, 
  updatedUser = {}, 
  isEditing = false, 
  setUpdatedUser = () => {}, 
  animatedStyle = {} 
}) => {
  const emergencyContactFields = ["Name", "Phone", "Relationship"];

  const getIconName = (field) => {
    switch (field) {
      case 'Name': return 'user-md';
      case 'Phone': return 'phone';
      case 'Relationship': return 'handshake-o';
      default: return 'question';
    }
  };

  return (
    <Animated.View style={[styles.section, animatedStyle]}>
      <View style={styles.sectionHeader}>
        <Icon 
          name="exclamation-triangle" 
          size={20} 
          color="#D32F2F" 
          style={styles.sectionIcon} 
        />
        <Text style={[styles.sectionTitle, { color: '#D32F2F' }]}>
          Emergency Contact
        </Text>
      </View>
      
      {emergencyContactFields.map((field) => (
        <View key={field} style={styles.detailRow}>
          <View style={styles.detailLabelContainer}>
            <Icon
              name={getIconName(field)}
              size={16}
              color="#888"
              style={styles.detailIcon}
            />
            <Text style={styles.detailLabel}>
              {field.charAt(0).toUpperCase() + field.slice(1)}:
            </Text>
          </View>
          <View style={styles.detailValueContainer}>
            {isEditing ? (
              <TextInput
                style={[
                  styles.editableDetailValue,
                  field === 'Phone' && styles.importantField
                ]}
                value={updatedUser[field] || ''}
                onChangeText={(text) => setUpdatedUser({ ...updatedUser, [field]: text })}
                placeholder={`Enter ${field}`}
                keyboardType={field === "Phone" ? "phone-pad" : "default"}
                importantForAccessibility={field === 'Phone' ? 'yes' : 'no'}
              />
            ) : (
              <Text 
                style={[
                  styles.detailValue, 
                  field === 'Phone' && styles.importantValue
                ]} 
                numberOfLines={1}
              >
                {user[field] || "Not specified"}
              </Text>
            )}
          </View>
        </View>
      ))}
      
      {isEditing && (
        <Text style={styles.noteText}>
          Please ensure emergency contact details are accurate
        </Text>
      )}
    </Animated.View>
  );
};

EmergencyContactSection.propTypes = {
  user: PropTypes.shape({
    Name: PropTypes.string,
    Phone: PropTypes.string,
    Relationship: PropTypes.string,
  }),
  updatedUser: PropTypes.shape({
    Name: PropTypes.string,
    Phone: PropTypes.string,
    Relationship: PropTypes.string,
  }),
  isEditing: PropTypes.bool,
  setUpdatedUser: PropTypes.func,
  animatedStyle: PropTypes.object,
};

const styles = {
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionIcon: {
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '40%', // Fixed width to match PersonalInfo section
  },
  detailValueContainer: {
    width: '60%', // Fixed width to match PersonalInfo section
  },
  detailIcon: {
    marginRight: 8,
    width: 20,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    textAlign: 'left',
  },
  importantValue: {
    color: '#D32F2F',
    fontWeight: '700',
  },
  editableDetailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    textAlign: 'left',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 2,
  },
  importantField: {
    color: '#D32F2F',
    borderBottomColor: '#D32F2F',
    fontWeight: '700',
  },
  noteText: {
    fontSize: 12,
    color: '#D32F2F',
    marginTop: 10,
    fontStyle: 'italic',
  },
};

export default EmergencyContactSection;