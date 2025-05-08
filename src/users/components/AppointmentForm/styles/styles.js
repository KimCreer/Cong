import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  // Form Container Styles
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    marginBottom: 1,
  },
  requiredIndicator: {
    fontSize: 13,
    color: '#F44336',
    fontStyle: 'italic',
  },

  // Type Selection Styles
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

  // Input Styles
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

  // Calendar Styles
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
  selectedDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  selectedDateText: {
    marginLeft: 8,
    color: '#2E7D32',
    fontWeight: '500',
  },

  // Week Calendar Styles
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
    opacity: 0.6,
  },
  bookedDay: {
    backgroundColor: '#FFEBEE',
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
    color: '#FF0000',
    marginTop: 2,
  },
  densityBadge: {
    fontSize: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 4,
    borderRadius: 4,
    marginTop: 2,
  },

  // Month Calendar Styles
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

  // Time Selection Styles
  selectedTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  selectedTimeText: {
    marginLeft: 8,
    color: '#2E7D32',
    fontWeight: '500',
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
  unselectedTimeButton: {
    borderColor: '#F44336',
    borderWidth: 1.5,
  },
  unselectedTimeText: {
    color: '#F44336',
    fontStyle: 'italic',
  },
  datePickerText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },

  // Info and Warning Styles
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
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F2FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  noteText: {
    color: "#31708F",
    marginLeft: 10,
    fontSize: 14,
    flex: 1,
  },

  // Document Upload Styles
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

  // Submit Button Styles
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

  // Blocked Date Modal Styles
  blockedReasonModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  blockedReasonContainer: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    width: '80%',
  },
  blockedReasonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 10,
    textAlign: 'center',
  },
  blockedReasonText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  blockedReasonButton: {
    backgroundColor: '#003580',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
  },
  blockedReasonButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 