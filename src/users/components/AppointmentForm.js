import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  Image,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from 'expo-image-picker';
import { CLOUDINARY_URL, CLOUDINARY_UPLOAD_PRESET } from '../../../data/cloudinaryConfig';

// Date Utilities
const formatDate = (date, formatStr) => {
  const d = new Date(date);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fullDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return formatStr
    .replace('yyyy', d.getFullYear())
    .replace('MM', String(d.getMonth() + 1).padStart(2, '0'))
    .replace('dd', String(d.getDate()).padStart(2, '0'))
    .replace('EEE', days[d.getDay() - 1] || '')
    .replace('EEEE', fullDays[d.getDay() - 1] || '')
    .replace('MMM', months[d.getMonth()])
    .replace('MMMM', fullMonths[d.getMonth()])
    .replace('d', d.getDate());
};

const isSameDay = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

// Holidays and Weekends
const HOLIDAYS = [
  '01-01', '01-29', '04-01', '04-09', '04-17', 
  '04-18', '04-19', '05-01', '06-07', '06-12',
  '08-21', '08-25', '10-31', '11-01', '11-30',
  '12-08', '12-24', '12-25', '12-30', '12-31'
];

const isHoliday = (date) => HOLIDAYS.includes(formatDate(date, 'MM-dd'));
const isWeekend = (date) => date.getDay() === 0 || date.getDay() === 6;

const WORKING_HOURS = {
  start: 8,    // 8 AM
  end: 17,     // 5 PM
  breakStart: 11.5,  // 11:30 AM
  breakEnd: 12.5     // 12:30 PM
};

// WeekCalendar component
const WeekCalendar = ({ selectedDate, onSelectDate, existingAppointments, currentUserId }) => {
  const today = new Date();
  const days = [];
  
  for (let i = 1; i <= 5; i++) {
    const date = addDays(today, i - today.getDay());
    days.push(date);
  }

  const hasAppointmentOnDay = (date) => {
    if (!existingAppointments || !currentUserId) return false;
    const dateStr = formatDate(date, 'yyyy-MM-dd');
    return existingAppointments.some(appt => 
      appt.userId === currentUserId && 
      formatDate(new Date(appt.date), 'yyyy-MM-dd') === dateStr
    );
  };

  return (
    <View style={styles.weekCalendar}>
      {days.map((date) => {
        const dateStr = formatDate(date, 'yyyy-MM-dd');
        const isSelected = dateStr === selectedDate;
        const dayName = formatDate(date, 'EEE');
        const dayNumber = formatDate(date, 'd');
        const isToday = isSameDay(date, today);
        const isUnavailable = isWeekend(date) || isHoliday(date);
        const hasAppointment = hasAppointmentOnDay(date);

        let dayColor = '#4CAF50';
        if (isUnavailable) dayColor = '#CCCCCC';
        else if (hasAppointment) dayColor = '#F44336';

        return (
          <TouchableOpacity
            key={dateStr}
            style={[
              styles.dayContainer,
              isSelected && { backgroundColor: dayColor },
              isToday && !isSelected && styles.todayDay,
              isUnavailable && styles.unavailableDay
            ]}
            onPress={() => !isUnavailable && !hasAppointment && onSelectDate(dateStr)}
            disabled={isUnavailable || hasAppointment}
          >
            <Text style={[
              styles.dayName, 
              isSelected && styles.selectedText,
              isUnavailable && styles.unavailableText
            ]}>
              {dayName}
            </Text>
            <Text style={[
              styles.dayNumber, 
              isSelected && styles.selectedText,
              isUnavailable && styles.unavailableText
            ]}>
              {dayNumber}
            </Text>
            {hasAppointment && !isUnavailable && (
              <Text style={[styles.densityBadge, isSelected && styles.selectedText]}>
                Booked
              </Text>
            )}
            {isUnavailable && (
              <Text style={styles.unavailableText}>Unavl</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// MonthCalendar component
const MonthCalendar = ({ selectedDate, onSelectDate, existingAppointments, currentUserId }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = new Date();
  
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const days = [];
    
    for (let i = 1; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    
    return days;
  };
  
  const days = getDaysInMonth(currentMonth);
  
  const hasAppointmentOnDay = (date) => {
    if (!existingAppointments || !currentUserId || !date) return false;
    const dateStr = formatDate(date, 'yyyy-MM-dd');
    return existingAppointments.some(appt => 
      appt.userId === currentUserId && 
      formatDate(new Date(appt.date), 'yyyy-MM-dd') === dateStr
    );
  };
  
  const renderDay = (date, index) => {
    if (!date) return <View key={`empty-${index}`} style={styles.monthEmptyDay} />;
    
    const dateStr = formatDate(date, 'yyyy-MM-dd');
    const isSelected = dateStr === selectedDate;
    const dayNumber = formatDate(date, 'd');
    const isToday = isSameDay(date, today);
    const isWeekday = date.getDay() >= 1 && date.getDay() <= 5;
    const isUnavailable = !isWeekday || isHoliday(date);
    const hasAppointment = hasAppointmentOnDay(date);
    
    let dayColor = '#4CAF50';
    if (isUnavailable) dayColor = '#CCCCCC';
    else if (hasAppointment) dayColor = '#F44336';
    
    return (
      <TouchableOpacity
        key={dateStr}
        style={[
          styles.monthDayContainer,
          isSelected && { backgroundColor: dayColor },
          isToday && !isSelected && styles.todayDay,
          isUnavailable && styles.unavailableDay
        ]}
        onPress={() => !isUnavailable && !hasAppointment && onSelectDate(dateStr)}
        disabled={isUnavailable || hasAppointment}
      >
        <Text style={[
          styles.monthDayNumber, 
          isSelected && styles.selectedText,
          isUnavailable && styles.unavailableText
        ]}>
          {dayNumber}
        </Text>
        {hasAppointment && !isUnavailable && (
          <Text style={[styles.densityBadge, isSelected && styles.selectedText]}>
            •
          </Text>
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
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
          <Text key={i} style={[
            styles.monthWeekday,
            i >= 5 && styles.weekendText
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

const AppointmentForm = ({ visible, onClose, onSubmit, initialData, existingAppointments = [], currentUserId }) => {
  const scrollViewRef = useRef(null);
  const [formData, setFormData] = useState({
    type: "",
    purpose: "",
    date: new Date(),
    time: "09:00 AM",
    timePickerValue: new Date(),
    patientName: "",
    processorName: "",
    medicalDetails: "",
    imageUri: null,
    selfieUri: null
  });
  
  const [uiState, setUiState] = useState({
    showDatePicker: false,
    showTimePicker: false,
    isReschedule: false,
    originalAppointmentId: null,
    uploadProgress: 0,
    isUploading: false,
    isLoading: false,
    calendarView: 'week',
    currentUpload: null
  });

  const appointmentTypes = [
    { id: 1, name: "Solicitation", icon: "hand-holding-usd" },
    { id: 2, name: "Courtesy", icon: "handshake" },
    { id: 3, name: "Invitation", icon: "calendar-alt" },
    { id: 4, name: "Finance (Medical)", icon: "file-medical" },
  ];

  // Initialize form
  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type,
        purpose: initialData.purpose,
        date: initialData.date ? new Date(initialData.date) : new Date(),
        time: initialData.time || "09:00 AM",
        timePickerValue: initialData.time ? (() => {
          const [hours, minutesPart] = initialData.time.split(":");
          let [minutes, period] = minutesPart.split(" ");
          let hour = parseInt(hours);
          if (period === "PM" && hour < 12) hour += 12;
          if (period === "AM" && hour === 12) hour = 0;
          const timeDate = new Date();
          timeDate.setHours(hour);
          timeDate.setMinutes(parseInt(minutes));
          return timeDate;
        })() : new Date(),
        patientName: initialData.patientName || "",
        processorName: initialData.processorName || "",
        medicalDetails: initialData.medicalDetails || "",
        imageUri: initialData.imageUrl || null,
        selfieUri: initialData.selfieUrl || null
      });

      setUiState(prev => ({
        ...prev,
        isReschedule: true,
        originalAppointmentId: initialData.id
      }));
    } else {
      resetForm();
    }
  }, [initialData]);

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        await ImagePicker.requestCameraPermissionsAsync();
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      }
    })();
  }, []);

  const resetForm = () => {
    setFormData({
      type: "",
      purpose: "",
      date: new Date(),
      time: "09:00 AM",
      timePickerValue: new Date(),
      patientName: "",
      processorName: "",
      medicalDetails: "",
      imageUri: null,
      selfieUri: null
    });
    setUiState({
      showDatePicker: false,
      showTimePicker: false,
      isReschedule: false,
      originalAppointmentId: null,
      uploadProgress: 0,
      isUploading: false,
      isLoading: false,
      calendarView: 'week',
      currentUpload: null
    });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUiChange = (field, value) => {
    setUiState(prev => ({ ...prev, [field]: value }));
  };

  // Cloudinary Image Upload
  const uploadImageToCloudinary = async (imageUri, type) => {
    if (!imageUri) return null;

    handleUiChange('isUploading', true);
    handleUiChange('uploadProgress', 0);
    handleUiChange('currentUpload', type);

    try {
      const formData = new FormData();
      const filename = imageUri.substring(imageUri.lastIndexOf("/") + 1);
      
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: filename,
      });
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'appointments');

      const xhr = new XMLHttpRequest();
      xhr.open('POST', CLOUDINARY_URL);
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          handleUiChange('uploadProgress', progress);
        }
      };

      const cloudinaryResponse = await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error('Upload failed'));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(formData);
      });

      return cloudinaryResponse.secure_url;
    } catch (error) {
      console.error("Image upload error:", error);
      throw error;
    } finally {
      handleUiChange('isUploading', false);
      handleUiChange('currentUpload', null);
    }
  };

  // Image Selection
  const selectImage = async (type) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        handleChange(type === 'selfie' ? 'selfieUri' : 'imageUri', result.assets[0].uri);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to select image");
    }
  };

  const takeSelfie = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        handleChange('selfieUri', result.assets[0].uri);
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  // Form Validation
  const validateForm = () => {
    if (!formData.type) {
      Alert.alert("Error", "Please select appointment type");
      return false;
    }
    
    if (!formData.purpose.trim()) {
      Alert.alert("Error", "Please enter purpose");
      return false;
    }
    
    if (formData.type === "Finance (Medical)") {
      if (!formData.patientName.trim()) {
        Alert.alert("Error", "Please enter patient name");
        return false;
      }
      if (!formData.processorName.trim()) {
        Alert.alert("Error", "Please enter processor name");
        return false;
      }
      if (!formData.selfieUri) {
        Alert.alert("Error", "Please take a selfie");
        return false;
      }
    }
    
    return true;
  };

  // Form Submission
  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (uiState.isUploading) {
      Alert.alert("Please wait", "Upload in progress");
      return;
    }

    handleUiChange('isLoading', true);
    
    try {
      // Upload images
      let imageUrl = null;
      let selfieUrl = null;

      if (formData.imageUri) {
        try {
          imageUrl = await uploadImageToCloudinary(formData.imageUri, 'document');
        } catch (error) {
          const shouldContinue = await new Promise((resolve) => {
            Alert.alert(
              "Upload Failed",
              "Would you like to continue without the document?",
              [
                { text: "Cancel", onPress: () => resolve(false) },
                { text: "Continue", onPress: () => resolve(true) }
              ]
            );
          });
          if (!shouldContinue) {
            handleUiChange('isLoading', false);
            return;
          }
        }
      }

      if (formData.selfieUri) {
        try {
          selfieUrl = await uploadImageToCloudinary(formData.selfieUri, 'selfie');
        } catch (error) {
          const shouldContinue = await new Promise((resolve) => {
            Alert.alert(
              "Upload Failed",
              "Would you like to continue without the selfie?",
              [
                { text: "Cancel", onPress: () => resolve(false) },
                { text: "Continue", onPress: () => resolve(true) }
              ]
            );
          });
          if (!shouldContinue) {
            handleUiChange('isLoading', false);
            return;
          }
        }
      }

      // Prepare appointment data
      const appointmentData = {
        type: formData.type,
        purpose: formData.purpose,
        date: formData.date.toISOString(),
        time: formData.time,
        status: "Pending",
        createdAt: new Date().toISOString(),
        imageUrl: imageUrl,
        ...(uiState.isReschedule && uiState.originalAppointmentId && { id: uiState.originalAppointmentId }),
        ...(formData.type === "Finance (Medical)" && {
          patientName: formData.patientName,
          processorName: formData.processorName,
          medicalDetails: formData.medicalDetails,
          selfieUrl: selfieUrl,
        }),
      };
      
      onSubmit(appointmentData);
      resetForm();
      onClose();
    } catch (error) {
      console.error("Submission error:", error);
      Alert.alert("Error", "Failed to submit appointment");
    } finally {
      handleUiChange('isLoading', false);
    }
  };

  // Date/Time Handling
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || formData.date;
    handleUiChange('showDatePicker', Platform.OS === 'ios');
    
    if (isHoliday(currentDate)) {
      Alert.alert("Holiday", "Selected date is a holiday. Please choose another date.");
      return;
    }
    
    handleChange('date', currentDate);
  };

  const onTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || formData.timePickerValue;
    handleUiChange('showTimePicker', Platform.OS === 'ios');
    
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
    const newTime = `${hour12}:${minutesStr} ${ampm}`;
    
    handleChange('timePickerValue', currentTime);
    handleChange('time', newTime);
  };

  // Render Functions
  const renderTypeButtons = () => (
    <View style={styles.typeGrid}>
      {appointmentTypes.map(({ id, name, icon }) => (
        <TouchableOpacity
          key={id}
          style={[
            styles.typeButton,
            formData.type === name && styles.selectedTypeButton
          ]}
          onPress={() => handleChange('type', name)}
          activeOpacity={0.7}
        >
          <View style={styles.typeIconContainer}>
            <FontAwesome5 
              name={icon} 
              size={18} 
              color={formData.type === name ? "#FFF" : "#003580"} 
            />
          </View>
          <Text style={[
            styles.typeButtonText,
            formData.type === name && styles.selectedTypeText
          ]}>
            {name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderImageSection = (uri, onPress, iconName, buttonText) => {
    const isCurrentUpload = uiState.currentUpload === buttonText.toLowerCase();
    return (
      <View style={styles.imageSection}>
        <TouchableOpacity 
          style={styles.imageButton}
          onPress={onPress}
          disabled={uiState.isUploading}
          activeOpacity={0.7}
        >
          <FontAwesome5 
            name={iconName} 
            size={16} 
            color={uiState.isUploading ? "#999" : "#003580"} 
          />
          <Text style={[
            styles.imageButtonText,
            uiState.isUploading && styles.disabledText
          ]}>
            {uri ? `Change ${buttonText}` : buttonText}
          </Text>
        </TouchableOpacity>
        
        {uri && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri }} style={styles.imagePreview} />
            <TouchableOpacity 
              style={styles.removeImageButton}
              onPress={() => handleChange(buttonText === "Selfie" ? 'selfieUri' : 'imageUri', null)}
              disabled={uiState.isUploading}
            >
              <FontAwesome5 name="times" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}
        
        {isCurrentUpload && uiState.isUploading && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${uiState.uploadProgress}%` }]} />
            <Text style={styles.progressText}>{Math.round(uiState.uploadProgress)}% Uploaded</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <SafeAreaView style={styles.safeAreaContainer}>
            <View style={styles.formContainer}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>
                  {uiState.isReschedule ? "Reschedule Appointment" : "New Appointment"}
                </Text>
                <TouchableOpacity 
                  onPress={onClose}
                  style={styles.closeButton}
                  hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
                >
                  <FontAwesome5 name="times" size={22} color="#003580" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                ref={scrollViewRef}
                style={styles.formScrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
              >
                {/* Type Selection */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>Appointment Type</Text>
                  {renderTypeButtons()}
                </View>

                {/* Purpose */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>Purpose</Text>
                  <TextInput
                    style={styles.purposeInput}
                    placeholder="Describe your purpose..."
                    value={formData.purpose}
                    onChangeText={(text) => handleChange('purpose', text)}
                    multiline
                    numberOfLines={3}
                    placeholderTextColor="#888"
                  />
                </View>

                {/* Calendar Section */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>Select Date</Text>
                  <View style={styles.calendarToggle}>
                    <TouchableOpacity 
                      onPress={() => handleUiChange('calendarView', 'week')}
                      style={[
                        styles.toggleButton, 
                        uiState.calendarView === 'week' && styles.activeToggle
                      ]}
                    >
                      <Text style={[
                        styles.toggleText, 
                        uiState.calendarView === 'week' && styles.activeToggleText
                      ]}>
                        Week
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => handleUiChange('calendarView', 'month')}
                      style={[
                        styles.toggleButton, 
                        uiState.calendarView === 'month' && styles.activeToggle
                      ]}
                    >
                      <Text style={[
                        styles.toggleText, 
                        uiState.calendarView === 'month' && styles.activeToggleText
                      ]}>
                        Month
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.calendarContainer}>
                    {uiState.calendarView === 'week' ? (
                      <WeekCalendar
                        selectedDate={formatDate(formData.date, 'yyyy-MM-dd')}
                        onSelectDate={(dateStr) => {
                          const [year, month, day] = dateStr.split('-');
                          const newDate = new Date(year, month - 1, day);
                          handleChange('date', newDate);
                        }}
                        existingAppointments={existingAppointments}
                        currentUserId={currentUserId}
                      />
                    ) : (
                      <MonthCalendar
                        selectedDate={formatDate(formData.date, 'yyyy-MM-dd')}
                        onSelectDate={(dateStr) => {
                          const [year, month, day] = dateStr.split('-');
                          const newDate = new Date(year, month - 1, day);
                          handleChange('date', newDate);
                        }}
                        existingAppointments={existingAppointments}
                        currentUserId={currentUserId}
                      />
                    )}
                  </View>
                </View>

                {/* Medical Information (Conditional) */}
                {formData.type === "Finance (Medical)" && (
                  <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Medical Information</Text>
                    <View style={styles.cardContainer}>
                      <View style={styles.inputGroup}>
                        <FontAwesome5 name="user" size={16} color="#003580" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="Patient Name"
                          value={formData.patientName}
                          onChangeText={(text) => handleChange('patientName', text)}
                          placeholderTextColor="#888"
                        />
                      </View>
                      
                      <View style={styles.inputGroup}>
                        <FontAwesome5 name="user-md" size={16} color="#003580" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="Processor Name"
                          value={formData.processorName}
                          onChangeText={(text) => handleChange('processorName', text)}
                          placeholderTextColor="#888"
                        />
                      </View>
                      
                      <View style={styles.inputGroup}>
                        <FontAwesome5 name="notes-medical" size={16} color="#003580" style={styles.inputIcon} />
                        <TextInput
                          style={[styles.input, { height: 80 }]}
                          placeholder="Medical Details"
                          value={formData.medicalDetails}
                          onChangeText={(text) => handleChange('medicalDetails', text)}
                          multiline
                          placeholderTextColor="#888"
                        />
                      </View>
                    </View>

                    <Text style={styles.sectionTitle}>Patient Verification</Text>
                    {renderImageSection(formData.selfieUri, takeSelfie, "camera", "Selfie")}
                  </View>
                )}

                {/* Supporting Documents */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>Supporting Documents</Text>
                  <Text style={styles.sectionSubtitle}>Attach any relevant files</Text>
                  {renderImageSection(formData.imageUri, () => selectImage('document'), "paperclip", "Document")}
                </View>

                {/* Time Selection */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>Select Time</Text>
                  <View style={styles.cardContainer}>
                    {isWeekend(formData.date) ? (
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
                      style={styles.timePickerButton}
                      onPress={() => handleUiChange('showTimePicker', true)}
                      disabled={uiState.isUploading}
                      activeOpacity={0.7}
                    >
                      <FontAwesome5 
                        name="clock" 
                        size={16} 
                        color={uiState.isUploading ? "#999" : "#003580"} 
                      />
                      <Text style={[
                        styles.datePickerText,
                        uiState.isUploading && styles.disabledText
                      ]}>
                        {formData.time}
                      </Text>
                    </TouchableOpacity>

                    {uiState.showTimePicker && (
                      <DateTimePicker
                        value={formData.timePickerValue}
                        mode="time"
                        is24Hour={false}
                        display="default"
                        onChange={onTimeChange}
                        minuteInterval={15}
                      />
                    )}
                  </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (uiState.isLoading || uiState.isUploading) && styles.disabledButton
                  ]}
                  onPress={handleSubmit}
                  disabled={uiState.isLoading || uiState.isUploading}
                  activeOpacity={0.8}
                >
                  {uiState.isLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator color="#FFF" size="small" />
                      <Text style={styles.loadingText}>Processing...</Text>
                    </View>
                  ) : (
                    <>
                      <FontAwesome5 
                        name={uiState.isReschedule ? "calendar-check" : "calendar-plus"} 
                        size={18} 
                        color="#FFF" 
                        style={styles.submitIcon}
                      />
                      <Text style={styles.submitButtonText}>
                        {uiState.isReschedule ? "Reschedule Appointment" : "Schedule Appointment"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  safeAreaContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  formContainer: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: "92%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
    position: "relative",
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#003580",
    textAlign: "center",
  },
  closeButton: {
    position: "absolute",
    right: 20,
    top: 16,
    zIndex: 1,
  },
  formScrollView: {
    maxHeight: "100%",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 30,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#003580",
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: -8,
    marginBottom: 10,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  typeButton: {
    width: "48.5%",
    backgroundColor: "#F5F7FA",
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    padding: 12,
    flexDirection: "column",
  },
  typeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EAEAEA",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  selectedTypeButton: {
    backgroundColor: "#003580",
    borderColor: "#003580",
  },
  selectedTypeText: {
    color: "#FFF",
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  purposeInput: {
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#F5F7FA",
    textAlignVertical: "top",
    minHeight: 100,
  },
  cardContainer: {
    backgroundColor: "#F5F7FA",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
  },
  inputGroup: {
    marginBottom: 14,
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    left: 14,
    top: 17,
    zIndex: 10,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 14,
    paddingLeft: 45,
    fontSize: 16,
    backgroundColor: "#FFF",
    textAlignVertical: "top",
  },
  imageSection: {
    marginTop: 10,
  },
  imageButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    justifyContent: "center",
  },
  imageButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "500",
    color: "#003580",
  },
  disabledText: {
    color: "#999",
  },
  imagePreviewContainer: {
    marginTop: 12,
    position: "relative",
    alignItems: "center",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    resizeMode: "contain",
    backgroundColor: "#F5F7FA",
  },
  removeImageButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  progressContainer: {
    marginTop: 8,
    height: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  progressText: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  timePickerButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
  },
  datePickerText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E6",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  warningText: {
    color: "#8A6D3B",
    marginLeft: 10,
    fontSize: 14,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F2FF",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  infoText: {
    color: "#31708F",
    marginLeft: 10,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: "#003580",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 5,
  },
  disabledButton: {
    backgroundColor: "#99B4D1",
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  submitIcon: {
    marginRight: 10,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFF",
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "600",
  },
  // Calendar styles
  calendarToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  activeToggle: {
    backgroundColor: '#003580',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#003580',
  },
  activeToggleText: {
    color: '#FFF',
  },
  calendarContainer: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weekCalendar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 2,
  },
  todayDay: {
    borderWidth: 2,
    borderColor: '#003580',
  },
  unavailableDay: {
    backgroundColor: '#F5F5F5',
  },
  dayName: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  selectedText: {
    color: '#FFF',
  },
  unavailableText: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  densityBadge: {
    fontSize: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 4,
    borderRadius: 4,
    marginTop: 2,
  },
  // Month calendar styles
  monthCalendar: {
    marginBottom: 10,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    marginBottom: 10,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003580',
  },
  monthWeekdays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 5,
  },
  monthWeekday: {
    width: 32,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333',
  },
  weekendText: {
    color: '#999',
  },
  monthDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  monthEmptyDay: {
    width: 32,
    height: 32,
    margin: 4,
  },
  monthDayContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    margin: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  monthDayNumber: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default AppointmentForm;