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

// Define required fields for each project type
const projectTypeRequiredFields = {
    infrastructure: ['contractor', 'location'],
    educational: ['partnerAgency', 'targetParticipants', 'programType', 'venue', 'startDate', 'endDate'],
    health: ['partnerAgency', 'beneficiaries', 'programType', 'venue', 'startDate'],
    livelihood: ['partnerAgency', 'beneficiaries', 'programType', 'budget', 'startDate'],
    social: ['partnerAgency', 'beneficiaries', 'programType', 'budget', 'venue'],
    environmental: ['partnerAgency', 'targetParticipants', 'programType', 'location', 'materials'],
    sports: ['partnerAgency', 'targetParticipants', 'programType', 'venue', 'equipment'],
    disaster: ['partnerAgency', 'beneficiaries', 'programType', 'budget', 'location'],
    youth: ['partnerAgency', 'targetParticipants', 'programType', 'venue', 'trainingHours'],
    senior: ['partnerAgency', 'beneficiaries', 'programType', 'venue', 'budget']
};

// Validate project form data
export const validateProjectForm = (formData) => {
    const errors = {};
    
    if (!formData.title || formData.title.trim() === '') {
        errors.title = 'Project title is required';
    }
    
    if (!formData.projectType) {
        errors.projectType = 'Project type is required';
    }

    // Validate required fields based on project type
    const requiredFields = projectTypeRequiredFields[formData.projectType] || [];
    requiredFields.forEach(field => {
        if (!formData[field] || formData[field].trim() === '') {
            errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} is required`;
        }
    });
    
    // Validate numeric fields
    const numericFields = ['contractAmount', 'budget', 'targetParticipants', 'beneficiaries', 'trainingHours'];
    numericFields.forEach(field => {
        if (formData[field] && isNaN(parseFloat(formData[field]))) {
            errors[field] = 'Invalid numeric value';
        }
    });
    
    // Validate dates
    if (formData.startDate && !isValidDate(formData.startDate)) {
        errors.startDate = 'Invalid start date';
    }
    if (formData.endDate && !isValidDate(formData.endDate)) {
        errors.endDate = 'Invalid end date';
    }
    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
        errors.endDate = 'End date must be after start date';
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

// Helper function to validate date format
const isValidDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
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
        image: null,
        projectType: project?.projectType || "infrastructure",
        beneficiaries: project?.beneficiaries || "",
        startDate: project?.startDate || "",
        endDate: project?.endDate || "",
        budget: project?.budget || "",
        partnerAgency: project?.partnerAgency || "",
        targetParticipants: project?.targetParticipants || "",
        programType: project?.programType || "",
        equipment: project?.equipment || "",
        materials: project?.materials || "",
        trainingHours: project?.trainingHours || "",
        venue: project?.venue || ""
    };
};