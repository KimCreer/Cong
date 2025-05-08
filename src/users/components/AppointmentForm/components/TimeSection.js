import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { isWeekend } from '../utils/validationUtils';
import { styles } from '../styles/styles';

const TimeSection = ({
  selectedDate,
  selectedTime,
  onTimeSelect,
  showTimePicker,
  onShowTimePicker,
  isUploading
}) => {
  return (
    <View style={styles.formSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Select Time</Text>
        {!selectedTime && (
          <Text style={styles.requiredIndicator}>* Required</Text>
        )}
      </View>
      
      {selectedTime && (
        <View style={styles.selectedTimeContainer}>
          <FontAwesome5 name="clock" size={16} color="#4CAF50" />
          <Text style={styles.selectedTimeText}>
            {selectedTime}
          </Text>
        </View>
      )}
      
      <View style={styles.cardContainer}>
        {isWeekend(selectedDate || new Date()) ? (
          <View style={styles.warningContainer}>
            <FontAwesome5 name="exclamation-triangle" size={16} color="#FFA500" />
            <Text style={styles.warningText}>
              Weekend appointments: 8AM-5PM only
            </Text>
          </View>
        ) : (
          <View style={styles.infoContainer}>
            <FontAwesome5 name="info-circle" size={16} color="#003580" />
            <Text style={styles.infoText}>
              Weekdays: 8AM-5PM (Break: 11:30AM-12:30PM)
            </Text>
          </View>
        )}
        
        <TouchableOpacity
          style={[
            styles.timePickerButton,
            !selectedTime && styles.unselectedTimeButton
          ]}
          onPress={() => onShowTimePicker(true)}
          disabled={isUploading}
          activeOpacity={0.7}
        >
          <FontAwesome5 
            name="clock" 
            size={16} 
            color={isUploading ? "#999" : (!selectedTime ? "#F44336" : "#003580")} 
          />
          <Text style={[
            styles.datePickerText,
            isUploading && styles.disabledText,
            !selectedTime && styles.unselectedTimeText
          ]}>
            {selectedTime || "Select a time"}
          </Text>
        </TouchableOpacity>

        {showTimePicker && (
          <DateTimePicker
            value={selectedTime ? new Date(selectedTime) : new Date()}
            mode="time"
            is24Hour={false}
            display="default"
            onChange={(event, time) => {
              onShowTimePicker(false);
              if (time) {
                onTimeSelect(time);
              }
            }}
            minuteInterval={15}
          />
        )}
      </View>
    </View>
  );
};

export default TimeSection; 