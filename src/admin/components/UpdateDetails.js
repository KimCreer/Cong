import React, { useState, useEffect, useCallback } from "react";
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    Image, 
    TouchableOpacity,
    Alert,
    Modal,
    Pressable,
    ActivityIndicator,
    TextInput,
    KeyboardAvoidingView,
    Platform
} from "react-native";
import { Picker } from '@react-native-picker/picker';
import { FontAwesome5 } from "@expo/vector-icons";
import { getFirestore, doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from "@react-native-firebase/firestore";
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CLOUDINARY_URL, CLOUDINARY_UPLOAD_PRESET } from '../../../data/cloudinaryConfig';

const PostDetails = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { postId } = route.params;
    const insets = useSafeAreaInsets();
    
    // State management
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        title: '',
        content: '',
        category: 'Announcement',
        priority: 'Medium',
        imageUrl: ''
    });
    const [image, setImage] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({
        title: false,
        content: false
    });

    const fetchPost = useCallback(async () => {
        try {
            setLoading(true);
            const db = getFirestore();
            const docRef = doc(db, "posts", postId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists) {
                const postData = docSnap.data();
                setPost({
                    id: docSnap.id,
                    ...postData,
                    createdAt: postData.createdAt?.toDate()
                });
                setEditData({
                    title: postData.title,
                    content: postData.content,
                    category: postData.category || 'Announcement',
                    priority: postData.priority || 'Medium',
                    imageUrl: postData.imageUrl || ''
                });
            } else {
                Alert.alert("Error", "Post not found");
                navigation.goBack();
            }
        } catch (error) {
            console.error("Error fetching post:", error);
            Alert.alert("Error", "Failed to load post details");
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    }, [postId, navigation]);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission required", "We need access to your photos to upload images");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const uploadImage = async () => {
        if (!image) return editData.imageUrl;
        
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', {
                uri: image,
                type: 'image/jpeg',
                name: 'upload.jpg'
            });
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            
            const response = await fetch(CLOUDINARY_URL, {
                method: 'POST',
                body: formData,
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            
            if (!response.ok) throw new Error('Upload failed');
            
            const data = await response.json();
            return data.secure_url;
        } catch (error) {
            console.error("Image upload error:", error);
            Alert.alert("Error", "Failed to upload image");
            return null;
        } finally {
            setUploading(false);
        }
    };

    const validateForm = () => {
        const errors = {
            title: !editData.title.trim(),
            content: !editData.content.trim()
        };
        setValidationErrors(errors);
        return !errors.title && !errors.content;
    };

    const handleSaveEdit = async () => {
        if (!validateForm()) return;

        try {
            const uploadedImageUrl = image ? await uploadImage() : editData.imageUrl;
            if (image && !uploadedImageUrl) return; // Upload failed
            
            const db = getFirestore();
            await updateDoc(doc(db, "posts", postId), {
                ...editData,
                imageUrl: uploadedImageUrl,
                updatedAt: serverTimestamp()
            });
            
            setIsEditing(false);
            await fetchPost();
            Alert.alert("Success", "Post saved successfully!");
        } catch (error) {
            console.error("Error saving post:", error);
            Alert.alert("Error", "Failed to save post");
        }
    };

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            const db = getFirestore();
            await deleteDoc(doc(db, "posts", postId));
            navigation.goBack();
        } catch (error) {
            console.error("Error deleting post:", error);
            Alert.alert("Error", "Failed to delete post");
        } finally {
            setIsDeleting(false);
        }
    };

    const confirmDelete = () => {
        Alert.alert(
            "Confirm Delete",
            `Are you sure you want to delete "${post?.title}"? This action cannot be undone.`,
            [
                {
                    text: "Cancel",
                    style: "cancel",
                    onPress: () => setModalVisible(false)
                },
                { 
                    text: "Delete", 
                    onPress: handleDelete,
                    style: "destructive"
                }
            ]
        );
    };

    const formatDate = (date) => {
        if (!date) return "Unknown date";
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getPriorityColor = (priority) => {
        if (!priority) return '#AAAAAA';
        
        switch (priority.toLowerCase()) {
            case 'high': return '#FF4444';
            case 'medium': return '#FFBB33';
            case 'low': return '#00C851';
            default: return '#AAAAAA';
        }
    };

    const handleCancelEdit = () => {
        if (image || editData.title !== post.title || editData.content !== post.content) {
            Alert.alert(
                "Discard Changes?",
                "You have unsaved changes. Are you sure you want to discard them?",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Discard", onPress: () => {
                        setImage(null);
                        setIsEditing(false);
                        setEditData({
                            title: post.title,
                            content: post.content,
                            category: post.category || 'Announcement',
                            priority: post.priority || 'Medium',
                            imageUrl: post.imageUrl || ''
                        });
                    }}
                ]
            );
        } else {
            setIsEditing(false);
        }
    };

    useEffect(() => {
        fetchPost();
    }, [fetchPost]);

    if (loading || !post) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#003366" />
                <Text style={styles.loadingText}>Loading post details...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 20 : 0}
        >
            {isEditing ? (
                <ScrollView 
                    contentContainerStyle={styles.editContainer}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={styles.editTitle}>Edit Post</Text>
                    
                    <Text style={styles.label}>Title *</Text>
                    <TextInput
                        style={[
                            styles.input,
                            validationErrors.title && styles.inputError
                        ]}
                        value={editData.title}
                        onChangeText={(text) => {
                            setEditData({...editData, title: text});
                            setValidationErrors({...validationErrors, title: false});
                        }}
                        placeholder="Post title"
                        placeholderTextColor="#999"
                    />
                    {validationErrors.title && (
                        <Text style={styles.errorText}>Title is required</Text>
                    )}
                    
                    <Text style={styles.label}>Content *</Text>
                    <TextInput
                        style={[
                            styles.input,
                            styles.contentInput,
                            validationErrors.content && styles.inputError
                        ]}
                        value={editData.content}
                        onChangeText={(text) => {
                            setEditData({...editData, content: text});
                            setValidationErrors({...validationErrors, content: false});
                        }}
                        placeholder="Post content"
                        placeholderTextColor="#999"
                        multiline
                        numberOfLines={4}
                    />
                    {validationErrors.content && (
                        <Text style={styles.errorText}>Content is required</Text>
                    )}
                    
                    <Text style={styles.label}>Image</Text>
                    <TouchableOpacity 
                        style={styles.imageButton} 
                        onPress={pickImage}
                        disabled={uploading}
                    >
                        <FontAwesome5 
                            name="image" 
                            size={16} 
                            color={uploading ? "#AAA" : "#003366"} 
                        />
                        <Text style={[
                            styles.imageButtonText,
                            uploading && { color: "#AAA" }
                        ]}>
                            {image ? "Change Image" : editData.imageUrl ? "Change Current Image" : "Add Image"}
                        </Text>
                    </TouchableOpacity>
                    
                    {(image || editData.imageUrl) && (
                        <Image 
                            source={{ uri: image || editData.imageUrl }} 
                            style={styles.imagePreview}
                        />
                    )}
                    
                    <Text style={styles.label}>Category</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={editData.category}
                            onValueChange={(value) => setEditData({...editData, category: value})}
                            dropdownIconColor="#003366"
                        >
                            <Picker.Item label="Announcement" value="Announcement" />
                            <Picker.Item label="Event" value="Event" />
                            <Picker.Item label="Maintenance" value="Maintenance" />
                            <Picker.Item label="Other" value="Other" />
                        </Picker>
                    </View>
                    
                    <Text style={styles.label}>Priority</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={editData.priority}
                            onValueChange={(value) => setEditData({...editData, priority: value})}
                            dropdownIconColor="#003366"
                        >
                            <Picker.Item label="High" value="High" />
                            <Picker.Item label="Medium" value="Medium" />
                            <Picker.Item label="Low" value="Low" />
                        </Picker>
                    </View>
                    
                    <View style={styles.editButtons}>
                        <TouchableOpacity 
                            style={[styles.editButton, styles.cancelButton]}
                            onPress={handleCancelEdit}
                            disabled={uploading}
                        >
                            <Text style={styles.editButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.editButton, styles.saveButton]}
                            onPress={handleSaveEdit}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={[styles.editButtonText, { color: '#FFF' }]}>Save Changes</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            ) : (
                <>
                    <ScrollView 
                        contentContainerStyle={[
                            styles.scrollContainer,
                            { paddingBottom: insets.bottom + 80 }
                        ]}
                        showsVerticalScrollIndicator={false}
                    >
                        {post.imageUrl && (
                            <Image 
                                source={{ uri: post.imageUrl }} 
                                style={styles.image}
                                resizeMode="cover"
                            />
                        )}

                        <View style={styles.header}>
                            <Text style={styles.title}>{post.title}</Text>
                        </View>

                        <View style={styles.metaContainer}>
                            <View style={styles.categoryBadge}>
                                <Text style={styles.categoryText}>{post.category || "General"}</Text>
                            </View>
                            <View style={[
                                styles.priorityBadge, 
                                { backgroundColor: getPriorityColor(post.priority) }
                            ]}>
                                <Text style={styles.priorityText}>{post.priority || "Normal"}</Text>
                            </View>
                            <Text style={styles.date}>{formatDate(post.createdAt)}</Text>
                        </View>

                        <Text style={styles.content}>{post.content}</Text>
                    </ScrollView>

                    <View style={[
                        styles.actionBar,
                        { paddingBottom: insets.bottom }
                    ]}>
                        <TouchableOpacity 
                            style={styles.actionButton} 
                            onPress={() => navigation.goBack()}
                        >
                            <FontAwesome5 name="arrow-left" size={20} color="#003366" />
                            <Text style={styles.actionText}>Back</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.actionButton} 
                            onPress={() => setIsEditing(true)}
                        >
                            <FontAwesome5 name="edit" size={20} color="#003366" />
                            <Text style={styles.actionText}>Edit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.actionButton} 
                            onPress={() => setModalVisible(true)}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <ActivityIndicator size="small" color="#FF4444" />
                            ) : (
                                <>
                                    <FontAwesome5 name="trash" size={20} color="#FF4444" />
                                    <Text style={[styles.actionText, { color: '#FF4444' }]}>Delete</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </>
            )}

            {/* Delete Confirmation Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <Pressable 
                        style={styles.modalOverlay} 
                        onPress={() => setModalVisible(false)}
                    />
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Delete Post</Text>
                        <Text style={styles.modalText}>
                            Are you sure you want to delete "{post?.title}"? This action cannot be undone.
                        </Text>
                        
                        <View style={styles.modalButtons}>
                            <Pressable
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setModalVisible(false)}
                                disabled={isDeleting}
                            >
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.modalButton, styles.deleteButton]}
                                onPress={confirmDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <ActivityIndicator color="#FFF" size="small" />
                                ) : (
                                    <Text style={[styles.modalButtonText, { color: '#FFF' }]}>Delete</Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
    },
    loadingText: {
        marginTop: 10,
        color: '#003366',
        fontSize: 16,
    },
    scrollContainer: {
        padding: 20,
    },
    editContainer: {
        padding: 20,
        paddingBottom: 100,
    },
    image: {
        width: '100%',
        height: 250,
        borderRadius: 10,
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#003366',
        flex: 1,
    },
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        flexWrap: 'wrap',
        rowGap: 10,
    },
    categoryBadge: {
        backgroundColor: '#EEE',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
        marginRight: 10,
    },
    categoryText: {
        color: '#555',
        fontSize: 14,
    },
    priorityBadge: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 15,
        marginRight: 10,
    },
    priorityText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    date: {
        color: '#999',
        fontSize: 14,
    },
    content: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
    },
    actionBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#FFF',
        paddingVertical: 15,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    actionButton: {
        alignItems: 'center',
        minWidth: 80,
    },
    actionText: {
        marginTop: 5,
        color: '#003366',
        fontSize: 14,
        fontWeight: '500',
    },
    // Edit mode styles
    editTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#003366',
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#555',
        marginBottom: 8,
        marginTop: 15,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    inputError: {
        borderColor: '#FF4444',
        backgroundColor: '#FFF9F9',
    },
    errorText: {
        color: '#FF4444',
        fontSize: 14,
        marginTop: 4,
        marginLeft: 4,
    },
    contentInput: {
        height: 120,
        textAlignVertical: 'top',
    },
    imageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: '#003366',
        borderRadius: 8,
        backgroundColor: 'rgba(0, 51, 102, 0.1)',
    },
    imageButtonText: {
        marginLeft: 10,
        color: '#003366',
        fontWeight: '500',
    },
    imagePreview: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginTop: 15,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#f9f9f9',
        overflow: 'hidden',
    },
    editButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 30,
    },
    editButton: {
        flex: 1,
        padding: 15,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
        marginRight: 10,
    },
    saveButton: {
        backgroundColor: '#003366',
    },
    editButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    // Modal styles
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        width: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#003366',
        marginBottom: 15,
    },
    modalText: {
        fontSize: 16,
        color: '#555',
        marginBottom: 25,
        lineHeight: 22,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    modalButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 6,
        marginLeft: 10,
        minWidth: 80,
        alignItems: 'center',
    },
    deleteButton: {
        backgroundColor: '#FF4444',
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default PostDetails;