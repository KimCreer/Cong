import React from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { formatDate, isSameDay, isWeekend, isHoliday, getTimeSlot, addDays } from "./utils";

export const CalendarDay = ({ 
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
  let dayColor = '#4CAF50';
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

export const WeekCalendar = ({ selectedDate, onSelectDate, appointmentCounts, existingAppointments, currentUserId }) => {
  const today = new Date();
  const days = Array.from({ length: 5 }, (_, i) => addDays(today, i - today.getDay() + 1));

  const getAppointmentStatus = (date) => {
    if (!existingAppointments || !currentUserId) return null;
    const dateStr = formatDate(date, 'yyyy-MM-dd');
    const appointment = existingAppointments.find(appt => 
      appt.userId === currentUserId && 
      !appt.isCourtesy && // Skip courtesy appointments
      formatDate(new Date(appt.date), 'yyyy-MM-dd') === dateStr &&
      appt.status === "Confirmed" // Only show confirmed appointments
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
              !appt.isCourtesy && // Skip courtesy appointments
              formatDate(new Date(appt.date), 'yyyy-MM-dd') === dateStr &&
              appt.status === "Confirmed" // Only show confirmed appointments
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

export const MonthCalendar = ({ selectedDate, onSelectDate, appointmentCounts, currentMonth, existingAppointments, currentUserId }) => {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  const days = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1))
  ];

  const getAppointmentStatus = (date) => {
    if (!existingAppointments || !currentUserId) return null;
    const dateStr = formatDate(date, 'yyyy-MM-dd');
    const appointment = existingAppointments.find(appt => 
      appt.userId === currentUserId && 
      !appt.isCourtesy && // Skip courtesy appointments
      formatDate(new Date(appt.date), 'yyyy-MM-dd') === dateStr &&
      appt.status === "Confirmed" // Only show confirmed appointments
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
          !appt.isCourtesy && // Skip courtesy appointments
          formatDate(new Date(appt.date), 'yyyy-MM-dd') === dateStr &&
          appt.status === "Confirmed" // Only show confirmed appointments
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

const styles = StyleSheet.create({
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
    color: "#000000",
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
});