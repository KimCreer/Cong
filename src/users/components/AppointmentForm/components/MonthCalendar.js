import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from "@expo/vector-icons";
import { formatDate, isSameDay, addMonths } from '../utils/dateUtils';
import { isWeekend, isHoliday, isDateUnavailable } from '../utils/validationUtils';
import { styles } from '../styles/styles';

const MonthCalendar = ({ selectedDate, onSelectDate, existingAppointments, currentUserId, blockedDates, onBlockedDateTap }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = new Date();
  
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const days = [];
    
    // Add empty days for alignment
    for (let i = 0; i < firstDay; i++) days.push(null);
    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    
    return days;
  };
  
  const days = getDaysInMonth(currentMonth);
  
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
  
  const renderDay = (date, index) => {
    if (!date) return <View key={`empty-${index}`} style={styles.monthEmptyDay} />;
    
    const dateStr = formatDate(date, 'yyyy-MM-dd');
    const isSelected = selectedDate && isSameDay(date, new Date(selectedDate));
    const dayNumber = formatDate(date, 'd');
    const isToday = isSameDay(date, today);
    const isUnavailable = isDateUnavailable(date) || isDateBlocked(date);
    const hasAppointment = hasAppointmentOnDay(date);
    
    return (
      <TouchableOpacity
        key={dateStr}
        style={[
          styles.monthDayContainer,
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
          styles.monthDayNumber, 
          isSelected && styles.selectedText,
          (isUnavailable || hasAppointment) && styles.unavailableText
        ]}>
          {dayNumber}
        </Text>
        {hasAppointment && !isUnavailable && (
          <Text style={[styles.densityBadge, isSelected && styles.selectedText]}>
            •
          </Text>
        )}
        {isUnavailable && isDateBlocked(date) && (
          <Text style={[styles.unavailableText, { fontSize: 8 }]}>Blocked</Text>
        )}
        {isUnavailable && !isDateBlocked(date) && !isWeekend(date) && (
          <Text style={[styles.unavailableText, { fontSize: 8 }]}>Unavail</Text>
        )}
      </TouchableOpacity>
    );
  };
  
  const monthName = formatDate(currentMonth, 'MMMM yyyy');
  
  return (
    <View style={styles.monthCalendar}>
      <View style={styles.monthHeader}>
        <TouchableOpacity onPress={() => setCurrentMonth(addMonths(currentMonth, -1))}>
          <FontAwesome5 name="chevron-left" size={16} color="#003580" />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{monthName}</Text>
        <TouchableOpacity onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <FontAwesome5 name="chevron-right" size={16} color="#003580" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.monthWeekdays}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <Text key={i} style={[
            styles.monthWeekday,
            i === 0 || i === 6 ? styles.weekendText : null
          ]}>
            {day}
          </Text>
        ))}
      </View>
      
      <View style={styles.monthDays}>
        {days.map((date, index) => renderDay(date, index))}
      </View>
    </View>
  );
};

export default MonthCalendar; 