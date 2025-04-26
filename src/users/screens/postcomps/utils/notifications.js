import * as Notifications from 'expo-notifications';
import { Alert, Linking, Platform } from 'react-native';
import { getMessaging, getToken as getFirebaseToken, onTokenRefresh } from '@react-native-firebase/messaging';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const NOTIFICATION_TYPES = {
  NEW_POST: 'new_post',
  IMPORTANT_ALERT: 'important_alert',
  SYSTEM_MESSAGE: 'system_message',
  EVENT_REMINDER: 'event_reminder'
};

export const setupNotificationChannels = async () => {
  if (Platform.OS !== 'android') return;

  try {
    await Notifications.setNotificationChannelAsync('announcements', {
      name: 'Announcements',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('alerts', {
      name: 'Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 1000, 500, 1000],
      sound: 'alert_sound.wav',
    });
  } catch (error) {
    console.error('Notification channel setup error:', error);
  }
};

export const requestNotificationPermissions = async () => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      
      if (newStatus === 'granted') {
        await setupNotificationChannels();
        await fetchFCMToken();
      } else {
        Alert.alert(
          'Notifications Disabled',
          'You won\'t receive important updates. You can enable them in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
      }
      return newStatus;
    } else {
      await setupNotificationChannels();
      await fetchFCMToken();
      return status;
    }
  } catch (error) {
    console.error('Permission request error:', error);
    return 'undetermined';
  }
};

export const fetchFCMToken = async () => {
  try {
    if (!Device.isDevice) return null;

    const messaging = getMessaging();
    const enabled = await messaging.hasPermission();
    
    if (!enabled) {
      try {
        await messaging.requestPermission();
      } catch (err) {
        console.log('User rejected permissions:', err);
        return null;
      }
    }

    const token = await getFirebaseToken(messaging);
    return token;
  } catch (error) {
    console.error('FCM token error:', error);
    return null;
  }
};

export const sendLocalNotification = async (title, body, data = {}) => {
  try {
    if (data.postId) {
      const notificationSent = await AsyncStorage.getItem(`notification_sent_${data.postId}`);
      if (notificationSent) return;
      await AsyncStorage.setItem(`notification_sent_${data.postId}`, 'true');
    }

    const channelId = data.important ? 'alerts' : 'announcements';
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        channelId,
      },
      trigger: null,
    });
  } catch (error) {
    console.log('Notification error:', error);
  }
};

export const handleNotificationTap = async (response, navigation) => {
  const { postId, type, url, eventId } = response.notification.request.content.data;
  
  if (postId) {
    await AsyncStorage.setItem(`viewed_${postId}`, 'true');
  }
  
  switch(type) {
    case NOTIFICATION_TYPES.NEW_POST:
      if (postId) navigation.navigate('PostDetail', { postId });
      break;
    case NOTIFICATION_TYPES.IMPORTANT_ALERT:
      navigation.navigate('Alerts');
      break;
    case NOTIFICATION_TYPES.EVENT_REMINDER:
      if (eventId) navigation.navigate('EventDetail', { eventId });
      break;
    case NOTIFICATION_TYPES.SYSTEM_MESSAGE:
      if (url && await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
      }
      break;
    default:
      return null;
  }
};