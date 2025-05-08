import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { formatDate, isSameDay, addDays } from '../utils/dateUtils';
import { isWeekend, isHoliday, isDateUnavailable } from '../utils/validationUtils';
import { styles } from '../styles/styles';

const WeekCalendar = ({ selectedDate, onSelectDate, existingAppointments, currentUserId, blockedDates, onBlockedDateTap }) => {
  const today = new Date();
  const days = [];
  
  // Get the next 5 weekdays starting from today
  let currentDay = new Date(today);
  let daysAdded = 0;
  
  while (daysAdded < 5) {
    if (currentDay.getDay() !== 0 && currentDay.getDay() !== 6) {
      days.push(new Date(currentDay));
      daysAdded++;
    }
    currentDay = addDays(currentDay, 1);
  }

  const hasAppointmentOnDay = (date) => {
    if (!existingAppointments || !currentUserId || !date) return false;
    
    const dateStr = formatDate(date, 'yyyy-MM-dd');
    
    return existingAppointments.some(appt => {
      if (!appt.date) return false;
      const isSameUser = appt.userId === currentUserId;
      const isSameDate = formatDate(new Date(appt.date), 'yyyy-MM-dd') === dateStr;
      return isSameUser && isSameDate;
    });
  };

  const isDateBlocked = (date) => {
    if (!blockedDates || !date) return false;
    return blockedDates.some(blockedDate => isSameDay(blockedDate.date, date));
  };

  return (
    <View style={styles.weekCalendar}>
      {days.map((date) => {
        const dateStr = formatDate(date, 'yyyy-MM-dd');
        const isSelected = selectedDate && isSameDay(date, new Date(selectedDate));
        const dayName = formatDate(date, 'EEE');
        const dayNumber = formatDate(date, 'd');
        const isToday = isSameDay(date, today);
        const isUnavailable = isDateUnavailable(date) || isDateBlocked(date);
        const hasAppointment = hasAppointmentOnDay(date);

        return (
          <TouchableOpacity
            key={dateStr}
            style={[
              styles.dayContainer,
              isSelected && { backgroundColor: '#4CAF50' },
              isToday && !isSelected && styles.todayDay,
              isUnavailable && styles.unavailableDay,
              hasAppointment && styles.bookedDay
            ]}
            onPress={() => {
              if (isUnavailable) {
                if (isDateBlocked(date)) {
                  onBlockedDateTap(date);
                }
              } else if (!hasAppointment) {
                onSelectDate(dateStr);
              }
            }}
            disabled={hasAppointment}
          >
            <Text style={[
              styles.dayName, 
              isSelected && styles.selectedText,
              (isUnavailable || hasAppointment) && styles.unavailableText
            ]}>
              {dayName}
            </Text>
            <Text style={[
              styles.dayNumber, 
              isSelected && styles.selectedText,
              (isUnavailable || hasAppointment) && styles.unavailableText
            ]}>
              {dayNumber}
            </Text>
            {hasAppointment && !isUnavailable && (
              <Text style={styles.unavailableText}>Booked</Text>
            )}
            {isUnavailable && !isWeekend(date) && !isHoliday(date) && isDateBlocked(date) && (
              <Text style={styles.unavailableText}>Blocked</Text>
            )}
            {isUnavailable && !isWeekend(date) && !isHoliday(date) && !isDateBlocked(date) && (
              <Text style={styles.unavailableText}>Past</Text>
            )}
            {isUnavailable && (isWeekend(date) || isHoliday(date)) && (
              <Text style={styles.unavailableText}>Unavail</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default WeekCalendar; 