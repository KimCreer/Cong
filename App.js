import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import IntroScreen from "./src/login/IntroScreen";
import Login from "./src/login/Login";
import Detail from "./src/login/Detail";
import Dashboard from "./src/users/Dashboard";
import AdminDashboard from "./src/admin/AdminDashboard";
import ProjectsScreen from "./src/users/screens/ProjectsScreen";
import ProjectDetailsScreen from "./src/users/components/ProjectDetailsScreen";
import AppointmentsScreen from "./src/users/screens/AppointmentsScreen";
import ConcernsScreen from "./src/users/screens/ConcernsScreen";
import ImageViewerScreen from "./src/users/components/ImageViewerScreen";
import HelpScreen from './src/users/screens/HelpScreen';
import SetPin from "./src/login/SetPin";

// Import the tab components from the admin/tabs folder
import ProjectsTab from "./src/admin/tabs/ProjectsTab";
import ConcernsTab from "./src/admin/tabs/ConcernsTab";
import AppointmentsTab from "./src/admin/tabs/AppointmentsTab";
import UpdatesTab from "./src/admin/tabs/UpdatesTab";
import AppointmentDetail from "./src/admin/components/AppointmentDetail";
import  NotificationsService from "./src/admin/components/NotificationsService";

const Stack = createStackNavigator();

export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Intro">
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
                <Stack.Screen
                    name="SetPin"
                    component={SetPin}
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
            
            </Stack.Navigator>
        </NavigationContainer>
    );
}