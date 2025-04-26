import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

const ActivityItem = ({ item }) => {
    const getIcon = () => {
        switch(item.type) {
            case 'appointment': return 'calendar-alt';
            case 'concern': return 'comments';
            case 'update': return 'newspaper';
            case 'project': return 'project-diagram';
            default: return 'bell';
        }
    };

    const getIconColor = () => {
        switch(item.type) {
            case 'appointment': return '#FF9800';
            case 'concern': return '#F44336';
            case 'update': return '#4CAF50';
            case 'project': return '#2196F3';
            default: return '#9C27B0';
        }
    };

    return (
        <Animatable.View 
            animation="fadeInRight" 
            duration={500}
            style={styles.activityItem}
        >
            <View style={[styles.activityIcon, { backgroundColor: getIconColor() + '20' }]}>
                <FontAwesome5 name={getIcon()} size={16} color={getIconColor()} />
            </View>
            <View style={styles.activityContent}>
                <Text style={styles.activityAction}>{item.action}</Text>
                <Text style={styles.activityTime}>{item.time}</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#ccc" />
        </Animatable.View>
    );
};

const styles = StyleSheet.create({
    activityItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#F0F4F8",
    },
    activityIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    activityContent: {
        flex: 1,
    },
    activityAction: {
        fontSize: 14,
        color: "#333",
        marginBottom: 2,
    },
    activityTime: {
        fontSize: 12,
        color: "#666",
    },
});

export default ActivityItem;