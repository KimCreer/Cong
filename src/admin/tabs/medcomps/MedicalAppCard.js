import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { getStatusColor, formatStatusText } from './utils/utils';
import styles from './styles/MedicalApplicationStyles';

const MedicalAppCard = ({ application, onPress, isSelected, toggleSelection }) => (
    <TouchableOpacity 
        style={[
            styles.applicationCard,
            isSelected && styles.selectedCard
        ]} 
        onPress={onPress}
        onLongPress={() => toggleSelection(application.id)}
    >
        <View style={styles.cardHeader}>
            <FontAwesome5 name="user" size={20} color="#2196F3" />
            <Text style={styles.applicationTitle} numberOfLines={1}>
                {application.fullName || "No name provided"}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(application.status) }]}>
                <Text style={styles.statusText}>{formatStatusText(application.status)}</Text>
            </View>
        </View>
        
        <View style={styles.detailRow}>
            <MaterialIcons name="email" size={16} color="#666" />
            <Text style={styles.detailText} numberOfLines={1}>
                {application.email || "No email provided"}
            </Text>
        </View>
        
        <View style={styles.detailRow}>
            <FontAwesome5 name="phone" size={16} color="#666" />
            <Text style={styles.detailText}>
                {application.contactNumber || "No contact number"}
            </Text>
        </View>
        
        <View style={styles.detailRow}>
            <MaterialIcons name="medical-services" size={16} color="#666" />
            <Text style={styles.detailText}>
                {application.programName || "No program specified"}
            </Text>
        </View>
        
        {application.assistanceType && (
            <View style={styles.detailRow}>
                <FontAwesome5 name="hands-helping" size={16} color="#666" />
                <Text style={styles.detailText}>
                    {application.assistanceType}
                </Text>
            </View>
        )}
        
        <View style={styles.cardFooter}>
            <Text style={styles.timeAgo}>
                {application.timeAgo || "Unknown date"}
            </Text>
            {application.estimatedCost && (
                <Text style={styles.costText}>₱{application.estimatedCost}</Text>
            )}
        </View>
        
        {isSelected && (
            <View style={styles.selectedOverlay}>
                <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
            </View>
        )}
    </TouchableOpacity>
);

export default MedicalAppCard;