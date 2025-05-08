import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 } from "@expo/vector-icons";
import { safeFormatDate } from '../utils/dateUtils';

const BlockedDateItem = ({ date, reason, onRemove }) => {
    return (
        <View style={styles.blockedDateItem}>
            <View style={styles.blockedDateInfo}>
                <FontAwesome5 name="calendar-times" size={18} color="#dc3545" />
                <Text style={styles.blockedDateText}>
                    {safeFormatDate(date, 'MMMM dd, yyyy')}
                </Text>
                <Text style={styles.blockedReasonText}>{reason}</Text>
            </View>
            <TouchableOpacity 
                style={styles.unblockButton}
                onPress={onRemove}
            >
                <FontAwesome5 name="times" size={16} color="#dc3545" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    blockedDateItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    blockedDateInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    blockedDateText: {
        marginLeft: 10,
        marginRight: 15,
        color: '#333',
        fontWeight: '500',
    },
    blockedReasonText: {
        color: '#666',
        fontStyle: 'italic',
    },
    unblockButton: {
        padding: 8,
    },
});

export default BlockedDateItem; 