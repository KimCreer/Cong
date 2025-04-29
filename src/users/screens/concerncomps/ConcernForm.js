import React, { useState, useEffect } from 'react';
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
  Animated,
  Alert
} from 'react-native';
import { Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const categoryData = {
  'General': {
    icon: 'alert-circle-outline',
    color: '#0275d8',
    fields: ['title', 'description', 'location', 'photo']
  },
  'Issue': {
    icon: 'alert-octagon',
    color: '#dc3545',
    fields: ['title', 'description', 'location', 'urgency', 'photo']
  },
  'Complaint': {
    icon: 'account-alert',
    color: '#fd7e14',
    fields: ['title', 'description', 'location', 'against', 'photo']
  },
  'Suggestion': {
    icon: 'lightbulb-on',
    color: '#ffc107',
    fields: ['title', 'description', 'department', 'photo']
  }
};

const ConcernForm = ({
    title,
    setTitle,
    description,
    setDescription,
    location,
    setLocation,
    category: propCategory,
    setCategory: propSetCategory,
    imageUri,
    setImageUri,
    uploadProgress,
    isUploading,
    isLoading,
    handleSubmit,
    selectImage,
    takePhoto,
    setShowForm
  }) => {
  
  // Ensure category is always one of our defined categories
  const [internalCategory, setInternalCategory] = useState(
    Object.keys(categoryData).includes(propCategory) ? propCategory : 'General'
  );
  
  // Sync with parent component if needed
  useEffect(() => {
    if (propCategory !== internalCategory) {
      propSetCategory(internalCategory);
    }
  }, [internalCategory]);

  const [validationErrors, setValidationErrors] = useState({
    title: false,
    description: false,
    location: false,
    photo: false,
    urgency: false,
    against: false,
    department: false
  });

  const [additionalFields, setAdditionalFields] = useState({
    urgency: '',
    against: '',
    department: ''
  });

  const handleAdditionalFieldChange = (field, value) => {
    setAdditionalFields({
      ...additionalFields,
      [field]: value
    });
    setValidationErrors({
      ...validationErrors,
      [field]: false
    });
  };

  const validateForm = () => {
    const currentCategory = categoryData[internalCategory];
    const errors = {
      title: !title.trim(),
      description: !description.trim(),
      location: currentCategory.fields.includes('location') && !location.trim(),
      photo: !imageUri,
      urgency: currentCategory.fields.includes('urgency') && !additionalFields.urgency.trim(),
      against: currentCategory.fields.includes('against') && !additionalFields.against.trim(),
      department: currentCategory.fields.includes('department') && !additionalFields.department.trim()
    };
    
    setValidationErrors(errors);
    
    return !Object.values(errors).some(error => error);
  };

  const handleSubmitWithValidation = () => {
    if (validateForm()) {
      const formData = {
        title,
        description,
        location,
        category: internalCategory,
        imageUri,
        ...additionalFields
      };
      handleSubmit(formData);
    }
  };

  const renderCategoryCards = () => {
    return (
      <View style={styles.categoryContainer}>
        {Object.keys(categoryData).map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryCard,
              internalCategory === cat && styles.categoryCardSelected,
              { 
                borderColor: categoryData[cat].color,
                backgroundColor: internalCategory === cat ? categoryData[cat].color : '#fff'
              }
            ]}
            onPress={() => setInternalCategory(cat)}
          >
            <Icon 
              name={categoryData[cat].icon} 
              size={24} 
              color={internalCategory === cat ? '#fff' : categoryData[cat].color} 
              style={styles.categoryIcon} 
            />
            <Text 
              style={[
                styles.categoryText,
                { color: internalCategory === cat ? '#fff' : categoryData[cat].color }
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderFields = () => {
    const currentCategory = categoryData[internalCategory];
    
    return (
      <>
        <View style={[
          styles.inputContainer,
          validationErrors.title && styles.inputContainerError
        ]}>
          <Text style={styles.inputLabel}>Title</Text>
          <View style={[
            styles.inputWrapper,
            validationErrors.title && styles.inputWrapperError
          ]}>
            <TextInput
              style={styles.input}
              placeholder="Brief title for your concern"
              placeholderTextColor="#999"
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                setValidationErrors({...validationErrors, title: false});
              }}
            />
          </View>
          {validationErrors.title && (
            <Text style={styles.errorText}>Please enter a title</Text>
          )}
        </View>
        
        <View style={[
          styles.inputContainer,
          validationErrors.description && styles.inputContainerError
        ]}>
          <Text style={styles.inputLabel}>Description</Text>
          <View style={[
            styles.inputWrapper,
            validationErrors.description && styles.inputWrapperError
          ]}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your concern in detail..."
              placeholderTextColor="#999"
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                setValidationErrors({...validationErrors, description: false});
              }}
              multiline
              numberOfLines={4}
            />
          </View>
          {validationErrors.description && (
            <Text style={styles.errorText}>Please enter a description</Text>
          )}
        </View>
        
        {currentCategory.fields.includes('location') && (
          <View style={[
            styles.inputContainer,
            validationErrors.location && styles.inputContainerError
          ]}>
            <Text style={styles.inputLabel}>Location</Text>
            <View style={[
              styles.inputWrapper,
              validationErrors.location && styles.inputWrapperError
            ]}>
              <TextInput
                style={styles.input}
                placeholder="Where is this concern located?"
                placeholderTextColor="#999"
                value={location}
                onChangeText={(text) => {
                  setLocation(text);
                  setValidationErrors({...validationErrors, location: false});
                }}
              />
            </View>
            {validationErrors.location && (
              <Text style={styles.errorText}>Please enter a location</Text>
            )}
          </View>
        )}
        
        {currentCategory.fields.includes('urgency') && (
          <View style={[
            styles.inputContainer,
            validationErrors.urgency && styles.inputContainerError
          ]}>
            <Text style={styles.inputLabel}>Urgency Level</Text>
            <View style={[
              styles.inputWrapper,
              validationErrors.urgency && styles.inputWrapperError
            ]}>
              <TextInput
                style={styles.input}
                placeholder="How urgent is this issue? (Low/Medium/High)"
                placeholderTextColor="#999"
                value={additionalFields.urgency}
                onChangeText={(text) => handleAdditionalFieldChange('urgency', text)}
              />
            </View>
            {validationErrors.urgency && (
              <Text style={styles.errorText}>Please specify urgency level</Text>
            )}
          </View>
        )}
        
        {currentCategory.fields.includes('against') && (
          <View style={[
            styles.inputContainer,
            validationErrors.against && styles.inputContainerError
          ]}>
            <Text style={styles.inputLabel}>Complaint Against</Text>
            <View style={[
              styles.inputWrapper,
              validationErrors.against && styles.inputWrapperError
            ]}>
              <TextInput
                style={styles.input}
                placeholder="Who is this complaint against?"
                placeholderTextColor="#999"
                value={additionalFields.against}
                onChangeText={(text) => handleAdditionalFieldChange('against', text)}
              />
            </View>
            {validationErrors.against && (
              <Text style={styles.errorText}>Please specify who this is against</Text>
            )}
          </View>
        )}
        
        {currentCategory.fields.includes('department') && (
          <View style={[
            styles.inputContainer,
            validationErrors.department && styles.inputContainerError
          ]}>
            <Text style={styles.inputLabel}>Department</Text>
            <View style={[
              styles.inputWrapper,
              validationErrors.department && styles.inputWrapperError
            ]}>
              <TextInput
                style={styles.input}
                placeholder="Which department is this suggestion for?"
                placeholderTextColor="#999"
                value={additionalFields.department}
                onChangeText={(text) => handleAdditionalFieldChange('department', text)}
              />
            </View>
            {validationErrors.department && (
              <Text style={styles.errorText}>Please specify the department</Text>
            )}
          </View>
        )}
      </>
    );
  };

  return (
    <View style={styles.formWrapper}>
      <LinearGradient
        colors={['#0275d8', '#025aa5']}
        style={styles.formHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.formTitle}>Specify your Concern</Text>
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
        {renderCategoryCards()}
        
        <Text style={styles.sectionTitle}>Details</Text>
        <Divider style={styles.divider} />
        
        {renderFields()}
        
        <View style={[
          styles.inputContainer,
          validationErrors.photo && styles.inputContainerError
        ]}>
          <Text style={styles.inputLabel}>Photo Evidence (Required)</Text>
          <Text style={styles.inputSubLabel}>
            Photo proof is required to verify and properly address your concern
          </Text>
          
          {imageUri ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              <View style={styles.imageActions}>
                <TouchableOpacity 
                  style={styles.imageActionButton}
                  onPress={() => {
                    setImageUri(null);
                    setValidationErrors({...validationErrors, photo: false});
                  }}
                >
                  <Icon name="close" size={18} color="#FF3B30" />
                  <Text style={styles.imageActionText}>Remove</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.imageActionButton, {marginLeft: 10}]}
                  onPress={takePhoto}
                >
                  <Icon name="camera" size={18} color="#0275d8" />
                  <Text style={[styles.imageActionText, {color: '#0275d8'}]}>Retake</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.photoEncouragement}>
                <Icon name="alert-circle-outline" size={20} color="#ff9800" />
                <Text style={styles.photoEncouragementText}>
                  Photo evidence is mandatory for all concerns
                </Text>
              </View>
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
            </>
          )}
          
          {validationErrors.photo && (
            <Text style={styles.errorText}>Please add photo evidence</Text>
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
          onPress={handleSubmitWithValidation} 
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
    marginBottom: 5,
  },
  divider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginBottom: 20,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  categoryCard: {
    width: '48%',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  categoryCardSelected: {
    backgroundColor: '#0275d8',
  },
  categoryIcon: {
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputContainerError: {
    marginBottom: 8,
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
  inputWrapperError: {
    borderColor: '#dc3545',
    backgroundColor: '#fff5f5',
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
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  photoEncouragement: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8e1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ffe0b2',
  },
  photoEncouragementText: {
    marginLeft: 8,
    color: '#ff9800',
    fontSize: 13,
    fontWeight: '500',
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