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
    onCancel
}) => {
    const isActuallyScheduled = appointment.isCourtesy 
        ? appointment.isScheduled && appointment.status === 'Confirmed'
        : appointment.isScheduled;

    return (
        <View style={[
            styles.appointmentCard,
            appointment.isCourtesy && styles.courtesyCard,
            isActuallyScheduled && styles.scheduledCard
        ]}>
            <TouchableOpacity onPress={() => onToggleActions(appointment.id)}>
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
                            {`${appointment.userFirstName} ${appointment.userLastName}`}
                        </Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                        <FontAwesome5 name="calendar-check" size={14} color="#666" />
                        <Text style={styles.detailText}>
                            Submitted: {appointment.formattedCreatedAt}
                        </Text>
                    </View>
                    
                    {isHistory && (
                        <View style={styles.detailRow}>
                            <FontAwesome5 name="history" size={14} color="#666" />
                            <Text style={styles.detailText}>
                                Updated: {appointment.formattedUpdatedAt}
                            </Text>
                        </View>
                    )}
                    
                    {appointment.notes && (
                        <View style={styles.detailRow}>
                            <FontAwesome5 name="sticky-note" size={14} color="#666" />
                            <Text style={styles.detailText} numberOfLines={1}>
                                {appointment.notes}
                            </Text>
                        </View>
                    )}
                </View>
                
                <View style={styles.cardFooter}>
                    <Text style={[
                        styles.typeText,
                        appointment.isCourtesy && styles.courtesyTypeText
                    ]}>
                        {appointment.typeInfo.label}
                    </Text>
                    {!isHistory && (
                        <MaterialIcons 
                            name={showActionButtons[appointment.id] ? "expand-less" : "expand-more"} 
                            size={20} 
                            color="#999" 
                        />
                    )}
                </View>
            </TouchableOpacity>

            {((!isHistory && showActionButtons[appointment.id]) || (isHistory && allowHistoryActions && showActionButtons[appointment.id])) && (
                <View style={styles.actionButtonsContainer}>
                    {((!isHistory && appointment.isCourtesy) || (isHistory && allowHistoryActions && appointment.isCourtesy)) && (
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.scheduleButton]}
                            onPress={() => onSchedule && onSchedule(appointment.id)}
                        >
                            <FontAwesome5 name="calendar-plus" size={14} color="#fff" />
                            <Text style={styles.actionButtonText}>{isHistory ? 'Reschedule' : 'Schedule'}</Text>
                        </TouchableOpacity>
                    )}
                    {((!isHistory && appointment.isCourtesy) || (isHistory && allowHistoryActions && (appointment.isCourtesy || appointment.typeInfo.label === 'Medical Finance'))) && (
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.rejectButton]}
                            onPress={() => onCancel && onCancel(appointment.id)}
                        >
                            <FontAwesome5 name="times" size={14} color="#fff" />
                            <Text style={styles.actionButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    )}
                    {(!isHistory && !appointment.isCourtesy) && (
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.confirmButton]}
                            onPress={() => onConfirm(appointment.id)}
                        >
                            <FontAwesome5 name="check" size={14} color="#fff" />
                            <Text style={styles.actionButtonText}>Confirm</Text>
                        </TouchableOpacity>
                    )}
                    {(!isHistory && !appointment.isCourtesy) && (
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.rejectButton]}
                            onPress={() => onReject(appointment.id)}
                        >
                            <FontAwesome5 name="times" size={14} color="#fff" />
                            <Text style={styles.actionButtonText}>Reject</Text>
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
        borderRadius: 10,
        margin: 10,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    courtesyCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#6c5ce7',
        backgroundColor: '#f8f5ff'
    },
    scheduledCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#28a745',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    typeIndicator: {
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    appointmentTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    courtesyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#4a3c8a'
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    appointmentDetails: {
        marginBottom: 10,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    detailText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#666',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    typeText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    courtesyTypeText: {
        color: '#6c5ce7',
        fontWeight: '600'
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        flexWrap: 'wrap'
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        justifyContent: 'center',
        marginVertical: 5,
        minWidth: '30%'
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
        marginLeft: 5
    },
    scheduledBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8f5e9',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        marginVertical: 5,
        minWidth: '30%'
    },
    scheduledText: {
        color: '#28a745',
        fontWeight: '600',
        fontSize: 12,
        marginLeft: 5
    },
});

export default AppointmentCard; 