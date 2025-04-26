// projectsService.js
import { 
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    orderBy,
    onSnapshot
} from '@react-native-firebase/firestore';

/**
 * Fetch all projects from Firestore
 * @returns {Promise<Array>} Array of project objects
 */
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

/**
 * Create a new project in Firestore
 * @param {Object} projectData - Project data to create
 * @returns {Promise<string>} ID of the created project
 */
export const createProject = async (projectData) => {
    try {
        const db = getFirestore();
        const docRef = await addDoc(collection(db, "projects"), {
            ...projectData,
            createdAt: new Date()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating project:", error);
        throw error;
    }
};

/**
 * Update an existing project in Firestore
 * @param {string} projectId - ID of the project to update
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export const updateProject = async (projectId, updates) => {
    try {
        const db = getFirestore();
        await updateDoc(doc(db, "projects", projectId), {
            ...updates,
            updatedAt: new Date()
        });
    } catch (error) {
        console.error("Error updating project:", error);
        throw error;
    }
};

/**
 * Delete a project from Firestore
 * @param {string} projectId - ID of the project to delete
 * @returns {Promise<void>}
 */
export const deleteProject = async (projectId) => {
    try {
        const db = getFirestore();
        await deleteDoc(doc(db, "projects", projectId));
    } catch (error) {
        console.error("Error deleting project:", error);
        throw error;
    }
};

/**
 * Set up a real-time listener for projects
 * @param {function} callback - Function to call with updated projects
 * @returns {function} Unsubscribe function
 */
export const setupProjectsListener = (callback) => {
    try {
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
    } catch (error) {
        console.error("Error setting up listener:", error);
        throw error;
    }
};

/**
 * Fetch a single project by ID
 * @param {string} projectId - ID of the project to fetch
 * @returns {Promise<Object|null>} Project data or null if not found
 */
export const getProjectById = async (projectId) => {
    try {
        const db = getFirestore();
        const docRef = doc(db, "projects", projectId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...docSnap.data(),
                createdAt: docSnap.data().createdAt?.toDate() || new Date(),
                updatedAt: docSnap.data().updatedAt?.toDate() || null
            };
        }
        return null;
    } catch (error) {
        console.error("Error fetching project:", error);
        throw error;
    }
};