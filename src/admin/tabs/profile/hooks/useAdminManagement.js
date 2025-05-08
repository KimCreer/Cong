import { useState } from 'react';
import { getAuth } from "@react-native-firebase/auth";
import { getFirestore, collection, query, where, getDocs, doc, setDoc } from "@react-native-firebase/firestore";
import { Alert } from 'react-native';

export const useAdminManagement = (adminType) => {
    const [showAddAdminModal, setShowAddAdminModal] = useState(false);
    const [newAdminPhone, setNewAdminPhone] = useState('');
    const [addingAdmin, setAddingAdmin] = useState(false);

    const auth = getAuth();
    const db = getFirestore();

    const resetAddAdminModal = () => {
        setNewAdminPhone('');
        setShowAddAdminModal(false);
    };

    const handleAddAdmin = async () => {
        if (!newAdminPhone.trim()) {
            Alert.alert("Validation Error", "Please enter a valid phone number");
            return;
        }
    
        if (adminType !== 'superadmin') {
            Alert.alert(
                "Permission Denied",
                "Only superadmins can create new admin accounts"
            );
            return;
        }
    
        try {
            setAddingAdmin(true);
            
            const adminsRef = collection(db, "admins");
            const adminQ = query(adminsRef, where("phone", "==", newAdminPhone.trim()));
            const adminSnapshot = await getDocs(adminQ);
            
            if (!adminSnapshot.empty) {
                throw new Error("This phone number is already registered as an admin");
            }
            
            const adminDocRef = doc(adminsRef);
            
            await setDoc(adminDocRef, {
                phone: newAdminPhone.trim(),
                name: "New Admin",
                position: "Administrator",
                createdAt: new Date(),
                addedBy: auth.currentUser.uid,
                adminType: 'regular'
            });
            
            Alert.alert("Success", "New admin added successfully");
            resetAddAdminModal();
        } catch (error) {
            console.error("Error adding admin:", error);
            Alert.alert("Error", error.message || "Failed to add admin");
        } finally {
            setAddingAdmin(false);
        }
    };

    return {
        showAddAdminModal,
        setShowAddAdminModal,
        newAdminPhone,
        setNewAdminPhone,
        addingAdmin,
        handleAddAdmin,
        resetAddAdminModal
    };
}; 