import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

const ConcernItem = ({ concern, navigation }) => (
    
    <Animatable.View 
        animation="fadeInRight" 
        duration={600}
        style={styles.concernItem}
    >
        <View style={styles.concernHeader}>
            <View style={styles.concernCategoryBadge}>
                <Text style={styles.concernCategoryText}>{concern.category || "General"}</Text>
            </View>
            <View style={[
                styles.statusBadge, 
                { 
                    backgroundColor: concern.status === 'Pending' ? '#F4433620' : '#FF980020',
                    marginLeft: 8
                }
            ]}>
                <Text style={[
                    styles.statusText, 
                    { color: concern.status === 'Pending' ? '#F44336' : '#FF9800' }
                ]}>
                    {concern.status}
                </Text>
            </View>
        </View>
        <Text style={styles.concernSubject}>{concern.subject}</Text>
        <Text style={styles.concernDetails} numberOfLines={2}>{concern.description}</Text>
        
        {concern.imageUrl && (
            <View style={styles.imageContainer}>
                <Text style={styles.imageLabel}>
                    {concern.imageName || 'Attached Image'}
                </Text>
                <TouchableOpacity 
                    onPress={() => navigation.navigate('ImageFullScreen', { imageUrl: concern.imageUrl })}
                    activeOpacity={0.8}
                >
                    <Image 
                        source={{ uri: concern.imageUrl }} 
                        style={styles.largeImage}
                        resizeMode="cover"
                    />
                </TouchableOpacity>
            </View>
        )}
        
        <View style={styles.concernFooter}>
            <Text style={styles.concernTime}>{concern.timeAgo}</Text>
            <TouchableOpacity 
                style={styles.viewDetailsButton}
                onPress={() => navigation.navigate('ConcernDetails', { concernId: concern.id })}
            >
                <Text style={styles.viewDetailsText}>View Details</Text>
            </TouchableOpacity>
        </View>
    </Animatable.View>
);

const styles = StyleSheet.create({
    concernItem: {
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
    concernHeader: {
        flexDirection: "row",
        marginBottom: 10,
    },
    concernCategoryBadge: {
        backgroundColor: "#0275d820",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    concernCategoryText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#0275d8",
    },
    concernSubject: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginBottom: 6,
    },
    concernDetails: {
        fontSize: 14,
        color: "#666",
        marginBottom: 10,
    },
    concernFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    concernTime: {
        fontSize: 12,
        color: "#999",
    },
    viewDetailsButton: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: "#F0F4F8",
        borderRadius: 12,
    },
    viewDetailsText: {
        fontSize: 12,
        color: "#0275d8",
        fontWeight: "600",
    },
    imageContainer: {
        marginBottom: 12,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#f5f5f5',
    },
    imageLabel: {
        padding: 8,
        fontSize: 14,
        color: "#333",
        fontWeight: '500',
        backgroundColor: '#f0f0f0',
    },
    largeImage: {
        width: '100%',
        height: 200,
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
});

export default ConcernItem;