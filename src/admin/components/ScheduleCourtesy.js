import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { getFirestore, doc, getDoc, updateDoc, serverTimestamp } from '@react-native-firebase/firestore';
import { useNavigation, useRoute } from '@react-navigation/native';

function formatSelectedDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString([], {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

const ScheduleCourtesy = ({ navigation }) => {
  const route = useRoute();
  const { appointmentId } = route.params;
  
  const [appointment, setAppointment] = useState(null);
  const [requester, setRequester] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [daysInMonth, setDaysInMonth] = useState([]);

  const db = getFirestore();

  useEffect(() => {
    const fetchAppointmentAndUser = async () => {
      try {
        setFetching(true);
        const docRef = doc(db, 'appointments', appointmentId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists) {
          const appointmentData = docSnap.data();
          setAppointment(appointmentData);
          
          if (appointmentData.date) {
            try {
              const appointmentDate = appointmentData.date.toDate 
                ? appointmentData.date.toDate() 
                : new Date(appointmentData.date);
              
              if (!isNaN(appointmentDate.getTime())) {
                setSelectedDate(appointmentDate.toISOString().split('T')[0]);
                setSelectedTime(appointmentDate);
              }
            } catch (e) {
              console.warn('Invalid existing date:', e);
            }
          }

          if (appointmentData.userId) {
            const userRef = doc(db, 'users', appointmentData.userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists) {
              setRequester(userSnap.data());
            }
          }
        } else {
          Alert.alert('Error', 'Appointment not found');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'Failed to load appointment details');
        navigation.goBack();
      } finally {
        setFetching(false);
      }
    };

    fetchAppointmentAndUser();
  }, [appointmentId]);

  useEffect(() => {
    generateMonthDays();
  }, [currentMonth]);

  const generateMonthDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    const startingDay = firstDay.getDay();
    
    for (let i = 0; i < startingDay; i++) {
      days.push({ day: null, date: null });
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({ 
        day: i, 
        date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
        isToday: isToday(date),
        isPast: isPastDate(date),
        isWeekend: date.getDay() === 0 || date.getDay() === 6
      });
    }
    
    setDaysInMonth(days);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const changeMonth = (increment) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + increment);
    setCurrentMonth(newMonth);
  };

  const handleDateSelect = (date) => {
    if (isPastDate(new Date(date + 'T00:00:00'))) {
      Alert.alert('Invalid Date', 'Cannot select past dates');
      return;
    }
    setSelectedDate(date);
    setShowTimePicker(true);
  };

  const handleTimeChange = (event, time) => {
    if (time) {
      setSelectedTime(time);
    }
    setShowTimePicker(Platform.OS === 'ios');
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMonthName = () => {
    return currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const scheduleAppointment = async () => {
    if (!selectedDate) {
      Alert.alert('Error', 'Please select a date first');
      return;
    }

    setLoading(true);
    try {
      const dateObj = new Date(selectedDate + 'T00:00:00');
      const timeObj = new Date(selectedTime);
      
      dateObj.setHours(timeObj.getHours());
      dateObj.setMinutes(timeObj.getMinutes());
      
      const scheduledDateTime = new Date(dateObj);
      
      await updateDoc(doc(db, 'appointments', appointmentId), {
        date: scheduledDateTime,
        time: formatTime(timeObj),
        status: 'Confirmed',
        updatedAt: serverTimestamp(),
        scheduledBy: 'admin',
        isScheduled: true,
        createdAt: appointment.createdAt 
      });

      Alert.alert(
        'Success', 
        'Courtesy appointment scheduled successfully',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      Alert.alert('Error', 'Failed to schedule appointment');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6c5ce7" />
        <Text style={styles.loadingText}>Loading appointment details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#003366" />
        </TouchableOpacity>
        <Text style={styles.title}>Schedule Courtesy Appointment</Text>
      </View>

      {appointment && (
        <View style={styles.appointmentInfo}>
          <Text style={styles.infoTitle}>Appointment Details</Text>
          <Text style={styles.infoText}>
            <Text style={styles.infoLabel}>Purpose:</Text> {appointment.purpose}
          </Text>
          <Text style={styles.infoText}>
            <Text style={styles.infoLabel}>Type:</Text> {appointment.type}
          </Text>
          
          {requester && (
            <>
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>Requester:</Text> {requester.firstName} {requester.lastName}
              </Text>
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>Phone:</Text> {requester.phone || 'Not provided'}
              </Text>
            </>
          )}
          
          <Text style={styles.infoText}>
            <Text style={styles.infoLabel}>Requested on:</Text> {new Date(appointment.createdAt.seconds * 1000).toLocaleString()}
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Date</Text>
        
        <View style={styles.calendarContainer}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => changeMonth(-1)}>
              <MaterialIcons name="chevron-left" size={24} color="#6c5ce7" />
            </TouchableOpacity>
            
            <Text style={styles.monthTitle}>{getMonthName()}</Text>
            
            <TouchableOpacity onPress={() => changeMonth(1)}>
              <MaterialIcons name="chevron-right" size={24} color="#6c5ce7" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.weekDaysContainer}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Text key={day} style={[
                styles.weekDayText,
                (day === 'Sun' || day === 'Sat') && styles.weekendText
              ]}>
                {day}
              </Text>
            ))}
          </View>
          
          <View style={styles.daysContainer}>
            {daysInMonth.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCell,
                  item.isToday && styles.todayCell,
                  item.date === selectedDate && styles.selectedCell,
                  item.isPast && styles.pastDayCell,
                  item.isWeekend && styles.weekendCell
                ]}
                onPress={() => item.day && !item.isPast && handleDateSelect(item.date)}
                disabled={!item.day || item.isPast}
              >
                {item.day && (
                  <Text style={[
                    styles.dayText,
                    item.isToday && styles.todayText,
                    item.date === selectedDate && styles.selectedText,
                    item.isPast && styles.pastDayText,
                    item.isWeekend && styles.weekendText
                  ]}>
                    {item.day}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {selectedDate && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selected Date & Time</Text>
          <View style={styles.selectedDateTime}>
            <FontAwesome5 name="calendar-alt" size={18} color="#6c5ce7" />
            <Text style={styles.dateText}>
              {formatSelectedDate(selectedDate)}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.timePickerButton}
            onPress={() => setShowTimePicker(true)}
          >
            <FontAwesome5 name="clock" size={18} color="#6c5ce7" />
            <Text style={styles.timeText}>
              {formatTime(selectedTime)}
            </Text>
          </TouchableOpacity>

          {showTimePicker && (
            <DateTimePicker
              value={selectedTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
              minuteInterval={15}
            />
          )}
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.submitButton,
          (!selectedDate || loading) && styles.disabledButton
        ]}
        onPress={scheduleAppointment}
        disabled={!selectedDate || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <FontAwesome5 name="calendar-check" size={16} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.submitButtonText}>
              Confirm Schedule
            </Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    color: '#6c5ce7',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#003366',
    marginLeft: 15,
  },
  appointmentInfo: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#003366',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
  },
  infoLabel: {
    fontWeight: '600',
    color: '#6c5ce7',
  },
  section: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#003366',
    marginBottom: 15,
  },
  calendarContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#003366',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  weekDayText: {
    width: 40,
    textAlign: 'center',
    fontWeight: '600',
    color: '#6c5ce7',
    fontSize: 12,
  },
  weekendText: {
    color: '#e84393',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: 20,
  },
  dayText: {
    fontSize: 16,
    color: '#333',
  },
  todayCell: {
    backgroundColor: '#e6e6fa',
  },
  todayText: {
    color: '#6c5ce7',
    fontWeight: 'bold',
  },
  selectedCell: {
    backgroundColor: '#6c5ce7',
  },
  selectedText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  pastDayCell: {
    opacity: 0.5,
  },
  pastDayText: {
    color: '#ccc',
  },
  weekendCell: {
    backgroundColor: '#fff9fa',
  },
  selectedDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  dateText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#f8f5ff',
    borderRadius: 8,
  },
  timeText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#6c5ce7',
    padding: 15,
    borderRadius: 8,
    margin: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#b8b5c9',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  buttonIcon: {
    marginRight: 10,
  },

  scheduledCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  scheduledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginVertical: 5,
    minWidth: '30%'
  },
  scheduledText: {
    color: '#28a745',
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 5
  },
  // Enhanced action buttons
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    justifyContent: 'center',
    marginVertical: 5,
    minWidth: '30%'
  },
  confirmButton: {
    backgroundColor: '#28a745',
  },
  rejectButton: {
    backgroundColor: '#dc3545',
  },
  detailsButton: {
    backgroundColor: '#007bff',
  },
  scheduleButton: {
    backgroundColor: '#6c5ce7',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 5
  }
});

export default ScheduleCourtesy;