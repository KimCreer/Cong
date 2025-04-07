import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { getAuth } from "@react-native-firebase/auth";
import { getFirestore, collection, query, where, orderBy, getDocs, addDoc, doc, updateDoc, onSnapshot } from "@react-native-firebase/firestore";
import { useFocusEffect } from "@react-navigation/native";
import AppointmentForm from "../components/AppointmentForm";

// Constants
const HOLIDAYS = [
  '01-01', '01-29', '04-01', '04-09', '04-17', 
  '04-18', '04-19', '05-01', '06-07', '06-12',
  '08-21', '08-25', '10-31', '11-01', '11-30',
  '12-08', '12-24', '12-25', '12-30', '12-31'
];
const MAX_DAILY_APPOINTMENTS = 6;
const TIME_SLOT_CONFLICT_MINUTES = 60;

// Date Utilities
const formatDate = (date, formatStr) => {
  const d = new Date(date);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return formatStr
    .replace('yyyy', d.getFullYear())
    .replace('MM', String(d.getMonth() + 1).padStart(2, '0'))
    .replace('dd', String(d.getDate()).padStart(2, '0'))
    .replace('EEE', days[d.getDay() - 1] || '')
    .replace('MMM', months[d.getMonth()])
    .replace('d', d.getDate());
};

const isSameDay = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const getTimeSlot = (time) => {
  const hour = parseInt(time.split(':')[0]);
  return hour < 12 ? 'Morning' : 'Afternoon';
};

const isHoliday = (date) => HOLIDAYS.includes(formatDate(date, 'MM-dd'));
const isWeekend = (date) => date.getDay() === 0 || date.getDay() === 6;

// Calendar Components
const CalendarDay = ({ 
  date, 
  isSelected, 
  isToday, 
  isUnavailable, 
  hasAppointment, 
  appointmentStatus, 
  density, 
  onPress,
  dayName,
  dayNumber,
  isMonthView = false
}) => {
  // Determine color based on status and density
  let dayColor = '#4CAF50'; // Default available color
  let statusIndicator = null;
  
  if (isUnavailable) {
    dayColor = '#CCCCCC';
  } else if (hasAppointment) {
    if (appointmentStatus === 'Confirmed') {
      dayColor = '#4CAF50';
      statusIndicator = '✓';
    } else if (appointmentStatus === 'Pending') {
      dayColor = '#FF9800';
      statusIndicator = '?';
    } else if (appointmentStatus === 'Completed') {
      dayColor = '#2196F3';
      statusIndicator = '✓';
    }
  } else if (density >= 40) {
    dayColor = '#F44336';
  } else if (density >= 30) {
    dayColor = '#FF5722';
  } else if (density >= 20) {
    dayColor = '#FF9800';
  } else if (density >= 10) {
    dayColor = '#FFC107';
  } else if (density >= 1) {
    dayColor = '#8BC34A';
  }

  const Container = isMonthView ? styles.monthDayContainer : styles.dayContainer;
  const DayNumber = isMonthView ? styles.monthDayNumber : styles.dayNumber;

  return (
    <TouchableOpacity
      style={[
        Container,
        isSelected && { backgroundColor: dayColor },
        isToday && !isSelected && styles.todayDay,
        isUnavailable && styles.unavailableDay,
        hasAppointment && !isUnavailable && styles.bookedDay
      ]}
      onPress={() => !isUnavailable && onPress(formatDate(date, 'yyyy-MM-dd'))}
      disabled={isUnavailable}
    >
      {!isMonthView && (
        <Text style={[
          styles.dayName, 
          isSelected && styles.selectedText,
          isUnavailable && styles.unavailableText,
          hasAppointment && !isUnavailable && styles.bookedText
        ]}>
          {dayName}
        </Text>
      )}
      <Text style={[
        DayNumber, 
        isSelected && styles.selectedText,
        isUnavailable && styles.unavailableText,
        hasAppointment && !isUnavailable && styles.bookedText
      ]}>
        {dayNumber}
      </Text>
      {hasAppointment && !isUnavailable && (
        <Text style={[styles.densityBadge, isSelected && styles.selectedText]}>
          {statusIndicator || 'Booked'}
        </Text>
      )}
      {!hasAppointment && !isUnavailable && density > 0 && (
        <Text style={[styles.densityBadge, isSelected && styles.selectedText]}>
          {density}
        </Text>
      )}
      {isUnavailable && !isMonthView && (
        <Text style={styles.unavailableText}>Unavl</Text>
      )}
    </TouchableOpacity>
  );
};

const WeekCalendar = ({ selectedDate, onSelectDate, appointmentCounts, existingAppointments, currentUserId }) => {
  const today = new Date();
  const days = Array.from({ length: 5 }, (_, i) => addDays(today, i - today.getDay() + 1));

  const getAppointmentStatus = (date) => {
    if (!existingAppointments || !currentUserId) return null;
    const dateStr = formatDate(date, 'yyyy-MM-dd');
    const appointment = existingAppointments.find(appt => 
      appt.userId === currentUserId && 
      formatDate(new Date(appt.date), 'yyyy-MM-dd') === dateStr &&
      appt.status !== "Cancelled"
    );
    return appointment?.status || null;
  };

  return (
    <View style={styles.weekCalendar}>
      {days.map((date) => {
        const dateStr = formatDate(date, 'yyyy-MM-dd');
        return (
          <CalendarDay
            key={dateStr}
            date={date}
            isSelected={dateStr === selectedDate}
            isToday={isSameDay(date, today)}
            isUnavailable={isWeekend(date) || isHoliday(date)}
            hasAppointment={existingAppointments?.some(appt => 
              appt.userId === currentUserId && 
              formatDate(new Date(appt.date), 'yyyy-MM-dd') === dateStr &&
              appt.status !== "Cancelled"
            )}
            appointmentStatus={getAppointmentStatus(date)}
            density={appointmentCounts[dateStr] || 0}
            onPress={onSelectDate}
            dayName={formatDate(date, 'EEE')}
            dayNumber={formatDate(date, 'd')}
          />
        );
      })}
    </View>
  );
};

const MonthCalendar = ({ selectedDate, onSelectDate, appointmentCounts, currentMonth, existingAppointments, currentUserId }) => {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  // Generate days array with empty slots for alignment
  const days = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1))
  ];

  const getAppointmentStatus = (date) => {
    if (!existingAppointments || !currentUserId) return null;
    const dateStr = formatDate(date, 'yyyy-MM-dd');
    const appointment = existingAppointments.find(appt => 
      appt.userId === currentUserId && 
      formatDate(new Date(appt.date), 'yyyy-MM-dd') === dateStr &&
      appt.status !== "Cancelled"
    );
    return appointment?.status || null;
  };

  const renderDay = ({ item: date }) => {
    if (!date) return <View style={[styles.monthDayContainer, styles.emptyDay]} />;

    const dateStr = formatDate(date, 'yyyy-MM-dd');
    return (
      <CalendarDay
        date={date}
        isSelected={dateStr === selectedDate}
        isToday={isSameDay(date, new Date())}
        isUnavailable={isWeekend(date) || isHoliday(date)}
        hasAppointment={existingAppointments?.some(appt => 
          appt.userId === currentUserId && 
          formatDate(new Date(appt.date), 'yyyy-MM-dd') === dateStr &&
          appt.status !== "Cancelled"
        )}
        appointmentStatus={getAppointmentStatus(date)}
        density={appointmentCounts[dateStr] || 0}
        onPress={onSelectDate}
        dayNumber={date.getDate()}
        isMonthView={true}
      />
    );
  };

  return (
    <View style={styles.monthContainer}>
      <View style={styles.weekdayHeader}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <Text key={day} style={styles.weekdayText}>{day}</Text>
        ))}
      </View>
      <FlatList
        data={days}
        renderItem={renderDay}
        keyExtractor={(item, index) => index.toString()}
        numColumns={7}
        scrollEnabled={false}
      />
    </View>
  );
};

// Main Component
export default function AppointmentsScreen({ navigation }) {
  const [state, setState] = useState({
    loading: true,
    refreshing: false,
    appointments: [],
    appointmentModalVisible: false,
    selectedAppointment: null,
    detailsModalVisible: false,
    selectedDate: formatDate(new Date(), 'yyyy-MM-dd'),
    appointmentCounts: {},
    currentMonth: new Date(),
    calendarView: 'week'
  });

  const auth = getAuth();
  const currentUser = auth.currentUser;

  // Fetch data functions
  const fetchAppointmentCounts = useCallback(async () => {
    try {
      const db = getFirestore();
      const q = query(
        collection(db, "appointments"),
        where("status", "in", ["Confirmed", "Pending", "Completed"])
      );
      
      const snapshot = await getDocs(q);
      const counts = {};
      
      snapshot.forEach(doc => {
        const appt = doc.data();
        const dateStr = formatDate(new Date(appt.date), 'yyyy-MM-dd');
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
      
      const snapshot = await getDocs(q);
      const appointmentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const counts = await fetchAppointmentCounts();
      
      setState(prev => ({
        ...prev,
        appointments: appointmentsData.sort((a, b) => new Date(a.date) - new Date(b.date)),
        appointmentCounts: counts,
        loading: false,
        refreshing: false
      }));
    } catch (error) {
      Alert.alert("Error", "Failed to load appointments");
      setState(prev => ({ ...prev, loading: false, refreshing: false }));
    }
  }, [currentUser, fetchAppointmentCounts]);

  // Effects
  useEffect(() => {
    const db = getFirestore();
    const q = query(collection(db, "appointments"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const counts = {};
      const appointmentsData = [];
      
      snapshot.forEach(doc => {
        const appt = { id: doc.id, ...doc.data() };
        
        if (appt.userId === currentUser?.uid) {
          appointmentsData.push(appt);
        }
        
        if (["Confirmed", "Pending", "Completed"].includes(appt.status)) {
          const dateStr = formatDate(new Date(appt.date), 'yyyy-MM-dd');
          counts[dateStr] = (counts[dateStr] || 0) + 1;
        }
      });
      
      setState(prev => ({
        ...prev,
        appointments: appointmentsData.sort((a, b) => new Date(a.date) - new Date(b.date)),
        appointmentCounts: counts
      }));
    });

    return unsubscribe;
  }, [currentUser]);

  useFocusEffect(useCallback(() => { fetchAppointments(); }, [fetchAppointments]));

  // Handlers
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
      const dateStr = formatDate(new Date(date), 'yyyy-MM-dd');
      
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
        const [existingHours, existingMinutes] = doc.data().time.split(':').map(Number);
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
  
      const appointmentDate = new Date(appointmentData.date);
      const dateStr = formatDate(appointmentDate, 'yyyy-MM-dd');
      
      // Validation checks
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
      if (await checkForTimeConflict(currentUser.uid, appointmentData.date, appointmentData.time)) {
        Alert.alert("Time Conflict", "You already have an appointment within this time frame.");
        return;
      }
  
      // Create appointment
      const db = getFirestore();
      await addDoc(collection(db, "appointments"), {
        ...appointmentData,
        userId: currentUser.uid,
        status: "Pending",
        createdAt: new Date().toISOString()
      });
  
      setState(prev => ({ ...prev, appointmentModalVisible: false }));
      Alert.alert("Success", "Appointment scheduled!");
    } catch (error) {
      console.error("Appointment error:", error);
      Alert.alert("Error", "Failed to schedule appointment");
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleRescheduleAppointment = async (appointment, newDate, newTime) => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      if (!currentUser) return false;

      const appointmentDate = new Date(newDate);
      const dateStr = formatDate(appointmentDate, 'yyyy-MM-dd');
      
      // Validation checks
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

      // Update appointment
      const db = getFirestore();
      await updateDoc(doc(db, "appointments", appointment.id), {
        date: newDate,
        time: newTime,
        status: "Confirmed",
      });

      Alert.alert("Success", "Appointment rescheduled!");
      return true;
    } catch (error) {
      console.error("Reschedule error:", error);
      Alert.alert("Error", "Failed to reschedule appointment");
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
                cancelledAt: new Date().toISOString(),
              });
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

  // Helper functions
  const filterAppointmentsByDate = (appointments) => {
    return appointments.filter(appt => 
      formatDate(new Date(appt.date), 'yyyy-MM-dd') === state.selectedDate
    );
  };

  const renderStatusBadge = (status) => {
    const colors = {
      Confirmed: "#4CAF50",
      Pending: "#FF9800",
      Cancelled: "#F44336",
      Completed: "#2196F3",
    };
    return (
      <View style={[styles.statusBadge, { backgroundColor: colors[status] || "#9E9E9E" }]}>
        <Text style={styles.statusText}>{status}</Text>
      </View>
    );
  };

  const renderAppointmentCard = (appointment) => (
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
          <Text style={styles.dateDay}>{new Date(appointment.date).getDate()}</Text>
          <Text style={styles.dateMonth}>
            {new Date(appointment.date).toLocaleString("default", { month: "short" })}
          </Text>
        </View>

        <View style={styles.appointmentInfo}>
          <Text style={styles.appointmentType}>{appointment.type}</Text>
          <View style={styles.appointmentTimeRow}>
            <FontAwesome5 name="clock" size={12} color="#003580" />
            <Text style={styles.appointmentTime}>{appointment.time}</Text>
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

  const renderAppointmentsByTimeSlot = (appointments) => {
    const morning = appointments.filter(a => getTimeSlot(a.time) === 'Morning');
    const afternoon = appointments.filter(a => getTimeSlot(a.time) === 'Afternoon');

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

  // Derived state
  const upcomingAppointments = state.appointments.filter(
    a => new Date(a.date) >= new Date() && a.status !== "Cancelled"
  );
  const pastAppointments = state.appointments.filter(
    a => new Date(a.date) < new Date() || a.status === "Cancelled"
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
          {new Date(state.selectedDate).toLocaleDateString("en-US", {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          })}
        </Text>

        {state.appointments.length === 0 ? (
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
                  <Text style={styles.detailValue}>{state.selectedAppointment.type}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(state.selectedAppointment.date).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Time:</Text>
                  <Text style={styles.detailValue}>
                    {state.selectedAppointment.time} ({getTimeSlot(state.selectedAppointment.time)})
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Purpose:</Text>
                  <Text style={styles.detailValue}>{state.selectedAppointment.purpose}</Text>
                </View>

                {state.selectedAppointment.status === "Cancelled" && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Cancelled On:</Text>
                    <Text style={styles.detailValue}>
                      {new Date(state.selectedAppointment.cancelledAt).toLocaleDateString()}
                    </Text>
                  </View>
                )}

                {new Date(state.selectedAppointment.date) >= new Date() && 
                state.selectedAppointment.status !== "Cancelled" && (
                  <View style={styles.modalButtons}>
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
                    
                    <TouchableOpacity
                      style={[styles.actionButton, styles.cancelButton]}
                      onPress={() => handleCancelAppointment(state.selectedAppointment)}
                    >
                      <FontAwesome5 name="times" size={16} color="white" />
                      <Text style={styles.buttonText}>Cancel Appointment</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#003580",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  newAppointmentButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  newAppointmentText: {
    color: "#FFFFFF",
    marginLeft: 8,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  weekCalendar: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 8,
    backgroundColor: "#F5F5F5",
  },
  dayContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 60,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  monthDayContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    margin: 4,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
  },
  todayDay: {
    borderWidth: 2,
    borderColor: "#003580",
  },
  unavailableDay: {
    backgroundColor: "#EEEEEE",
  },
  bookedDay: {
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  dayName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333333",
  },
  dayNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
    marginVertical: 4,
  },
  monthDayNumber: {
    fontSize: 16,
    color: "#333333",
  },
  selectedText: {
    color: "#FFFFFF",
  },
  unavailableText: {
    color: "#999999",
  },
  bookedText: {
    color: "#4CAF50",
  },
  densityBadge: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#333333",
    marginTop: 4,
  },
  monthContainer: {
    padding: 8,
    backgroundColor: "#F5F5F5",
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#003580",
  },
  weekdayHeader: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  weekdayText: {
    width: 40,
    textAlign: "center",
    fontWeight: "bold",
    color: "#003580",
  },
  emptyDay: {
    backgroundColor: "transparent",
  },
  calendarToggle: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 8,
  },
  toggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 4,
    backgroundColor: "#E0E0E0",
  },
  activeToggle: {
    backgroundColor: "#003580",
  },
  toggleText: {
    color: "#333333",
    fontWeight: "bold",
  },
  activeToggleText: {
    color: "#FFFFFF",
  },
  selectedDateHeader: {
    fontSize: 18,
    fontWeight: "bold",
    padding: 16,
    color: "#003580",
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "bold",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    color: "#003580",
  },
  appointmentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  dateContainer: {
    alignItems: "center",
    marginRight: 16,
  },
  dateDay: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#003580",
  },
  dateMonth: {
    fontSize: 12,
    color: "#666666",
    textTransform: "uppercase",
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentType: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 4,
  },
  appointmentTimeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  appointmentTime: {
    fontSize: 14,
    color: "#666666",
    marginLeft: 4,
  },
  virtualBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  virtualText: {
    fontSize: 10,
    color: "#FFFFFF",
    marginLeft: 4,
  },
  statusBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  appointmentBody: {},
  purposeLabel: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 4,
  },
  purposeText: {
    fontSize: 14,
    color: "#333333",
  },
  timeSlotHeader: {
    backgroundColor: "#F5F5F5",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  timeSlotTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666666",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#999999",
    marginTop: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#003580",
  },
  detailRow: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  detailLabel: {
    width: 100,
    fontSize: 14,
    fontWeight: "bold",
    color: "#666666",
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: "#333333",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 4,
    marginHorizontal: 8,
  },
  rescheduleButton: {
    backgroundColor: "#4CAF50",
  },
  cancelButton: {
    backgroundColor: "#F44336",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginLeft: 8,
  },
});