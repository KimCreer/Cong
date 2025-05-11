import React from 'react';
import { View, Text } from 'react-native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { commonStyles } from '../../styles/commonStyles';

const DetailRow = ({ icon, label, value, iconColor = '#666' }) => {
    const IconComponent = icon === 'user-tie' ? FontAwesome5 :
                         icon === 'map-marker-alt' ? FontAwesome5 :
                         icon === 'money-bill-wave' ? FontAwesome5 :
                         icon === 'calendar-alt' ? FontAwesome5 :
                         icon === 'edit' ? MaterialIcons : FontAwesome5;

    return (
        <View style={commonStyles.detailRow}>
            <View style={commonStyles.icon}>
                <IconComponent name={icon} size={16} color={iconColor} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={commonStyles.label}>{label}</Text>
                <Text style={commonStyles.value}>{value}</Text>
            </View>
        </View>
    );
};

export default DetailRow; 