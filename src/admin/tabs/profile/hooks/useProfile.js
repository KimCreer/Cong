import { useState, useEffect } from 'react';
import { getAuth } from "@react-native-firebase/auth";
import { getFirestore, doc, getDoc, updateDoc, setDoc } from "@react-native-firebase/firestore";
import { Alert } from 'react-native';
import { CLOUDINARY_URL, CLOUDINARY_UPLOAD_PRESET } from '../../../../../data/cloudinaryConfig';

export const useProfile = () => {
    const [adminData, setAdminData] = useState({
        name: 'Loading...',
        phone: 'Loading...',
        position: 'Loading...',
        avatarUrl: null,
        adminType: 'regular'
    });
    
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        position: ''
    });
    const [uploading, setUploading] = useState(false);

    const auth = getAuth();
    const db = getFirestore();

    const fetchAdminProfile = async () => {
        try {
            setLoading(true);
            const currentUser = auth.currentUser;
            
            if (!currentUser || !currentUser.uid) {
                throw new Error("User not authenticated or missing UID");
            }
        
            const adminRef = doc(db, "admins", currentUser.uid);
            const adminSnap = await getDoc(adminRef);
        
            if (adminSnap && adminSnap.exists) {
                const data = adminSnap.data();
                
                if (!data) {
                    throw new Error("Document exists but has no data");
                }
        
                const validatedData = {
                    name: data.name?.trim() || 'Not set',
                    phone: data.phone?.trim() || 'Not set',
                    position: data.position?.trim() || 'Not set',
                    avatarUrl: data.avatarUrl || null,
                    adminType: data.adminType || 'regular'
                };
                
                setAdminData(validatedData);
                setFormData({
                    name: validatedData.name,
                    phone: validatedData.phone,
                    position: validatedData.position
                });
            } else {
                const defaultData = {
                    name: currentUser.displayName || 'Not set',
                    phone: currentUser.phoneNumber || 'Not set',
                    position: 'Administrator',
                    avatarUrl: null,
                    createdAt: new Date(),
                    adminType: 'regular'
                };
                
                await setDoc(adminRef, defaultData);
                setAdminData(defaultData);
                setFormData({
                    name: defaultData.name,
                    phone: defaultData.phone,
                    position: defaultData.position
                });
            }
        } catch (error) {
            console.error("Profile fetch error:", error);
            Alert.alert(
                "Profile Error",
                error.message || "Failed to load admin profile"
            );
            setAdminData({
                name: 'Error loading',
                phone: 'Error loading',
                position: 'Error loading',
                avatarUrl: null,
                adminType: 'regular'
            });
        } finally {
            setLoading(false);
        }
    };

    const uploadImageToCloudinary = async (imageUri) => {
        try {
            setUploading(true);
            
            const formData = new FormData();
            formData.append('file', {
                uri: imageUri,
                type: 'image/jpeg',
                name: 'profile.jpg'
            });
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            
            const response = await fetch(CLOUDINARY_URL, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to upload image');
            }
            
            return data.secure_url;
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        } finally {
            setUploading(false);
        }
    };

    const updateProfileImage = async (imageUrl) => {
        try {
            setLoading(true);
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error("User not authenticated");
            }

            const adminRef = doc(db, "admins", currentUser.uid);
            await updateDoc(adminRef, {
                avatarUrl: imageUrl
            });
            
            setAdminData(prev => ({ 
                ...prev,
                avatarUrl: imageUrl
            }));
            
            Alert.alert("Success", "Profile image updated successfully");
        } catch (error) {
            console.error("Error updating profile image:", error);
            Alert.alert("Error", "Failed to update profile image");
        } finally {
            setLoading(false);
        }
    };

    const validateFormData = () => {
        if (!formData.name.trim()) {
            Alert.alert("Validation Error", "Please enter your name");
            return false;
        }
        if (!formData.position.trim()) {
            Alert.alert("Validation Error", "Please enter your position");
            return false;
        }
        return true;
    };

    const handleUpdateProfile = async () => {
        if (!validateFormData()) return;

        try {
            setLoading(true);
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error("User not authenticated");
            }

            const adminRef = doc(db, "admins", currentUser.uid);
            await updateDoc(adminRef, {
                name: formData.name.trim(),
                phone: formData.phone.trim(),
                position: formData.position.trim()
            });
            
            setAdminData({ 
                ...adminData,
                name: formData.name.trim(),
                phone: formData.phone.trim(),
                position: formData.position.trim()
            });
            setEditing(false);
            Alert.alert("Success", "Profile updated successfully");
        } catch (error) {
            console.error("Error updating profile:", error);
            Alert.alert("Error", "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                fetchAdminProfile();
            } else {
                setLoading(false);
            }
        });
    
        return () => unsubscribe();
    }, []);

    return {
        adminData,
        loading,
        editing,
        setEditing,
        formData,
        setFormData,
        uploading,
        handleUpdateProfile,
        uploadImageToCloudinary,
        updateProfileImage
    };
}; 