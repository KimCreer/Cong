import { isPastDate, isSameDay, formatDate } from './dateUtils';
import { HOLIDAYS } from './constants';

export const isHoliday = (date) => date ? HOLIDAYS.includes(formatDate(date, 'MM-dd')) : false;
export const isWeekend = (date) => date ? date.getDay() === 0 || date.getDay() === 6 : false;

export const isDateUnavailable = (date) => {
  if (!date) return false;
  return isPastDate(date) || isWeekend(date) || isHoliday(date);
};

export const hasExistingCourtesyAppointment = (existingAppointments, currentUserId) => {
  if (!existingAppointments || !currentUserId) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return existingAppointments.some(appointment => {
    if (!appointment.isCourtesy || appointment.userId !== currentUserId || !appointment.createdAt) {
      return false;
    }
    
    // Handle both Timestamp and Date objects
    const appointmentDate = appointment.createdAt instanceof Date 
      ? appointment.createdAt 
      : new Date(appointment.createdAt.seconds * 1000);
    
    appointmentDate.setHours(0, 0, 0, 0);
    return isSameDay(appointmentDate, today);
  });
};

export const validateAppointmentForm = (formData, blockedDates, existingAppointments, currentUserId) => {
  const errors = [];

  if (!formData.type) {
    errors.push("Please select appointment type");
  }
  
  if (!formData.purpose.trim()) {
    errors.push("Please enter purpose");
  }
  
  // Check for existing courtesy appointment
  if (formData.type === "Courtesy (VIP)" && hasExistingCourtesyAppointment(existingAppointments, currentUserId)) {
    errors.push("You already have a courtesy appointment request for today. Please try again tomorrow.");
  }
  
  // Skip date/time validation for courtesy appointments
  if (formData.type !== "Courtesy (VIP)") {
    if (!formData.date) {
      errors.push("Please select a date");
    } else {
      const dateObj = new Date(formData.date);
      
      if (isNaN(dateObj.getTime())) {
        errors.push("Invalid date selected");
      }
      
      if (isPastDate(dateObj)) {
        errors.push("You cannot schedule appointments for past dates");
      }
      
      // Check if date is blocked
      const isBlocked = blockedDates.some(blockedDate => 
        isSameDay(blockedDate.date, dateObj)
      );
      
      if (isBlocked) {
        errors.push("The selected date is blocked. Please choose another date.");
      }
      
      if (!formData.time) {
        errors.push("Please select a time");
      }
    }
  }
  
  if (formData.type === "Finance (Medical)") {
    if (!formData.patientName.trim()) {
      errors.push("Please enter patient name");
    }
    if (!formData.processorName.trim()) {
      errors.push("Please enter processor name");
    }
    if (!formData.selfieUri) {
      errors.push("Please take a selfie");
    }
  }
  
  return errors;
}; 