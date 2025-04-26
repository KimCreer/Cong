import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5, Feather } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

const StatCard = ({ icon, value, label, color, onPress }) => {
    return (
        <Animatable.View 
            animation="fadeInUp" 
            duration={800}
            style={[
                styles.statCard, 
                { borderLeftWidth: 4, borderLeftColor: color },
            ]}
        >
            <TouchableOpacity onPress={onPress} style={{ flex: 1 }}>
                <View style={styles.statCardContent}>
                    <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
                        <FontAwesome5 name={icon} size={20} color={color} />
                    </View>
                    <Text style={styles.statValue}>{value}</Text>
                    <Text style={styles.statLabel}>{label}</Text>
                    <View style={styles.statArrow}>
                        <Feather name="chevron-right" size={16} color="#ccc" />
                    </View>
                </View>
            </TouchableOpacity>
        </Animatable.View>
    );
};

const styles = StyleSheet.create({
    statCard: {
        width: "48%",
        backgroundColor: "white",
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 12,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    statCardContent: {
        flexDirection: "column",
    },
    statIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: "700",
        color: "#333",
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: "#666",
    },
    statArrow: {
        position: "absolute",
        right: 0,
        top: 10,
    },
});

export default StatCard;