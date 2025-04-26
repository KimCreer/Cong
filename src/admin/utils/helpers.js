import { getFirestore, collection, query, where, getDocs, orderBy, limit } from "@react-native-firebase/firestore";

export const formatTimeAgo = (date) => {
    if (!date) return "Unknown time";
    
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return `${interval} year${interval === 1 ? '' : 's'} ago`;
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval} month${interval === 1 ? '' : 's'} ago`;
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval} day${interval === 1 ? '' : 's'} ago`;
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval} hour${interval === 1 ? '' : 's'} ago`;
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval} minute${interval === 1 ? '' : 's'} ago`;
    
    return "Just now";
};

export const formatAppointmentDateTime = (dateString, timeString) => {
    try {
        const date = new Date(dateString);
        return `${date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        })} at ${timeString}`;
    } catch (error) {
        console.error("Error formatting date:", error);
        return timeString;
    }
};

export const fetchCollectionCount = async (collectionName, conditions = []) => {
    try {
        const db = getFirestore();
        let q = query(collection(db, collectionName));
        
        conditions.forEach(condition => {
            q = query(q, where(...condition));
        });
        
        const snapshot = await getDocs(q);
        return snapshot.size;
    } catch (error) {
        console.error(`Error fetching ${collectionName} count:`, error);
        return 0;
    }
};

export const fetchRecentActivities = async () => {
    try {
        const db = getFirestore();
        const q = query(
            collection(db, "activities"),
            orderBy("timestamp", "desc"),
            limit(10)
        );
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            time: formatTimeAgo(doc.data().timestamp?.toDate())
        }));
    } catch (error) {
        console.error("Error fetching activities:", error);
        return [];
    }
};

export const fetchAppointments = async () => {
    try {
        const db = getFirestore();
        const q = query(
            collection(db, "appointments"),
            where("status", "==", "Pending"),
            orderBy("date", "asc")
        );
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            formattedDateTime: formatAppointmentDateTime(doc.data().date, doc.data().time)
        }));
    } catch (error) {
        console.error("Error fetching appointments:", error);
        return [];
    }
};

export const fetchConcerns = async () => {
    try {
        const db = getFirestore();
        const q = query(
            collection(db, "concerns"),
            where("status", "in", ["Pending", "In Progress"]),
            orderBy("createdAt", "desc")
        );
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timeAgo: formatTimeAgo(doc.data().createdAt?.toDate()),
            imageName: doc.data().title || doc.data().location || null,
            imageUrl: doc.data().imageUrl || null
        }));
    } catch (error) {
        console.error("Error fetching concerns:", error);
        return [];
    }
};

export const fetchMedicalAppStats = async () => {
    try {
        const db = getFirestore();
        const q = query(collection(db, "medicalApplications"));
        const snapshot = await getDocs(q);
        
        const programCounts = {};
        snapshot.docs.forEach(doc => {
            const program = doc.data().program || doc.data().type || 'Other';
            programCounts[program] = (programCounts[program] || 0) + 1;
        });
        
        const labels = Object.keys(programCounts);
        const data = Object.values(programCounts);
        
        return {
            labels: labels.length > 0 ? labels : ['No Programs'],
            datasets: [{
                data: data.length > 0 ? data : [0]
            }]
        };
    } catch (error) {
        console.error("Error fetching medical application stats:", error);
        return {
            labels: ['No Data'],
            datasets: [{
                data: [0]
            }]
        };
    }
};

export const fetchStatusDistribution = async () => {
    try {
        const db = getFirestore();
        
        const [pendingConcerns, inProgressConcerns, resolvedConcerns] = await Promise.all([
            fetchCollectionCount("concerns", [["status", "==", "Pending"]]),
            fetchCollectionCount("concerns", [["status", "==", "In Progress"]]),
            fetchCollectionCount("concerns", [["status", "==", "Resolved"]])
        ]);
        
        return [
            {
                name: "Pending",
                population: pendingConcerns,
                color: "#FF6384",
                legendFontColor: "#7F7F7F",
                legendFontSize: 12
            },
            {
                name: "In Progress",
                population: inProgressConcerns,
                color: "#36A2EB",
                legendFontColor: "#7F7F7F",
                legendFontSize: 12
            },
            {
                name: "Completed",
                population: resolvedConcerns,
                color: "#4BC0C0",
                legendFontColor: "#7F7F7F",
                legendFontSize: 12
            }
        ];
    } catch (error) {
        console.error("Error fetching status distribution:", error);
        return [
            {
                name: "Pending",
                population: 0,
                color: "#FF6384",
                legendFontColor: "#7F7F7F",
                legendFontSize: 12
            },
            {
                name: "In Progress",
                population: 0,
                color: "#36A2EB",
                legendFontColor: "#7F7F7F",
                legendFontSize: 12
            },
            {
                name: "Completed",
                population: 0,
                color: "#4BC0C0",
                legendFontColor: "#7F7F7F",
                legendFontSize: 12
            }
        ];
    }
};