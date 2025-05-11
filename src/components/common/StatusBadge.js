import React from 'react';
import { View, Text } from 'react-native';
import { commonStyles } from '../../styles/commonStyles';

const getStatusColor = (status) => {
    const statusMap = {
        pending: '#FFC107',    // warning
        approved: '#4CAF50',   // success
        rejected: '#F44336',   // danger
        inProgress: '#2196F3', // info
        completed: '#4CAF50',  // success
        cancelled: '#9E9E9E',  // gray
    };
    
    return statusMap[status?.toLowerCase()] || '#9E9E9E';
};

const StatusBadge = ({ status, style }) => {
    const backgroundColor = getStatusColor(status);
    
    return (
        <View 
            style={[
                commonStyles.statusContainer,
                { backgroundColor },
                style
            ]}
        >
            <Text style={[commonStyles.statusText, { color: '#FFFFFF' }]}>
                {status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase() || 'Unknown'}
            </Text>
        </View>
    );
};

export default StatusBadge; 