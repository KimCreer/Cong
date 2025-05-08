import React, { useState, useEffect, useRef, useCallback } from "react";
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
    Alert,
    Dimensions,
    Platform,
    useWindowDimensions,
    TextInput,
    FlatList
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { FontAwesome5, Feather, MaterialIcons, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { getFirestore, collection, query, where, getDocs, onSnapshot, orderBy, limit, doc, getDoc, setDoc } from "@react-native-firebase/firestore";
import { getAuth } from "@react-native-firebase/auth";
import { BarChart, PieChart } from 'react-native-chart-kit';
import * as Animatable from 'react-native-animatable';
import BackgroundFetch from "react-native-background-fetch";
import * as SecureStore from 'expo-secure-store';

// Import tab components
import ProjectsTab from './tabs/ProjectsTab';
import ConcernsTab from './tabs/ConcernsTab';
import AppointmentsTab from './tabs/AppointmentsTab';
import UpdatesTab from './tabs/UpdatesTab';
import MedicalApplicationTab from './tabs/MedicalApplicationTab';
import ProfileTab from './tabs/ProfileTab';
import StatsTab from './tabs/StatsTab';

// Import utility components
import Header from './adcomps/Header';
import StatCard from './adcomps/StatCard';
import ActivityItem from './adcomps/ActivityItem';
import AppointmentItem from './adcomps/AppointmentItem';
import ConcernItem from './adcomps/ConcernItem';

// Import utility functions
import { 
    formatTimeAgo, 
    formatAppointmentDateTime,
    fetchCollectionCount,
    fetchRecentActivities,
    fetchAppointments,
    fetchConcerns,
    fetchMedicalAppStats,
    fetchStatusDistribution
} from './utils/helpers';

const AdminDashboard = () => {
    const navigation = useNavigation();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("dashboard");
    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;
    const isTablet = width >= 768;
    const [currentUid, setCurrentUid] = useState(null);
    
    // Admin profile state
    const [adminProfile, setAdminProfile] = useState({
        name: 'Admin',
        position: 'Administrator',
        avatarUrl: null
    });
    const [profileLoading, setProfileLoading] = useState(false);

    // Dashboard stats state
    const [stats, setStats] = useState({
        pendingAppointments: 0,
        pendingConcerns: 0,
        activeProjects: 0,
        medicalApplications: 0,
        completedProjects: 0,
        resolvedConcerns: 0
    });

    // Chart data state
    const [chartData, setChartData] = useState({
        labels: ['No Data'],
        datasets: [{
            data: [0]
        }]
    });

    const [pieData, setPieData] = useState([
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
    ]);

    // Data state
    const [recentActivities, setRecentActivities] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [concerns, setConcerns] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const cache = useRef({
        lastFetch: null,
        data: null
    });

    const fetchAdminProfile = useCallback(async () => {
        try {
            setProfileLoading(true);
            const auth = getAuth();
            const currentUser = auth.currentUser;
            
            if (!currentUser || !currentUser.uid) {
                setAdminProfile({
                    name: 'Admin',
                    position: 'Administrator',
                    avatarUrl: null
                });
                return;
            }
    
            const db = getFirestore();
            const adminRef = doc(db, "admins", currentUser.uid);
            const adminSnap = await getDoc(adminRef);
    
            if (adminSnap.exists) {
                const data = adminSnap.data();
                const updatedProfile = {
                    name: data.name || 'Admin',
                    position: data.position || 'Administrator',
                    avatarUrl: data.avatarUrl || null
                };
                setAdminProfile(updatedProfile);
                return updatedProfile;
            }
        } catch (error) {
            console.error("Error fetching admin profile:", error);
            if (!error.message.includes("not authenticated")) {
                Alert.alert("Error", "Failed to load admin profile");
            }
            return null;
        } finally {
            setProfileLoading(false);
        }
    }, []);

    const fetchAdminData = useCallback(async (forceRefresh = false) => {
        try {
            setLoading(true);
            const now = Date.now();
            const oneHour = 60 * 60 * 1000;
            
            if (!forceRefresh && cache.current.data && 
                cache.current.lastFetch && (now - cache.current.lastFetch < oneHour)) {
                setStats(cache.current.data.stats);
                setRecentActivities(cache.current.data.activities);
                setAppointments(cache.current.data.appointments);
                setConcerns(cache.current.data.concerns);
                setChartData(cache.current.data.chartData);
                setPieData(cache.current.data.pieData);
                setLoading(false);
                return;
            }
            
            const [
                pendingAppointments, 
                pendingConcerns, 
                activeProjects, 
                completedProjects,
                medicalApplications,
                resolvedConcerns, 
                activities, 
                appointmentsData, 
                concernsData, 
                medicalChartData,
                pieData
            ] = await Promise.all([
                fetchCollectionCount("appointments", [["status", "==", "Pending"]]),
                fetchCollectionCount("concerns", [["status", "in", ["Pending", "In Progress"]]]),
                fetchCollectionCount("projects", [["status", "==", "active"]]),
                fetchCollectionCount("projects", [["status", "==", "completed"]]),
                fetchCollectionCount("medicalApplications"),
                fetchCollectionCount("concerns", [["status", "==", "Resolved"]]),
                fetchRecentActivities(),
                fetchAppointments(),
                fetchConcerns(),
                fetchMedicalAppStats(),
                fetchStatusDistribution()
            ]);
            
            cache.current = {
                lastFetch: now,
                data: {
                    stats: { 
                        pendingAppointments, 
                        pendingConcerns, 
                        activeProjects, 
                        medicalApplications,
                        completedProjects,
                        resolvedConcerns 
                    },
                    activities,
                    appointments: appointmentsData,
                    concerns: concernsData,
                    chartData: medicalChartData,
                    pieData
                }
            };
            
            setStats({ 
                pendingAppointments, 
                pendingConcerns, 
                activeProjects, 
                medicalApplications,
                completedProjects,
                resolvedConcerns 
            });
            setRecentActivities(activities);
            setAppointments(appointmentsData);
            setConcerns(concernsData);
            setChartData(medicalChartData);
            setPieData(pieData);
            
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
    }, []);

    const getLast7Days = () => {
        const dates = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dates.push(date);
        }
        return dates;
    };

    const formatDateLabel = (date) => {
        return date.toLocaleDateString('en-US', { 
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTooltipLabel = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    useEffect(() => {
        fetchAdminData();
        fetchAdminProfile();
        
        const db = getFirestore();
        const auth = getAuth();
        const adminId = auth.currentUser?.uid;
        
        if (adminId) {
            setCurrentUid(adminId);
        }
        
        if (!adminId) return;
        
        const unsubscribeMedicalApplications = onSnapshot(
            query(collection(db, "medicalApplications")),
            (snapshot) => {
                setStats(prev => ({ 
                    ...prev, 
                    medicalApplications: snapshot.size 
                }));
                
                // Get last 7 days
                const last7Days = getLast7Days();
                const dailyCounts = new Array(7).fill(0);
                
                // Count applications for each day
                snapshot.docs.forEach(doc => {
                    const appDate = doc.data().createdAt?.toDate();
                    if (!appDate) return;
                    
                    const dayIndex = last7Days.findIndex(date => 
                        date.getDate() === appDate.getDate() &&
                        date.getMonth() === appDate.getMonth() &&
                        date.getFullYear() === appDate.getFullYear()
                    );
                    
                    if (dayIndex !== -1) {
                        dailyCounts[dayIndex]++;
                    }
                });
                
                // Prepare chart data
                setChartData({
                    labels: last7Days.map(formatDateLabel),
                    datasets: [{
                        data: dailyCounts,
                        color: (opacity = 1) => `rgba(0, 51, 102, ${opacity})`,
                        strokeWidth: 2
                    }]
                });
            }
        );
        
        const unsubscribeAppointments = onSnapshot(
            query(
                collection(db, "appointments"),
                where("date", ">=", new Date()),
                orderBy("date", "asc"),
                limit(5)
            ),
            (snapshot) => {
                const appointmentsData = snapshot.docs.map(doc => {
                    const data = doc.data();
                    
                    // Format the createdAt timestamp
                    const formattedDateTime = data.date ? formatAppointmentDateTime(data.date, data.time) : 'N/A';
                    const createdAt = data.createdAt ? formatAppointmentDateTime(data.createdAt, null) : 'N/A';
                    
                    return {
                        id: doc.id,
                        ...data,
                        formattedDateTime,
                        createdAt,
                        type: data.type || 'OTHER',
                        status: data.status || 'Pending',
                        isCourtesy: data.isCourtesy || false,
                        medicalDetails: data.medicalDetails || '',
                        patientName: data.patientName || '',
                        processorName: data.processorName || '',
                        purpose: data.purpose || '',
                        selfieUrl: data.selfieUrl || null,
                        imageUrl: data.imageUrl || null
                    };
                });
                setAppointments(appointmentsData);
                setStats(prev => ({ ...prev, pendingAppointments: snapshot.size }));
            }
        );
        
        const unsubscribeConcerns = onSnapshot(
            query(collection(db, "concerns"), where("status", "in", ["Pending", "In Progress"])),
            (snapshot) => {
                const concernsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    timeAgo: formatTimeAgo(doc.data().createdAt?.toDate()),
                    imageName: doc.data().title || doc.data().location || null,
                    imageUrl: doc.data().imageUrl || null
                }));
                setConcerns(concernsData);
                setStats(prev => ({ ...prev, pendingConcerns: snapshot.size }));
            }
        );
        
        const unsubscribeResolvedConcerns = onSnapshot(
            query(collection(db, "concerns"), where("status", "==", "Resolved")),
            (snapshot) => {
                setStats(prev => ({ ...prev, resolvedConcerns: snapshot.size }));
            }
        );
        
        const unsubscribeProjects = onSnapshot(
            query(collection(db, "projects"), where("status", "==", "active")),
            (snapshot) => {
                setStats(prev => ({ ...prev, activeProjects: snapshot.size }));
            }
        );
        
        const unsubscribeCompletedProjects = onSnapshot(
            query(collection(db, "projects"), where("status", "==", "completed")),
            (snapshot) => {
                setStats(prev => ({ ...prev, completedProjects: snapshot.size }));
            }
        );
        
        const unsubscribeActivities = onSnapshot(
            query(collection(db, "activities"), orderBy("timestamp", "desc"), limit(10)),
            (snapshot) => {
                const activities = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    time: formatTimeAgo(doc.data().timestamp?.toDate())
                }));
                setRecentActivities(activities);
            }
        );
        
        return () => {
            unsubscribeMedicalApplications();
            unsubscribeAppointments();
            unsubscribeConcerns();
            unsubscribeResolvedConcerns();
            unsubscribeProjects();
            unsubscribeCompletedProjects();
            unsubscribeActivities();
        };
    }, [fetchAdminData, fetchAdminProfile, formatAppointmentDateTime]);

    useFocusEffect(
        useCallback(() => {
            if (activeTab === 'profile') {
                fetchAdminProfile();
            }
        }, [activeTab, fetchAdminProfile])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchAdminData(true);
        fetchAdminProfile();
    }, [fetchAdminData, fetchAdminProfile]);

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
            
            <View style={[styles.statsContainer, isLandscape && styles.statsContainerLandscape]}>
                <StatCard 
                    icon="calendar-check" 
                    value={stats.pendingAppointments} 
                    label="Pending Appointments" 
                    color="#FF9800"
                    onPress={() => setActiveTab('appointments')}
                />
                <StatCard 
                    icon="comments" 
                    value={stats.pendingConcerns} 
                    label="Pending Concerns" 
                    color="#F44336"
                    onPress={() => setActiveTab('concerns')}
                />
                <StatCard 
                    icon="project-diagram" 
                    value={stats.activeProjects} 
                    label="Active Projects" 
                    color="#4CAF50"
                    onPress={() => setActiveTab('projects')}
                />
                <StatCard 
                    icon="file-medical" 
                    value={stats.medicalApplications} 
                    label="Medical Apps" 
                    color="#2196F3"
                    onPress={() => setActiveTab('medical')}
                />
            </View>

            <View style={[styles.contentRow, isLandscape && styles.contentRowLandscape]}>
                <View style={[styles.contentColumn, isLandscape && styles.contentColumnLandscape]}>
                    <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
                    {appointments.length > 0 ? (
                        <>
                            {appointments.map(appointment => (
                                <AppointmentItem 
                                    key={appointment.id} 
                                    appointment={appointment}
                                    onPress={() => {
                                        setActiveTab('appointments');
                                        // You can add navigation to specific appointment details here
                                    }}
                                />
                            ))}
                            <TouchableOpacity 
                                style={styles.seeAllButton}
                                onPress={() => setActiveTab('appointments')}
                            >
                                <Text style={styles.seeAllText}>See all appointments →</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <MaterialIcons name="event-busy" size={24} color="#999" />
                            <Text style={styles.emptyText}>No upcoming appointments</Text>
                        </View>
                    )}
                </View>

                <View style={[styles.contentColumn, isLandscape && styles.contentColumnLandscape]}>
                    <Text style={styles.sectionTitle}>Pending Concerns</Text>
                    {concerns.length > 0 ? (
                        <>
                            {concerns.slice(0, 2).map(concern => (
                                <ConcernItem 
                                    key={concern.id} 
                                    concern={concern} 
                                    navigation={navigation}  // Add this line
                                />
                            ))}
                                {concerns.length > 2 && (
                                <TouchableOpacity 
                                    style={styles.seeAllButton}
                                    onPress={() => setActiveTab('concerns')}
                                >
                                    <Text style={styles.seeAllText}>See all concerns →</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <MaterialIcons name="help-outline" size={24} color="#999" />
                            <Text style={styles.emptyText}>No pending concerns</Text>
                        </View>
                    )}
                </View>
            </View>

      
        </ScrollView>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'projects':
                return <ProjectsTab />;
            case 'concerns':
                return <ConcernsTab concerns={concerns} />;
            case 'appointments':
                return <AppointmentsTab appointments={appointments} />;
            case 'updates':
                return <UpdatesTab />;
            case 'medical':
                return <MedicalApplicationTab />;
            case 'profile':
                return <ProfileTab profile={adminProfile} onProfileUpdate={fetchAdminProfile} />;
            case 'stats':
                return <StatsTab 
                    chartData={chartData} 
                    pieData={pieData} 
                    stats={stats} 
                />;
            case 'dashboard':
            default:
                return renderDashboard();
        }
    };

    useEffect(() => {
        const configureBackgroundFetch = async () => {
            try {
                const status = await BackgroundFetch.configure({
                    minimumFetchInterval: 15, // minutes
                    stopOnTerminate: false,
                    startOnBoot: true,
                    enableHeadless: true,
                    requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY,
                }, async (taskId) => {
                    console.log('[BackgroundFetch] Task:', taskId);
                    await fetchAdminData(true);
                    BackgroundFetch.finish(taskId);
                }, (taskId) => {
                    console.warn('[BackgroundFetch] TIMEOUT task:', taskId);
                    BackgroundFetch.finish(taskId);
                });
                
                console.log('[BackgroundFetch] configure status:', status);
            } catch (error) {
                console.error('BackgroundFetch config error:', error);
            }
        };
        
        if (Platform.OS !== 'web') {
            configureBackgroundFetch();
        }
        
        return () => {
            BackgroundFetch.stop();
        };
    }, [fetchAdminData]);

    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', ({ window }) => {
            const { width, height } = window;
            const newIsLandscape = width > height;
            if (newIsLandscape !== isLandscape) {
                setActiveTab(currentTab => currentTab);
            }
        });

        return () => subscription.remove();
    }, [isLandscape]);

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#003366" />
                <Text style={styles.loadingText}>Loading dashboard data...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Header 
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                adminProfile={adminProfile}
            />
            
            {renderContent()}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F7FA",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F5F7FA",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: "#003366",
    },
    scrollContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    statsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    statsContainerLandscape: {
        justifyContent: "flex-start",
    },
    contentRow: {
        flexDirection: "column",
    },
    contentRowLandscape: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    contentColumn: {
        width: "100%",
    },
    contentColumnLandscape: {
        width: "48.5%",
    },
    activityContainer: {
        marginTop: 10,
    },
    activityContainerLandscape: {
        marginTop: 0,
    },
    emptyContainer: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 20,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    emptyText: {
        marginTop: 8,
        fontSize: 14,
        color: "#999",
    },
    seeAllButton: {
        alignSelf: "flex-end",
        paddingVertical: 8,
    },
    seeAllText: {
        fontSize: 14,
        color: "#0275d8",
        fontWeight: "600",
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#003366",
        marginTop: 20,
        marginBottom: 12,
    },
    appointmentItem: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    appointmentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    appointmentType: {
        fontSize: 16,
        fontWeight: '600',
        color: '#003366',
    },
    appointmentStatus: {
        fontSize: 14,
        fontWeight: '500',
    },
    appointmentDateTime: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    appointmentSubmitted: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    appointmentPurpose: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    appointmentDetail: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
});

export default AdminDashboard;