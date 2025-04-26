import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    ScrollView,
    Image,
    ActivityIndicator,
    StyleSheet,
    Alert,
    TouchableOpacity,
    Animated
} from 'react-native';
import { MaterialIcons, AntDesign } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { getFirestore, collection, addDoc } from "@react-native-firebase/firestore";
import { CLOUDINARY_URL, CLOUDINARY_UPLOAD_PRESET } from '../config/cloudConfig';
import { validateProjectForm, getStatusColor } from './projectsUtils';

const CreateProjectModal = ({ visible, onClose, slideAnim }) => {
    const [formData, setFormData] = useState({
        title: "",
        contractor: "",
        contractAmount: "",
        accomplishment: "0%",
        location: "",
        remarks: "",
        status: "active",
        imageUrl: "",
        image: null
    });
    const [uploading, setUploading] = useState(false);
    const [errors, setErrors] = useState({});

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission required", "We need access to your photos to upload images");
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setFormData(prev => ({
                ...prev,
                image: result.assets[0].uri
            }));
        }
    };

    const uploadImage = async () => {
        if (!formData.image) return null;
        
        setUploading(true);
        
        try {
            const form = new FormData();
            form.append('file', {
                uri: formData.image,
                type: 'image/jpeg',
                name: 'project_image.jpg'
            });
            form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            
            const response = await fetch(CLOUDINARY_URL, {
                method: 'POST',
                body: form,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            const data = await response.json();
            return data.secure_url;
        } catch (error) {
            console.error("Error uploading image:", error);
            Alert.alert("Error", "Failed to upload image");
            return null;
        } finally {
            setUploading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: undefined
            }));
        }
    };

    const handleCreateProject = async () => {
        const validation = validateProjectForm(formData);
        setErrors(validation.errors);
        
        if (!validation.isValid) return;

        try {
            let uploadedImageUrl = "";
            if (formData.image) {
                uploadedImageUrl = await uploadImage();
            }

            const db = getFirestore();
            await addDoc(collection(db, "projects"), {
                title: formData.title,
                contractor: formData.contractor,
                contractAmount: parseFloat(formData.contractAmount) || 0,
                accomplishment: formData.accomplishment.includes('%') ? 
                    formData.accomplishment : `${formData.accomplishment}%`,
                location: formData.location,
                remarks: formData.remarks,
                status: formData.status,
                imageUrl: uploadedImageUrl || "",
                createdAt: new Date()
            });
            
            onClose();
            resetForm();
            Alert.alert("Success", "Project created successfully!");
        } catch (error) {
            console.error("Error creating project:", error);
            Alert.alert("Error", "Failed to create project");
        }
    };

    const resetForm = () => {
        setFormData({
            title: "",
            contractor: "",
            contractAmount: "",
            accomplishment: "0%",
            location: "",
            remarks: "",
            status: "active",
            imageUrl: "",
            image: null
        });
        setErrors({});
    };

    if (!visible) return null;

    return (
        <View style={styles.bottomModalContainer}>
            <Pressable 
                style={styles.bottomModalOverlay} 
                onPress={onClose}
            />
            
            <Animated.View 
                style={[
                    styles.bottomModalView,
                    { 
                        transform: [{
                            translateY: slideAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [500, 0]  // Now slides up from bottom
                            })
                        }],
                        opacity: slideAnim.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [0, 0.5, 1]
                        })
                    }
                ]}
            >
                <View style={styles.modalHandle} />
                <ScrollView 
                    style={styles.modalScrollView}
                    contentContainerStyle={styles.modalScrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Create New Project</Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                        >
                            <AntDesign name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>


                    <View style={styles.formGroup}>
                        <Text style={styles.inputLabel}>Project Title <Text style={styles.required}>*</Text></Text>
                        <TextInput
                            style={[
                                styles.inputField,
                                errors.title && styles.inputError
                            ]}
                            placeholder="Enter project title"
                            value={formData.title}
                            onChangeText={(text) => handleInputChange('title', text)}
                            returnKeyType="next"
                        />
                        {errors.title && (
                            <Text style={styles.errorText}>{errors.title}</Text>
                        )}
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.inputLabel}>Contractor Name <Text style={styles.required}>*</Text></Text>
                        <TextInput
                            style={[
                                styles.inputField,
                                errors.contractor && styles.inputError
                            ]}
                            placeholder="Enter contractor name"
                            value={formData.contractor}
                            onChangeText={(text) => handleInputChange('contractor', text)}
                            returnKeyType="next"
                        />
                        {errors.contractor && (
                            <Text style={styles.errorText}>{errors.contractor}</Text>
                        )}
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.inputLabel}>Contract Amount</Text>
                        <TextInput
                            style={[
                                styles.inputField,
                                errors.contractAmount && styles.inputError
                            ]}
                            placeholder="Enter amount in ₱"
                            keyboardType="numeric"
                            value={formData.contractAmount}
                            onChangeText={(text) => handleInputChange('contractAmount', text)}
                            returnKeyType="next"
                        />
                        {errors.contractAmount && (
                            <Text style={styles.errorText}>{errors.contractAmount}</Text>
                        )}
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.inputLabel}>Accomplishment</Text>
                        <TextInput
                            style={[
                                styles.inputField,
                                errors.accomplishment && styles.inputError
                            ]}
                            placeholder="Enter progress (e.g., 50%)"
                            value={formData.accomplishment}
                            onChangeText={(text) => handleInputChange('accomplishment', text)}
                            returnKeyType="next"
                        />
                        {errors.accomplishment && (
                            <Text style={styles.errorText}>{errors.accomplishment}</Text>
                        )}
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.inputLabel}>Location</Text>
                        <TextInput
                            style={styles.inputField}
                            placeholder="Enter project location"
                            value={formData.location}
                            onChangeText={(text) => handleInputChange('location', text)}
                            returnKeyType="next"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.inputLabel}>Remarks</Text>
                        <TextInput
                            style={[styles.inputField, styles.textArea]}
                            placeholder="Enter any remarks"
                            multiline
                            numberOfLines={4}
                            value={formData.remarks}
                            onChangeText={(text) => handleInputChange('remarks', text)}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.inputLabel}>Project Image</Text>
                        <Pressable 
                            style={styles.imageUploadButton}
                            onPress={pickImage}
                            disabled={uploading}
                        >
                            <MaterialIcons 
                                name={formData.image ? "photo-camera" : "add-photo-alternate"} 
                                size={20} 
                                color="#003366" 
                            />
                            <Text style={styles.imageUploadText}>
                                {formData.image ? "Change Image" : "Upload Image (Optional)"}
                            </Text>
                        </Pressable>

                        {(formData.image || formData.imageUrl) && (
                            <View style={styles.imagePreviewContainer}>
                                <Image 
                                    source={{ uri: formData.image || formData.imageUrl }} 
                                    style={styles.imagePreview}
                                    resizeMode="cover"
                                />
                                {uploading && (
                                    <View style={styles.uploadOverlay}>
                                        <ActivityIndicator size="large" color="#FFF" />
                                        <Text style={styles.uploadText}>Uploading...</Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.inputLabel}>Status <Text style={styles.required}>*</Text></Text>
                        <View style={styles.statusOptions}>
                            {['Active', 'Inactive', 'Completed'].map((stat) => (
                                <Pressable 
                                    key={stat}
                                    style={[
                                        styles.statusOption,
                                        formData.status === stat.toLowerCase() && styles.statusOptionSelected
                                    ]}
                                    onPress={() => handleInputChange('status', stat.toLowerCase())}
                                >
                                    <View style={[
                                        styles.statusIndicator,
                                        { backgroundColor: getStatusColor(stat) },
                                        formData.status === stat.toLowerCase() && styles.statusIndicatorSelected
                                    ]} />
                                    <Text style={styles.statusText}>{stat}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    <View style={styles.modalActions}>
                        <Pressable
                            style={[styles.modalButton, styles.cancelButton]}
                            onPress={() => {
                                onClose();
                                resetForm();
                            }}
                        >
                            <Text style={styles.modalButtonText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.modalButton, styles.submitButton]}
                            onPress={handleCreateProject}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.modalButtonText}>Create Project</Text>
                            )}
                        </Pressable>
                    </View>
                </ScrollView>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    bottomModalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    bottomModalOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    bottomModalView: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 30,
        maxHeight: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    modalHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#ccc',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 15,
    },
    modalScrollView: {
        width: '100%',
    },
    modalScrollContent: {
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#003366',
    },
    closeButton: {
        padding: 5,
    },
    formGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
        marginBottom: 8,
    },
    required: {
        color: '#FF0000',
    },
    inputField: {
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 15,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    inputError: {
        borderColor: '#F44336',
        backgroundColor: '#FFF5F5',
    },
    errorText: {
        color: '#F44336',
        fontSize: 12,
        marginTop: 5,
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
        paddingTop: 15,
    },
    imageUploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: '#003366',
        borderRadius: 8,
        backgroundColor: 'rgba(0, 51, 102, 0.1)',
    },
    imageUploadText: {
        marginLeft: 10,
        color: '#003366',
        fontWeight: '500',
    },
    imagePreviewContainer: {
        marginTop: 15,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: 200,
    },
    uploadOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadText: {
        color: '#FFF',
        marginTop: 10,
        fontWeight: '500',
    },
    statusOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    statusOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 8,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    statusOptionSelected: {
        borderColor: '#003366',
        backgroundColor: 'rgba(0, 51, 102, 0.1)',
    },
    statusIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
        opacity: 0.5,
    },
    statusIndicatorSelected: {
        opacity: 1,
    },
    statusText: {
        fontSize: 14,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    modalButton: {
        flex: 1,
        padding: 15,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
        marginRight: 10,
    },
    submitButton: {
        backgroundColor: '#003366',
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButtonText: {
        color: '#333',
    },
    submitButtonText: {
        color: '#FFF',  
    },
});

export default CreateProjectModal;