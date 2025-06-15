import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
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
import { getFirestore, collection, query, where, getDocs } from '@react-native-firebase/firestore';

// Components
import TypeSelection from './AppointmentForm/components/TypeSelection';
import PurposeInput from './AppointmentForm/components/PurposeInput';
import CalendarSection from './AppointmentForm/components/CalendarSection';
import TimeSection from './AppointmentForm/components/TimeSection';
import MedicalInfo from './AppointmentForm/components/MedicalInfo';
import DocumentUpload from './AppointmentForm/components/DocumentUpload';
import BlockedDateModal from './AppointmentForm/components/BlockedDateModal';

// Utils
import { formatTime, isSameDay } from './AppointmentForm/utils/dateUtils';
import { validateAppointmentForm } from './AppointmentForm/utils/validationUtils';

// Styles
import { styles } from './AppointmentForm/styles/styles';

const AppointmentForm = ({ visible, onClose, onSubmit, initialData, existingAppointments = [], currentUserId }) => {
  const scrollViewRef = useRef(null);
  const [formData, setFormData] = useState({
    type: "",
    purpose: "",
    date: null,
    time: "",
    timePickerValue: null,
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
    currentUpload: null,
    blockedDates: [],
    showBlockedReason: false,
    selectedBlockedDate: null
  });

  const db = getFirestore();

  // Initialize form
  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type,
        purpose: initialData.purpose,
        date: initialData.date ? new Date(initialData.date) : null,
        time: initialData.time || "",
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
        })() : null,
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

  // Fetch blocked dates on mount
  useEffect(() => {
    const fetchBlockedDates = async () => {
      try {
        const blockedDatesQuery = query(
          collection(db, 'blockedDates'),
          where('date', '>=', new Date())
        );
        
        const snapshot = await getDocs(blockedDatesQuery);
        const dates = snapshot.docs.map(doc => ({
          id: doc.id,
          date: doc.data().date.toDate(),
          reason: doc.data().reason || 'No reason provided'
        }));
        
        setUiState(prev => ({
          ...prev,
          blockedDates: dates
        }));
      } catch (error) {
        console.error("Error fetching blocked dates:", error);
      }
    };

    if (visible) {
      fetchBlockedDates();
    }
  }, [visible]);

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
      date: null,
      time: "",
      timePickerValue: null,
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
      currentUpload: null,
      blockedDates: [],
      showBlockedReason: false,
      selectedBlockedDate: null
    });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUiChange = (field, value) => {
    setUiState(prev => ({ ...prev, [field]: value }));
  };

  const handleBlockedDateTap = (date) => {
    const blockedDate = uiState.blockedDates.find(d => isSameDay(d.date, date));
    if (blockedDate) {
      handleUiChange('selectedBlockedDate', blockedDate);
      handleUiChange('showBlockedReason', true);
    }
  };

  // Form Submission
  const handleSubmit = async () => {
    // First check for courtesy appointment duplication
    if (formData.type === "Courtesy (VIP)") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const hasExistingCourtesy = existingAppointments.some(appt => {
        if (!appt.isCourtesy || appt.status === "Cancelled") return false;
        
        const apptDate = appt.createdAt instanceof Date ? appt.createdAt : new Date(appt.createdAt);
        const apptDay = new Date(apptDate);
        apptDay.setHours(0, 0, 0, 0);
        
        return apptDay.getTime() === today.getTime();
      });

      if (hasExistingCourtesy) {
        Alert.alert("Error", "You already have a courtesy appointment request for today");
        return;
      }
    }

    const errors = validateAppointmentForm(formData, uiState.blockedDates, existingAppointments, currentUserId);
    if (errors.length > 0) {
      Alert.alert("Error", errors[0]);
      return;
    }

    if (uiState.isUploading) {
      Alert.alert("Please wait", "Upload in progress");
      return;
    }
  
    handleUiChange('isLoading', true);
    
    try {
      // Prepare appointment data
      let appointmentDate = null;
      
      if (formData.type !== "Courtesy (VIP)" && formData.date && formData.time) {
        // Create a new date with the correct time
        appointmentDate = new Date(formData.date);
        const [timePart, period] = formData.time.split(' ');
        let [hours, minutes] = timePart.split(':');
        
        // Convert to 24-hour format
        hours = parseInt(hours);
        if (period === 'PM' && hours < 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        appointmentDate.setHours(hours);
        appointmentDate.setMinutes(parseInt(minutes));
        appointmentDate.setSeconds(0);
        appointmentDate.setMilliseconds(0);
      }
  
      const appointmentData = {
        type: formData.type,
        purpose: formData.purpose,
        status: "Pending",
        createdAt: new Date().toISOString(),
        imageUrl: formData.imageUri,
        isCourtesy: formData.type === "Courtesy (VIP)",
        ...(formData.type !== "Courtesy (VIP)" && {
          date: appointmentDate,
          time: formData.time,
        }),
        ...(uiState.isReschedule && uiState.originalAppointmentId && { 
          id: uiState.originalAppointmentId 
        }),
        ...(formData.type === "Finance (Medical)" && {
          patientName: formData.patientName,
          processorName: formData.processorName,
          medicalDetails: formData.medicalDetails,
          selfieUrl: formData.selfieUri,
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
                  <TypeSelection
                    selectedType={formData.type}
                    onTypeSelect={(type) => handleChange('type', type)}
                  />
                </View>

                {/* Purpose */}
                <PurposeInput
                  value={formData.purpose}
                  onChangeText={(text) => handleChange('purpose', text)}
                />

                {/* Info for courtesy appointments */}
                {formData.type === "Courtesy (VIP)" && (
                  <View style={styles.noteContainer}>
                    <FontAwesome5 name="info-circle" size={16} color="#003580" />
                    <Text style={styles.noteText}>
                      For courtesy appointments, our office will contact you to schedule the date and time.
                    </Text>
                  </View>
                )}

                {/* Calendar and Time Sections (only for non-courtesy) */}
                {formData.type !== "Courtesy (VIP)" && (
                  <>
                    <CalendarSection
                      selectedDate={formData.date}
                      onSelectDate={(date) => handleChange('date', date)}
                      existingAppointments={existingAppointments}
                      currentUserId={currentUserId}
                      blockedDates={uiState.blockedDates}
                      onBlockedDateTap={handleBlockedDateTap}
                      calendarView={uiState.calendarView}
                      onCalendarViewChange={(view) => handleUiChange('calendarView', view)}
                    />
                    
                    <TimeSection
                      selectedDate={formData.date}
                      selectedTime={formData.time}
                      onTimeSelect={(time) => {
                        handleChange('timePickerValue', time);
                        handleChange('time', formatTime(time));
                      }}
                      showTimePicker={uiState.showTimePicker}
                      onShowTimePicker={(show) => handleUiChange('showTimePicker', show)}
                      isUploading={uiState.isUploading}
                    />
                  </>
                )}

                {/* Medical Information (Conditional) */}
                {formData.type === "Finance (Medical)" && (
                  <MedicalInfo
                    patientName={formData.patientName}
                    processorName={formData.processorName}
                    medicalDetails={formData.medicalDetails}
                    onPatientNameChange={(text) => handleChange('patientName', text)}
                    onProcessorNameChange={(text) => handleChange('processorName', text)}
                    onMedicalDetailsChange={(text) => handleChange('medicalDetails', text)}
                  />
                )}

                {/* Supporting Documents */}
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>Supporting Documents</Text>
                  <Text style={styles.sectionSubtitle}>Attach any relevant files</Text>
                  <DocumentUpload
                    uri={formData.imageUri}
                    onSelect={() => selectImage('document')}
                    onRemove={() => handleChange('imageUri', null)}
                    iconName="paperclip"
                    buttonText="Document"
                    isUploading={uiState.isUploading}
                  />
                </View>

                {/* Patient Verification for Medical Appointments */}
                {formData.type === "Finance (Medical)" && (
                  <View style={styles.formSection}>
                    <Text style={styles.sectionTitle}>Patient Verification</Text>
                    <DocumentUpload
                      uri={formData.selfieUri}
                      onSelect={takeSelfie}
                      onRemove={() => handleChange('selfieUri', null)}
                      iconName="camera"
                      buttonText="Selfie"
                      isUploading={uiState.isUploading}
                    />
                  </View>
                )}

                {/* Blocked Date Modal */}
                <BlockedDateModal
                  visible={uiState.showBlockedReason}
                  onClose={() => handleUiChange('showBlockedReason', false)}
                  blockedDate={uiState.selectedBlockedDate}
                />

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

export default AppointmentForm;


