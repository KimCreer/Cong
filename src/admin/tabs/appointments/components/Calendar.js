import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 } from "@expo/vector-icons";
import { addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { DAYS_OF_WEEK, MONTHS } from '../constants';
import { isDateInPast, isDateBlocked, isDateSelectable } from '../utils/dateUtils';

const Calendar = ({ 
    currentMonth, 
    onNavigateMonth, 
    selectedDate, 
    onSelectDate, 
    blockedDates 
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
                    const isSelectable = isDateSelectable(day, blockedDates);
                    
                    return (
                        <TouchableOpacity
                            key={day.toString()}
                            style={[
                                styles.calendarDay,
                                isBlocked && styles.blockedDay,
                                isPast && styles.pastDay,
                                isSelected && styles.selectedDay,
                                !isCurrentMonth && styles.nonMonthDay
                            ]}
                            onPress={() => isSelectable && onSelectDate(day)}
                            disabled={!isSelectable}
                        >
                            <Text style={[
                                styles.dayText,
                                isBlocked && styles.blockedDayText,
                                isPast && styles.pastDayText,
                                isSelected && styles.selectedDayText,
                                !isCurrentMonth && styles.nonMonthDayText
                            ]}>
                                {day.getDate()}
                            </Text>
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
        backgroundColor: '#003366',
    },
    selectedDayText: {
        color: '#fff',
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
});

export default Calendar; 