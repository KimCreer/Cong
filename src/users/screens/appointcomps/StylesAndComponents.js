import { StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import React from 'react';


// Reusable Time Slot Header Component
export const TimeSlotHeader = ({ title }) => (
  <View style={styles.timeSlotHeader}>
    <Text style={styles.timeSlotTitle}>{title}</Text>
  </View>
);

// Reusable Empty State Component
export const EmptyState = ({ icon, text }) => (
  <View style={styles.emptyState}>
    <FontAwesome5 name={icon} size={50} color="#CCCCCC" />
    <Text style={styles.emptyStateText}>{text}</Text>
  </View>
);

// Reusable Modal Action Button Component
export const ModalActionButton = ({ icon, text, color, onPress }) => (
  <TouchableOpacity
    style={[styles.actionButton, { backgroundColor: color }]}
    onPress={onPress}
  >
    <FontAwesome5 name={icon} size={16} color="white" />
    <Text style={styles.buttonText}>{text}</Text>
  </TouchableOpacity>
);



// All remaining styles that weren't included in other files
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#003580",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  newAppointmentButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  newAppointmentText: {
    color: "#FFFFFF",
    marginLeft: 8,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#003580",
  },
  calendarToggle: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 8,
  },
  toggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 4,
    backgroundColor: "#E0E0E0",
  },
  activeToggle: {
    backgroundColor: "#003580",
  },
  toggleText: {
    color: "#000000",
    fontWeight: "bold",
  },
  activeToggleText: {
    color: "#FFFFFF",
  },
  selectedDateHeader: {
    fontSize: 18,
    fontWeight: "bold",
    padding: 16,
    color: "#003580",
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "bold",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    color: "#003580",
  },
  appointmentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
    overflow: 'hidden', // Add this for better border radius rendering

  },
  appointmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  dateContainer: {
    alignItems: "center",
    marginRight: 16,
  },
  dateDay: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#003580",
  },
  dateMonth: {
    fontSize: 12,
    color: "#666666",
    textTransform: "uppercase",
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentType: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 4,
  },
  appointmentTimeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  appointmentTime: {
    fontSize: 14,
    color: "#666666",
    marginLeft: 4,
  },
  virtualBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  virtualText: {
    fontSize: 10,
    color: "#FFFFFF",
    marginLeft: 4,
  },

  appointmentBody: {},
  purposeLabel: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 4,
  },
  purposeText: {
    fontSize: 14,
    color: "#333333",
  },
  timeSlotHeader: {
    backgroundColor: "#F5F5F5",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  timeSlotTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666666",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#999999",
    marginTop: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#003580",
  },
  detailRow: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  detailLabel: {
    width: 100,
    fontSize: 14,
    fontWeight: "bold",
    color: "#666666",
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: "#333333",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12, // modern alternative to margins
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  rescheduleButton: {
    backgroundColor: "#4CAF50", // green color for positive action
  },
  cancelButton: {
    backgroundColor: "#F44336", // red color for destructive action
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
    textAlign: "center",
  },
  buttonIcon: {
    marginRight: 8,
  },
  courtesyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#003580',
  },
  courtesyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  courtesyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6F2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  courtesyTitleContainer: {
    flex: 1,
  },
  courtesyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003580',
  },
  courtesySubtitle: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
    marginLeft: 10,  // Fixed typo here
  },
  courtesyBody: {
    marginBottom: 12,
  },
  courtesyDetailRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  courtesyDetailLabel: {
    width: 80,
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  courtesyDetailValue: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
  },
  courtesyFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  courtesyButton: {
    backgroundColor: '#003580',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  courtesyButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  statusBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },

  // Replace or add this to your styles object
backButton: {
  padding: 8,
  borderRadius: 12,
  backgroundColor: '#f0f6ff',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
  elevation: 2,
  marginRight: 10,
},

// You can also add this style for the back icon if you want to change its appearance
backButtonIcon: {
  color: '#003580',
  marginRight: 2,
},

// This is optional if you want to add text next to the icon
backButtonText: {
  color: '#003580',
  fontSize: 14,
  fontWeight: '600',
},
  
});