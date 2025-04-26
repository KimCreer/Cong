// Constants
export const HOLIDAYS = [
    '01-01', '01-29', '04-01', '04-09', '04-17', 
    '04-18', '04-19', '05-01', '06-07', '06-12',
    '08-21', '08-25', '10-31', '11-01', '11-30',
    '12-08', '12-24', '12-25', '12-30', '12-31'
  ];
  
  export const MAX_DAILY_APPOINTMENTS = 6;
  export const TIME_SLOT_CONFLICT_MINUTES = 60;
  
  // Date Utilities
  export const formatDate = (date, formatStr) => {
    const d = new Date(date);
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return formatStr
      .replace('yyyy', d.getFullYear())
      .replace('MM', String(d.getMonth() + 1).padStart(2, '0'))
      .replace('dd', String(d.getDate()).padStart(2, '0'))
      .replace('EEE', days[d.getDay() - 1] || '')
      .replace('MMM', months[d.getMonth()])
      .replace('d', d.getDate());
  };
  
  export const isSameDay = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };
  
  export const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };
  
  export const getTimeSlot = (time) => {
    const hour = parseInt(time.split(':')[0]);
    return hour < 12 ? 'Morning' : 'Afternoon';
  };
  
  export const isHoliday = (date) => HOLIDAYS.includes(formatDate(date, 'MM-dd'));
  export const isWeekend = (date) => date.getDay() === 0 || date.getDay() === 6;
  
  // Helper function to get the start of week (Monday)
  export const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    return new Date(d.setDate(diff));
  };
  
  // Helper function to get days in month
  export const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  // Helper function to check if date is in the past
  export const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(date) < today;
  };
  
  // Helper function to validate time format
  export const isValidTime = (time) => {
    return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
  };
  
  // Helper function to convert time to minutes
  export const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  // Helper function to check time conflict
  export const hasTimeConflict = (existingTimes, newTime, bufferMinutes = TIME_SLOT_CONFLICT_MINUTES) => {
    const newTimeMinutes = timeToMinutes(newTime);
    
    return existingTimes.some(existingTime => {
      const existingMinutes = timeToMinutes(existingTime);
      return Math.abs(newTimeMinutes - existingMinutes) < bufferMinutes;
    });
  };


  