import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, RefreshControl, Alert, Modal, Platform } from "react-native";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { getAuth } from "@react-native-firebase/auth";
import { getFirestore, collection, query, where, orderBy, getDocs, addDoc, doc, updateDoc, onSnapshot, Timestamp } from "@react-native-firebase/firestore";
import { useFocusEffect } from "@react-navigation/native";
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AppointmentForm from "../components/AppointmentForm";
import { CalendarDay, WeekCalendar, MonthCalendar } from "./appointcomps/CalendarComponents";
import { HOLIDAYS, MAX_DAILY_APPOINTMENTS, TIME_SLOT_CONFLICT_MINUTES, isSameDay, addDays, getTimeSlot, isHoliday, isWeekend } from "./appointcomps/utils";
import { styles } from "./appointcomps/StylesAndComponents";

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Date utility functions
const parseFirestoreDate = (date) => {
  if (date instanceof Timestamp) {
    return date.toDate();
  }
  if (typeof date === 'string') {
    return new Date(date);
  }
  return date;
};

const formatDisplayDate = (date) => {
  const d = parseFirestoreDate(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatTime = (date) => {
  if (!date) return "";
  
  // If date is a string, parse it first
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Ensure we have a valid date object
  if (!(d instanceof Date) || isNaN(d.getTime())) return "";
  
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  
  return `${hour12}:${String(minutes).padStart(2, '0')} ${ampm}`;
};
const formatDate = (date, format) => {
  const d = parseFirestoreDate(date);
  const pad = (num) => num.toString().padStart(2, '0');
  
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  
  if (format === 'yyyy-MM-dd') return `${year}-${month}-${day}`;
  if (format === 'MMM d, yyyy') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  
  return d.toISOString();
};

export default function AppointmentsScreen({ navigation }) {
  const [state, setState] = useState({
    loading: true,
    refreshing: false,
    appointments: [],
    courtesyAppointments: [],
    appointmentModalVisible: false,
    selectedAppointment: null,
    detailsModalVisible: false,
    selectedDate: formatDate(new Date(), 'yyyy-MM-dd'),
    appointmentCounts: {},
    currentMonth: new Date(),
    calendarView: 'week',
    expoPushToken: null
  });

  const auth = getAuth();
  const currentUser = auth.currentUser;

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return '#28a745';
      case 'pending':
        return '#ffc107';
      case 'cancelled':
        return '#dc3545';
      case 'completed':
        return '#007bff';
      default:
        return '#6c757d';
    }
  };

  // Notification functions
  const registerForPushNotifications = async () => {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!');
        return;
      }
      
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      setState(prev => ({ ...prev, expoPushToken: token }));

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('appointments', {
          name: 'Appointments',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#003580',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });
      }
    } else {
      alert('Must use physical device for Push Notifications');
    }
  };

  const sendAppointmentNotification = async (title, body, data = {}) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
          priority: 'high',
          autoDismiss: false,
          sticky: false,
          vibrate: [0, 250, 250, 250],
        },
        trigger: null,
      });
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  const setupNotifications = async () => {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowAnnouncements: true,
          },
        });
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get notification permissions!');
        return;
      }
      
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Expo push token:', token);
      
      await Notifications.setNotificationChannelAsync('appointments', {
        name: 'Appointments',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#003580',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    } else {
      console.log('Must use physical device for Push Notifications');
    }
  };

  useEffect(() => {
    let notificationSubscription;
    let responseSubscription;

    const setupNotificationListeners = async () => {
      await setupNotifications();

      notificationSubscription = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received:', notification);
      });

      responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification response:', response);
        const appointmentId = response.notification.request.content.data.appointmentId;
        if (appointmentId) {
          const appointment = [...state.appointments, ...state.courtesyAppointments].find(a => a.id === appointmentId);
          if (appointment) {
            setState(prev => ({
              ...prev,
              selectedAppointment: appointment,
              detailsModalVisible: true
            }));
          }
        }
      });
    };

    setupNotificationListeners();

    return () => {
      if (notificationSubscription) notificationSubscription.remove();
      if (responseSubscription) responseSubscription.remove();
    };
  }, [state.appointments, state.courtesyAppointments]);

  const fetchAppointmentCounts = useCallback(async () => {
    try {
      const db = getFirestore();
      const q = query(
        collection(db, "appointments"),
        where("status", "==", "Confirmed") // Only count confirmed appointments
      );
      
      const snapshot = await getDocs(q);
      const counts = {};
      
      snapshot.forEach(doc => {
        const appt = doc.data();
        // Skip courtesy appointments
        if (appt.isCourtesy) return;
        
        const date = parseFirestoreDate(appt.date);
        const dateStr = formatDate(date, 'yyyy-MM-dd');
        counts[dateStr] = (counts[dateStr] || 0) + 1;
      });
      
      return counts;
    } catch (error) {
      console.error("Error fetching appointment counts:", error);
      return {};
    }
  }, []);

  const fetchAppointments = useCallback(async () => {
    if (!currentUser) return;
  
    try {
      setState(prev => ({ ...prev, loading: true }));
      const db = getFirestore();
      
      const q = query(
        collection(db, "appointments"),
        where("userId", "==", currentUser.uid),
        orderBy("date", "desc")
      );
      
      const courtesyQ = query(
        collection(db, "appointments"),
        where("userId", "==", currentUser.uid),
        where("isCourtesy", "==", true),
        orderBy("createdAt", "desc")
      );
      
      const [snapshot, courtesySnapshot] = await Promise.all([
        getDocs(q),
        getDocs(courtesyQ)
      ]);
      
      const appointmentsData = snapshot.docs.map(doc => {
        const data = doc.data();
        let date = data.date;
        
        // Ensure date is properly parsed
        if (date instanceof Timestamp) {
          date = date.toDate();
        } else if (typeof date === 'string') {
          date = new Date(date);
        }
        
        return { 
          id: doc.id, 
          ...data,
          date: date,
          createdAt: parseFirestoreDate(data.createdAt),
          updatedAt: parseFirestoreDate(data.updatedAt)
        };
      });
      
      const courtesyData = courtesySnapshot.docs.map(doc => {
        const data = doc.data();
        let date = data.date;
        
        if (date instanceof Timestamp) {
          date = date.toDate();
        } else if (typeof date === 'string') {
          date = new Date(date);
        }
        
        return { 
          id: doc.id, 
          ...data,
          date: date,
          createdAt: parseFirestoreDate(data.createdAt),
          updatedAt: parseFirestoreDate(data.updatedAt)
        };
      });
      
      const counts = await fetchAppointmentCounts();
      
      setState(prev => ({
        ...prev,
        appointments: appointmentsData.sort((a, b) => a.date - b.date),
        courtesyAppointments: courtesyData,
        appointmentCounts: counts,
        loading: false,
        refreshing: false
      }));
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setState(prev => ({ ...prev, loading: false, refreshing: false }));
    }
  }, [currentUser, fetchAppointmentCounts]);

  useEffect(() => {
    if (!currentUser) return;
    
    const db = getFirestore();
    const q = query(collection(db, "appointments"));
    
    const prevAppointments = new Map();
    state.appointments.forEach(appt => {
      prevAppointments.set(appt.id, { ...appt });
    });
    
    const prevCourtesyAppointments = new Map();
    state.courtesyAppointments.forEach(appt => {
      prevCourtesyAppointments.set(appt.id, { ...appt });
    });
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const counts = {};
      const appointmentsData = [];
      const courtesyData = [];
      const statusChangedAppointments = [];
      
      snapshot.forEach(doc => {
        const appt = { 
          id: doc.id, 
          ...doc.data(),
          date: parseFirestoreDate(doc.data().date),
          createdAt: parseFirestoreDate(doc.data().createdAt),
          updatedAt: parseFirestoreDate(doc.data().updatedAt)
        };
        
        if (appt.userId === currentUser?.uid) {
          if (appt.isCourtesy) {
            const prevAppt = prevCourtesyAppointments.get(appt.id);
            if (prevAppt && prevAppt.status !== appt.status) {
              statusChangedAppointments.push({ 
                ...appt, 
                oldStatus: prevAppt.status 
              });
            }
            courtesyData.push(appt);
          } else {
            const prevAppt = prevAppointments.get(appt.id);
            if (prevAppt && prevAppt.status !== appt.status) {
              statusChangedAppointments.push({ 
                ...appt, 
                oldStatus: prevAppt.status 
              });
            }
            appointmentsData.push(appt);
          }
          
          // Only count confirmed, non-courtesy appointments
          if (appt.status === "Confirmed" && !appt.isCourtesy) {
            const dateStr = formatDate(appt.date, 'yyyy-MM-dd');
            counts[dateStr] = (counts[dateStr] || 0) + 1;
          }
        }
      });
      
      
      statusChangedAppointments.forEach(async appt => {
        if (appt.status === "Confirmed" && appt.oldStatus === "Pending") {
          await sendAppointmentNotification(
            "Appointment Confirmed",
            `Your ${appt.isCourtesy ? 'courtesy ' : ''}appointment on ${formatDisplayDate(appt.date)} at ${formatTime(appt.date)} has been confirmed.`,
            { appointmentId: appt.id }
          );
        } else if (appt.status === "Cancelled" && ["Pending", "Confirmed"].includes(appt.oldStatus)) {
          await sendAppointmentNotification(
            "Appointment Cancelled",
            `Your ${appt.isCourtesy ? 'courtesy ' : ''}appointment on ${formatDisplayDate(appt.date)} has been cancelled.`,
            { appointmentId: appt.id }
          );
        } else if (appt.status === "Completed" && appt.oldStatus !== "Completed") {
          await sendAppointmentNotification(
            "Appointment Completed",
            `Your ${appt.isCourtesy ? 'courtesy ' : ''}appointment on ${formatDisplayDate(appt.date)} has been marked as completed.`,
            { appointmentId: appt.id }
          );
        }
      });
      
      setState(prev => ({
        ...prev,
        appointments: appointmentsData.sort((a, b) => a.date - b.date),
        courtesyAppointments: courtesyData,
        appointmentCounts: counts
      }));
    });

    return unsubscribe;
  }, [currentUser]);

  useFocusEffect(useCallback(() => { fetchAppointments(); }, [fetchAppointments]));

  const handleRefresh = useCallback(() => {
    setState(prev => ({ ...prev, refreshing: true }));
    fetchAppointments();
  }, [fetchAppointments]);

  const handleMonthChange = (months) => {
    setState(prev => {
      const newMonth = new Date(prev.currentMonth);
      newMonth.setMonth(newMonth.getMonth() + months);
      return { ...prev, currentMonth: newMonth };
    });
  };

  const checkForTimeConflict = async (userId, date, time) => {
    try {
      const db = getFirestore();
      const dateStr = formatDate(date, 'yyyy-MM-dd');
      
      const q = query(
        collection(db, "appointments"),
        where("userId", "==", userId),
        where("date", ">=", new Date(dateStr + "T00:00:00")),
        where("date", "<=", new Date(dateStr + "T23:59:59")),
        where("status", "in", ["Pending", "Confirmed"])
      );
      
      const snapshot = await getDocs(q);
      const [newHours, newMinutes] = time.split(':').map(Number);
      const newTotalMinutes = newHours * 60 + newMinutes;
      
      return snapshot.docs.some(doc => {
        const apptDate = parseFirestoreDate(doc.data().date);
        const [existingHours, existingMinutes] = formatTime(apptDate).split(':').map(Number);
        const existingTotalMinutes = existingHours * 60 + existingMinutes;
        return Math.abs(newTotalMinutes - existingTotalMinutes) < TIME_SLOT_CONFLICT_MINUTES;
      });
    } catch (error) {
      console.error("Error checking for time conflicts:", error);
      return false;
    }
  };
  const handleSubmitAppointment = async (appointmentData) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      if (!currentUser) return;
  
      let appointmentDate;
      
      if (!appointmentData.isCourtesy) {
        // Regular appointment date/time validation
        if (!appointmentData.date) {
          throw new Error("Please select a valid date");
        }
        
        // Ensure the date is a proper Date object
        appointmentDate = new Date(appointmentData.date);
        
        if (isNaN(appointmentDate.getTime())) {
          throw new Error("Invalid date selected");
        }
  
        const dateStr = formatDate(appointmentDate, 'yyyy-MM-dd');
        
        if (isWeekend(appointmentDate)) {
          Alert.alert("Error", "Weekends are not available");
          return;
        }
        if (isHoliday(appointmentDate)) {
          Alert.alert("Error", "Holidays are not available");
          return;
        }
        if ((state.appointmentCounts[dateStr] || 0) >= MAX_DAILY_APPOINTMENTS) {
          Alert.alert("Error", "This day is fully booked");
          return;
        }
        if (await checkForTimeConflict(currentUser.uid, appointmentDate, appointmentData.time)) {
          Alert.alert("Time Conflict", "You already have an appointment within this time frame.");
          return;
        }
      } else {
        // For courtesy appointments, use current date as placeholder
        appointmentDate = new Date();
      }
  
      const db = getFirestore();
      await addDoc(collection(db, "appointments"), {
        ...appointmentData,
        date: Timestamp.fromDate(appointmentDate),
        userId: currentUser.uid,
        status: "Pending",
        createdAt: Timestamp.now()
      });
  
      await sendAppointmentNotification(
        "Appointment Scheduled",
        `Your ${appointmentData.isCourtesy ? 'courtesy' : ''} appointment has been scheduled and is pending confirmation.`,
        { status: "pending" }
      );
  
      setState(prev => ({ ...prev, appointmentModalVisible: false }));
      Alert.alert("Success", `Appointment ${appointmentData.isCourtesy ? 'request' : 'scheduled'}!`);
    } catch (error) {
      console.error("Appointment error:", error);
      Alert.alert("Error", error.message || "Failed to schedule appointment");
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };
  
  const handleRescheduleAppointment = async (appointment, newDate, newTime) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      if (!currentUser) return false;
  
      // Validate the date
      if (!newDate || !(newDate instanceof Date)) {
        throw new Error("Please select a valid date");
      }
      
      const appointmentDate = new Date(newDate);
      
      if (isNaN(appointmentDate.getTime())) {
        throw new Error("Invalid date selected");
      }
  
      const dateStr = formatDate(appointmentDate, 'yyyy-MM-dd');
      
      if (!appointment.isCourtesy) {
        if (isWeekend(appointmentDate)) {
          Alert.alert("Error", "Weekends are not available");
          return false;
        }
        if (isHoliday(appointmentDate)) {
          Alert.alert("Error", "Holidays are not available");
          return false;
        }
        if ((state.appointmentCounts[dateStr] || 0) >= MAX_DAILY_APPOINTMENTS) {
          Alert.alert("Error", "This day is fully booked");
          return false;
        }
        if (await checkForTimeConflict(currentUser.uid, newDate, newTime)) {
          Alert.alert("Time Conflict", "You already have an appointment within this time frame.");
          return false;
        }
      }
  
      const db = getFirestore();
      const updateData = {
        date: Timestamp.fromDate(appointmentDate),
        time: newTime,
        // Only update status if it's not Pending
        ...(appointment.status !== "Pending" && { status: appointment.status }),
        updatedAt: Timestamp.now()
      };
  
      await updateDoc(doc(db, "appointments", appointment.id), updateData);
  
      await sendAppointmentNotification(
        "Appointment Rescheduled",
        `Your ${appointment.isCourtesy ? 'courtesy ' : ''}appointment has been rescheduled to ${formatDisplayDate(appointmentDate)} at ${newTime}.`,
        { appointmentId: appointment.id }
      );
  
      Alert.alert("Success", "Appointment rescheduled!");
      return true;
    } catch (error) {
      console.error("Reschedule error:", error);
      Alert.alert("Error", error.message || "Failed to reschedule appointment");
      return false;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };
  const handleCancelAppointment = (appointment) => {
    Alert.alert(
      "Confirm Cancellation",
      "Are you sure you want to cancel this appointment?",
      [
        { text: "No" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              setState(prev => ({ ...prev, loading: true }));
              const db = getFirestore();
              await updateDoc(doc(db, "appointments", appointment.id), {
                status: "Cancelled",
                cancelledAt: Timestamp.now(),
              });

              await sendAppointmentNotification(
                "Appointment Cancelled",
                `Your ${appointment.isCourtesy ? 'courtesy ' : ''}appointment has been cancelled.`,
                { appointmentId: appointment.id }
              );

              setState(prev => ({ ...prev, detailsModalVisible: false }));
            } catch (error) {
              Alert.alert("Error", "Failed to cancel appointment");
            } finally {
              setState(prev => ({ ...prev, loading: false }));
            }
          }
        }
      ]
    );
  };

  const filterAppointmentsByDate = (appointments) => {
    return appointments.filter(appt => 
      formatDate(appt.date, 'yyyy-MM-dd') === state.selectedDate
    );
  };

  const renderStatusBadge = (status) => {
    return (
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
        <Text style={styles.statusText}>{status}</Text>
      </View>
    );
  };

  const renderAppointmentCard = (appointment) => {
    if (appointment.isCourtesy) {
      return (
        <TouchableOpacity
          key={appointment.id}
          style={styles.courtesyCard}
          onPress={() => setState(prev => ({
            ...prev,
            selectedAppointment: appointment,
            detailsModalVisible: true
          }))}
        >
          <View style={styles.courtesyHeader}>
            <View style={styles.courtesyIconContainer}>
              <FontAwesome5 name="handshake" size={16} color="#003580" />
            </View>
            <View style={styles.courtesyTitleContainer}>
              <Text style={styles.courtesyTitle}>{appointment.type}</Text>
              <Text style={styles.courtesySubtitle}>VIP/Courtesy Request</Text>
            </View>
            {renderStatusBadge(appointment.status)}
          </View>
  
          <View style={styles.courtesyBody}>
            <View style={styles.courtesyDetailRow}>
              <Text style={styles.courtesyDetailLabel}>Purpose:</Text>
              <Text style={styles.courtesyDetailValue}>{appointment.purpose}</Text>
            </View>
            <View style={styles.courtesyDetailRow}>
              <Text style={styles.courtesyDetailLabel}>Submitted:</Text>
              <Text style={styles.courtesyDetailValue}>
                {formatDisplayDate(appointment.createdAt)}
              </Text>
            </View>
            {appointment.status === 'Confirmed' && appointment.date && (
              <View style={styles.courtesyDetailRow}>
                <Text style={styles.courtesyDetailLabel}>Scheduled:</Text>
                <Text style={styles.courtesyDetailValue}>
                  {formatDisplayDate(appointment.date)} at {formatTime(appointment.date)}
                </Text>
              </View>
            )}
          </View>
  
          <View style={styles.courtesyFooter}>
            <TouchableOpacity 
              style={styles.courtesyButton}
              onPress={() => setState(prev => ({
                ...prev,
                selectedAppointment: appointment,
                detailsModalVisible: true
              }))}
            >
              <FontAwesome5 name="info-circle" size={12} color="#FFFFFF" />
              <Text style={styles.courtesyButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={appointment.id}
        style={styles.appointmentCard}
        onPress={() => setState(prev => ({
          ...prev,
          selectedAppointment: appointment,
          detailsModalVisible: true
        }))}
      >
        <View style={styles.appointmentHeader}>
          <View style={styles.dateContainer}>
            <Text style={styles.dateDay}>{appointment.date.getDate()}</Text>
            <Text style={styles.dateMonth}>
              {appointment.date.toLocaleString("default", { month: "short" })}
            </Text>
          </View>
  
          <View style={styles.appointmentInfo}>
            <Text style={styles.appointmentType}>{appointment.type}</Text>
            <View style={styles.appointmentTimeRow}>
              <FontAwesome5 name="clock" size={12} color="#003580" />
              <Text style={styles.appointmentTime}>{formatTime(appointment.date)}</Text>
              {appointment.isVirtual && (
                <View style={styles.virtualBadge}>
                  <FontAwesome5 name="video" size={10} color="#FFFFFF" />
                  <Text style={styles.virtualText}>Virtual</Text>
                </View>
              )}
            </View>
          </View>
  
          {renderStatusBadge(appointment.status)}
        </View>
  
        <View style={styles.appointmentBody}>
          <Text style={styles.purposeLabel}>Purpose:</Text>
          <Text style={styles.purposeText}>{appointment.purpose}</Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  const renderAppointmentsByTimeSlot = (appointments) => {
    const morning = appointments.filter(a => getTimeSlot(formatTime(a.date)) === 'Morning');
    const afternoon = appointments.filter(a => getTimeSlot(formatTime(a.date)) === 'Afternoon');

    return (
      <>
        {morning.length > 0 && (
          <>
            <View style={styles.timeSlotHeader}>
              <Text style={styles.timeSlotTitle}>Morning</Text>
            </View>
            {morning.map(renderAppointmentCard)}
          </>
        )}

        {afternoon.length > 0 && (
          <>
            <View style={styles.timeSlotHeader}>
              <Text style={styles.timeSlotTitle}>Afternoon</Text>
            </View>
            {afternoon.map(renderAppointmentCard)}
          </>
        )}
      </>
    );
  };

  const upcomingAppointments = state.appointments.filter(
    a => a.date >= new Date() && a.status !== "Cancelled"
  );
  const pastAppointments = state.appointments.filter(
    a => a.date < new Date() || a.status === "Cancelled"
  );
  const filteredUpcoming = filterAppointmentsByDate(upcomingAppointments);
  const filteredPast = filterAppointmentsByDate(pastAppointments);

  if (state.loading && !state.refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#003580" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#003580" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Appointments</Text>
        <TouchableOpacity
          style={styles.newAppointmentButton}
          onPress={() => setState(prev => ({
            ...prev,
            selectedAppointment: null,
            appointmentModalVisible: true
          }))}
        >
          <FontAwesome5 name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.newAppointmentText}>New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.calendarToggle}>
        <TouchableOpacity 
          onPress={() => setState(prev => ({ ...prev, calendarView: 'week' }))}
          style={[styles.toggleButton, state.calendarView === 'week' && styles.activeToggle]}
        >
          <Text style={[styles.toggleText, state.calendarView === 'week' && styles.activeToggleText]}>Week</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setState(prev => ({ ...prev, calendarView: 'month' }))}
          style={[styles.toggleButton, state.calendarView === 'month' && styles.activeToggle]}
        >
          <Text style={[styles.toggleText, state.calendarView === 'month' && styles.activeToggleText]}>Month</Text>
        </TouchableOpacity>
      </View>

      {state.calendarView === 'month' ? (
        <View>
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={() => handleMonthChange(-1)}>
              <FontAwesome5 name="chevron-left" size={20} color="#003580" />
            </TouchableOpacity>
            
            <Text style={styles.monthTitle}>
              {state.currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </Text>
            
            <TouchableOpacity onPress={() => handleMonthChange(1)}>
              <FontAwesome5 name="chevron-right" size={20} color="#003580" />
            </TouchableOpacity>
          </View>

          <MonthCalendar 
            selectedDate={state.selectedDate}
            onSelectDate={(date) => setState(prev => ({ ...prev, selectedDate: date }))}
            appointmentCounts={state.appointmentCounts}
            currentMonth={state.currentMonth}
            existingAppointments={state.appointments}
            currentUserId={currentUser?.uid}
          />
        </View>
      ) : (
        <WeekCalendar 
          selectedDate={state.selectedDate}
          onSelectDate={(date) => setState(prev => ({ ...prev, selectedDate: date }))}
          appointmentCounts={state.appointmentCounts}
          existingAppointments={state.appointments}
          currentUserId={currentUser?.uid}
        />
      )}

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={state.refreshing}
            onRefresh={handleRefresh}
            colors={["#003580"]}
          />
        }
      >
        <Text style={styles.selectedDateHeader}>
          {formatDisplayDate(state.selectedDate)}
        </Text>

        {state.appointments.length === 0 && state.courtesyAppointments.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome5 name="calendar-check" size={50} color="#CCCCCC" />
            <Text style={styles.emptyStateText}>No appointments scheduled</Text>
          </View>
        ) : (
          <>
            {filteredUpcoming.length > 0 && (
              <>
                <Text style={styles.sectionHeader}>Upcoming Appointments</Text>
                {renderAppointmentsByTimeSlot(filteredUpcoming)}
              </>
            )}

            {filteredPast.length > 0 && (
              <>
                <Text style={styles.sectionHeader}>Past Appointments</Text>
                {renderAppointmentsByTimeSlot(filteredPast)}
              </>
            )}

            {filteredUpcoming.length === 0 && filteredPast.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No appointments for this date</Text>
              </View>
            )}

            {state.courtesyAppointments.length > 0 && (
              <>
                <Text style={styles.sectionHeader}>Courtesy Requests</Text>
                {state.courtesyAppointments.map(appointment => (
                  <View key={appointment.id} style={styles.courtesyCard}>
                    <View style={styles.courtesyHeader}>
                      <View style={styles.courtesyIconContainer}>
                        <FontAwesome5 name="handshake" size={20} color="#003580" />
                      </View>
                      <View style={styles.courtesyTitleContainer}>
                        <Text style={styles.courtesyTitle}>VIP/Courtesy Request</Text>
                        <Text style={styles.courtesySubtitle}>
                          {appointment.requesterName || "VIP Guest"}
                        </Text>
                      </View>
                      <View style={[
                        styles.statusBadge, 
                        { backgroundColor: getStatusColor(appointment.status) }
                      ]}>
                        <Text style={styles.statusText}>{appointment.status}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.courtesyBody}>
                      <View style={styles.courtesyDetailRow}>
                        <Text style={styles.courtesyDetailLabel}>Purpose:</Text>
                        <Text style={styles.courtesyDetailValue}>{appointment.purpose}</Text>
                      </View>
                      
                      <View style={styles.courtesyDetailRow}>
                        <Text style={styles.courtesyDetailLabel}>Submitted:</Text>
                        <Text style={styles.courtesyDetailValue}>
                          {formatDisplayDate(appointment.createdAt)}
                        </Text>
                      </View>
                      
                      {appointment.status === "Confirmed" && (
                        <View style={styles.courtesyDetailRow}>
                          <Text style={styles.courtesyDetailLabel}>Scheduled:</Text>
                          <Text style={styles.courtesyDetailValue}>
                            {formatDisplayDate(appointment.date)} at {formatTime(appointment.date)}
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.courtesyFooter}>
                      <TouchableOpacity 
                        style={styles.courtesyButton}
                        onPress={() => setState(prev => ({
                          ...prev,
                          selectedAppointment: appointment,
                          detailsModalVisible: true
                        }))}
                      >
                        <Text style={styles.courtesyButtonText}>View Details</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      <AppointmentForm
        visible={state.appointmentModalVisible}
        onClose={() => setState(prev => ({
          ...prev,
          appointmentModalVisible: false,
          selectedAppointment: null
        }))}
        onSubmit={(data) => {
          if (state.selectedAppointment) {
            handleRescheduleAppointment(
              state.selectedAppointment,
              data.date,
              data.time
            ).then((success) => {
              if (success) {
                setState(prev => ({
                  ...prev,
                  appointmentModalVisible: false
                }));
              }
            });
          } else {
            handleSubmitAppointment(data);
          }
        }}
        initialData={state.selectedAppointment}
        disabledDates={[...HOLIDAYS]}
        existingAppointments={state.appointments}
        currentUserId={currentUser?.uid}
      />

{state.detailsModalVisible && state.selectedAppointment && (
  <Modal
    visible={state.detailsModalVisible}
    transparent
    animationType="slide"
    onRequestClose={() => setState(prev => ({ ...prev, detailsModalVisible: false }))}
  >
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Appointment Details</Text>
          <TouchableOpacity onPress={() => setState(prev => ({ ...prev, detailsModalVisible: false }))}>
            <FontAwesome5 name="times" size={20} color="#003580" />
          </TouchableOpacity>
        </View>

        <ScrollView>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type:</Text>
            <Text style={styles.detailValue}>
              {state.selectedAppointment.type}
              {state.selectedAppointment.isCourtesy && " (Courtesy)"}
            </Text>
          </View>
          
          {!state.selectedAppointment.isCourtesy && (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date:</Text>
                <Text style={styles.detailValue}>
                  {formatDisplayDate(state.selectedAppointment.date)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Time:</Text>
                <Text style={styles.detailValue}>
                  {formatTime(state.selectedAppointment.date)} ({getTimeSlot(formatTime(state.selectedAppointment.date))})
                </Text>
              </View>
            </>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Purpose:</Text>
            <Text style={styles.detailValue}>{state.selectedAppointment.purpose}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={styles.detailValue}>{state.selectedAppointment.status}</Text>
          </View>

          {state.selectedAppointment.status === "Cancelled" && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Cancelled On:</Text>
              <Text style={styles.detailValue}>
                {formatDisplayDate(state.selectedAppointment.cancelledAt)}
              </Text>
            </View>
          )}

          {state.selectedAppointment.createdAt && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Submitted:</Text>
              <Text style={styles.detailValue}>
                {formatDisplayDate(state.selectedAppointment.createdAt)}
              </Text>
            </View>
          )}

          {state.selectedAppointment.isCourtesy && state.selectedAppointment.status === "Confirmed" && (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Scheduled Date:</Text>
                <Text style={styles.detailValue}>
                  {formatDisplayDate(state.selectedAppointment.date)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Scheduled Time:</Text>
                <Text style={styles.detailValue}>
                  {formatTime(state.selectedAppointment.date)}
                </Text>
              </View>
            </>
          )}

          {(!state.selectedAppointment.isCourtesy || 
            (state.selectedAppointment.isCourtesy && state.selectedAppointment.status === "Confirmed")) && 
            state.selectedAppointment.date >= new Date() && 
            state.selectedAppointment.status !== "Cancelled" && (
              <View style={styles.modalButtons}>
                {!state.selectedAppointment.isCourtesy && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rescheduleButton]}
                    onPress={() => setState(prev => ({
                      ...prev,
                      detailsModalVisible: false,
                      appointmentModalVisible: true
                    }))}
                  >
                    <FontAwesome5 name="calendar-alt" size={16} color="white" />
                    <Text style={styles.buttonText}>Reschedule</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => handleCancelAppointment(state.selectedAppointment)}
                >
                  <FontAwesome5 name="times" size={16} color="white" />
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
          )}
        </ScrollView>
      </View>
    </View>
  </Modal>
)}
    </SafeAreaView>
  );
}