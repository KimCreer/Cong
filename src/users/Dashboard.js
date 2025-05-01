// dashboard.js
import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Alert,
  Modal,
  Pressable
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { getAuth } from "@react-native-firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  updateDoc,
  Timestamp 
} from "@react-native-firebase/firestore";
import { format, parseISO, isToday, isTomorrow } from 'date-fns';

// Import components
import ServiceCard from './dashcomps/ServiceCard';
import NewsCard from './dashcomps/NewsCard';
import AddressCard from './dashcomps/AddressCard';
import AppointmentCard from './dashcomps/AppointmentCard';
import MedicalFinancialSection from './dashcomps/MedicalFinancialSection';

// data imports
import { HOSPITALS } from "./data/hospitals";
import { OFFICE_ADDRESS } from "./data/officeAddress";

// Import screens
import LawsScreen from "./screens/LawsScreen";
import ProjectsScreen from "./screens/ProjectsScreen";
import ConcernsScreen from "./screens/ConcernsScreen";
import InfoScreen from "./screens/InfoScreen";
import ProfileScreen from "./screens/ProfileScreen";
import AppointmentsScreen from "./screens/AppointmentsScreen";
import HelpScreen from "./screens/HelpScreen";
import AssistanceScreen from "./screens/AssistanceScreen";
import PostScreen from "./screens/PostScreen";

// Language translations with consistent styling
const translations = {
  en: {
    welcome: "Welcome Back!",
    noAppointments: "No upcoming appointments",
    scheduleNow: "Schedule Now",
    latestPosts: "Latest Posts",
    noPosts: "No posts available",
    viewAllPosts: "View All Posts",
    upcomingAppointments: "Upcoming Appointments",
    viewAll: "View All",
    districtOffice: "District Office Location",
    help: "HELP",
    selectLanguage: "Select Language",
    close: "Close",
    services: {
      Laws: "Acts",
      Projects: "Projects",
      Concerns: "Concerns",
      Sched: "Bookings",
      Newsfeed: "Newsfeed",
      Info: "Information"
    }
  },
  tl: {
    welcome: "Maligayang Pagbabalik!",
    noAppointments: "Walang nakatakdang appointment",
    scheduleNow: "Mag-schedule Ngayon",
    latestPosts: "Pinakabagong Mga Post",
    noPosts: "Walang available na post",
    viewAllPosts: "Tingnan Lahat ng Post",
    upcomingAppointments: "Mga Darating na Appointment",
    viewAll: "Tingnan Lahat",
    districtOffice: "Lokasyon ng District Office",
    help: "TULONG",
    selectLanguage: "Pumili ng Wika",
    close: "Isara",
    services: {
      Laws: "Mga Batas",
      Projects: "Mga Proyekto",
      Concerns: "Mga Alalahanin",
      Sched: "Iskedyul",
      Newsfeed: "Balita",
      Info: "Impormasyon"
    }
  }
};

// Constants
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const { width, height } = Dimensions.get('window');
const PLACEHOLDER_IMAGE = "https://via.placeholder.com/50";

// Responsive font sizes
const fontSize = {
  xxxl: width < 400 ? 26 : 28,
  xxl: width < 400 ? 22 : 24,
  xl: width < 400 ? 18 : 20,
  lg: width < 400 ? 16 : 18,
  md: width < 400 ? 14 : 16,
  sm: width < 400 ? 12 : 14,
  xs: width < 400 ? 10 : 12,
};

// Service menu items - will be populated based on language
const getServiceItems = (language) => [
  { name: translations[language].services.Laws, icon: "balance-scale", color: "#0275d8", screen: "Laws" },
  { name: translations[language].services.Projects, icon: "tasks", color: "#0275d8", screen: "Projects" },
  { name: translations[language].services.Concerns, icon: "comments", color: "#0275d8", screen: "Concerns" },
  { name: translations[language].services.Sched, icon: "calendar-check", color: "#0275d8", screen: "Appointments" },
  { name: translations[language].services.Newsfeed, icon: "newspaper", color: "#0275d8", screen: "Post" },
  { name: translations[language].services.Info, icon: "info-circle", color: "#0275d8", screen: "Info" },
];

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

function HomeScreen() {
  const navigation = useNavigation();
  const [language, setLanguage] = useState('en');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [userData, setUserData] = useState({
    firstName: "User Name",
    profileImage: PLACEHOLDER_IMAGE,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [newsItems, setNewsItems] = useState([]);
  const [error, setError] = useState(null);

  const t = translations[language];
  const SERVICE_ITEMS = getServiceItems(language);


  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const auth = getAuth();
      const currentUser = auth.currentUser;
      const db = getFirestore();
  
      if (!currentUser) {
        throw new Error("No authenticated user found");
      }
  
      // Fetch user profile
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDocSnapshot = await getDoc(userDocRef);
      
      if (userDocSnapshot.exists) {
        const userInfo = userDocSnapshot.data();
        setUserData({
          firstName: userInfo.firstName || "User Name",
          profileImage: userInfo.profilePicture?.trim() ? userInfo.profilePicture : PLACEHOLDER_IMAGE,
        });
      }
  
      // Fetch appointments
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfTodayTimestamp = Timestamp.fromDate(startOfToday);
      
      const appointmentsQuery = query(
        collection(db, "appointments"),
        where("userId", "==", currentUser.uid),
        where("date", ">=", startOfTodayTimestamp),
        where("status", "in", ["Pending", "Confirmed"]),
        orderBy("date", "asc"),
        limit(5)
      );
      
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      let appointments = appointmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
        status: doc.data().status?.trim() || 'Pending'
      }));
  
      appointments.sort((a, b) => {
        if (a.status === 'Confirmed' && b.status !== 'Confirmed') return -1;
        if (a.status !== 'Confirmed' && b.status === 'Confirmed') return 1;
        return a.date - b.date;
      });
  
      setUpcomingAppointments(appointments);
  
      // Fetch news posts
      const postsQuery = query(
        collection(db, "posts"),
        orderBy("createdAt", "desc"),
        limit(5)
      );
      
      const postsSnapshot = await getDocs(postsQuery);
      const posts = postsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        read: doc.data().read || false
      }));
      setNewsItems(posts);
  
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
      Alert.alert("Error", "Failed to load data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserData();
  }, [fetchUserData]);

  const handleImageError = useCallback(() => {
    setUserData(prev => ({
      ...prev,
      profileImage: PLACEHOLDER_IMAGE,
    }));
  }, []);

  const navigateToScreen = useCallback((screen) => {
    navigation.navigate(screen);
  }, [navigation]);

  const markPostAsRead = useCallback(async (postId) => {
    try {
      const db = getFirestore();
      await updateDoc(doc(db, "posts", postId), {
        read: true
      });
      setNewsItems(prev => prev.map(item => 
        item.id === postId ? {...item, read: true} : item
      ));
    } catch (err) {
      console.error("Error marking post as read:", err);
    }
  }, []);

  const changeLanguage = (lang) => {
    setLanguage(lang);
    setShowLanguageModal(false);
  };

  const renderHeader = useMemo(() => (
    <LinearGradient
      colors={['#003366', '#0275d8']}
      style={styles.header}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      <View style={styles.headerTop}>
        {loading ? (
          <ActivityIndicator size="small" color="#FFD700" />
        ) : (
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Image
              source={{ uri: userData.profileImage }}
              style={styles.profileImage}
              onError={handleImageError}
            />
          </TouchableOpacity>
        )}
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerSubtitle}>{t.welcome}</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {userData.firstName}
          </Text>
        </View>
        <View style={styles.headerButtonsContainer}>
          <TouchableOpacity 
            style={styles.languageButton}
            onPress={() => setShowLanguageModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.languageText}>{language === 'en' ? 'EN' : 'TL'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.helpButton}
            onPress={() => navigation.navigate('Help')}
            activeOpacity={0.7}
          >
            <Text style={styles.helpText}>{t.help}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  ), [userData, loading, handleImageError, navigation, t, language]);

  const renderServiceGrid = useMemo(() => (
    <View style={styles.serviceGrid}>
      {SERVICE_ITEMS.map((item) => (
        <ServiceCard 
          key={item.name}
          item={item} 
          onPress={() => navigateToScreen(item.screen)} 
        />
      ))}
    </View>
  ), [navigateToScreen, SERVICE_ITEMS]);

  const renderNewsSection = useMemo(() => {
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <FontAwesome5 name="exclamation-triangle" size={30} color="#FF3B30" />
          <Text style={styles.errorText}>Failed to load news</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchUserData}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        <Text style={styles.sectionTitle}>{t.latestPosts}</Text>
        {newsItems.length > 0 ? (
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalNewsContainer}
          >
            {newsItems.map(item => (
              <NewsCard 
                key={item.id}
                item={item}
                onPress={() => {
                  if (!item.read) markPostAsRead(item.id);
                  navigation.navigate("Post", { 
                    postId: item.id,
                    postData: item
                  });
                }}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.noUpdatesContainer}>
            <FontAwesome5 name="newspaper" size={30} color="#cccccc" />
            <Text style={styles.noUpdatesText}>{t.noPosts}</Text>
          </View>
        )}
        
        <TouchableOpacity
          style={styles.viewAllUpdatesButton}
          onPress={() => navigation.navigate("Post")}
          activeOpacity={0.7}
        >
          <Text style={styles.viewAllUpdatesText}>{t.viewAllPosts}</Text>
          <FontAwesome5 name="arrow-right" size={14} color="#003580" />
        </TouchableOpacity>
      </>
    );
  }, [newsItems, error, navigation, markPostAsRead, fetchUserData, t]);

  const renderAppointmentsSection = useMemo(() => {
    if (upcomingAppointments.length === 0) {
      return (
        <View style={styles.noAppointmentsContainer}>
          <FontAwesome5 name="calendar" size={30} color="#cccccc" />
          <Text style={styles.noAppointmentsText}>{t.noAppointments}</Text>
          <TouchableOpacity
            style={styles.scheduleButton}
            onPress={() => navigation.navigate('Appointments')}
          >
            <Text style={styles.scheduleButtonText}>{t.scheduleNow}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View style={styles.upcomingAppointmentsContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.upcomingAppointmentsTitle}>{t.upcomingAppointments}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Appointments')}>
            <Text style={styles.viewAllText}>{t.viewAll}</Text>
          </TouchableOpacity>
        </View>
        
        {upcomingAppointments.map(appointment => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            onViewDetails={() => navigation.navigate("Appointments", { 
              focusAppointmentId: appointment.id 
            })}
          />
        ))}
      </View>
    );
  }, [upcomingAppointments, navigation, t]);

  const renderLanguageModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showLanguageModal}
      onRequestClose={() => setShowLanguageModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Language</Text>
          <Pressable
            style={[styles.languageOption, language === 'en' && styles.selectedLanguage]}
            onPress={() => changeLanguage('en')}
          >
            <Text style={styles.languageOptionText}>English</Text>
          </Pressable>
          <Pressable
            style={[styles.languageOption, language === 'tl' && styles.selectedLanguage]}
            onPress={() => changeLanguage('tl')}
          >
            <Text style={styles.languageOptionText}>Tagalog</Text>
          </Pressable>
          <Pressable
            style={styles.closeButton}
            onPress={() => setShowLanguageModal(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      {renderHeader}
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
        showsVerticalScrollIndicator={false}
      >
        {renderServiceGrid}
        <MedicalFinancialSection navigation={navigation} hospitals={HOSPITALS} language={language} />
        {renderAppointmentsSection}
        <Text style={styles.sectionTitle}>{t.districtOffice}</Text>
        <AddressCard address={OFFICE_ADDRESS} />
        {renderNewsSection}
      </ScrollView>
      {renderLanguageModal()}
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
      <Stack.Screen name="Post" component={PostScreen} />
      <Stack.Screen name="Info" component={InfoScreen} />
      <Stack.Screen name="Appointments" component={AppointmentsScreen} />
      <Stack.Screen name="AssistanceScreen" component={AssistanceScreen} />
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
        tabBarBackground: () => <GradientTabBar />,
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
        name="Newsfeed"
        component={PostScreen}
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

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
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
  headerTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginLeft: 10,
  },
  languageButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    elevation: 3,
  },
  helpText: {
    fontWeight: "bold",
    color: "#003580",
    fontSize: 14,
  },
  languageText: {
    fontWeight: "bold",
    color: "white",
    fontSize: 14,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingBottom: 25,
  },
  serviceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 16,
    color: "#333",
  },
  upcomingAppointmentsContainer: {
    marginTop: 10,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  upcomingAppointmentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  viewAllText: {
    color: '#0275d8',
    fontWeight: '500',
    fontSize: 14,
  },
  noAppointmentsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 16,
  },
  noAppointmentsText: {
    marginTop: 10,
    color: '#666666',
    fontSize: 16,
    marginBottom: 15,
  },
  scheduleButton: {
    backgroundColor: '#0275d8',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  scheduleButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  horizontalNewsContainer: {
    paddingVertical: 10,
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
  tabBar: {
    borderTopWidth: 0,
    elevation: 0,
    backgroundColor: 'transparent',
    height: 60,
  },
  tabBarBackground: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 15,
  },
  errorText: {
    marginTop: 10,
    color: '#FF3B30',
    fontSize: 16,
  },
  retryButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#003580',
    borderRadius: 5,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  languageOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedLanguage: {
    backgroundColor: '#e6f2ff',
  },
  languageOptionText: {
    fontSize: 16,
  },
  closeButton: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#0275d8',
    borderRadius: 5,
    alignSelf: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});