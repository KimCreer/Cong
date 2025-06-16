import { useState } from 'react';
import { getAuth } from "@react-native-firebase/auth";
import { getFirestore, collection, query, where, getDocs, doc, setDoc, updateDoc } from "@react-native-firebase/firestore";
import { Alert } from 'react-native';

// Define available tasks that can be assigned to admins
export const AVAILABLE_TASKS = {
    appointments: {
        name: 'Appointments',
        description: 'Manage appointments and scheduling'
    },
    concerns: {
        name: 'Concerns',
        description: 'Handle user concerns and complaints'
    },
    projects: {
        name: 'Projects',
        description: 'Manage community projects'
    },
    medical: {
        name: 'Medical Applications',
        description: 'Process medical assistance applications'
    },
    updates: {
        name: 'Updates & Announcements',
        description: 'Manage system updates and community announcements'
    }
};

export const useAdminManagement = (adminType) => {
    const [showAddAdminModal, setShowAddAdminModal] = useState(false);
    const [showEditPermissionsModal, setShowEditPermissionsModal] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [newAdminPhone, setNewAdminPhone] = useState('');
    const [addingAdmin, setAddingAdmin] = useState(false);
    const [adminList, setAdminList] = useState([]);
    const [loadingAdmins, setLoadingAdmins] = useState(false);

    const auth = getAuth();
    const db = getFirestore();

    const resetAddAdminModal = () => {
        setNewAdminPhone('');
        setShowAddAdminModal(false);
    };

    const resetEditPermissionsModal = () => {
        setSelectedAdmin(null);
        setShowEditPermissionsModal(false);
    };

    const fetchAdmins = async () => {
        if (adminType !== 'superadmin') return;
        
        try {
            setLoadingAdmins(true);
            const currentUser = auth.currentUser;
            
            if (!currentUser) {
                setAdminList([]);
                return;
            }

            const adminsRef = collection(db, "admins");
            // Query all admins except the current super admin
            const adminQ = query(
                adminsRef,
                where("adminType", "==", "regular") // Only get regular admins
            );
            const adminSnapshot = await getDocs(adminQ);
            
            const admins = adminSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                tasks: doc.data().tasks || []
            }));
            
            setAdminList(admins);
        } catch (error) {
            console.error("Error fetching admins:", error);
            Alert.alert("Error", "Failed to fetch admin list");
        } finally {
            setLoadingAdmins(false);
        }
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
                adminType: 'regular',
                tasks: [] // Initialize with no tasks
            });
            
            Alert.alert("Success", "New admin added successfully");
            resetAddAdminModal();
            fetchAdmins(); // Refresh admin list
        } catch (error) {
            console.error("Error adding admin:", error);
            Alert.alert("Error", error.message || "Failed to add admin");
        } finally {
            setAddingAdmin(false);
        }
    };

    const handleUpdateAdminTasks = async (adminId, tasks) => {
        if (adminType !== 'superadmin') {
            Alert.alert(
                "Permission Denied",
                "Only superadmins can modify admin permissions"
            );
            return;
        }

        try {
            const adminRef = doc(db, "admins", adminId);
            await updateDoc(adminRef, {
                tasks: tasks
            });
            
            Alert.alert("Success", "Admin permissions updated successfully");
            resetEditPermissionsModal();
            fetchAdmins(); // Refresh admin list
        } catch (error) {
            console.error("Error updating admin tasks:", error);
            Alert.alert("Error", "Failed to update admin permissions");
        }
    };

    return {
        showAddAdminModal,
        setShowAddAdminModal,
        showEditPermissionsModal,
        setShowEditPermissionsModal,
        selectedAdmin,
        setSelectedAdmin,
        newAdminPhone,
        setNewAdminPhone,
        addingAdmin,
        loadingAdmins,
        adminList,
        handleAddAdmin,
        handleUpdateAdminTasks,
        resetAddAdminModal,
        resetEditPermissionsModal,
        fetchAdmins
    };
}; 