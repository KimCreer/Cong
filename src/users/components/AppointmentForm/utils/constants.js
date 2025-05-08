export const HOLIDAYS = [
  '01-01', '01-29', '04-01', '04-09', '04-17', 
  '04-18', '04-19', '05-01', '06-07', '06-12',
  '08-21', '08-25', '10-31', '11-01', '11-30',
  '12-08', '12-24', '12-25', '12-30', '12-31'
];

export const WORKING_HOURS = {
  start: 8,    // 8 AM
  end: 17,     // 5 PM
  breakStart: 11.5,  // 11:30 AM
  breakEnd: 12.5     // 12:30 PM
};

export const APPOINTMENT_TYPES = [
  { id: 1, name: "Courtesy (VIP)", icon: "handshake" },
  { id: 2, name: "Finance (Medical)", icon: "file-medical" },
]; 