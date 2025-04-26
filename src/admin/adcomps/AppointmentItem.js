import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

const AppointmentItem = ({ appointment }) => (
    <Animatable.View 
        animation="fadeInRight" 
        duration={600}
        style={styles.appointmentItem}
    >
        <View style={styles.appointmentHeader}>
            <Text style={styles.appointmentType}>{appointment.type || 'Appointment'}</Text>
            <View style={[styles.statusBadge, { backgroundColor: '#FF980020' }]}>
                <Text style={[styles.statusText, { color: '#FF9800' }]}>{appointment.status}</Text>
            </View>
        </View>
        <View style={styles.appointmentDetailRow}>
            <Feather name="clock" size={16} color="#666" />
            <Text style={styles.appointmentDetailText}>
                {appointment.formattedDateTime}
            </Text>
        </View>
        <View style={styles.appointmentDetailRow}>
            <Feather name="info" size={16} color="#666" />
            <Text style={styles.appointmentDetailText}>{appointment.purpose || 'No purpose specified'}</Text>
        </View>
    </Animatable.View>
);

const styles = StyleSheet.create({
    appointmentItem: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    appointmentHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    appointmentType: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
    },
    appointmentDetailRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },
    appointmentDetailText: {
        fontSize: 14,
        color: "#666",
        marginLeft: 8,
    },
});

export default AppointmentItem;