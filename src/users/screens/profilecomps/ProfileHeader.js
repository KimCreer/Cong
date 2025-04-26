import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import PropTypes from 'prop-types';

const ProfileHeader = ({ 
  onLockPress, 
  onLogoutPress, 
  isLoading = false // Default parameter here instead of defaultProps
}) => {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Profile</Text>
      <View style={styles.headerActions}>
        <TouchableOpacity 
          onPress={onLockPress}
          style={styles.headerActionButton}
        >
          <Icon name="lock" size={20} color="#003366" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={onLogoutPress} 
          style={styles.headerActionButton}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#003366" size="small" />
          ) : (
            <Icon name="sign-out" size={20} color="#003366" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

ProfileHeader.propTypes = {
  onLockPress: PropTypes.func.isRequired,
  onLogoutPress: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

// Remove the defaultProps since we're using default parameters now
// ProfileHeader.defaultProps = {
//   isLoading: false,
// };

const styles = {
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#003366',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    marginLeft: 15,
    padding: 8,
  },
};

export default ProfileHeader;