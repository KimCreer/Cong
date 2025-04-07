import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import BackgroundFetch from 'react-native-background-fetch';
import { Alert } from 'react-native';

// Configure notification settings
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// Register for push notifications
export const registerForPushNotifications = async (navigation) => {
    try {
        // Request permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
            Alert.alert(
                'Permission Required', 
                'Notification permission is required to receive appointment alerts.',
                [{ text: 'OK' }]
            );
            return;
        }
        
        // Get push token
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        
        // Store token in AsyncStorage
        await AsyncStorage.setItem('pushToken', token);
        
        // Setup notification listeners
        const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
            console.log('Notification received:', notification);
        });
        
        const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            // Navigate to appointments screen if user taps notification
            if (data.screen === 'Appointments' && navigation) {
                navigation.navigate('Appointments');
            }
        });
        
        return {
            receivedSubscription,
            responseSubscription
        };
    } catch (error) {
        console.error('Error registering for push notifications:', error);
        return null;
    }
};

// Configure background fetch
export const configureBackgroundFetch = async () => {
    try {
        const status = await BackgroundFetch.configure({
            minimumFetchInterval: 15, // fetch interval in minutes (minimum 15 minutes)
            stopOnTerminate: false,
            enableHeadless: true,
            startOnBoot: true,
            requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY,
        }, async (taskId) => {
            // This task runs every 15 minutes
            await checkPendingAppointments();
            BackgroundFetch.finish(taskId);
        }, (error) => {
            console.error("Background fetch failed:", error);
        });
        
        console.log("Background fetch status:", status);
        return status;
    } catch (error) {
        console.error("Failed to configure background fetch:", error);
        return null;
    }
};

// Check for pending appointments
export const checkPendingAppointments = async () => {
    try {
        const db = firestore();
        const q = db.collection('appointments').where('status', '==', 'Pending');
        const snapshot = await q.get();
        
        const pendingCount = snapshot.size;
        
        if (pendingCount > 0) {
            // Send local notification to admin
            await sendPendingAppointmentNotification(pendingCount);
            
            // Store the last notification time
            await AsyncStorage.setItem('lastNotificationTime', new Date().toISOString());
        }
        
        return pendingCount;
    } catch (error) {
        console.error('Error checking pending appointments:', error);
        return 0;
    }
};

// Send notification for pending appointments
export const sendPendingAppointmentNotification = async (count) => {
    try {
        // Check if we've already sent a notification recently (within last 4 hours)
        const lastNotifTime = await AsyncStorage.getItem('lastNotificationTime');
        
        if (lastNotifTime) {
            const lastTime = new Date(lastNotifTime).getTime();
            const currentTime = new Date().getTime();
            const hoursDiff = (currentTime - lastTime) / (1000 * 60 * 60);
            
            // Don't send another notification if it's been less than 4 hours
            if (hoursDiff < 4) {
                console.log('Skipping notification - sent recently');
                return false;
            }
        }
        
        await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Pending Appointments',
                body: `You have ${count} pending appointment${count > 1 ? 's' : ''} that need your attention.`,
                data: { screen: 'Appointments' },
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: null, // Send immediately
        });
        
        return true;
    } catch (error) {
        console.error('Error sending notification:', error);
        return false;
    }
};

// Initialize the notification service
export const initNotificationService = async (navigation) => {
    try {
        // Register for push notifications
        const subscriptions = await registerForPushNotifications(navigation);
        
        // Configure background fetch
        await configureBackgroundFetch();
        
        // Check for pending appointments immediately
        await checkPendingAppointments();
        
        // Set up interval to check pending appointments every 5 hours
        const checkInterval = 5 * 60 * 60 * 1000; // 5 hours in milliseconds
        const intervalId = setInterval(checkPendingAppointments, checkInterval);
        
        return {
            subscriptions,
            intervalId,
            cleanup: () => {
                // Clean up resources
                if (subscriptions) {
                    subscriptions.receivedSubscription.remove();
                    subscriptions.responseSubscription.remove();
                }
                clearInterval(intervalId);
            }
        };
    } catch (error) {
        console.error('Error initializing notification service:', error);
        return {
            cleanup: () => {} // Empty cleanup function
        };
    }
};

// Register headless task for background fetch
export const registerHeadlessTask = () => {
    BackgroundFetch.registerHeadlessTask(async ({ taskId }) => {
        console.log('[BackgroundFetch] Headless task started:', taskId);
        try {
            await checkPendingAppointments();
        } catch (error) {
            console.error('[BackgroundFetch] Headless task failed:', error);
        }
        BackgroundFetch.finish(taskId);
    });
};