import React, { useState, useEffect, useRef } from "react";
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    ActivityIndicator,
    RefreshControl,
    Alert,
    Modal,
    TextInput,
    Pressable,
    Image,
    Animated,
    ScrollView
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { 
    getFirestore, 
    collection, 
    query, 
    getDocs, 
    onSnapshot, 
    orderBy,
    addDoc,
    updateDoc,
    doc,
    deleteDoc,
    serverTimestamp
} from "@react-native-firebase/firestore";
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { CLOUDINARY_URL, CLOUDINARY_UPLOAD_PRESET } from '../../../data/cloudinaryConfig';
import { useNavigation } from '@react-navigation/native';

import { styles, getPriorityColor } from './postcomps/UpdatesTab.styles';


const UpdatesTab = () => {
    const navigation = useNavigation();
    // State management
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [currentPost, setCurrentPost] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [user, setUser] = useState(null);
    
    // Form state
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState("Announcement");
    const [priority, setPriority] = useState("Medium");
    const [image, setImage] = useState(null);
    const [imageUrl, setImageUrl] = useState("");

    // Animation
    const slideAnim = useRef(new Animated.Value(500)).current;
    const editSlideAnim = useRef(new Animated.Value(500)).current;

    // Check authentication status - FIXED: Using getAuth()
    useEffect(() => {
        const auth = getAuth();
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (!currentUser) {
                Alert.alert(
                    "Authentication Required", 
                    "Please log in to manage posts",
                    [
                        {
                            text: "OK",
                            onPress: () => navigation.navigate('Login')
                        }
                    ]
                );
            }
        });

        return () => unsubscribeAuth();
    }, [navigation]);

    // Data structure to match user updates with admin info
    const formatPostData = (data) => ({
        title: data.title,
        content: data.content,
        category: data.category,
        priority: data.priority,
        imageUrl: data.imageUrl || null,
        createdAt: data.createdAt || serverTimestamp(),
        adminId: user?.uid || "unknown_admin",
        adminName: user?.displayName || "Admin",
        adminAvatar: user?.photoURL || "https://example.com/admin-avatar.jpg",
        updatedAt: data.updatedAt || null
    });

    // Image handling
    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });
        if (!result.canceled) setImage(result.assets[0].uri);
    };

    const uploadImage = async () => {
        if (!image) return null;
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
            
            const data = await response.json();
            setImageUrl(data.secure_url);
            return data.secure_url;
        } catch (error) {
            Alert.alert("Error", "Failed to upload image");
            return null;
        } finally {
            setUploading(false);
        }
    };

    // Data fetching
    const fetchPosts = async () => {
        try {
            setRefreshing(true);
            const db = getFirestore();
            const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
            
            const snapshot = await getDocs(q);
            const postsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
                updatedAt: doc.data().updatedAt?.toDate() || null
            }));
            
            setPosts(postsData);
        } catch (error) {
            console.error("Error fetching posts:", error);
            Alert.alert("Error", "Failed to load posts");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    
    // Real-time updates subscription
    useEffect(() => {
        if (!user) return;

        fetchPosts();
        const db = getFirestore();
        const unsubscribe = onSnapshot(
            query(collection(db, "posts"), orderBy("createdAt", "desc")),
            (snapshot) => {
                setPosts(snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date(),
                    updatedAt: doc.data().updatedAt?.toDate() || null
                })));
            },
            (error) => {
                console.error("Snapshot error:", error);
            }
        );
        return () => unsubscribe();
    }, [user]);

    // CRUD operations
    const handleCreatePost = async () => {
        if (!title || !content) {
            Alert.alert("Error", "Title and content are required");
            return;
        }

        if (!user) {
            Alert.alert("Error", "You must be logged in to create posts");
            return;
        }

        try {
            const uploadedImageUrl = image ? await uploadImage() : null;
            const db = getFirestore();
            
            const postData = formatPostData({
                title,
                content,
                category,
                priority,
                imageUrl: uploadedImageUrl
            });
            
            await addDoc(collection(db, "posts"), postData);
            
            setModalVisible(false);
            resetForm();
            Alert.alert("Success", "Post created successfully!");
        } catch (error) {
            console.error("Create post error:", error);
            Alert.alert("Error", "Failed to create post");
        }
    };

    const handleEditPost = async () => {
        if (!title || !content || !currentPost) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        if (!user) {
            Alert.alert("Error", "You must be logged in to edit posts");
            return;
        }

        try {
            let uploadedImageUrl = currentPost.imageUrl || null;
            if (image && image !== currentPost.imageUrl) {
                uploadedImageUrl = await uploadImage();
            }

            const db = getFirestore();
            await updateDoc(doc(db, "posts", currentPost.id), {
                title,
                content,
                category,
                priority,
                imageUrl: uploadedImageUrl,
                updatedAt: serverTimestamp(),
                // Preserve original admin info if current user is different
                adminId: user?.uid || currentPost.adminId,
                adminName: user?.displayName || currentPost.adminName,
                adminAvatar: user?.photoURL || currentPost.adminAvatar
            });
            
            setEditModalVisible(false);
            resetForm();
            Alert.alert("Success", "Post updated successfully!");
        } catch (error) {
            console.error("Update post error:", error);
            Alert.alert("Error", "Failed to update post");
        }
    };

    const handleDeletePost = async (id) => {
        if (!user) {
            Alert.alert("Error", "You must be logged in to delete posts");
            return false;
        }

        try {
            const db = getFirestore();
            await deleteDoc(doc(db, "posts", id));
            Alert.alert("Success", "Post deleted successfully!");
            return true;
        } catch (error) {
            console.error("Delete post error:", error);
            Alert.alert("Error", "Failed to delete post");
            return false;
        }
    };

    // Helpers
    const resetForm = () => {
        setTitle("");
        setContent("");
        setCategory("Announcement");
        setPriority("Medium");
        setImage(null);
        setImageUrl("");
        setCurrentPost(null);
    };

    const openEditModal = (post) => {
        if (!user) {
            Alert.alert("Error", "You must be logged in to edit posts");
            return;
        }

        setCurrentPost(post);
        setTitle(post.title);
        setContent(post.content);
        setCategory(post.category);
        setPriority(post.priority);
        setImage(null);
        setImageUrl(post.imageUrl || "");
        setEditModalVisible(true);
    };

    const formatDate = (date) => {
        if (!date || !(date instanceof Date)) {
            return "Date not available";
        }
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getPriorityColor = (priority) => {
        switch (priority.toLowerCase()) {
            case 'high': return '#FF4444';
            case 'medium': return '#FFBB33';
            case 'low': return '#00C851';
            default: return '#AAAAAA';
        }
    };

    // Animation effects
    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: modalVisible ? 0 : 500,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [modalVisible]);

    useEffect(() => {
        Animated.timing(editSlideAnim, {
            toValue: editModalVisible ? 0 : 500,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [editModalVisible]);

    // Components
    const PostCard = ({ post, onPress }) => (
        <TouchableOpacity style={styles.postCard} onPress={onPress}>
            {post.imageUrl && (
                <Image 
                    source={{ uri: post.imageUrl }} 
                    style={styles.postImage}
                    resizeMode="cover"
                />
            )}
            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <Text style={styles.postTitle}>{post.title}</Text>
                    {post.read === false && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadText}>New</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.postContent} numberOfLines={2}>
                    {post.content}
                </Text>
                <View style={styles.categoryContainer}>
                    <Text style={styles.postCategory}>{post.category}</Text>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(post.priority) }]}>
                        <Text style={styles.priorityText}>{post.priority}</Text>
                    </View>
                </View>
                <View style={styles.postFooter}>
                    <View>
                        <Text style={styles.postDate}>
                            {formatDate(post.createdAt)}
                            {post.updatedAt && ` (Updated: ${formatDate(post.updatedAt)})`}
                        </Text>
                    </View>
                    {user && (
                        <View style={styles.actionButtons}>
                            <TouchableOpacity onPress={(e) => {
                                e.stopPropagation();
                                openEditModal(post);
                            }}>
                                <FontAwesome5 name="edit" size={16} color="#003366" style={styles.actionIcon} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={(e) => {
                                e.stopPropagation();
                                Alert.alert(
                                    "Confirm Delete",
                                    "Are you sure you want to delete this post?",
                                    [
                                        {
                                            text: "Cancel",
                                            style: "cancel"
                                        },
                                        { 
                                            text: "Delete", 
                                            onPress: () => handleDeletePost(post.id),
                                            style: "destructive"
                                        }
                                    ]
                                );
                            }}>
                                <FontAwesome5 name="trash" size={16} color="#FF4444" style={styles.actionIcon} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    if (!user) {
        return (
            <View style={styles.authContainer}>
                <ActivityIndicator size="large" color="#003366" />
                <Text style={styles.authText}>Verifying authentication...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Create Button */}
            <TouchableOpacity 
                style={styles.createButton}
                onPress={() => {
                    if (!user) {
                        Alert.alert("Error", "You must be logged in to create posts");
                        return;
                    }
                    setModalVisible(true);
                }}
                disabled={!user}
            >
                <FontAwesome5 name="plus" size={18} color="#FFF" />
                <Text style={styles.createButtonText}>Create Post</Text>
            </TouchableOpacity>

            {/* Posts List */}
            {loading && !refreshing ? (
                <ActivityIndicator size="large" color="#003366" style={styles.loader} />
            ) : (
                <FlatList
                    data={posts}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <PostCard 
                            post={item}
                            onPress={() => navigation.navigate('UpdateDetails', { postId: item.id })}
                        />
                    )}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No posts found</Text>
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={fetchPosts}
                            colors={["#003366", "#0275d8"]}
                        />
                    }
                    contentContainerStyle={posts.length === 0 && styles.emptyContainer}
                />
            )}

            {/* Create Post Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.bottomModalContainer}>
                    <Pressable 
                        style={styles.bottomModalOverlay} 
                        onPress={() => setModalVisible(false)}
                    />
                    
                    <Animated.View style={[styles.bottomModalView, { transform: [{ translateY: slideAnim }] }]}>
                        <View style={styles.modalHandle} />
                        <ScrollView 
                            style={styles.modalScrollView}
                            contentContainerStyle={styles.modalScrollContent}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Create New Post</Text>
                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={() => setModalVisible(false)}
                                >
                                    <FontAwesome5 name="times" size={20} color="#666" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.inputLabel}>Title <Text style={styles.required}>*</Text></Text>
                                <TextInput
                                    style={styles.inputField}
                                    placeholder="Enter title"
                                    value={title}
                                    onChangeText={setTitle}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.inputLabel}>Content <Text style={styles.required}>*</Text></Text>
                                <TextInput
                                    style={[styles.inputField, styles.textArea]}
                                    placeholder="Enter content"
                                    value={content}
                                    onChangeText={setContent}
                                    multiline
                                    numberOfLines={4}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.inputLabel}>Image</Text>
                                <TouchableOpacity 
                                    style={styles.imageUploadButton}
                                    onPress={pickImage}
                                    disabled={uploading}
                                >
                                    <FontAwesome5 
                                        name={image ? "camera" : "image"} 
                                        size={16} 
                                        color="#003366" 
                                    />
                                    <Text style={styles.imageUploadText}>
                                        {image ? "Change Image" : "Add Image (Optional)"}
                                    </Text>
                                </TouchableOpacity>

                                {(image || imageUrl) && (
                                    <View style={styles.imagePreviewContainer}>
                                        <Image 
                                            source={{ uri: image || imageUrl }} 
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
                                <Text style={styles.inputLabel}>Category <Text style={styles.required}>*</Text></Text>
                                <View style={styles.selectContainer}>
                                    <Picker
                                        selectedValue={category}
                                        onValueChange={setCategory}
                                        style={styles.selectInput}
                                        dropdownIconColor="#003366"
                                    >
                                        <Picker.Item label="Announcement" value="Announcement" />
                                        <Picker.Item label="Event" value="Event" />
                                        <Picker.Item label="Maintenance" value="Maintenance" />
                                        <Picker.Item label="Other" value="Other" />
                                    </Picker>
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.inputLabel}>Priority <Text style={styles.required}>*</Text></Text>
                                <View style={styles.selectContainer}>
                                    <Picker
                                        selectedValue={priority}
                                        onValueChange={setPriority}
                                        style={styles.selectInput}
                                        dropdownIconColor="#003366"
                                    >
                                        <Picker.Item label="High" value="High" />
                                        <Picker.Item label="Medium" value="Medium" />
                                        <Picker.Item label="Low" value="Low" />
                                    </Picker>
                                </View>
                            </View>

                            <View style={styles.modalActions}>
                                <Pressable
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={() => {
                                        setModalVisible(false);
                                        resetForm();
                                    }}
                                >
                                    <Text style={styles.modalButtonText}>Cancel</Text>
                                </Pressable>
                                <Pressable
                                    style={[styles.modalButton, styles.submitButton]}
                                    onPress={handleCreatePost}
                                    disabled={uploading || !user}
                                >
                                    {uploading ? (
                                        <ActivityIndicator color="#FFF" size="small" />
                                    ) : (
                                        <Text style={styles.modalButtonText}>Create Post</Text>
                                    )}
                                </Pressable>
                            </View>
                        </ScrollView>
                    </Animated.View>
                </View>
            </Modal>

            {/* Edit Post Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={editModalVisible}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.bottomModalContainer}>
                    <Pressable 
                        style={styles.bottomModalOverlay} 
                        onPress={() => setEditModalVisible(false)}
                    />
                    
                    <Animated.View style={[styles.bottomModalView, { transform: [{ translateY: editSlideAnim }] }]}>
                        <View style={styles.modalHandle} />
                        <ScrollView 
                            style={styles.modalScrollView}
                            contentContainerStyle={styles.modalScrollContent}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Edit Post</Text>
                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={() => setEditModalVisible(false)}
                                >
                                    <FontAwesome5 name="times" size={20} color="#666" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.inputLabel}>Title <Text style={styles.required}>*</Text></Text>
                                <TextInput
                                    style={styles.inputField}
                                    placeholder="Enter title"
                                    value={title}
                                    onChangeText={setTitle}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.inputLabel}>Content <Text style={styles.required}>*</Text></Text>
                                <TextInput
                                    style={[styles.inputField, styles.textArea]}
                                    placeholder="Enter content"
                                    value={content}
                                    onChangeText={setContent}
                                    multiline
                                    numberOfLines={4}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.inputLabel}>Image</Text>
                                <TouchableOpacity 
                                    style={styles.imageUploadButton}
                                    onPress={pickImage}
                                    disabled={uploading}
                                >
                                    <FontAwesome5 
                                        name={image ? "camera" : imageUrl ? "camera" : "image"} 
                                        size={16} 
                                        color="#003366" 
                                    />
                                    <Text style={styles.imageUploadText}>
                                        {image ? "Change Image" : imageUrl ? "Change Current Image" : "Add Image (Optional)"}
                                    </Text>
                                </TouchableOpacity>

                                {(image || imageUrl) && (
                                    <View style={styles.imagePreviewContainer}>
                                        <Image 
                                            source={{ uri: image || imageUrl }} 
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
                                <Text style={styles.inputLabel}>Category <Text style={styles.required}>*</Text></Text>
                                <View style={styles.selectContainer}>
                                    <Picker
                                        selectedValue={category}
                                        onValueChange={setCategory}
                                        style={styles.selectInput}
                                        dropdownIconColor="#003366"
                                    >
                                        <Picker.Item label="Announcement" value="Announcement" />
                                        <Picker.Item label="Event" value="Event" />
                                        <Picker.Item label="Maintenance" value="Maintenance" />
                                        <Picker.Item label="Other" value="Other" />
                                    </Picker>
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.inputLabel}>Priority <Text style={styles.required}>*</Text></Text>
                                <View style={styles.selectContainer}>
                                    <Picker
                                        selectedValue={priority}
                                        onValueChange={setPriority}
                                        style={styles.selectInput}
                                        dropdownIconColor="#003366"
                                    >
                                        <Picker.Item label="High" value="High" />
                                        <Picker.Item label="Medium" value="Medium" />
                                        <Picker.Item label="Low" value="Low" />
                                    </Picker>
                                </View>
                            </View>

                            <View style={styles.modalActions}>
                                <Pressable
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={() => {
                                        setEditModalVisible(false);
                                        resetForm();
                                    }}
                                >
                                    <Text style={styles.modalButtonText}>Cancel</Text>
                                </Pressable>
                                <Pressable
                                    style={[styles.modalButton, styles.submitButton]}
                                    onPress={handleEditPost}
                                    disabled={uploading || !user}
                                >
                                    {uploading ? (
                                        <ActivityIndicator color="#FFF" size="small" />
                                    ) : (
                                        <Text style={styles.modalButtonText}>Save Changes</Text>
                                    )}
                                </Pressable>
                            </View>
                        </ScrollView>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
};


export default UpdatesTab;