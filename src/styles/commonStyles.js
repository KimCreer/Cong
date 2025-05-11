import { StyleSheet } from 'react-native';

export const commonStyles = StyleSheet.create({
    // Common container styles
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    contentContainer: {
        padding: 16,
    },
    
    // Common text styles
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2C3E50',
        marginBottom: 12,
        lineHeight: 28,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#34495E',
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 4,
    },
    value: {
        fontSize: 16,
        color: '#333333',
        fontWeight: '500',
    },
    
    // Common row styles
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    
    // Common button styles
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    buttonIcon: {
        marginRight: 8,
    },
    
    // Common card styles
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    
    // Common icon styles
    icon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(2, 117, 216, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    
    // Common modal styles
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '90%',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    
    // Common status styles
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    
    // Common divider
    divider: {
        height: 1,
        backgroundColor: '#EEEEEE',
        marginVertical: 16,
    },
    
    // Common spacing
    spacing: {
        small: 8,
        medium: 16,
        large: 24,
    },
    
    // Common colors
    colors: {
        primary: '#0275d8',
        success: '#4CAF50',
        danger: '#F44336',
        warning: '#FFC107',
        info: '#2196F3',
        light: '#F5F5F5',
        dark: '#333333',
        gray: '#666666',
        white: '#FFFFFF',
    },
}); 