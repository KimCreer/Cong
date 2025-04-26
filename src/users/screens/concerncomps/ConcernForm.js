import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated
} from 'react-native';
import { Menu, Divider, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const ConcernForm = ({
    title,
    setTitle,
    description,
    setDescription,
    location,
    setLocation,
    category,
    setCategory,
    imageUri,
    setImageUri,
    uploadProgress,
    isUploading,
    isLoading,
    isMenuVisible,
    setIsMenuVisible,
    handleSubmit,
    selectImage,
    takePhoto,
    getCategoryIcon,
    getCategoryColor,
    setShowForm // Add this to the props
  }) => {
  const categories = ["General", "Road", "Garbage", "Water", "Electricity"];

  return (
    <View style={styles.formWrapper}>
      <LinearGradient
        colors={['#0275d8', '#025aa5']}
        style={styles.formHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.formTitle}>Report an Issue</Text>
        <TouchableOpacity 
          onPress={() => setShowForm(false)}
          style={styles.closeButton}
        >
          <Icon name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>
      
      <ScrollView
        contentContainerStyle={styles.formContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Title</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Brief title for your concern"
              placeholderTextColor="#999"
              value={title}
              onChangeText={setTitle}
            />
          </View>
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Description</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your issue in detail..."
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Location</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Where is this issue located?"
              placeholderTextColor="#999"
              value={location}
              onChangeText={setLocation}
            />
          </View>
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Category</Text>
          <Menu
            visible={isMenuVisible}
            onDismiss={() => setIsMenuVisible(false)}
            anchor={
              <TouchableOpacity
                style={styles.categorySelector}
                onPress={() => setIsMenuVisible(true)}
              >
                <Icon 
                  name={getCategoryIcon(category)} 
                  size={20} 
                  color={getCategoryColor(category)} 
                  style={styles.categoryIcon} 
                />
                <Text style={styles.categoryText}>{category}</Text>
                <Icon name="chevron-down" size={20} color="#555" />
              </TouchableOpacity>
            }
            style={styles.menuStyle}
          >
            {categories.map((cat) => (
              <Menu.Item
                key={cat}
                onPress={() => {
                  setCategory(cat);
                  setIsMenuVisible(false);
                }}
                title={cat}
                leadingIcon={() => (
                  <Icon 
                    name={getCategoryIcon(cat)} 
                    size={20} 
                    color={getCategoryColor(cat)} 
                  />
                )}
                style={styles.menuItem}
              />
            ))}
          </Menu>
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Photo Evidence (Optional)</Text>
          <Text style={styles.inputSubLabel}>Add a photo to help authorities understand the issue</Text>
          
          {imageUri ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              <View style={styles.imageActions}>
                <TouchableOpacity 
                  style={styles.imageActionButton}
                  onPress={() => setImageUri(null)}
                >
                  <Icon name="close" size={18} color="#FF3B30" />
                  <Text style={styles.imageActionText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.imageButtons}>
              <TouchableOpacity 
                style={[styles.imageButton, {backgroundColor: '#E3F2FD'}]}
                onPress={takePhoto}
              >
                <View style={styles.imageButtonIcon}>
                  <Icon name="camera" size={24} color="#1976D2" />
                </View>
                <Text style={[styles.imageButtonText, {color: '#1976D2'}]}>Take Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.imageButton, {backgroundColor: '#E8F5E9'}]}
                onPress={selectImage}
              >
                <View style={styles.imageButtonIcon}>
                  <Icon name="image" size={24} color="#388E3C" />
                </View>
                <Text style={[styles.imageButtonText, {color: '#388E3C'}]}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {isUploading && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBackground}>
                <Animated.View 
                  style={[
                    styles.progressBar, 
                    { width: `${uploadProgress}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                Uploading: {Math.round(uploadProgress)}%
              </Text>
            </View>
          )}
        </View>
        
        <TouchableOpacity 
          style={[
            styles.submitButton,
            (isLoading || isUploading) && styles.submitButtonDisabled
          ]} 
          onPress={handleSubmit} 
          disabled={isLoading || isUploading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Icon name="send" size={18} color="#ffffff" style={styles.submitIcon} />
              <Text style={styles.submitButtonText}>Submit Report</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  formWrapper: {
    flex: 1,
    backgroundColor: '#fff',
  },
  formHeader: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    padding: 20,
    paddingBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputSubLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
  },
  inputWrapper: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  input: {
    padding: 14,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  categoryIcon: {
    marginRight: 10,
  },
  categoryText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  menuStyle: {
    marginTop: 50,
  },
  menuItem: {
    paddingVertical: 8,
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 0.48,
  },
  imageButtonIcon: {
    marginRight: 8,
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  imagePreviewContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 12,
  },
  imagePreview: {
    width: '100%',
    height: 200,
  },
  imageActions: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 8,
    borderTopLeftRadius: 10,
  },
  imageActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  imageActionText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#FF3B30',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBackground: {
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    height: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#0275d8',
  },
  progressText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    textAlign: 'right',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#0275d8',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    marginTop: 10,
    shadowColor: '#0275d8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ConcernForm;