import React from 'react';
import { View, Text, TouchableOpacity, } from 'react-native';
import { FontAwesome5 } from "@expo/vector-icons";
import { formatDate } from '../utils/dateUtils';
import WeekCalendar from './WeekCalendar';
import MonthCalendar from './MonthCalendar';
import { styles } from '../styles/styles';

const CalendarSection = ({
  selectedDate,
  onSelectDate,
  existingAppointments,
  currentUserId,
  blockedDates,
  onBlockedDateTap,
  calendarView,
  onCalendarViewChange
}) => {
  return (
    <View style={styles.formSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Select Date</Text>
        {!selectedDate && (
          <Text style={styles.requiredIndicator}>* Required</Text>
        )}
      </View>
      
      {selectedDate && (
        <View style={styles.selectedDateContainer}>
          <FontAwesome5 name="calendar-check" size={16} color="#4CAF50" />
          <Text style={styles.selectedDateText}>
            {formatDate(selectedDate, 'EEEE, MMMM d, yyyy')}
          </Text>
        </View>
      )}
      
      <View style={styles.calendarToggle}>
        <TouchableOpacity 
          onPress={() => onCalendarViewChange('week')}
          style={[
            styles.toggleButton, 
            calendarView === 'week' && styles.activeToggle
          ]}
        >
          <Text style={[
            styles.toggleText, 
            calendarView === 'week' && styles.activeToggleText
          ]}>
            Week View
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => onCalendarViewChange('month')}
          style={[
            styles.toggleButton, 
            calendarView === 'month' && styles.activeToggle
          ]}
        >
          <Text style={[
            styles.toggleText, 
            calendarView === 'month' && styles.activeToggleText
          ]}>
            Month View
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.calendarContainer}>
        {calendarView === 'week' ? (
          <WeekCalendar
            selectedDate={selectedDate ? formatDate(selectedDate, 'yyyy-MM-dd') : null}
            onSelectDate={(dateStr) => {
              const [year, month, day] = dateStr.split('-');
              const newDate = new Date(year, month - 1, day);
              onSelectDate(newDate);
            }}
            existingAppointments={existingAppointments}
            currentUserId={currentUserId}
            blockedDates={blockedDates}
            onBlockedDateTap={onBlockedDateTap}
          />
        ) : (
          <MonthCalendar
            selectedDate={selectedDate ? formatDate(selectedDate, 'yyyy-MM-dd') : null}
            onSelectDate={(dateStr) => {
              const [year, month, day] = dateStr.split('-');
              const newDate = new Date(year, month - 1, day);
              onSelectDate(newDate);
            }}
            existingAppointments={existingAppointments}
            currentUserId={currentUserId}
            blockedDates={blockedDates}
            onBlockedDateTap={onBlockedDateTap}
          />
        )}
      </View>
    </View>
  );
};

export default CalendarSection; 