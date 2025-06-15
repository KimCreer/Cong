import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 } from "@expo/vector-icons";
import { addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, format } from 'date-fns';
import { DAYS_OF_WEEK, MONTHS } from '../constants';
import { isDateInPast, isDateBlocked, isDateSelectable } from '../utils/dateUtils';

const Calendar = ({ 
    currentMonth, 
    onNavigateMonth, 
    selectedDate, 
    onSelectDate, 
    blockedDates,
    allowPastDates = false,
    allowPastSelection = false,
    appointmentCountsByDate = {}
}) => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDay = monthStart.getDay();
    const emptyStartDays = Array(startDay).fill(null);

    return (
        <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={() => onNavigateMonth('prev')}>
                    <FontAwesome5 name="chevron-left" size={20} color="#003366" />
                </TouchableOpacity>
                
                <Text style={styles.calendarTitle}>
                    {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </Text>
                
                <TouchableOpacity onPress={() => onNavigateMonth('next')}>
                    <FontAwesome5 name="chevron-right" size={20} color="#003366" />
                </TouchableOpacity>
            </View>
            
            <View style={styles.daysOfWeek}>
                {DAYS_OF_WEEK.map(day => (
                    <Text key={day} style={styles.dayOfWeekText}>{day}</Text>
                ))}
            </View>
            
            <View style={styles.calendarGrid}>
                {emptyStartDays.map((_, index) => (
                    <View key={`empty-${index}`} style={styles.calendarDayEmpty} />
                ))}
                
                {daysInMonth.map(day => {
                    const isBlocked = isDateBlocked(day, blockedDates);
                    const isPast = isDateInPast(day);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isSelectable = isDateSelectable(day, blockedDates, allowPastSelection);
                    
                    const dayKey = format(day, 'yyyy-MM-dd');
                    const appointmentCount = appointmentCountsByDate[dayKey] || 0;

                    return (
                        <TouchableOpacity
                            key={day.toString()}
                            style={[
                                styles.calendarDay,
                                isBlocked && styles.blockedDay,
                                !allowPastDates && isPast && styles.pastDay,
                                (appointmentCount > 0 && !isSelected) && styles.hasAppointmentsDay,
                                isSelected && styles.selectedDay,
                                !isCurrentMonth && styles.nonMonthDay
                            ]}
                            onPress={() => isSelectable && onSelectDate(day)}
                            disabled={!isSelectable}
                        >
                            <Text style={[
                                styles.dayText,
                                isBlocked && styles.blockedDayText,
                                !allowPastDates && isPast && styles.pastDayText,
                                isSelected && styles.selectedDayText,
                                !isSelected && appointmentCount > 0 && { color: '#333' },
                                !isCurrentMonth && styles.nonMonthDayText
                            ]}>
                                {day.getDate()}
                            </Text>
                            {appointmentCount > 0 && (
                                <View style={styles.appointmentCountBadge}>
                                    <Text style={styles.appointmentCountText}>
                                        {appointmentCount}
                                    </Text>
                                </View>
                            )}
                            {isBlocked && (
                                <View style={styles.blockedIndicator} />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    calendarContainer: {
        marginBottom: 20,
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    calendarTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#003366',
    },
    daysOfWeek: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        paddingHorizontal: 1,
    },
    dayOfWeekText: {
        flex: 1,
        textAlign: 'center',
        fontWeight: '600',
        color: '#666',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    calendarDay: {
        width: `${100 / 7}%`,
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        padding: 10,
    },
    calendarDayEmpty: {
        width: `${100 / 7}%`,
        aspectRatio: 1,
    },
    dayText: {
        fontSize: 16,
        color: '#333',
    },
    blockedDay: {
        backgroundColor: '#ffebee',
    },
    blockedDayText: {
        color: '#b71c1c',
    },
    pastDay: {
        backgroundColor: '#f5f5f5',
    },
    pastDayText: {
        color: '#999',
    },
    selectedDay: {
        borderColor: '#003366',
        borderWidth: 2,
        backgroundColor: 'transparent',
    },
    selectedDayText: {
        color: '#333',
        fontWeight: 'bold',
    },
    nonMonthDay: {
        opacity: 0.3,
    },
    nonMonthDayText: {
        color: '#999',
    },
    blockedIndicator: {
        position: 'absolute',
        top: 2,
        right: 2,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#dc3545',
    },
    hasAppointmentsDay: {
        backgroundColor: '#e6f2ff',
    },
    appointmentCountBadge: {
        position: 'absolute',
        bottom: 1,
        left: 1,
        backgroundColor: '#003366',
        borderRadius: 7,
        width: 14,
        height: 14,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 0,
    },
    appointmentCountText: {
        color: '#fff',
        fontSize: 8,
        fontWeight: 'bold',
    },
});

export default Calendar; 