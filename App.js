import "react-native-gesture-handler";
import React, { useEffect, useRef } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Common Screens
import IntroScreen from "./src/users/components/IntroScreen";
import Login from "./src/login/Login";
import Detail from "./src/login/Detail";
import AdminSetup from "./src/login/AdminSetup";

// User Screens
import Dashboard from "./src/users/Dashboard";
import ProjectsScreen from "./src/users/screens/ProjectsScreen";
import ProjectDetailsScreen from "./src/users/components/ProjectDetailsScreen";
import AppointmentsScreen from "./src/users/screens/AppointmentsScreen";
import ConcernsScreen from "./src/users/screens/ConcernsScreen";
import ImageViewerScreen from "./src/users/components/ImageViewerScreen";
import HelpScreen from './src/users/screens/HelpScreen';
import PostScreen from "./src/users/screens/PostScreen";
import AssistanceScreen from './src/users/screens/AssistanceScreen';
import PostDetail from "./src/users/components/PostDetail";
import ConcernDetail from "./src/users/components/ConcernDetail";
import FinancialAssistanceScreen from "./src/users/screens/FinancialAssistanceScreen";
import ApplicationDetails from "./src/users/components/ApplicationDetails";

// Admin Screens
import AdminDashboard from "./src/admin/AdminDashboard";
import ProjectsTab from "./src/admin/tabs/ProjectsTab";
import ConcernsTab from "./src/admin/tabs/ConcernsTab";
import AppointmentsTab from "./src/admin/tabs/AppointmentsTab";
import UpdatesTab from "./src/admin/tabs/UpdatesTab";
import AppointmentDetail from "./src/admin/components/AppointmentDetail";
import MedicalApplicationTab from "./src/admin/tabs/MedicalApplicationTab";
import MedicalApplicationDetail from "./src/admin/components/MedicalApplicationDetail";
import ProjectDetails from "./src/admin/components/ProjectDetails";
import UpdateDetails from "./src/admin/components/UpdateDetails";
import ConcernDetails from "./src/admin/components/ConcernDetails";
import ProfileTab from "./src/admin/tabs/ProfileTab";
import StatsTab from "./src/admin/tabs/StatsTab";
import ImageFullScreen from "./src/admin/adcomps/ImageFullScreen";
import ScheduleCourtesy from "./src/admin/components/ScheduleCourtesy"; // Add this import

const Stack = createStackNavigator();

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Register for push notifications
    const registerForPushNotifications = async () => {
      try {
        await Notifications.requestPermissionsAsync();
        
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
        }
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    };

    // Set up notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response received:', response);
      // Handle notification taps here
    });

    registerForPushNotifications();

    return () => {
      // Clean up listeners
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Intro" screenOptions={{
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}>
        {/* Common Screens */}
        <Stack.Screen
          name="Intro"
          component={IntroScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={Login}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Detail"
          component={Detail}
          options={{ headerShown: false }}
        />
        
        {/* User Screens */}
        <Stack.Screen
          name="Dashboard"
          component={Dashboard}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Projects"
          component={ProjectsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ProjectDetails"
          component={ProjectDetailsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Appointments"
          component={AppointmentsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Concerns"
          component={ConcernsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ImageViewer"
          component={ImageViewerScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Help"
          component={HelpScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PostScreen"
          component={PostScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PostDetail"
          component={PostDetail}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AssistanceScreen"
          component={AssistanceScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ConcernDetail"
          component={ConcernDetail}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="FinancialAssistanceScreen"
          component={FinancialAssistanceScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ApplicationDetails"
          component={ApplicationDetails}
          options={{ headerShown: false }}
        />
        
        {/* Admin Screens */}
        <Stack.Screen
          name="AdminDashboard"
          component={AdminDashboard}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ProjectsTab"
          component={ProjectsTab}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ConcernsTab"
          component={ConcernsTab}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AppointmentsTab"
          component={AppointmentsTab}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="UpdatesTab"
          component={UpdatesTab}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AppointmentDetail"
          component={AppointmentDetail}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MedicalApplication"
          component={MedicalApplicationTab}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MedicalApplicationDetail"
          component={MedicalApplicationDetail}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ProjectDetailsAdmin"
          component={ProjectDetails}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="UpdateDetails"
          component={UpdateDetails}
          options={{ headerShown: false }}
        /> 
        <Stack.Screen
          name="ConcernDetails"
          component={ConcernDetails}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AdminSetup"
          component={AdminSetup}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ProfileTab"
          component={ProfileTab}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="StatsTab"
          component={StatsTab}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ImageFullScreen"
          component={ImageFullScreen}
          options={{ headerShown: false }}
        />
        {/* Add the new ScheduleCourtesy screen */}
        <Stack.Screen
          name="ScheduleCourtesy"
          component={ScheduleCourtesy}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}