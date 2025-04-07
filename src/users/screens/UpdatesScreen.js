import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
View, 
Text, 
StyleSheet, 
ScrollView, 
ActivityIndicator, 
RefreshControl,
TouchableOpacity,
Alert,
Platform,
AppState
} from "react-native";
import { Card, Badge } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';

// Constants for AsyncStorage keys
const STORAGE_KEYS = {
NOTIFICATIONS_ENABLED: 'notificationsEnabled',
LAST_CHECKED_TIMESTAMP: 'lastCheckedTimestamp',
CATEGORY_FILTERS: 'categoryFilters',
FCM_TOKEN: 'fcmToken'
};

export default function UpdateScreen() {
    const [updates, setUpdates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [lastCheckedTimestamp, setLastCheckedTimestamp] = useState(null);
    const [activeCategories, setActiveCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [appState, setAppState] = useState(AppState.currentState);
    const [fcmToken, setFcmToken] = useState(null);
    
    // Format the timestamp to a more readable format
    const formatTimestamp = useCallback((timestamp) => {
        if (!timestamp) return 'Never';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = Math.abs(now - date) / 36e5; // hours
        
        if (diffInHours < 24) {
            return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }, []);
    
    // Process updates data
    const processUpdates = useCallback((docs, lastChecked = 0) => {
        return docs.map(doc => {
            const data = doc.data();
            const timestamp = data.timestamp ? data.timestamp.toDate().getTime() : 0;
            // If read status exists in Firestore, use it first, otherwise calculate based on timestamp
            const isRead = data.read !== undefined ? data.read : (timestamp <= lastChecked);
            
            return {
                id: doc.id,
                title: data.title || "No title",
                description: data.description || "No description",
                date: data.timestamp 
                    ? new Date(data.timestamp.toDate()).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })
                    : (data.date || "No date"),
                timestamp: timestamp,
                category: data.category || "General",
                read: isRead,
                isNew: !isRead, // Inverse of read status
                priority: data.priority || 'normal'
            };
        });
    }, []);

    // Function to fetch updates
    const fetchUpdates = useCallback(async () => {
        try {
            setLoading(true);
            
            // Get the last checked timestamp from storage
            const storedTimestamp = await AsyncStorage.getItem(STORAGE_KEYS.LAST_CHECKED_TIMESTAMP);
            const lastChecked = storedTimestamp ? parseInt(storedTimestamp) : 0;
            
            // Query updates with Firebase
            let updatesQuery = firestore().collection('updates')
                .orderBy('timestamp', 'desc');
                
            // Apply category filter if selected
            if (selectedCategory) {
                updatesQuery = firestore().collection('updates')
                    .where('category', '==', selectedCategory)
                    .orderBy('timestamp', 'desc');
            }
            
            const querySnapshot = await updatesQuery.get();
            
            const updatesData = processUpdates(querySnapshot.docs, lastChecked);
            
            // Update the last checked timestamp
            const currentTime = new Date().getTime();
            await AsyncStorage.setItem(STORAGE_KEYS.LAST_CHECKED_TIMESTAMP, currentTime.toString());
            setLastCheckedTimestamp(currentTime);
            
            setUpdates(updatesData);
            setError(null);
        } catch (err) {
            console.error("Error fetching updates:", err);
            setError("Failed to load updates. Please try again later.");
        } finally {
            setLoading(false);
        }
    }, [selectedCategory, processUpdates]);

    // Check notification permission status
    const checkNotificationPermission = async () => {
        try {
            if (Platform.OS === 'ios') {
                const authStatus = await messaging().hasPermission();
                return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
            } else {
                return true; // On Android we'll check during the request
            }
        } catch (error) {
            console.error("Error checking notification permission:", error);
            return false;
        }
    };

    // Request notification permissions
    const requestNotificationPermission = async () => {
        try {
            // First check current permission status
            const hasPermissionAlready = await checkNotificationPermission();
            if (hasPermissionAlready) return true;
            
            // Request permission for iOS
            if (Platform.OS === 'ios') {
                const authStatus = await messaging().requestPermission();
                const enabled =
                    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
                
                if (!enabled) {
                    Alert.alert(
                        "Notification Permission", 
                        "Notifications are disabled. Please enable them in your device settings.",
                        [
                            { text: "Cancel", style: "cancel" },
                            { text: "Open Settings", onPress: () => {
                                // Open app settings
                                Linking.openSettings();
                            }}
                        ]
                    );
                    return false;
                }
            } else {
                // For Android, check if we have permission
                const permissionStatus = await notifee.requestPermission({
                    sound: true,
                    announcement: true,
                    criticalAlert: true,
                });
                
                if (!permissionStatus.granted) {
                    Alert.alert(
                        "Notification Permission", 
                        "Notifications are disabled. Please enable them in your device settings.",
                        [
                            { text: "Cancel", style: "cancel" },
                            { text: "Open Settings", onPress: () => {
                                // Open app settings
                                notifee.openNotificationSettings();
                            }}
                        ]
                    );
                    return false;
                }
            }
            
            return true;
        } catch (error) {
            console.error("Error requesting notification permission:", error);
            return false;
        }
    };

    // Create notification channels - moved to a separate function for better organization
    const createNotificationChannels = async () => {
        // Create a notification channel for Android
        if (Platform.OS === 'android') {
            try {
                await notifee.createChannel({
                    id: 'updates',
                    name: 'App Updates',
                    lights: true,
                    vibration: true,
                    importance: AndroidImportance.HIGH,
                    sound: 'default',
                });
                
                // Create a separate channel for high priority updates
                await notifee.createChannel({
                    id: 'high-priority',
                    name: 'High Priority Updates',
                    lights: true,
                    vibration: true,
                    importance: AndroidImportance.HIGH,
                    sound: 'default',
                });
                
                console.log('Notification channels created successfully');
            } catch (error) {
                console.error('Failed to create notification channels:', error);
            }
        }
    };

    // Get and save FCM token
    const getFCMToken = async () => {
        try {
            // Check for existing token
            const savedToken = await AsyncStorage.getItem(STORAGE_KEYS.FCM_TOKEN);
            
            if (savedToken) {
                setFcmToken(savedToken);
                console.log('Using saved FCM token:', savedToken);
                return savedToken;
            }

            // Get token from FCM
            const token = await messaging().getToken();
            
            if (token) {
                // Save the token to state and AsyncStorage
                setFcmToken(token);
                await AsyncStorage.setItem(STORAGE_KEYS.FCM_TOKEN, token);
                console.log('New FCM token generated:', token);
                
                // Here you would typically send this token to your server
                // sendTokenToServer(token);
                
                return token;
            }
        } catch (error) {
            console.error("Error getting FCM token:", error);
            return null;
        }
    };

    // Send FCM token to server - add this function if you have a server to handle tokens
    const sendTokenToServer = async (token) => {
        // Implement your server communication logic here
        console.log('Would send token to server:', token);
        // Example:
        // try {
        //     const response = await fetch('https://your-api.com/register-token', {
        //         method: 'POST',
        //         headers: {
        //             'Content-Type': 'application/json',
        //         },
        //         body: JSON.stringify({ token }),
        //     });
        //     const data = await response.json();
        //     console.log('Token registered with server:', data);
        // } catch (error) {
        //     console.error('Error registering token with server:', error);
        // }
    };

    // Initialize FCM
    const initializeMessaging = useCallback(async () => {
        try {
            // Create notification channels first
            await createNotificationChannels();
            
            // Check if notification permission is granted
            const hasPermission = await requestNotificationPermission();
            
            if (!hasPermission) {
                console.log('Notification permission not granted');
                return;
            }
            
            // Get FCM token
            const token = await getFCMToken();
            
            if (token) {
                // Send token to your server if needed
                sendTokenToServer(token);
            }
            
            // Listen for FCM token refresh
            const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (newToken) => {
                console.log('FCM token refreshed:', newToken);
                setFcmToken(newToken);
                await AsyncStorage.setItem(STORAGE_KEYS.FCM_TOKEN, newToken);
                // Update token on your server
                sendTokenToServer(newToken);
            });
            
            // Handle foreground messages with Notifee
            const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
                console.log('Foreground message received:', remoteMessage);
                displayLocalNotification(remoteMessage);
            });
            
            // Handle background/quit state messages
            messaging().setBackgroundMessageHandler(async (remoteMessage) => {
                // Handle background messages if needed
                console.log('Background message handled:', remoteMessage);
                return Promise.resolve();
            });
            
            // Set up Notifee event listener
            const unsubscribeNotifeeEvents = notifee.onForegroundEvent(({ type, detail }) => {
                switch (type) {
                    case EventType.PRESS:
                        console.log('User pressed notification', detail.notification);
                        
                        // Extract data from notification
                        const { data } = detail.notification;
                        
                        // If we have updateId, mark it as read
                        if (data?.updateId) {
                            markAsRead(data.updateId);
                        }
                        
                        // If we have category, set the filter
                        if (data?.category) {
                            setSelectedCategory(data.category);
                        }
                        
                        break;
                    case EventType.ACTION_PRESS:
                        console.log('User pressed notification action', detail.pressAction);
                        break;
                }
            });
            
            return () => {
                unsubscribeTokenRefresh();
                unsubscribeForeground();
                unsubscribeNotifeeEvents();
            };
        } catch (error) {
            console.error("Error initializing Firebase Messaging:", error);
        }
    }, [markAsRead]);

    // Display local notification using Notifee
    const displayLocalNotification = useCallback(async (notification) => {
        try {
            // Extract notification data
            const { notification: fcmNotification, data = {} } = notification || {};
            const title = fcmNotification?.title || data.title || 'New Update';
            const body = fcmNotification?.body || data.body || 'You have a new update to check out';
            const category = data.category || 'General';
            const priority = data.priority || 'normal';
            const updateId = data.updateId || '';
            
            console.log('Displaying notification:', { title, body, category, priority, updateId });
            
            // Choose channel based on priority
            const channelId = priority === 'high' ? 'high-priority' : 'updates';
            
            await notifee.displayNotification({
                title,
                body,
                data: {
                    ...data,
                    updateId,
                    category,
                    priority
                },
                android: {
                    channelId,
                    smallIcon: 'ic_launcher', // This often works as a fallback since it's the app icon
                    color: getCategoryColor(category),
                    pressAction: {
                        id: 'default',
                    },
                    actions: [
                        {
                            title: 'View',
                            pressAction: {
                                id: 'view',
                            },
                        },
                        {
                            title: 'Mark as Read',
                            pressAction: {
                                id: 'mark-read',
                            },
                        },
                    ],
                    importance: priority === 'high' ? AndroidImportance.HIGH : AndroidImportance.DEFAULT,
                    lights: [getCategoryColor(category), 300, 500], // [color, onMs, offMs]
                    vibrationPattern: [300, 500],
                },
                ios: {
                    categoryId: 'updates',
                    critical: priority === 'high',
                    sound: 'default',
                    attachments: [],
                    interruptionLevel: priority === 'high' ? 'critical' : 'active',
                    foregroundPresentationOptions: {
                        alert: true,
                        badge: true,
                        sound: true,
                    },
                },
            });
            
            console.log('Notification displayed successfully');
        } catch (error) {
            console.error("Error displaying notification:", error);
        }
    }, [getCategoryColor]);

    // Test notification function
    const sendTestNotification = async () => {
        try {
            console.log('Sending test notification');
            
            const testNotification = {
                notification: {
                    title: 'Test Notification',
                    body: 'This is a test notification to verify functionality',
                },
                data: {
                    category: 'Announcement',
                    priority: 'high',
                    updateId: 'test-notification',
                }
            };
            
            await displayLocalNotification(testNotification);
            
            Alert.alert(
                "Test Notification Sent",
                "If everything is working correctly, you should see a notification appear.",
                [{ text: "OK" }]
            );
        } catch (error) {
            console.error('Error sending test notification:', error);
            Alert.alert(
                "Error",
                "Failed to send test notification: " + error.message,
                [{ text: "OK" }]
            );
        }
    };

    // Handle notification press
    const handleNotificationOpen = useCallback(async () => {
        try {
            // Get the notification that opened the app
            const initialNotification = await messaging().getInitialNotification();
            
            if (initialNotification) {
                // Handle the notification data
                console.log('App opened from notification:', initialNotification);
                
                // Extract data from notification
                const { data } = initialNotification;
                
                // If we have updateId, mark it as read
                if (data?.updateId) {
                    markAsRead(data.updateId);
                }
                
                // If we have category, set the filter
                if (data?.category) {
                    setSelectedCategory(data.category);
                }
            }
            
            // Listen for notification opens when app is in background
            const unsubscribe = messaging().onNotificationOpenedApp((notification) => {
                console.log('Notification opened app from background:', notification);
                
                // Extract data from notification
                const { data } = notification;
                
                // If we have updateId, mark it as read
                if (data?.updateId) {
                    markAsRead(data.updateId);
                }
                
                // If we have category, set the filter
                if (data?.category) {
                    setSelectedCategory(data.category);
                }
            });
            
            return unsubscribe;
        } catch (error) {
            console.error("Error handling notification open:", error);
        }
    }, [markAsRead, setSelectedCategory]);

    // Setup listener for app state changes
    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (appState.match(/inactive|background/) && nextAppState === 'active') {
                // App has come to the foreground, refresh data
                console.log('App came to foreground, refreshing data');
                fetchUpdates();
                
                // Check notification permission when app comes to foreground
                checkNotificationPermission().then(enabled => {
                    if (enabled !== notificationsEnabled && enabled === true) {
                        // Update state if permissions changed while app was in background
                        setNotificationsEnabled(true);
                        AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, 'true');
                    }
                });
            }
            setAppState(nextAppState);
        });

        return () => {
            subscription.remove();
        };
    }, [appState, fetchUpdates, notificationsEnabled]);

    const markAsRead = useCallback(async (id) => {
        try {
            console.log('Marking update as read:', id);
            
            // Update local state
            setUpdates(prevUpdates => 
                prevUpdates.map(update => 
                    update.id === id ? {...update, read: true, isNew: false} : update
                )
            );
            
            // Update Firestore document
            const updateRef = firestore().collection('updates').doc(id);
            await updateRef.update({
                read: true
            });
            
            // Add to notified updates set so we don't notify again
            const notifiedUpdatesString = await AsyncStorage.getItem('notifiedUpdates') || '[]';
            const notifiedUpdates = JSON.parse(notifiedUpdatesString);
            
            // Only add if not already in the set
            if (!notifiedUpdates.includes(id)) {
                notifiedUpdates.push(id);
                await AsyncStorage.setItem('notifiedUpdates', JSON.stringify(notifiedUpdates));
            }
            
            // Update timestamp to prevent repeated notifications
            const currentTime = new Date().getTime();
            await AsyncStorage.setItem(STORAGE_KEYS.LAST_CHECKED_TIMESTAMP, currentTime.toString());
            setLastCheckedTimestamp(currentTime);
            
            console.log('Update marked as read successfully');
        } catch (err) {
            console.error("Error marking update as read:", err);
            Alert.alert("Error", "Failed to mark update as read. Please try again.");
        }
    }, []);

  // Function to get updates in real-time
  const setupUpdateListener = useCallback(() => {
    console.log('Setting up real-time update listener');
    
    // Apply category filter if selected
    let updatesQuery = firestore().collection('updates')
        .orderBy('timestamp', 'desc');
    
    if (selectedCategory) {
        updatesQuery = firestore().collection('updates')
            .where('category', '==', selectedCategory)
            .orderBy('timestamp', 'desc');
    }
    
    return updatesQuery.onSnapshot(async (querySnapshot) => {
        // Get the last checked timestamp from storage
        const storedTimestamp = await AsyncStorage.getItem(STORAGE_KEYS.LAST_CHECKED_TIMESTAMP);
        const lastChecked = storedTimestamp ? parseInt(storedTimestamp) : 0;
        
        const updatesData = processUpdates(querySnapshot.docs, lastChecked);
        
        // Extract unique categories for filter
        const categories = [...new Set(updatesData.map(update => update.category))];
        setActiveCategories(categories);
        
        // Check for NEW updates - those that are unread AND we haven't notified about yet
        if (notificationsEnabled && lastCheckedTimestamp) {
            try {
                // Create a Set of previously notified update IDs for faster lookup
                const notifiedUpdatesString = await AsyncStorage.getItem('notifiedUpdates') || '[]';
                const notifiedUpdates = new Set(JSON.parse(notifiedUpdatesString));
                
                // Find updates that are:
                // 1. Unread (read = false)
                // 2. Have timestamp newer than last checked
                // 3. Haven't been notified about yet (not in notifiedUpdates set)
                const newUpdatesToNotify = updatesData.filter(update => 
                    !update.read && 
                    update.timestamp > lastCheckedTimestamp &&
                    !notifiedUpdates.has(update.id)
                );
                
                console.log(`Found ${newUpdatesToNotify.length} new updates to notify about`);
                
                // If we have new updates to notify about
                if (newUpdatesToNotify.length > 0) {
                    // Track which updates we've notified about
                    const updatedNotifiedSet = [...notifiedUpdates];
                    
                    for (const update of newUpdatesToNotify) {
                        // Double-check that the update is still unread in Firestore
                        const docSnap = await firestore().collection('updates').doc(update.id).get();
                        const docData = docSnap.data();
                        
                        // Only notify if still unread in Firestore
                        if (!docData.read) {
                            // Construct notification
                            const notification = {
                                notification: {
                                    title: update.title,
                                    body: update.description,
                                },
                                data: {
                                    updateId: update.id,
                                    category: update.category,
                                    priority: update.priority,
                                }
                            };
                            
                            // Display the notification
                            await displayLocalNotification(notification);
                            
                            // Add to notified set
                            updatedNotifiedSet.push(update.id);
                        }
                    }
                    
                    // Save updated notified set to AsyncStorage
                    await AsyncStorage.setItem('notifiedUpdates', JSON.stringify([...updatedNotifiedSet]));
                }
            } catch (error) {
                console.error("Error processing notifications:", error);
            }
        }
        
        // Only update the last checked timestamp when the app is first loaded or refreshed
        if (loading || refreshing) {
            const currentTime = new Date().getTime();
            await AsyncStorage.setItem(STORAGE_KEYS.LAST_CHECKED_TIMESTAMP, currentTime.toString());
            setLastCheckedTimestamp(currentTime);
        }
        
        setUpdates(updatesData);
        setError(null);
        setLoading(false);
    }, (error) => {
        console.error("Error in Firestore listener:", error);
        setError("Failed to load updates. Please try again later.");
        setLoading(false);
    });
}, [selectedCategory, processUpdates, notificationsEnabled, lastCheckedTimestamp, loading, refreshing, displayLocalNotification]);

    // Function to mark all as read
    const markAllAsRead = useCallback(async () => {
        try {
            console.log('Marking all updates as read');
            
            // Update local state
            setUpdates(prevUpdates => 
                prevUpdates.map(update => ({...update, read: true, isNew: false}))
            );
            
            // Update all visible updates in Firestore
            const batch = firestore().batch();
            
            // Also track these as notified
            const notifiedUpdatesString = await AsyncStorage.getItem('notifiedUpdates') || '[]';
            const notifiedUpdates = JSON.parse(notifiedUpdatesString);
            const updatedNotifiedSet = [...notifiedUpdates];
            let updatesAdded = false;
            
            filteredUpdates.forEach(update => {
                const docRef = firestore().collection('updates').doc(update.id);
                batch.update(docRef, { read: true });
                
                // Add to notified set if not already there
                if (!updatedNotifiedSet.includes(update.id)) {
                    updatedNotifiedSet.push(update.id);
                    updatesAdded = true;
                }
            });
            
            await batch.commit();
            
            // Save updated notified set if changed
            if (updatesAdded) {
                await AsyncStorage.setItem('notifiedUpdates', JSON.stringify(updatedNotifiedSet));
            }
            
            // Update timestamp to prevent repeated notifications
            const currentTime = new Date().getTime();
            await AsyncStorage.setItem(STORAGE_KEYS.LAST_CHECKED_TIMESTAMP, currentTime.toString());
            setLastCheckedTimestamp(currentTime);
            
            console.log('All updates marked as read successfully');
        } catch (err) {
            console.error("Error marking all updates as read:", err);
            Alert.alert("Error", "Failed to mark all updates as read. Please try again.");
        }
    }, [filteredUpdates]);

    const cleanupNotifiedUpdates = async () => {
try {
    // Get current updates
    const currentUpdateIds = new Set(updates.map(update => update.id));
    
    // Get notified updates
    const notifiedUpdatesString = await AsyncStorage.getItem('notifiedUpdates') || '[]';
    const notifiedUpdates = JSON.parse(notifiedUpdatesString);
    
    // Filter notified updates to only include current updates or keep last 100
    const filteredNotifiedUpdates = notifiedUpdates.filter(id => 
        currentUpdateIds.has(id)
    ).slice(-100); // Keep only the most recent 100
    
    // Save back to storage
    await AsyncStorage.setItem('notifiedUpdates', JSON.stringify(filteredNotifiedUpdates));
    console.log('Cleaned up notified updates list');
} catch (err) {
    console.error("Error cleaning up notified updates:", err);
}
};
    

    // Toggle notification settings
    const toggleNotifications = async () => {
        try {
            const newState = !notificationsEnabled;
            
            if (newState) {
                // Requesting permission when enabling
                const hasPermission = await requestNotificationPermission();
                
                if (!hasPermission) {
                    console.log('Permission denied, cannot enable notifications');
                    return;
                }
                
                // Get FCM token if we don't have one
                if (!fcmToken) {
                    await getFCMToken();
                }
                
                // Create notification channels
                await createNotificationChannels();
                
                Alert.alert(
                    "Notifications Enabled", 
                    "You will now receive push notifications when new updates are available."
                );
                
                // Update timestamp when enabling to avoid notifications for old content
                const currentTime = new Date().getTime();
                await AsyncStorage.setItem(STORAGE_KEYS.LAST_CHECKED_TIMESTAMP, currentTime.toString());
                setLastCheckedTimestamp(currentTime);
                
                // Initialize messaging handlers
                await initializeMessaging();
                
                // Send a test notification
                setTimeout(() => {
                    sendTestNotification();
                }, 2000);
            } else {
                Alert.alert(
                    "Notifications Disabled", 
                    "You will no longer receive push notifications for updates."
                );
            }
            
            setNotificationsEnabled(newState);
            await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, newState ? 'true' : 'false');
            console.log('Notification state updated:', newState);
        } catch (err) {
            console.error("Error toggling notifications:", err);
            Alert.alert("Error", "Could not change notification settings. Please try again.");
        }
    };

    // Select a category filter
    const selectCategory = useCallback(async (category) => {
        // If already selected, clear the filter
        const newCategory = category === selectedCategory ? null : category;
        console.log('Setting category filter:', newCategory);
        
        setSelectedCategory(newCategory);
        
        // Save preference
        if (newCategory) {
            await AsyncStorage.setItem(STORAGE_KEYS.CATEGORY_FILTERS, newCategory);
        } else {
            await AsyncStorage.removeItem(STORAGE_KEYS.CATEGORY_FILTERS);
        }
    }, [selectedCategory]);

    // Function to refresh updates (pull-to-refresh)
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchUpdates();
        setRefreshing(false);
    }, [fetchUpdates]);

    // Initialize and setup listeners
    useEffect(() => {
        // Load user preferences
        const loadPreferences = async () => {
            try {
                console.log('Loading user preferences');
                
                // Load notification preference
                const notifEnabled = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED);
                setNotificationsEnabled(notifEnabled === 'true');
                console.log('Notifications enabled:', notifEnabled === 'true');
                
                // Load last checked timestamp
                const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.LAST_CHECKED_TIMESTAMP);
                setLastCheckedTimestamp(timestamp ? parseInt(timestamp) : null);
                console.log('Last checked timestamp:', timestamp ? formatTimestamp(parseInt(timestamp)) : 'Never');
                
                // Load category filters
                const savedCategory = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORY_FILTERS);
                if (savedCategory) {
                    setSelectedCategory(savedCategory);
                    console.log('Saved category filter:', savedCategory);
                }
            } catch (err) {
                console.error("Error loading preferences:", err);
            }
        };
        
        const initializeApp = async () => {
            // First load preferences
            await loadPreferences();
            await cleanupNotifiedUpdates();
            
            // Initialize Firebase Messaging if notifications are enabled
            let messagingCleanup = null;
            const notifEnabled = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED);
            
            if (notifEnabled === 'true') {
                console.log('Notifications enabled, initializing messaging');
                messagingCleanup = await initializeMessaging();
            }
            
            // Handle notification open events
            const notificationOpenCleanup = await handleNotificationOpen();
            
            // Set up Firestore listener
            const firestoreCleanup = setupUpdateListener();
            
            // Return cleanup function
            return () => {
                if (firestoreCleanup) firestoreCleanup();
                
                if (messagingCleanup && typeof messagingCleanup.then === 'function') {
                    messagingCleanup.then(cleanup => cleanup && cleanup());
                } else if (typeof messagingCleanup === 'function') {
                    messagingCleanup();
                }
                
                if (notificationOpenCleanup && typeof notificationOpenCleanup.then === 'function') {
                    notificationOpenCleanup.then(cleanup => cleanup && cleanup());
                } else if (typeof notificationOpenCleanup === 'function') {
                    notificationOpenCleanup();
                }
            };
        };
        
        // Start initialization
        const cleanup = initializeApp();
        
        // Cleanup function
        return () => {
            cleanup.then(cleanupFn => {
                if (cleanupFn) cleanupFn();
            });
        };
    }, []);

    // Function to get category icon based on category name
    const getCategoryIcon = useCallback((category) => {
        switch(category.toLowerCase()) {
            case 'announcement':
                return 'bullhorn';
            case 'feature':
                return 'star';
            case 'bugfix':
                return 'bug-check';
            case 'maintenance':
                return 'wrench';
            default:
                return 'information-outline';
        }
    }, []);

    // Get category color based on category name
    const getCategoryColor = useCallback((category) => {
        switch(category.toLowerCase()) {
            case 'announcement':
                return '#007bff';
            case 'feature':
                return '#28a745';
            case 'bugfix':
                return '#dc3545';
            case 'maintenance':
                return '#ffc107';
            default:
                return '#6c757d';
        }
    }, []);

    // Get priority style
    const getPriorityStyle = useCallback((priority) => {
        switch(priority.toLowerCase()) {
            case 'high':
                return styles.highPriority;
            case 'medium':
                return styles.mediumPriority;
            case 'low':
                return styles.lowPriority;
            default:
                return null;
        }
    }, []);

    // Count unread updates
    const unreadCount = useMemo(() => {
        return updates.filter(update => !update.read).length;
    }, [updates]);

    // Get filtered updates based on selected category
    const filteredUpdates = useMemo(() => {
        return selectedCategory 
            ? updates.filter(update => update.category === selectedCategory)
            : updates;
    }, [updates, selectedCategory]);

    return (
        <View style={styles.container}>
            {/* Header Section */}
            <View style={styles.header}>
                <Icon name="update" size={30} color="#ffffff" style={styles.headerIcon} />
                <Text style={styles.headerTitle}>
                    Latest Updates
                    {selectedCategory && (
                        <Text style={styles.headerSubtitle}> ({selectedCategory})</Text>
                    )}
                </Text>
                
                <View style={styles.headerActions}>
                    {unreadCount > 0 && (
                        <TouchableOpacity 
                            style={styles.markAllReadButton}
                            onPress={markAllAsRead}
                            accessibilityLabel="Mark all as read"
                        >
                            <Icon name="check-all" size={20} color="#ffffff" />
                            {unreadCount > 0 && (
                                <Badge 
                                    style={styles.unreadBadge}
                                    size={16}
                                >
                                    {unreadCount}
                                </Badge>
                            )}
                        </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity 
                        style={styles.notificationToggle}
                        onPress={toggleNotifications}
                        accessibilityLabel={notificationsEnabled ? "Disable notifications" : "Enable notifications"}
                    >
                        <Icon 
                            name={notificationsEnabled ? "bell" : "bell-off"} 
                            size={20} 
                            color="#ffffff" 
                        />
                    </TouchableOpacity>
                </View>
            </View>
            
            {/* Category Filters */}
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.categoryContainer}
                contentContainerStyle={styles.categoryContent}
            >
                {activeCategories.map(category => (
                    <TouchableOpacity
                        key={category}
                        style={[
                            styles.categoryButton,
                            selectedCategory === category && styles.categoryButtonActive,
                            { borderColor: getCategoryColor(category) }
                        ]}
                        onPress={() => selectCategory(category)}
                    >
                        <Icon 
                            name={getCategoryIcon(category)} 
                            size={16} 
                            color={selectedCategory === category ? '#fff' : getCategoryColor(category)} 
                        />
                        <Text 
                            style={[
                                styles.categoryButtonText,
                                selectedCategory === category && styles.categoryButtonTextActive
                            ]}
                        >
                            {category}
                        </Text>
                    </TouchableOpacity>
                ))}
                
                {selectedCategory && (
                    <TouchableOpacity
                        style={styles.clearFilterButton}
                        onPress={() => selectCategory(null)}
                    >
                        <Icon name="filter-remove" size={16} color="#6c757d" />
                        <Text style={styles.clearFilterText}>Clear Filter</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
            
            {/* Last Updated Timestamp */}
            <View style={styles.lastCheckedContainer}>
                <Text style={styles.lastCheckedText}>
                    Last checked: {formatTimestamp(lastCheckedTimestamp)}
                </Text>
            </View>
            
            {/* Error Message */}
            {error && (
                <View style={styles.errorContainer}>
                    <Icon name="alert-circle" size={20} color="#dc3545" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity 
                        style={styles.retryButton}
                        onPress={fetchUpdates}
                    >
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            )}
            
            {/* Updates List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007bff" />
                    <Text style={styles.loadingText}>Loading updates...</Text>
                </View>
            ) : (
                <ScrollView 
                    style={styles.updatesList}
                    contentContainerStyle={styles.updatesListContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#007bff']}
                            tintColor="#007bff"
                        />
                    }
                >
                    {filteredUpdates.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Icon name="information-outline" size={50} color="#6c757d" />
                            <Text style={styles.emptyText}>
                                {selectedCategory 
                                    ? `No updates in the ${selectedCategory} category.` 
                                    : 'No updates available.'}
                            </Text>
                            <TouchableOpacity 
                                style={styles.refreshButton}
                                onPress={onRefresh}
                            >
                                <Text style={styles.refreshButtonText}>Refresh</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        filteredUpdates.map(update => (
                            <Card 
                                key={update.id} 
                                style={[
                                    styles.updateCard,
                                    !update.read && styles.unreadCard,
                                    getPriorityStyle(update.priority)
                                ]}
                                onPress={() => markAsRead(update.id)}
                            >
                                <Card.Content>
                                    <View style={styles.updateHeader}>
                                        <View style={styles.updateTitleContainer}>
                                            {update.isNew && (
                                                <Badge style={styles.newBadge}>New</Badge>
                                            )}
                                            <Text style={styles.updateTitle}>{update.title}</Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => markAsRead(update.id)}
                                            style={styles.readButton}
                                        >
                                            <Icon 
                                                name={update.read ? "checkbox-marked-circle" : "checkbox-marked-circle-outline"} 
                                                size={20} 
                                                color={update.read ? "#28a745" : "#6c757d"} 
                                            />
                                        </TouchableOpacity>
                                    </View>
                                    
                                    <Text style={styles.updateDescription}>{update.description}</Text>
                                    
                                    <View style={styles.updateFooter}>
                                        <View style={styles.categoryBadge}>
                                            <Icon 
                                                name={getCategoryIcon(update.category)} 
                                                size={14} 
                                                color={getCategoryColor(update.category)} 
                                            />
                                            <Text style={[
                                                styles.categoryText,
                                                { color: getCategoryColor(update.category) }
                                            ]}>
                                                {update.category}
                                            </Text>
                                        </View>
                                        <Text style={styles.updateDate}>{update.date}</Text>
                                    </View>
                                </Card.Content>
                            </Card>
                        ))
                    )}
                </ScrollView>
            )}
            
            {/* Footer with notification status */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    {notificationsEnabled 
                        ? "Push notifications are enabled" 
                        : "Push notifications are disabled"}
                </Text>
                <TouchableOpacity 
                    style={[
                        styles.footerButton, 
                        { backgroundColor: notificationsEnabled ? '#dc3545' : '#28a745' }
                    ]}
                    onPress={toggleNotifications}
                >
                    <Text style={styles.footerButtonText}>
                        {notificationsEnabled ? "Disable" : "Enable"}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// Define the styles
const styles = StyleSheet.create({
container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
},
header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
},
headerIcon: {
    marginRight: 10,
},
headerTitle: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold',
    flex: 1,
},
headerSubtitle: {
    fontSize: 16,
    fontWeight: 'normal',
},
headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
},
markAllReadButton: {
    marginRight: 15,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
},
unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#dc3545',
},
notificationToggle: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
},
categoryContainer: {
    maxHeight: 60,
    marginTop: 10,
    marginBottom: 5,
},
categoryContent: {
    paddingHorizontal: 15,
    paddingVertical: 5,
},
categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'transparent',
},
categoryButtonActive: {
    backgroundColor: '#007bff',
},
categoryButtonText: {
    marginLeft: 4,
    fontSize: 14,
},
categoryButtonTextActive: {
    color: '#ffffff',
},
clearFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6c757d',
},
clearFilterText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#6c757d',
},
lastCheckedContainer: {
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
},
lastCheckedText: {
    fontSize: 12,
    color: '#6c757d',
},
errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8d7da',
    padding: 15,
    margin: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f5c6cb',
},
errorText: {
    flex: 1,
    marginLeft: 10,
    color: '#721c24',
},
retryButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
},
retryButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
},
loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
},
loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6c757d',
},
updatesList: {
    flex: 1,
},
updatesListContent: {
    padding: 15,
},
emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
},
emptyText: {
    marginTop: 15,
    marginBottom: 20,
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
},
refreshButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
},
refreshButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
},
updateCard: {
    marginBottom: 15,
    borderRadius: 8,
    borderLeftWidth: 5,
    borderLeftColor: '#6c757d',
},
unreadCard: {
    backgroundColor: '#f8f9fa',
    borderLeftColor: '#007bff',
},
highPriority: {
    borderLeftColor: '#dc3545',
},
mediumPriority: {
    borderLeftColor: '#ffc107',
},
lowPriority: {
    borderLeftColor: '#28a745',
},
updateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
},
updateTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
},
newBadge: {
    marginRight: 8,
    backgroundColor: '#28a745',
},
updateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
},
readButton: {
    padding: 5,
},
updateDescription: {
    fontSize: 14,
    color: '#212529',
    marginBottom: 15,
},
updateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
},
categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
},
categoryText: {
    marginLeft: 5,
    fontSize: 12,
},
updateDate: {
    fontSize: 12,
    color: '#6c757d',
},
footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    backgroundColor: '#ffffff',
    paddingBottom:10,
},
footerText: {
    fontSize: 14,
    color: '#6c757d',
},
// And change it to this in StyleSheet.create:
footerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
},
footerButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
},
});