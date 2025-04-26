// projectsUtils.js
import { getFirestore, doc, deleteDoc } from "@react-native-firebase/firestore";

// Format currency for display
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
    }).format(amount || 0).replace('PHP', '₱');
};

// Get color based on project status
export const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
        case 'active': return '#4CAF50';
        case 'inactive': return '#F44336';
        case 'completed': return '#2196F3';
        default: return '#9E9E9E';
    }
};

// Delete project document
export const deleteProject = async (id) => {
    try {
        const db = getFirestore();
        await deleteDoc(doc(db, "projects", id));
        return true;
    } catch (error) {
        console.error("Error deleting project:", error);
        throw error;
    }
};

// Fetch projects from Firestore
export const fetchProjects = async () => {
    try {
        const db = getFirestore();
        const q = query(
            collection(db, "projects"),
            orderBy("createdAt", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || null
        }));
    } catch (error) {
        console.error("Error fetching projects:", error);
        throw error;
    }
};

// Setup real-time listener for projects
export const setupProjectsListener = (callback) => {
    const db = getFirestore();
    const q = query(
        collection(db, "projects"),
        orderBy("createdAt", "desc")
    );
    
    return onSnapshot(q, (snapshot) => {
        const updatedData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || null
        }));
        callback(updatedData);
    });
};

// Validate project form data
export const validateProjectForm = (formData) => {
    const errors = {};
    
    if (!formData.title || formData.title.trim() === '') {
        errors.title = 'Project title is required';
    }
    
    if (!formData.contractor || formData.contractor.trim() === '') {
        errors.contractor = 'Contractor name is required';
    }
    
    if (formData.contractAmount && isNaN(parseFloat(formData.contractAmount))) {
        errors.contractAmount = 'Invalid amount';
    }
    
    if (formData.accomplishment) {
        const accomplishmentValue = parseFloat(formData.accomplishment.replace('%', ''));
        if (isNaN(accomplishmentValue)) {
            errors.accomplishment = 'Invalid accomplishment value';
        } else if (accomplishmentValue < 0 || accomplishmentValue > 100) {
            errors.accomplishment = 'Must be between 0% and 100%';
        }
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

// Helper for initial project form state
export const getInitialProjectFormState = (project = null) => {
    return {
        title: project?.title || "",
        contractor: project?.contractor || "",
        contractAmount: project?.contractAmount?.toString() || "",
        accomplishment: project?.accomplishment || "0%",
        location: project?.location || "",
        remarks: project?.remarks || "",
        status: project?.status || "active",
        imageUrl: project?.imageUrl || "",
        image: null
    };
};