import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import PropTypes from 'prop-types';
import Animated from 'react-native-reanimated';

const ProfileCard = ({
  user,
  pictureChanged,
  isLoading,
  isEditing,
  onPictureUpdate,
  onSavePicture,
  onEditPress,
  animatedStyle = {} 
}) => {
  return (
    <Animated.View style={[styles.profileCard, animatedStyle]}>
      <View style={styles.profileImageContainer}>
        <Image
          source={{ uri: user.profilePicture || "https://via.placeholder.com/150" }}
          style={styles.profileImage}
        />
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={pictureChanged ? onSavePicture : onPictureUpdate}
          disabled={isLoading}
        >
          <Icon 
            name={pictureChanged ? "check" : "camera"} 
            size={16} 
            color="white" 
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {user.firstName || "User"} {user.lastName || "Name"}
        </Text>
        <Text style={styles.userEmail}>{user.phone || "user@example.com"}</Text>
        
        <TouchableOpacity
          onPress={onEditPress}
          style={[styles.editProfileButton, isEditing && styles.saveButton]}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.editProfileText}>
              {isEditing ? "Save Profile" : "Edit Profile"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

ProfileCard.propTypes = {
  user: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    phone: PropTypes.string,
    profilePicture: PropTypes.string,
  }).isRequired,
  pictureChanged: PropTypes.bool,
  isLoading: PropTypes.bool,
  isEditing: PropTypes.bool,
  onPictureUpdate: PropTypes.func.isRequired,
  onSavePicture: PropTypes.func.isRequired,
  onEditPress: PropTypes.func.isRequired,
  animatedStyle: PropTypes.object,
};



const styles = {
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#003366',
  },
  uploadButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#003366',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#003366',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  editProfileButton: {
    backgroundColor: '#003366',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  saveButton: {
    backgroundColor: '#28a745',
  },
  editProfileText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
};

export default ProfileCard;