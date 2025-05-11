import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { commonStyles } from '../../styles/commonStyles';

const TimeSection = ({
    selectedDate,
    selectedTime,
    onTimeSelect,
    showTimePicker,
    onShowTimePicker,
    isUploading
}) => {
    const formatTime = (date) => {
        if (!date) return '';
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    return (
        <View style={styles.container}>
            <Text style={commonStyles.sectionTitle}>Select Time</Text>
            
            <TouchableOpacity
                style={[
                    styles.timeButton,
                    isUploading && styles.disabledButton
                ]}
                onPress={() => onShowTimePicker(true)}
                disabled={!selectedDate || isUploading}
            >
                <FontAwesome5 
                    name="clock" 
                    size={16} 
                    color={!selectedDate || isUploading ? '#999' : '#003580'} 
                />
                <Text style={[
                    styles.timeButtonText,
                    (!selectedDate || isUploading) && styles.disabledText
                ]}>
                    {selectedTime || 'Select time'}
                </Text>
            </TouchableOpacity>

            {showTimePicker && (
                <DateTimePicker
                    value={selectedTime ? new Date(`2000-01-01T${selectedTime}`) : new Date()}
                    mode="time"
                    is24Hour={false}
                    display="spinner"
                    onChange={(event, date) => {
                        onShowTimePicker(false);
                        if (event.type === 'set' && date) {
                            onTimeSelect(date);
                        }
                    }}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    timeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F7FA',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1.5,
        borderColor: '#E0E0E0',
    },
    disabledButton: {
        backgroundColor: '#F5F5F5',
        borderColor: '#EEEEEE',
    },
    timeButtonText: {
        marginLeft: 10,
        fontSize: 16,
        fontWeight: '500',
        color: '#003580',
    },
    disabledText: {
        color: '#999',
    },
});

export default TimeSection; 