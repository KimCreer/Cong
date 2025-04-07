import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    Image,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
    Linking,
    Modal,
    TextInput,
    Platform,
    Alert,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome5 } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from 'expo-linear-gradient';


// Updated Firebase imports to use modular API
import { getAuth } from "@react-native-firebase/auth";
import { 
    getFirestore, 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    addDoc, 
    query, 
    where, 
    orderBy, 
    limit,
    updateDoc  // Add this import
} from "@react-native-firebase/firestore";

// Import screens
import LawsScreen from "./screens/LawsScreen";
import ProjectsScreen from "./screens/ProjectsScreen";
import ConcernsScreen from "./screens/ConcernsScreen";
import UpdatesScreen from "./screens/UpdatesScreen";
import InfoScreen from "./screens/InfoScreen";
import ProfileScreen from "./screens/ProfileScreen";
import AppointmentsScreen from "./screens/AppointmentsScreen";
import HelpScreen from "./screens/HelpScreen";



// Constants
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const { width } = Dimensions.get('window');
const PLACEHOLDER_IMAGE = "https://via.placeholder.com/50";


// Service menu items with appointment added
const SERVICE_ITEMS = [
    { name: "Laws", icon: "balance-scale", color: "#0275d8", screen: "Laws" },
    { name: "Projects", icon: "tasks", color: "#0275d8", screen: "Projects" },
    { name: "Concerns", icon: "comments", color: "#0275d8", screen: "Concerns" },
    { name: "Sched", icon: "calendar-check", color: "#0275d8", screen: "Appointments" },
    { name: "Updates", icon: "newspaper", color: "#0275d8", screen: "Updates" },
    { name: "Info", icon: "info-circle", color: "#0275d8", screen: "Info" },
];

// Office address information with street view
const OFFICE_ADDRESS = {
    floor: "3rd Floor",
    location: "Alabang Public Market",
    street: "123 Muntinlupa Boulevard",
    barangay: "Barangay Alabang",
    city: "Muntinlupa City",
    zip: "1780",
    phone: "(02) 8123-4567",
    email: "office@fresnedi.gov.ph",
    hours: "Monday to Friday: 8:00 AM - 5:00 PM",
    streetViewUrl: "https://www.google.com/maps/@14.4192184,121.0444493,3a,60y,90t/data=!3m7!1e1!3m5!1sCQKQAcAQbMIIAjycGSWzcw!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D0%26panoid%3DCQKQAcAQbMIIAjycGSWzcw%26yaw%3D0!7i16384!8i8192?entry=ttu",
    streetViewImage: "https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=CQKQAcAQbMIIAjycGSWzcw&cb_client=search.revgeo_and_fetch.gps&w=600&h=200&yaw=0&pitch=0",
};


const GradientTabBar = ({ children }) => (
    <LinearGradient
      colors={['#003366', '#0275d8']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.tabBarBackground}
    >
      {children}
    </LinearGradient>
  );



// Available appointment types
const APPOINTMENT_TYPES = [
    { id: 1, name: "Constituent Assistance", icon: "hands-helping", description: "General consultation and assistance" },
    { id: 2, name: "Document Processing", icon: "file-alt", description: "Processing of official documents and permits" },
    { id: 3, name: "Community Concerns", icon: "users", description: "Discuss issues affecting your community" },
    { id: 4, name: "Project Proposal", icon: "project-diagram", description: "Present community project ideas" },
];

// Available appointment time slots
const TIME_SLOTS = [
    "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", 
    "11:00 AM", "11:30 AM", "1:00 PM", "1:30 PM", 
    "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM"
];

// Component for Service Card
const ServiceCard = ({ item, onPress }) => (
    <TouchableOpacity
        style={styles.serviceCard}
        onPress={onPress}
    >
        <FontAwesome5 name={item.icon} size={30} color={item.color} />
        <Text style={styles.serviceTitle}>{item.name}</Text>
    </TouchableOpacity>
);

// Component for News Card
const NewsCard = ({ item, onPress }) => (
    <TouchableOpacity 
        style={styles.newsCard}
        onPress={onPress}
    >
        <Image
            source={{ uri: item.image }}
            style={styles.newsImage}
        />
        <View style={styles.newsContent}>
            <View style={styles.newsTitleContainer}>
                <Text style={styles.newsTitle}>{item.title}</Text>
                {!item.read && <View style={styles.unreadIndicator} />}
            </View>
            <Text style={styles.newsDesc}>{item.description}</Text>
            <Text style={styles.newsDate}>{item.date}</Text>
        </View>
    </TouchableOpacity>
);

// Component for Address Card with Street View
const AddressCard = ({ address }) => {
    const openMaps = () => {
        const formattedAddress = `${address.street}, ${address.barangay}, ${address.city}`;
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formattedAddress)}`;
        Linking.openURL(url);
    };

    const openStreetView = () => {
        Linking.openURL(address.streetViewUrl);
    };

    return (
        <View style={styles.addressCard}>
            <View style={styles.addressHeader}>
                <FontAwesome5 name="building" size={24} color="#003580" />
                <Text style={styles.addressTitle}>Muntinlupa District Office</Text>
            </View>
            
            {/* Street View Image */}
            <TouchableOpacity onPress={openStreetView}>
                <Image 
                    source={{ uri: address.streetViewImage }} 
                    style={styles.streetViewImage}
                    resizeMode="cover"
                />
                <View style={styles.streetViewOverlay}>
                    <FontAwesome5 name="street-view" size={24} color="#FFFFFF" />
                    <Text style={styles.streetViewText}>View on Street View</Text>
                </View>
            </TouchableOpacity>
            
            <View style={styles.addressContent}>
                <AddressRow 
                    icon="building" 
                    text={`${address.floor}, ${address.location}`} 
                    highlight={true}
                />
                <AddressRow 
                    icon="map-marker-alt" 
                    text={`${address.street}, ${address.barangay}, ${address.city}, ${address.zip}`} 
                />
                <AddressRow icon="phone-alt" text={address.phone} />
                <AddressRow icon="envelope" text={address.email} />
                <AddressRow icon="clock" text={address.hours} />
            </View>
            
            <TouchableOpacity 
                style={styles.directionsButton}
                onPress={openMaps}
            >
                <FontAwesome5 name="directions" size={16} color="#FFFFFF" />
                <Text style={styles.directionsText}>Get Directions</Text>
            </TouchableOpacity>
        </View>
    );
};

// Component for Address Row with optional highlight
const AddressRow = ({ icon, text, highlight = false }) => (
    <View style={styles.addressRow}>
        <FontAwesome5 name={icon} size={16} color="#003580" style={styles.addressIcon} />
        <Text style={[styles.addressText, highlight && styles.addressTextHighlight]}>{text}</Text>
    </View>
);

// Component for Quick Appointment Card
const QuickAppointmentCard = ({ onPress }) => (
    <TouchableOpacity 
        style={styles.quickAppointmentCard}
        onPress={onPress}
    >
        <View style={styles.quickAppointmentHeader}>
            <FontAwesome5 name="calendar-alt" size={24} color="#003580" />
            <Text style={styles.quickAppointmentTitle}>Book an Appointment</Text>
        </View>
        
        <Text style={styles.quickAppointmentDesc}>
            Need assistance? Schedule a meeting with our district staff or request a virtual consultation with Congressman Fresnedi.
        </Text>
        
        <View style={styles.appointmentButtonContainer}>
            <TouchableOpacity style={styles.appointmentButton} onPress={onPress}>
                <FontAwesome5 name="calendar-plus" size={16} color="#FFFFFF" />
                <Text style={styles.appointmentButtonText}>Book Now</Text>
            </TouchableOpacity>
        </View>
    </TouchableOpacity>
);

// Component for Upcoming Appointment
const UpcomingAppointmentCard = ({ appointment, onViewDetails }) => (
    <TouchableOpacity 
        style={styles.upcomingAppointmentCard}
        onPress={onViewDetails}
    >
        <View style={styles.upcomingAppointmentHeader}>
            <View style={styles.upcomingAppointmentDate}>
                <Text style={styles.upcomingAppointmentDay}>
                    {new Date(appointment.date).getDate()}
                </Text>
                <Text style={styles.upcomingAppointmentMonth}>
                    {new Date(appointment.date).toLocaleString('default', { month: 'short' })}
                </Text>
            </View>
            
            <View style={styles.upcomingAppointmentInfo}>
                <Text style={styles.upcomingAppointmentType}>
                    {appointment.type}
                </Text>
                <Text style={styles.upcomingAppointmentTime}>
                    <FontAwesome5 name="clock" size={12} color="#003580" style={styles.upcomingAppointmentIcon} />
                    {appointment.time}
                </Text>
            </View>
            
            <View style={styles.upcomingAppointmentStatus}>
                <Text style={[
                    styles.upcomingAppointmentStatusText, 
                    { color: appointment.status === 'Confirmed' ? '#4CAF50' : '#FF9800' }
                ]}>
                    {appointment.status}
                </Text>
            </View>
        </View>
        
        <View style={styles.upcomingAppointmentFooter}>
            <FontAwesome5 name="info-circle" size={14} color="#003580" />
            <Text style={styles.upcomingAppointmentDetailsText}>View Details</Text>
        </View>
    </TouchableOpacity>
);

// Component for AppointmentForm Modal
const AppointmentForm = ({ visible, onClose, onSubmit }) => {
    const [appointmentType, setAppointmentType] = useState(null);
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
    const [purpose, setPurpose] = useState('');
    const [isVirtual, setIsVirtual] = useState(false);
    
    const handleDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || date;
        setShowDatePicker(Platform.OS === 'ios');
        setDate(currentDate);
    };
    
    const handleSubmit = () => {
        if (!appointmentType || !selectedTimeSlot || purpose.trim() === '') {
            Alert.alert('Missing Information', 'Please fill in all required fields.');
            return;
        }
        
        const appointmentData = {
            type: APPOINTMENT_TYPES.find(type => type.id === appointmentType)?.name,
            date: date.toISOString(),
            time: selectedTimeSlot,
            purpose: purpose,
            isVirtual: isVirtual,
            status: 'Pending',
            createdAt: new Date().toISOString(),
        };
        
        onSubmit(appointmentData);
    };
    
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Schedule an Appointment</Text>
                        <TouchableOpacity onPress={onClose}>
                            <FontAwesome5 name="times" size={20} color="#003580" />
                        </TouchableOpacity>
                    </View>
                    
                    <ScrollView style={styles.formContainer}>
                        <Text style={styles.formLabel}>Appointment Type</Text>
                        <View style={styles.appointmentTypeContainer}>
                            {APPOINTMENT_TYPES.map(type => (
                                <TouchableOpacity
                                    key={type.id}
                                    style={[
                                        styles.appointmentTypeButton,
                                        appointmentType === type.id && styles.appointmentTypeButtonActive
                                    ]}
                                    onPress={() => setAppointmentType(type.id)}
                                >
                                    <FontAwesome5
                                        name={type.icon}
                                        size={18}
                                        color={appointmentType === type.id ? "#FFFFFF" : "#003580"}
                                    />
                                    <Text
                                        style={[
                                            styles.appointmentTypeText,
                                            appointmentType === type.id && styles.appointmentTypeTextActive
                                        ]}
                                    >
                                        {type.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        
                        <Text style={styles.formLabel}>Select Date</Text>
                        <TouchableOpacity
                            style={styles.datePickerButton}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <FontAwesome5 name="calendar-alt" size={16} color="#003580" />
                            <Text style={styles.datePickerButtonText}>
                                {date.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                            </Text>
                        </TouchableOpacity>
                        
                        {showDatePicker && (
                            <DateTimePicker
                                value={date}
                                mode="date"
                                display="default"
                                onChange={handleDateChange}
                                minimumDate={new Date()}
                                maximumDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
                            />
                        )}
                        
                        <Text style={styles.formLabel}>Select Time</Text>
                        <View style={styles.timeSlotContainer}>
                            {TIME_SLOTS.map((time, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.timeSlotButton,
                                        selectedTimeSlot === time && styles.timeSlotButtonActive
                                    ]}
                                    onPress={() => setSelectedTimeSlot(time)}
                                >
                                    <Text
                                        style={[
                                            styles.timeSlotText,
                                            selectedTimeSlot === time && styles.timeSlotTextActive
                                        ]}
                                    >
                                        {time}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        
                        <Text style={styles.formLabel}>Purpose of Visit</Text>
                        <TextInput
                            style={styles.purposeInput}
                            placeholder="Briefly describe the purpose of your appointment"
                            value={purpose}
                            onChangeText={setPurpose}
                            multiline={true}
                            numberOfLines={4}
                        />
                        
                        <View style={styles.virtualOptionContainer}>
                            <TouchableOpacity
                                style={styles.virtualCheckbox}
                                onPress={() => setIsVirtual(!isVirtual)}
                            >
                                <View style={[
                                    styles.checkbox,
                                    isVirtual && styles.checkboxChecked
                                ]}>
                                    {isVirtual && <FontAwesome5 name="check" size={10} color="#FFFFFF" />}
                                </View>
                                <Text style={styles.virtualOptionText}>Request Virtual Meeting</Text>
                            </TouchableOpacity>
                        </View>
                        
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleSubmit}
                        >
                            <Text style={styles.submitButtonText}>Schedule Appointment</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

function HomeScreen() {
    const navigation = useNavigation();
    const [userData, setUserData] = useState({
        firstName: "User Name",
        profileImage: PLACEHOLDER_IMAGE,
    });
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [appointmentModalVisible, setAppointmentModalVisible] = useState(false);
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [newsItems, setNewsItems] = useState([]);

    const fetchUserData = useCallback(async () => {
        setLoading(true);
        const auth = getAuth();
        const currentUser = auth.currentUser;
        const db = getFirestore();

        if (currentUser) {
            try {
                // Updated query for user data
                const userDocRef = doc(db, "users", currentUser.uid);
                const userDocSnapshot = await getDoc(userDocRef);
                
                if (userDocSnapshot.exists) {
                    const userInfo = userDocSnapshot.data();
                    setUserData({
                        firstName: userInfo.firstName || "User Name",
                        profileImage: userInfo.profilePicture?.trim() ? userInfo.profilePicture : PLACEHOLDER_IMAGE,
                    });
                }
                
                // Updated query for upcoming appointments
                const appointmentsQuery = query(
                    collection(db, "appointments"),
                    where("userId", "==", currentUser.uid),
                    where("date", ">=", new Date().toISOString()),
                    orderBy("date", "asc"),
                    limit(2)
                );
                
                const appointmentsSnapshot = await getDocs(appointmentsQuery);
                
                const appointments = [];
                appointmentsSnapshot.forEach(doc => {
                    appointments.push({ id: doc.id, ...doc.data() });
                });
                
                setUpcomingAppointments(appointments);

                // Fetch updates from Firestore
                const updatesQuery = query(
                    collection(db, "updates"),
                    orderBy("timestamp", "desc"),
                    limit(5)
                );
                
                const updatesSnapshot = await getDocs(updatesQuery);
                
                const updates = [];
                updatesSnapshot.forEach(doc => {
                    const data = doc.data();
                    updates.push({
                        id: doc.id,
                        title: data.title,
                        description: data.description,
                        date: new Date(data.timestamp).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        }),
                        image: data.image || "https://via.placeholder.com/300x150",
                        read: data.read || false
                    });
                });
                
                setNewsItems(updates);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        }

        setLoading(false);
        setRefreshing(false);
    }, []);

    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchUserData();
    }, [fetchUserData]);

    const handleImageError = () => {
        setUserData(prev => ({
            ...prev,
            profileImage: PLACEHOLDER_IMAGE,
        }));
    };

    const navigateToScreen = (screen) => {
        navigation.navigate(screen);
    };
    
    const handleSubmitAppointment = async (appointmentData) => {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        const db = getFirestore();
        
        if (currentUser) {
            try {
                setLoading(true);
                
                // Updated query to add appointment to Firestore
                await addDoc(collection(db, "appointments"), {
                    ...appointmentData,
                    userId: currentUser.uid,
                });
                
                setAppointmentModalVisible(false);
                Alert.alert(
                    'Appointment Scheduled',
                    'Your appointment has been scheduled. You will receive a confirmation shortly.',
                    [{ text: 'OK' }]
                );
                
                // Refresh data to show new appointment
                fetchUserData();
            } catch (error) {
                console.error("Error scheduling appointment:", error);
                Alert.alert('Error', 'Failed to schedule appointment. Please try again later.');
            } finally {
                setLoading(false);
            }
        }
    };

    const renderHeader = () => {
    
        return (
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    {loading ? (
                        <ActivityIndicator size="small" color="#FFD700" />
                    ) : (
                        <Image
                            source={{ uri: userData.profileImage }}
                            style={styles.profileImage}
                            onError={handleImageError}
                        />
                    )}
                    <View>
                        <Text style={styles.headerSubtitle}>Welcome Back!</Text>
                        <Text style={styles.headerTitle}>{userData.firstName}</Text>
                    </View>
                    <TouchableOpacity 
                        style={styles.helpButton}
                        onPress={() => navigation.navigate('Help')}  // Add navigation
                    >
                        <Text style={styles.helpText}>HELP</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderServiceGrid = () => (
        <View style={styles.serviceGrid}>
            {SERVICE_ITEMS.map((item, index) => (
                <ServiceCard 
                    key={index} 
                    item={item} 
                    onPress={() => navigateToScreen(item.screen)} 
                />
            ))}
        </View>
    );

    const renderAppointmentSection = () => (
        <>
            <Text style={styles.sectionTitle}>Appointments</Text>
            <QuickAppointmentCard onPress={() => setAppointmentModalVisible(true)} />
            
            {upcomingAppointments.length > 0 ? (
                <View style={styles.upcomingAppointmentsContainer}>
                    <Text style={styles.upcomingAppointmentsTitle}>Upcoming Appointments</Text>
                    {upcomingAppointments.map(appointment => (
                        <UpcomingAppointmentCard
                            key={appointment.id}
                            appointment={appointment}
                            onViewDetails={() => navigateToScreen("Appointments")}
                        />
                    ))}
                </View>
            ) : null}
        </>
    );

    const renderNewsSection = () => (
        <>
            <Text style={styles.sectionTitle}>Latest Updates</Text>
            {newsItems.length > 0 ? (
                newsItems.map(item => (
                    <NewsCard 
                        key={item.id} 
                        item={item} 
                        onPress={() => {
                            // Mark the update as read in Firestore
                            if (!item.read) {
                                markUpdateAsRead(item.id);
                            }
                            navigation.navigate("Updates", { updateId: item.id });
                        }} 
                    />
                ))
            ) : (
                <View style={styles.noUpdatesContainer}>
                    <FontAwesome5 name="newspaper" size={30} color="#cccccc" />
                    <Text style={styles.noUpdatesText}>No updates available</Text>
                </View>
            )}
            
            <TouchableOpacity
                style={styles.viewAllUpdatesButton}
                onPress={() => navigateToScreen("Updates")}
            >
                <Text style={styles.viewAllUpdatesText}>View All Updates</Text>
                <FontAwesome5 name="arrow-right" size={14} color="#003580" />
            </TouchableOpacity>
        </>
    );

    // Function to mark an update as read
    const markUpdateAsRead = async (updateId) => {
        try {
            const db = getFirestore();
            const updateRef = doc(db, "updates", updateId);
            await updateDoc(updateRef, {
                read: true
            });
            
            // Update local state
            setNewsItems(prev => 
                prev.map(item => 
                    item.id === updateId ? { ...item, read: true } : item
                )
            );
        } catch (error) {
            console.error("Error marking update as read:", error);
        }
    };

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.safeContainer}>
                {renderHeader()}
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#003580" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeContainer}>
            {renderHeader()}
            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={["#003580", "#FFD700"]}
                        tintColor="#003580"
                    />
                }
            >
                {renderServiceGrid()}
                {renderAppointmentSection()}
                <Text style={styles.sectionTitle}>District Office Location</Text>
                <AddressCard address={OFFICE_ADDRESS} />
                {renderNewsSection()}
            </ScrollView>
            
            <AppointmentForm
                visible={appointmentModalVisible}
                onClose={() => setAppointmentModalVisible(false)}
                onSubmit={handleSubmitAppointment}
            />
        </SafeAreaView>
    );
}

function HomeStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="HomeMain" component={HomeScreen} />
            <Stack.Screen name="Laws" component={LawsScreen} />
            <Stack.Screen name="Projects" component={ProjectsScreen} />
            <Stack.Screen name="Concerns" component={ConcernsScreen} />
            <Stack.Screen name="Updates" component={UpdatesScreen} />
            <Stack.Screen name="Info" component={InfoScreen} />
            <Stack.Screen name="Appointments" component={AppointmentsScreen} />
        </Stack.Navigator>
    );
}

export default function Dashboard() {
    return (
        <Tab.Navigator
  screenOptions={{
    headerShown: false,
    tabBarStyle: styles.tabBar,
    tabBarActiveTintColor: "#FFD700",
    tabBarInactiveTintColor: "rgba(255,255,255,0.7)",
    tabBarShowLabel: true,
    tabBarBackground: () => <GradientTabBar />, // This is the key change
  }}
>
  <Tab.Screen
    name="Home"
    component={HomeStack}
    options={{
      tabBarIcon: ({ color, size }) => (
        <FontAwesome5 name="home" size={size} color={color} />
      ),
    }}
  />
  <Tab.Screen
    name="Concerns"
    component={ConcernsScreen}
    options={{
      tabBarIcon: ({ color, size }) => (
        <FontAwesome5 name="comments" size={size} color={color} />
      ),
    }}
  />
  <Tab.Screen
    name="Appointments"
    component={AppointmentsScreen}
    options={{
      tabBarIcon: ({ color, size }) => (
        <FontAwesome5 name="calendar-check" size={size} color={color} />
      ),
    }}
  />
  <Tab.Screen
    name="Profile"
    component={ProfileScreen}
    options={{
      tabBarIcon: ({ color, size }) => (
        <FontAwesome5 name="user" size={size} color={color} />
      ),
    }}
  />
</Tab.Navigator>

    );
}


// Extended styles with appointment-related styles
const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        backgroundColor: "#F5F7FA",
    },

    /** HEADER **/
    header: {
        backgroundColor: "#003580",
        paddingVertical: 22,
        paddingHorizontal: 25,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        elevation: 5,
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
    },
    headerTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    profileImage: {
        width: 55,
        height: 55,
        borderRadius: 28,
        borderWidth: 2.5,
        borderColor: "#FFD700",
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#FFFFFF",
    },
    headerSubtitle: {
        fontSize: 14,
        color: "#FFD700",
        fontWeight: "600",
    },
    helpButton: {
        backgroundColor: "#FFD700",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        elevation: 3,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 2 },
    },
    helpText: {
        fontWeight: "bold",
        color: "#003580",
        fontSize: 14,
    },

    /** MAIN CONTENT **/
    scrollContainer: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        paddingBottom: 25,
    },

    /** SERVICE GRID **/
    serviceGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    serviceCard: {
        width: "31%", // Adjusted for 6 items (3 per row)
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        paddingVertical: 20,
        marginTop: 12,
        borderRadius: 18,
        elevation: 4,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
    },
    serviceTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#003580",
        marginTop: 10,
    },

    /** SECTION TITLE **/
    sectionTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginVertical: 16,
        color: "#333",
    },

    /** QUICK APPOINTMENT CARD **/
    quickAppointmentCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        elevation: 4,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
    },
    quickAppointmentHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    quickAppointmentTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#003580",
        marginLeft: 10,
    },
    quickAppointmentDesc: {
        fontSize: 14,
        color: "#606060",
        lineHeight: 20,
        marginBottom: 15,
    },
    appointmentButtonContainer: {
        alignItems: "center",
    },
    appointmentButton: {
        backgroundColor: "#003580",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        elevation: 3,
    },
    appointmentButtonText: {
        color: "#FFFFFF",
        fontWeight: "bold",
        marginLeft: 8,
        fontSize: 14,
    },

    /** UPCOMING APPOINTMENTS **/
    upcomingAppointmentsContainer: {
        marginTop: 10,
        marginBottom: 16,
    },
    upcomingAppointmentsTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 10,
    },
    upcomingAppointmentCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 15,
        padding: 15,
        marginBottom: 12,
        elevation: 3,
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
    },
    upcomingAppointmentHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    upcomingAppointmentDate: {
        alignItems: "center",
        justifyContent: "center",
        width: 40,
        height: 40,
        backgroundColor: "#003580",
        borderRadius: 10,
    },
    upcomingAppointmentDay: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "bold",
    },
    upcomingAppointmentMonth: {
        color: "#FFD700",
        fontSize: 12,
        fontWeight: "600",
    },
    upcomingAppointmentInfo: {
        flex: 1,
        paddingHorizontal: 12,
    },
    upcomingAppointmentType: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 4,
    },
    upcomingAppointmentTime: {
        fontSize: 14,
        color: "#666",
        flexDirection: "row",
        alignItems: "center",
    },
    upcomingAppointmentIcon: {
        marginRight: 5,
    },
    upcomingAppointmentStatus: {
        alignItems: "flex-end",
    },
    upcomingAppointmentStatusText: {
        fontSize: 14,
        fontWeight: "bold",
    },
    upcomingAppointmentFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: "#EEEEEE",
    },
    upcomingAppointmentDetailsText: {
        color: "#003580",
        fontWeight: "600",
        fontSize: 14,
        marginLeft: 5,
    },

    /** ADDRESS CARD **/
    addressCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        elevation: 4,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
    },
    addressHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 15,
    },
    addressTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#003580",
        marginLeft: 10,
    },
    streetViewImage: {
        width: "100%",
        height: 120,
        borderRadius: 10,
        marginBottom: 15,
    },
    streetViewOverlay: {
        position: "absolute",
        bottom: 25,
        right: 10,
        backgroundColor: "rgba(0, 53, 128, 0.7)",
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 15,
    },
    streetViewText: {
        color: "#FFFFFF",
        fontSize: 12,
        marginLeft: 5,
        fontWeight: "600",
    },
    addressContent: {
        marginBottom: 15,
    },
    addressRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    addressIcon: {
        width: 20,
        marginRight: 10,
    },
    addressText: {
        fontSize: 14,
        color: "#606060",
        flex: 1,
    },
    addressTextHighlight: {
        color: "#000000",
        fontWeight: "bold",
    },
    directionsButton: {
        backgroundColor: "#003580",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        alignSelf: "center",
        elevation: 3,
    },
    directionsText: {
        color: "#FFFFFF",
        fontWeight: "bold",
        marginLeft: 8,
        fontSize: 14,
    },

    /** NEWS CARD **/
    newsCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        overflow: "hidden",
        marginBottom: 16,
        elevation: 4,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
    },
    newsImage: {
        width: "100%",
        height: 150,
    },
    newsContent: {
        padding: 15,
    },
    newsTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 8,
    },
    newsDesc: {
        fontSize: 14,
        color: "#606060",
        lineHeight: 20,
        marginBottom: 10,
    },
    newsDate: {
        fontSize: 12,
        color: "#888",
        fontWeight: "600",
    },

    /** LOADING & ERROR STATES **/
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    /** APPOINTMENT FORM MODAL **/
    modalContainer: {
        flex: 2,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        paddingBottom: 20,
        maxHeight: "95%",
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#EEEEEE",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#003580",
    },
    formContainer: {
        padding: 20,
    },
    formLabel: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 10,
        marginTop: 15,
    },
    appointmentTypeContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    appointmentTypeButton: {
        width: "48%",
        backgroundColor: "#F0F0F0",
        borderRadius: 12,
        paddingVertical: 15,
        paddingHorizontal: 10,
        marginBottom: 10,
        alignItems: "center",
        flexDirection: "row",
    },
    appointmentTypeButtonActive: {
        backgroundColor: "#003580",
    },
    appointmentTypeText: {
        fontSize: 14,
        color: "#333",
        marginLeft: 10,
        fontWeight: "600",
        flex: 1,
    },
    appointmentTypeTextActive: {
        color: "#FFFFFF",
    },
    datePickerButton: {
        backgroundColor: "#F0F0F0",
        borderRadius: 12,
        paddingVertical: 15,
        paddingHorizontal: 15,
        flexDirection: "row",
        alignItems: "center",
    },
    datePickerButtonText: {
        fontSize: 14,
        color: "#333",
        marginLeft: 10,
    },
    timeSlotContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    timeSlotButton: {
        width: "31%",
        backgroundColor: "#F0F0F0",
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 5,
        marginBottom: 10,
        alignItems: "center",
    },
    timeSlotButtonActive: {
        backgroundColor: "#003580",
    },
    timeSlotText: {
        fontSize: 14,
        color: "#333",
        fontWeight: "500",
    },
    timeSlotTextActive: {
        color: "#FFFFFF",
    },
    purposeInput: {
        backgroundColor: "#F0F0F0",
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 15,
        fontSize: 14,
        color: "#333",
        textAlignVertical: "top",
        minHeight: 100,
    },
    virtualOptionContainer: {
        marginTop: 15,
        marginBottom: 15,
    },
    virtualCheckbox: {
        flexDirection: "row",
        alignItems: "center",
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: "#003580",
        marginRight: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    checkboxChecked: {
        backgroundColor: "#003580",
    },
    virtualOptionText: {
        fontSize: 14,
        color: "#333",
    },
    submitButton: {
        backgroundColor: "#003580",
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: "center",
        marginTop: 10,
        paddingBottom:30,
    },
    submitButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "bold",
    },

    /** Tab Bar **/
    tabBar: {
        backgroundColor: "#003580",
        borderTopWidth: 0,
        elevation: 8,
        height: 60,
        paddingBottom: 5,
    },
    noUpdatesContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        marginBottom: 15,
    },
    noUpdatesText: {
        marginTop: 10,
        color: '#666666',
        fontSize: 16,
    },
    viewAllUpdatesButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        marginTop: 5,
        marginBottom: 20,
    },
    viewAllUpdatesText: {
        color: '#003580',
        fontWeight: '600',
        marginRight: 8,
    },
    newsTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    unreadIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF9800',
        marginLeft: 8,
    },

tabBar: {
    borderTopWidth: 0,
    elevation: 0,
    backgroundColor: 'transparent',
    height:60, // Recommended height for better touch targets
  },
  tabBarBackground: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  }, 
});