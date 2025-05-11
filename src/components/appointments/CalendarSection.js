import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { commonStyles } from '../../styles/commonStyles';
import { formatDate } from '../../utils/dateUtils';

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
    const renderWeekView = () => {
        const today = new Date();
        const days = [];
        
        // Get the start of the week (Monday)
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1);
        
        for (let i = 0; i < 5; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            
            const isSelected = selectedDate && 
                date.getDate() === selectedDate.getDate() &&
                date.getMonth() === selectedDate.getMonth() &&
                date.getFullYear() === selectedDate.getFullYear();
                
            const isBlocked = blockedDates.some(blockedDate => 
                date.getDate() === blockedDate.getDate() &&
                date.getMonth() === blockedDate.getMonth() &&
                date.getFullYear() === blockedDate.getFullYear()
            );
            
            const hasAppointments = existingAppointments.some(apt => {
                const aptDate = new Date(apt.date);
                return date.getDate() === aptDate.getDate() &&
                       date.getMonth() === aptDate.getMonth() &&
                       date.getFullYear() === aptDate.getFullYear();
            });
            
            days.push(
                <TouchableOpacity
                    key={i}
                    style={[
                        styles.dayButton,
                        isSelected && styles.selectedDay,
                        isBlocked && styles.blockedDay
                    ]}
                    onPress={() => {
                        if (isBlocked) {
                            onBlockedDateTap(date);
                        } else {
                            onSelectDate(date);
                        }
                    }}
                    disabled={isBlocked}
                >
                    <Text style={[
                        styles.dayText,
                        isSelected && styles.selectedDayText,
                        isBlocked && styles.blockedDayText
                    ]}>
                        {formatDate(date, 'EEE')}
                    </Text>
                    <Text style={[
                        styles.dateText,
                        isSelected && styles.selectedDateText,
                        isBlocked && styles.blockedDateText
                    ]}>
                        {formatDate(date, 'd')}
                    </Text>
                    {hasAppointments && !isBlocked && (
                        <View style={styles.appointmentDot} />
                    )}
                </TouchableOpacity>
            );
        }
        
        return (
            <View style={styles.weekContainer}>
                {days}
            </View>
        );
    };
    
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={commonStyles.sectionTitle}>Select Date</Text>
                <View style={styles.viewToggle}>
                    <TouchableOpacity
                        style={[
                            styles.toggleButton,
                            calendarView === 'week' && styles.activeToggle
                        ]}
                        onPress={() => onCalendarViewChange('week')}
                    >
                        <FontAwesome5 name="calendar-week" size={16} color={calendarView === 'week' ? '#FFFFFF' : '#666'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.toggleButton,
                            calendarView === 'month' && styles.activeToggle
                        ]}
                        onPress={() => onCalendarViewChange('month')}
                    >
                        <FontAwesome5 name="calendar-alt" size={16} color={calendarView === 'month' ? '#FFFFFF' : '#666'} />
                    </TouchableOpacity>
                </View>
            </View>
            
            {calendarView === 'week' ? renderWeekView() : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    viewToggle: {
        flexDirection: 'row',
        backgroundColor: '#F5F7FA',
        borderRadius: 8,
        padding: 4,
    },
    toggleButton: {
        padding: 8,
        borderRadius: 6,
    },
    activeToggle: {
        backgroundColor: '#003580',
    },
    weekContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    dayButton: {
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        width: '18%',
    },
    selectedDay: {
        backgroundColor: '#003580',
    },
    blockedDay: {
        backgroundColor: '#F5F5F5',
        opacity: 0.7,
    },
    dayText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    dateText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    selectedDayText: {
        color: '#FFFFFF',
    },
    selectedDateText: {
        color: '#FFFFFF',
    },
    blockedDayText: {
        color: '#999',
    },
    blockedDateText: {
        color: '#999',
    },
    appointmentDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4CAF50',
        marginTop: 4,
    },
});

export default CalendarSection; 