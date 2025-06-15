import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { STATUS_COLORS } from '../constants';

const AppointmentCard = ({ 
    appointment, 
    isHistory = false, 
    showActionButtons, 
    onToggleActions, 
    onConfirm, 
    onReject, 
    onSchedule, 
    onViewDetails,
    allowHistoryActions,
    onCancel,
    onStatusUpdate,
    onComplete,
    onDelete,
    isInHistoryList
}) => {
    const isActuallyScheduled = appointment.isCourtesy 
        ? appointment.isScheduled && appointment.status === 'Confirmed'
        : appointment.isScheduled;

    const showRescheduleButton = appointment.isCourtesy && 
        (appointment.status === 'Confirmed' || appointment.status === 'Cancelled' || appointment.status === 'Rejected') &&
        !isInHistoryList;

    const showConfirmButton = !appointment.isCourtesy && 
        appointment.status !== 'Confirmed' && 
        !isInHistoryList;

    const showRejectButton = !appointment.isCourtesy && 
        appointment.status !== 'Cancelled' && 
        appointment.status !== 'Rejected' &&
        !isInHistoryList;

    const showDoneButton = appointment.status === 'Confirmed' && 
        !isInHistoryList;

    return (
        <View style={[
            styles.appointmentCard,
            appointment.isCourtesy && styles.courtesyCard,
            isActuallyScheduled && styles.scheduledCard,
            showActionButtons[appointment.id] && styles.expandedCard
        ]}>
            <TouchableOpacity 
                onPress={() => onToggleActions(appointment.id)}
                style={styles.cardTouchable}
            >
                <View style={styles.cardHeader}>
                    <View style={[
                        styles.typeIndicator, 
                        { 
                            backgroundColor: appointment.typeInfo.color,
                            width: appointment.isCourtesy ? 30 : 24,
                            height: appointment.isCourtesy ? 30 : 24,
                            borderRadius: appointment.isCourtesy ? 15 : 12
                        }
                    ]}>
                        <FontAwesome5 
                            name={appointment.typeInfo.icon} 
                            size={appointment.isCourtesy ? 16 : 14} 
                            color="#fff" 
                        />
                    </View>
                    <Text style={[
                        styles.appointmentTitle,
                        appointment.isCourtesy && styles.courtesyTitle
                    ]}>
                        {appointment.purpose}
                    </Text>
                    <View style={[
                        styles.statusBadge,
                        { backgroundColor: STATUS_COLORS[appointment.status] || '#FFF9E6' }
                    ]}>
                        <Text style={[
                            styles.statusText,
                            { color: appointment.status === 'Pending' ? 'white' : '#fff' }
                        ]}>
                            {appointment.status}
                        </Text>
                    </View>
                </View>
                
                <View style={styles.appointmentDetails}>
                    {appointment.isCourtesy && (
                        <View style={styles.detailRow}>
                            <FontAwesome5 name="user-tie" size={14} color="#666" />
                            <Text style={styles.detailText}>
                                Courtesy Request
                            </Text>
                        </View>
                    )}
                    
                    {appointment.date ? (
                        <>
                            <View style={styles.detailRow}>
                                <FontAwesome5 name="calendar-alt" size={14} color="#666" />
                                <Text style={styles.detailText}>
                                    {appointment.formattedDate}
                                </Text>
                            </View>
                            
                            <View style={styles.detailRow}>
                                <FontAwesome5 name="clock" size={14} color="#666" />
                                <Text style={styles.detailText}>
                                    {appointment.formattedTime}
                                </Text>
                            </View>
                        </>
                    ) : (
                        <View style={styles.detailRow}>
                            <FontAwesome5 name="calendar-plus" size={14} color="#666" />
                            <Text style={styles.detailText}>
                                Date not yet scheduled
                            </Text>
                        </View>
                    )}
                    
                    <View style={styles.detailRow}>
                        <FontAwesome5 name="user" size={14} color="#666" />
                        <Text style={styles.detailText}>
                            {appointment.userFirstName} {appointment.userLastName}
                        </Text>
                    </View>
                </View>
                
                <View style={styles.cardFooter}>
                    <Text style={[
                        styles.typeText,
                        appointment.isCourtesy && styles.courtesyTypeText
                    ]}>
                        {appointment.typeInfo.label}
                    </Text>
                    {!isInHistoryList && (
                        <MaterialIcons 
                            name={showActionButtons[appointment.id] ? "expand-less" : "expand-more"} 
                            size={20} 
                            color="#999" 
                        />
                    )}
                </View>
            </TouchableOpacity>

            {showActionButtons[appointment.id] && (
                <View style={styles.actionButtonsContainer}>
                    {!isInHistoryList && (
                        <>
                            {showDoneButton && (
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.completeButton]}
                                    onPress={() => onComplete(appointment.id)}
                                >
                                    <FontAwesome5 name="check-double" size={14} color="#fff" />
                                    <Text style={styles.actionButtonText}>Done</Text>
                                </TouchableOpacity>
                            )}
                            {showRescheduleButton && (
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.scheduleButton]}
                                    onPress={() => onSchedule(appointment.id)}
                                >
                                    <FontAwesome5 name="calendar-plus" size={14} color="#fff" />
                                    <Text style={styles.actionButtonText}>
                                        {showRescheduleButton ? 'Reschedule' : 'Schedule'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            {showConfirmButton && (
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.confirmButton]}
                                    onPress={() => onConfirm(appointment.id)}
                                >
                                    <FontAwesome5 name="check" size={14} color="#fff" />
                                    <Text style={styles.actionButtonText}>Confirm</Text>
                                </TouchableOpacity>
                            )}
                            {showRejectButton && (
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.rejectButton]}
                                    onPress={() => onReject(appointment.id)}
                                >
                                    <FontAwesome5 name="times" size={14} color="#fff" />
                                    <Text style={styles.actionButtonText}>Reject</Text>
                                </TouchableOpacity>
                            )}
                            {onCancel && (
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.rejectButton]}
                                    onPress={() => onCancel(appointment.id)}
                                >
                                    <FontAwesome5 name="times" size={14} color="#fff" />
                                    <Text style={styles.actionButtonText}>Cancel</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                    {(isHistory || isInHistoryList) && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.deleteButton]}
                            onPress={() => onDelete(appointment.id)}
                        >
                            <FontAwesome5 name="trash" size={14} color="#fff" />
                            <Text style={styles.actionButtonText}>Delete</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.actionButton, styles.detailsButton]}
                        onPress={() => onViewDetails(appointment.id)}
                    >
                        <FontAwesome5 name="info-circle" size={14} color="#fff" />
                        <Text style={styles.actionButtonText}>Details</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    appointmentCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        margin: 8,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    expandedCard: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    cardTouchable: {
        borderRadius: 12,
    },
    courtesyCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#6c5ce7',
        backgroundColor: '#f8f5ff',
    },
    scheduledCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#28a745',
        backgroundColor: '#f8fff9',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    typeIndicator: {
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    appointmentTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginRight: 8,
    },
    courtesyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#4a3c8a',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    appointmentDetails: {
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        paddingVertical: 2,
    },
    detailText: {
        marginLeft: 10,
        fontSize: 14,
        color: '#666',
        flex: 1,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    typeText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    courtesyTypeText: {
        color: '#6c5ce7',
        fontWeight: '600',
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        flexWrap: 'wrap',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        justifyContent: 'center',
        marginVertical: 4,
        minWidth: '30%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    confirmButton: {
        backgroundColor: '#28a745',
    },
    rejectButton: {
        backgroundColor: '#dc3545',
    },
    detailsButton: {
        backgroundColor: '#007bff',
    },
    scheduleButton: {
        backgroundColor: '#6c5ce7',
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 12,
        marginLeft: 6,
    },
    completeButton: {
        backgroundColor: '#6c5ce7',
    },
    deleteButton: {
        backgroundColor: '#ff4d4f',
    },
});

export default AppointmentCard; 