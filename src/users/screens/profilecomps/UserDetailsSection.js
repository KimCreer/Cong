import React from 'react';
import { View, Text, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import PropTypes from 'prop-types';
import Animated from 'react-native-reanimated';

const getIconName = (field) => {
  switch (field) {
    case 'firstName': return 'user';
    case 'lastName': return 'user';
    case 'email': return 'envelope';
    case 'dob': return 'calendar';
    case 'gender': return 'venus-mars';
    case 'address': return 'home';
    case 'barangay': return 'map-marker';
    case 'phone': return 'phone';
    case 'occupation': return 'briefcase';
    case 'nationality': return 'flag';
    default: return 'question';
  }
};

const UserDetailsSection = ({ 
  user, 
  updatedUser, 
  isEditing, 
  setUpdatedUser, 
  animatedStyle = {}  // Default value set here
}) => {
  const userDetailsFields = [
    "firstName", "lastName", "email", "dob", 
    "gender", "address", "barangay", "phone", 
    "occupation", "nationality"
  ];

  return (
    <Animated.View style={[styles.section, animatedStyle]}>
      <View style={styles.sectionHeader}>
        <Icon name="user" size={20} color="#003366" style={styles.sectionIcon} />
        <Text style={styles.sectionTitle}>Personal Information</Text>
      </View>
      
      {userDetailsFields.map((field) => (
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
          {isEditing ? (
            <TextInput
              style={styles.editableDetailValue}
              value={updatedUser[field] || ''}
              onChangeText={(text) => setUpdatedUser({ ...updatedUser, [field]: text })}
              placeholder={`Enter ${field}`}
              keyboardType={field === "phone" ? "phone-pad" : "default"}
              editable={field !== "phone"}
            />
          ) : (
            <Text style={styles.detailValue} numberOfLines={1}>
              {user[field] || "Not specified"}
            </Text>
          )}
        </View>
      ))}
    </Animated.View>
  );
};

// PropTypes for type checking
UserDetailsSection.propTypes = {
  user: PropTypes.object.isRequired,
  updatedUser: PropTypes.object.isRequired,
  isEditing: PropTypes.bool.isRequired,
  setUpdatedUser: PropTypes.func.isRequired,
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
    color: '#003366',
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
    flex: 1,
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
    flex: 1,
    textAlign: 'left',
    paddingLeft: -100,
  },
  editableDetailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'left',
    paddingLeft: -100,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 2,
  },
};

export default UserDetailsSection;