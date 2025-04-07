// ConcernsScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
  Animated,
  Easing
} from "react-native";
import { Card, Menu, Divider, Provider, FAB, Chip, Snackbar } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { initializeApp, getApp } from '@react-native-firebase/app';
import { getFirestore, collection, query, where, orderBy, serverTimestamp, getDocs, addDoc } from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';
import * as ImagePicker from "expo-image-picker";
import { CLOUDINARY_URL, CLOUDINARY_UPLOAD_PRESET } from '../../../data/cloudinaryConfig';
import { format } from 'date-fns/esm';

export default function ConcernsScreen() {
  const navigation = useNavigation();
  const [concerns, setConcerns] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("General");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [fabAnimation] = useState(new Animated.Value(0));
  const app = getApp();
  const db = getFirestore(app);
  const firebaseAuth = getAuth(app);

  // Animation for FAB
  useEffect(() => {
    Animated.timing(fabAnimation, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  const fabStyle = {
    transform: [
      {
        scale: fabAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        }),
      },
    ],
    opacity: fabAnimation,
  };

  // Request permission for camera and media library
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
          setSnackbarMessage('Camera/media permissions are needed for full functionality');
          setSnackbarVisible(true);
        }
      }
    })();
  }, []);

  // Fetch concerns from Firestore
  const fetchConcerns = async () => {
    setIsFetching(true);
    const user = firebaseAuth.currentUser;
    if (!user) {
      setSnackbarMessage("You must be logged in to view concerns");
      setSnackbarVisible(true);
      setIsFetching(false);
      return;
    }
  
    try {
      const concernsRef = collection(db, 'concerns');
      const q = query(
        concernsRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await q.get();
  
      const concernsList = [];
      snapshot.forEach((doc) => {
        concernsList.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setConcerns(concernsList);
    } catch (error) {
      console.error("Error fetching concerns: ", error);
      setSnackbarMessage("There was an issue fetching your concerns");
      setSnackbarVisible(true);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchConcerns();
  }, []);

  const selectImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setSnackbarMessage("You need to allow access to your photos");
        setSnackbarVisible(true);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error selecting image: ", error);
      setSnackbarMessage("There was an issue selecting the image");
      setSnackbarVisible(true);
    }
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setSnackbarMessage("You need to allow access to your camera");
        setSnackbarVisible(true);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking photo: ", error);
      setSnackbarMessage("There was an issue taking the photo");
      setSnackbarVisible(true);
    }
  };

  const uploadImageToCloudinary = async (imageUri) => {
    if (!imageUri) return null;
  
    setIsUploading(true);
    setUploadProgress(0);
  
    try {
      const formData = new FormData();
      const filename = imageUri.substring(imageUri.lastIndexOf("/") + 1);
      
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: filename,
      });
      
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'concerns');
  
      const xhr = new XMLHttpRequest();
      xhr.open('POST', CLOUDINARY_URL);
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadProgress(progress);
        }
      };
  
      const cloudinaryResponse = await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error('Upload failed'));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(formData);
      });
  
      setIsUploading(false);
      return cloudinaryResponse.secure_url;
      
    } catch (error) {
      console.error("Error in uploadImage function:", error);
      setIsUploading(false);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!title || !description || !location) {
      setSnackbarMessage("Please fill in all fields");
      setSnackbarVisible(true);
      return;
    }

    const user = firebaseAuth.currentUser;
    if (!user) {
      setSnackbarMessage("You must be logged in to submit a concern");
      setSnackbarVisible(true);
      return;
    }

    setIsLoading(true);

    try {
      let imageUrl = null;
      if (imageUri) {
        try {
          imageUrl = await uploadImageToCloudinary(imageUri);
        } catch (uploadError) {
          const shouldContinue = await new Promise((resolve) => {
            Alert.alert(
              "Upload Failed",
              "Would you like to submit your concern without the image?",
              [
                { text: "Cancel", onPress: () => resolve(false) },
                { text: "Continue", onPress: () => resolve(true) },
              ]
            );
          });

          if (!shouldContinue) {
            setIsLoading(false);
            return;
          }
        }
      }

      await submitConcernToFirestore(imageUrl);
      setSnackbarMessage("Your concern has been recorded");
      setSnackbarVisible(true);
      resetForm();
      setShowForm(false);
      fetchConcerns();
    } catch (error) {
      console.error("Error adding concern:", error);
      setSnackbarMessage("There was an issue submitting your concern");
      setSnackbarVisible(true);
    } finally {
      setIsLoading(false);
    }
  };
    
  const submitConcernToFirestore = async (imageUrl) => {
    const user = firebaseAuth.currentUser;
    if (!user) throw new Error("User not authenticated.");

    const concernsRef = collection(db, 'concerns');
    await addDoc(concernsRef, {
      title,
      description,
      location,
      category,
      status: "Pending",
      userId: user.uid,
      userEmail: user.email,
      imageUrl,
      createdAt: serverTimestamp(),
    });
  };
    
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLocation("");
    setCategory("General");
    setImageUri(null);
    setUploadProgress(0);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return '#FFC107';
      case 'in progress': return '#2196F3';
      case 'resolved': return '#4CAF50';
      default: return '#757575';
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat.toLowerCase()) {
      case 'road': return 'road-variant';
      case 'garbage': return 'trash-can';
      case 'water': return 'water';
      case 'electricity': return 'lightning-bolt';
      default: return 'alert-circle';
    }
  };

  const getCategoryColor = (cat) => {
    switch (cat.toLowerCase()) {
      case 'road': return '#FF9800';
      case 'garbage': return '#795548';
      case 'water': return '#2196F3';
      case 'electricity': return '#FFC107';
      default: return '#9C27B0';
    }
  };

  const categories = ["General", "Road", "Garbage", "Water", "Electricity"];

  const renderForm = () => (
    <View style={styles.formWrapper}>
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>Report an Issue</Text>
        <TouchableOpacity 
          onPress={() => setShowForm(false)}
          style={styles.closeButton}
        >
          <Icon name="close" size={24} color="#555" />
        </TouchableOpacity>
      </View>
      
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

  const renderConcernCard = (concern) => (
    <Card key={concern.id} style={styles.concernCard}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <View style={[
              styles.categoryBadge,
              { backgroundColor: `${getCategoryColor(concern.category)}20` }
            ]}>
              <Icon 
                name={getCategoryIcon(concern.category)} 
                size={16} 
                color={getCategoryColor(concern.category)} 
              />
            </View>
            <Text style={styles.concernTitle}>{concern.title}</Text>
          </View>
          <Chip 
            style={[
              styles.statusChip, 
              { 
                backgroundColor: `${getStatusColor(concern.status)}20`,
                borderColor: getStatusColor(concern.status)
              }
            ]}
            textStyle={{ 
              color: getStatusColor(concern.status),
              fontSize: 12,
            }}
          >
            {concern.status}
          </Chip>
        </View>
        
        <Text style={styles.concernDescription}>{concern.description}</Text>
        
        {concern.imageUrl && (
          <TouchableOpacity 
            onPress={() => navigation.navigate('ImageViewer', { imageUrl: concern.imageUrl })}
            activeOpacity={0.9}
          >
            <Image 
              source={{ uri: concern.imageUrl }} 
              style={styles.concernImage} 
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
        
        <Divider style={styles.divider} />
        
        <View style={styles.metadataContainer}>
          <View style={styles.detailRow}>
            <Icon name="map-marker" size={14} color="#6200ee" />
            <Text style={styles.concernDetail}>{concern.location}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Icon name="clock-outline" size={14} color="#6200ee" />
            <Text style={styles.concernDetail}>
              {concern.createdAt?.toDate() ? 
                format(concern.createdAt.toDate(), 'MMM dd, yyyy') : 
                'Date not available'}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <Provider>
      <StatusBar backgroundColor="#0275d8" barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Icon name="arrow-left" size={24} color="#ffffff" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>My Reports</Text>
            </View>
            <View style={styles.headerRightPlaceholder} />
          </View>
        </View>

        {showForm ? (
          renderForm()
        ) : (
          <>
            {/* Empty state */}
            {concerns.length === 0 && !isFetching && (
              <View style={styles.emptyState}>
                <Icon name="clipboard-text-outline" size={80} color="#E0E0E0" />
                <Text style={styles.emptyStateText}>No Reports Yet</Text>
                <Text style={styles.emptyStateSubText}>
                  Tap the + button below to report an issue in your community
                </Text>
              </View>
            )}

            {/* List of Concerns */}
            <ScrollView
              style={styles.concernList}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isFetching}
                  onRefresh={fetchConcerns}
                  colors={["#0275d8"]}
                  tintColor="#0275d8"
                />
              }
            >
              {concerns.map(renderConcernCard)}
              <View style={{ height: 100 }} />
            </ScrollView>

            {/* Floating Action Button */}
            <Animated.View style={[styles.fabContainer, fabStyle]}>
              <FAB
                style={styles.fab}
                icon="plus"
                color="#fff"
                onPress={() => setShowForm(true)}
                animated={true}
              />
            </Animated.View>
          </>
        )}

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          style={styles.snackbar}
          action={{
            label: 'Dismiss',
            onPress: () => setSnackbarVisible(false),
          }}
        >
          {snackbarMessage}
        </Snackbar>
      </KeyboardAvoidingView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: '#0275d8',
    paddingTop: Platform.OS === 'ios' ? 50 : 10,
    paddingBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '600',
  },
  headerRightPlaceholder: {
    width: 40,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
    marginTop: 16,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    maxWidth: '80%',
  },
  formWrapper: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 10,
    paddingTop: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
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
  concernList: {
    padding: 16,
    paddingTop: 8,
  },
  concernCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  categoryBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  concernTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusChip: {
    height:35,
    paddingHorizontal: 1,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#007AFF',       // Light blue or your theme color
    backgroundColor: '#EAF4FF',   // Light background tint
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  concernDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 12,
    lineHeight: 20,
  },
  concernImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 12,
  },
  metadataContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  concernDetail: {
    fontSize: 12,
    color: '#777',
    marginLeft: 5,
  },
  divider: {
    marginVertical: 12,
    backgroundColor: '#eee',
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
  fab: {
    backgroundColor: '#0275d8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  snackbar: {
    backgroundColor: '#323232',
    marginBottom: 70,
  },
});