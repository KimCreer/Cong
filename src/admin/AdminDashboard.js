import React, { useState, useEffect, useRef } from "react";
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    SafeAreaView, 
    TouchableOpacity,
    Image,
    RefreshControl,
    ActivityIndicator,
    Alert
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome5, Feather } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { getFirestore, collection, query, where, getDocs, onSnapshot, orderBy, limit } from "@react-native-firebase/firestore";
import { getAuth } from "@react-native-firebase/auth";

// Import tab components
import ProjectsTab from './tabs/ProjectsTab';
import ConcernsTab from './tabs/ConcernsTab';
import AppointmentsTab from './tabs/AppointmentsTab';
import UpdatesTab from './tabs/UpdatesTab';

const AdminDashboard = () => {
    const navigation = useNavigation();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("dashboard");
    
    const [stats, setStats] = useState({
        pendingAppointments: 0,
        unresolvedConcerns: 0,
        draftUpdates: 0,
        activeProjects: 0
    });

    const [recentActivities, setRecentActivities] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const cache = useRef({
        lastFetch: null,
        data: null
    });

    // Format time as "X mins/hours/days ago"
    const formatTimeAgo = (date) => {
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

    // Format appointment date and time
    const formatAppointmentDateTime = (dateString, timeString) => {
        try {
            const date = new Date(dateString);
            return `${date.toLocaleDateString()} at ${timeString}`;
        } catch (error) {
            console.error("Error formatting date:", error);
            return timeString; // Return just the time if date parsing fails
        }
    };

    // Fetch counts for different collections
    const fetchCollectionCount = async (collectionName, conditions = []) => {
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

    // Fetch recent activities
    const fetchRecentActivities = async () => {
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
                time: formatTimeAgo(doc.data().timestamp.toDate())
            }));
        } catch (error) {
            console.error("Error fetching activities:", error);
            return [];
        }
    };

    // Fetch appointments data
    const fetchAppointments = async () => {
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

    // Main data fetching function
    const fetchAdminData = async (forceRefresh = false) => {
        try {
            setLoading(true);
            const now = Date.now();
            const oneHour = 60 * 60 * 1000;
            
            if (!forceRefresh && cache.current.data && 
                cache.current.lastFetch && (now - cache.current.lastFetch < oneHour)) {
                setStats(cache.current.data.stats);
                setRecentActivities(cache.current.data.activities);
                setAppointments(cache.current.data.appointments);
                setLoading(false);
                return;
            }
            
            const [pendingAppointments, unresolvedConcerns, draftUpdates, activeProjects, activities, appointmentsData] = 
                await Promise.all([
                    fetchCollectionCount("appointments", [["status", "==", "Pending"]]),
                    fetchCollectionCount("concerns", [["status", "in", ["new", "in-progress"]]]),
                    fetchCollectionCount("updates", [["status", "==", "draft"]]),
                    fetchCollectionCount("projects", [["status", "==", "active"]]),
                    fetchRecentActivities(),
                    fetchAppointments()
                ]);
            
            cache.current = {
                lastFetch: now,
                data: {
                    stats: { pendingAppointments, unresolvedConcerns, draftUpdates, activeProjects },
                    activities,
                    appointments: appointmentsData
                }
            };
            
            setStats({ pendingAppointments, unresolvedConcerns, draftUpdates, activeProjects });
            setRecentActivities(activities);
            setAppointments(appointmentsData);
            
        } catch (error) {
            console.error("Error fetching admin data:", error);
            Alert.alert(
                "Error",
                "Failed to load dashboard data",
                [
                    { text: "Try Again", onPress: () => fetchAdminData(true) },
                    { text: "Cancel", style: "cancel" }
                ]
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Set up real-time listeners
    useEffect(() => {
        fetchAdminData();
        
        const db = getFirestore();
        const auth = getAuth();
        const adminId = auth.currentUser?.uid;
        
        if (!adminId) return;
        
        // Set up listeners for each collection
        const unsubscribeAppointments = onSnapshot(
            query(collection(db, "appointments"), where("status", "==", "Pending")),
            (snapshot) => {
                const appointmentsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    formattedDateTime: formatAppointmentDateTime(doc.data().date, doc.data().time)
                }));
                setAppointments(appointmentsData);
                setStats(prev => ({ ...prev, pendingAppointments: snapshot.size }));
            }
        );
        
        const unsubscribeConcerns = onSnapshot(
            query(collection(db, "concerns"), where("status", "in", ["new", "in-progress"])),
            (snapshot) => {
                setStats(prev => ({ ...prev, unresolvedConcerns: snapshot.size }));
            }
        );
        
        const unsubscribeUpdates = onSnapshot(
            query(collection(db, "updates"), where("status", "==", "draft")),
            (snapshot) => {
                setStats(prev => ({ ...prev, draftUpdates: snapshot.size }));
            }
        );
        
        const unsubscribeProjects = onSnapshot(
            query(collection(db, "projects"), where("status", "==", "active")),
            (snapshot) => {
                setStats(prev => ({ ...prev, activeProjects: snapshot.size }));
            }
        );
        
        const unsubscribeActivities = onSnapshot(
            query(collection(db, "activities"), orderBy("timestamp", "desc"), limit(10)),
            (snapshot) => {
                const activities = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    time: formatTimeAgo(doc.data().timestamp.toDate())
                }));
                setRecentActivities(activities);
            }
        );
        
        return () => {
            unsubscribeAppointments();
            unsubscribeConcerns();
            unsubscribeUpdates();
            unsubscribeProjects();
            unsubscribeActivities();
        };
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchAdminData(true);
    };

    const handleLogout = async () => {
        try {
            const auth = getAuth();
            const user = auth.currentUser;
            
            if (!user) {
                navigation.navigate("Login");
                return;
            }
            
            await auth.signOut();
            navigation.navigate("Login");
        } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Error", error.message);
        }
    };

    // Dashboard Components
    const StatCard = ({ icon, value, label, color, onPress }) => (
        <TouchableOpacity style={styles.statCard} onPress={onPress}>
            <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
                <FontAwesome5 name={icon} size={20} color={color} />
            </View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </TouchableOpacity>
    );

    const QuickAction = ({ icon, label, onPress }) => (
        <TouchableOpacity style={styles.quickAction} onPress={onPress}>
            <View style={styles.quickActionIcon}>
                <FontAwesome5 name={icon} size={20} color="#0275d8" />
            </View>
            <Text style={styles.quickActionLabel}>{label}</Text>
        </TouchableOpacity>
    );

    const ActivityItem = ({ item }) => {
        const getIcon = () => {
            switch(item.type) {
                case 'appointment': return 'calendar-alt';
                case 'concern': return 'comments';
                case 'update': return 'newspaper';
                case 'project': return 'project-diagram';
                default: return 'bell';
            }
        };

        return (
            <View style={styles.activityItem}>
                <View style={styles.activityIcon}>
                    <FontAwesome5 name={getIcon()} size={16} color="#0275d8" />
                </View>
                <View style={styles.activityContent}>
                    <Text style={styles.activityAction}>{item.action}</Text>
                    <Text style={styles.activityTime}>{item.time}</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#ccc" />
            </View>
        );
    };

    const AppointmentItem = ({ appointment }) => (
        <View style={styles.appointmentItem}>
            <Text style={styles.appointmentType}>{appointment.type}</Text>
            <Text style={styles.appointmentPurpose}>{appointment.purpose}</Text>
            <Text style={styles.appointmentTime}>{appointment.formattedDateTime}</Text>
        </View>
    );

    const ActivityList = ({ activities }) => (
        <View style={styles.activityList}>
            {activities.map(item => (
                <ActivityItem key={item.id} item={item} />
            ))}
        </View>
    );

    const NavButton = ({ icon, label, active, onPress }) => (
        <TouchableOpacity 
            style={[styles.navButton, active && styles.navButtonActive]} 
            onPress={onPress}
        >
            <FontAwesome5 
                name={icon} 
                size={16} 
                color={active ? "#FFD700" : "rgba(255,255,255,0.7)"} 
            />
            <Text style={[styles.navButtonLabel, active && styles.navButtonLabelActive]}>
                {label}
            </Text>
        </TouchableOpacity>
    );

    // Tab Screens
    const renderDashboard = () => (
        <ScrollView
            contentContainerStyle={styles.scrollContainer}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={["#003366", "#0275d8"]}
                    tintColor="#003366"
                    progressBackgroundColor="#FFFFFF"
                />
            }
        >
            <Text style={styles.sectionTitle}>Admin Overview</Text>
            
            <View style={styles.statsContainer}>
                <StatCard 
                    icon="calendar-check" 
                    value={stats.pendingAppointments} 
                    label="Pending Appointments" 
                    color="#FF9800"
                    onPress={() => setActiveTab('appointments')}
                />
                <StatCard 
                    icon="comments" 
                    value={stats.unresolvedConcerns} 
                    label="Unresolved Concerns" 
                    color="#F44336"
                    onPress={() => setActiveTab('concerns')}
                />
                <StatCard 
                    icon="newspaper" 
                    value={stats.draftUpdates} 
                    label="Draft Updates" 
                    color="#2196F3"
                    onPress={() => setActiveTab('updates')}
                />
                <StatCard 
                    icon="project-diagram" 
                    value={stats.activeProjects} 
                    label="Active Projects" 
                    color="#4CAF50"
                    onPress={() => setActiveTab('projects')}
                />
            </View>

            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            {appointments.length > 0 ? (
                <>
                    {appointments.slice(0, 3).map(appointment => (
                        <AppointmentItem key={appointment.id} appointment={appointment} />
                    ))}
                    {appointments.length > 3 && (
                        <TouchableOpacity 
                            style={styles.seeAllButton}
                            onPress={() => setActiveTab('appointments')}
                        >
                            <Text style={styles.seeAllText}>See all appointments →</Text>
                        </TouchableOpacity>
                    )}
                </>
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No upcoming appointments</Text>
                </View>
            )}

            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
                <QuickAction 
                    icon="plus-circle" 
                    label="Add Update" 
                    onPress={() => navigation.navigate('CreateUpdate')}
                />
                <QuickAction 
                    icon="file-alt" 
                    label="Generate Report" 
                    onPress={() => navigation.navigate('GenerateReport')}
                />
                <QuickAction 
                    icon="search" 
                    label="Search Data" 
                    onPress={() => navigation.navigate('SearchData')}
                />
            </View>

            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {recentActivities.length > 0 ? (
                <ActivityList activities={recentActivities} />
            ) : (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No recent activities</Text>
                </View>
            )}
        </ScrollView>
    );

    const renderTabContent = () => {
        switch(activeTab) {
            case "dashboard": 
                return renderDashboard();
            case "projects": 
                return <ProjectsTab navigation={navigation} />;
            case "concerns": 
                return <ConcernsTab navigation={navigation} />;
            case "appointments": 
                return <AppointmentsTab navigation={navigation} />;
            case "updates": 
                return <UpdatesTab navigation={navigation} />;
            default: 
                return renderDashboard();
        }
    };

    return (
        <SafeAreaView style={styles.safeContainer}>
            {/* Header */}
            <LinearGradient
                colors={['#003366', '#0275d8']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <Image
                        source={{ uri: 'https://via.placeholder.com/50' }}
                        style={styles.adminAvatar}
                    />
                    <View>
                        <Text style={styles.headerSubtitle}>Administrator</Text>
                        <Text style={styles.headerTitle}>Dashboard</Text>
                    </View>
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                        <Feather name="log-out" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Main Content */}
            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#003366" />
                    <Text style={styles.loadingText}>Loading Dashboard...</Text>
                </View>
            ) : (
                renderTabContent()
            )}

            {/* Admin Navigation */}
            <LinearGradient
                colors={['#003366', '#0275d8']}
                style={styles.adminNav}
            >
                <NavButton 
                    icon="tachometer-alt" 
                    label="Dashboard" 
                    active={activeTab === "dashboard"}
                    onPress={() => setActiveTab("dashboard")}
                />
                <NavButton 
                    icon="project-diagram" 
                    label="Projects" 
                    active={activeTab === "projects"}
                    onPress={() => setActiveTab("projects")}
                />
                <NavButton 
                    icon="comments" 
                    label="Concerns" 
                    active={activeTab === "concerns"}
                    onPress={() => setActiveTab("concerns")}
                />
                <NavButton 
                    icon="calendar-alt" 
                    label="Appointments" 
                    active={activeTab === "appointments"}
                    onPress={() => setActiveTab("appointments")}
                />
                <NavButton 
                    icon="newspaper" 
                    label="Updates" 
                    active={activeTab === "updates"}
                    onPress={() => setActiveTab("updates")}
                />
            </LinearGradient>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        paddingVertical: 15,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    adminAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    logoutButton: {
        padding: 8,
    },
    scrollContainer: {
        padding: 20,
        paddingBottom: 90,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#003366',
    },
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statCard: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    statIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#003366',
        marginBottom: 5,
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    quickAction: {
        width: '32%',
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    quickActionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(2, 117, 216, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    quickActionLabel: {
        fontSize: 14,
        color: '#003366',
        textAlign: 'center',
    },
    activityList: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    activityIcon: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(2, 117, 216, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    activityContent: {
        flex: 1,
    },
    activityAction: {
        fontSize: 14,
        color: '#333',
        marginBottom: 3,
    },
    activityTime: {
        fontSize: 12,
        color: '#999',
    },
    appointmentItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 15,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    appointmentType: {
        fontWeight: 'bold',
        color: '#003366',
        marginBottom: 5,
    },
    appointmentPurpose: {
        color: '#333',
        marginBottom: 5,
    },
    appointmentTime: {
        color: '#666',
        fontSize: 12,
    },
    seeAllButton: {
        alignSelf: 'flex-end',
        marginTop: 5,
    },
    seeAllText: {
        color: '#0275d8',
        fontSize: 14,
    },
    adminNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 15,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    navButton: {
        alignItems: 'center',
        padding: 5,
    },
    navButtonActive: {
        borderTopWidth: 2,
        borderTopColor: '#FFD700',
    },
    navButtonLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 5,
    },
    navButtonLabelActive: {
        color: '#FFD700',
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#003366',
    },
    emptyContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
    },
    emptyText: {
        color: '#999',
        fontSize: 16,
    },
});

export default AdminDashboard;