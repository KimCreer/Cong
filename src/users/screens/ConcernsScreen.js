import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
  Easing,
  Dimensions,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { Provider, FAB, Snackbar } from 'react-native-paper';
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { CLOUDINARY_URL, CLOUDINARY_UPLOAD_PRESET } from '../../../data/cloudinaryConfig';
import { format } from 'date-fns/esm';

// Components
import Header from './concerncomps/Header';
import ConcernForm from './concerncomps/ConcernForm';
import ConcernCard from './concerncomps/ConcernCard';
import SearchAndFilter from './concerncomps/SearchAndFilter';
import EmptyState from './concerncomps/EmptyState';

// Hooks and Utilities
import { useConcerns } from './concerncomps/useConcerns';
import {
  getStatusColor,
  getCategoryIcon,
  getCategoryColor,
  statusFilters,
  categories
} from './concerncomps/concernUtils';

const { width } = Dimensions.get('window');

export default function ConcernsScreen() {
  const navigation = useNavigation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("General");
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [fabAnimation] = useState(new Animated.Value(0));
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  
  const {
    concerns,
    isFetching,
    error,
    fetchConcerns,
    submitConcern
  } = useConcerns();

  const [filteredConcerns, setFilteredConcerns] = useState([]);

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

  // Filter concerns based on search and status
  useEffect(() => {
    let results = concerns;
    
    if (searchQuery) {
      results = results.filter(concern => 
        concern.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        concern.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        concern.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (activeFilter !== "all") {
      results = results.filter(concern => 
        concern.status.toLowerCase() === activeFilter.toLowerCase()
      );
    }
    
    setFilteredConcerns(results);
  }, [concerns, searchQuery, activeFilter]);

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

  useEffect(() => {
    fetchConcerns();
  }, []);

  useEffect(() => {
    if (error) {
      setSnackbarMessage(error);
      setSnackbarVisible(true);
    }
  }, [error]);

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

      await submitConcern({
        title,
        description,
        location,
        category,
        status: "Pending",
        imageUrl
      });
      
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
    
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLocation("");
    setCategory("General");
    setImageUri(null);
    setUploadProgress(0);
  };

  return (
    <Provider>
      <StatusBar backgroundColor="#0275d8" barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <Header 
          title="My Concerns" 
          onBackPress={() => navigation.goBack()}
          showForm={showForm}
          setShowForm={setShowForm}
        />

        {showForm ? (
          <ConcernForm
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            location={location}
            setLocation={setLocation}
            category={category}
            setCategory={setCategory}
            imageUri={imageUri}
            setImageUri={setImageUri}
            uploadProgress={uploadProgress}
            isUploading={isUploading}
            isLoading={isLoading}
            isMenuVisible={isMenuVisible}
            setIsMenuVisible={setIsMenuVisible}
            handleSubmit={handleSubmit}
            selectImage={selectImage}
            takePhoto={takePhoto}
            getCategoryIcon={getCategoryIcon}
            getCategoryColor={getCategoryColor}
            setShowForm={setShowForm}
          />
        ) : (
          <>
            <SearchAndFilter
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
            />

            {filteredConcerns.length === 0 && !isFetching && (
              <EmptyState 
                searchQuery={searchQuery} 
                activeFilter={activeFilter} 
              />
            )}

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
              {filteredConcerns.map(concern => (
                <ConcernCard 
                  key={concern.id}
                  concern={concern}
                  onPress={() => navigation.navigate('ConcernDetail', { concern })}
                  getCategoryIcon={getCategoryIcon}
                  getCategoryColor={getCategoryColor}
                  getStatusColor={getStatusColor}
                />
              ))}
              <View style={{ height: 100 }} />
            </ScrollView>

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
  concernList: {
    padding: 16,
    paddingTop: 8,
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