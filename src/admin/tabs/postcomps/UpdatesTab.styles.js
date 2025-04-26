// UpdatesTab.styles.js
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 15,
        backgroundColor: '#F5F5F5',
    },
    authContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
    },
    authText: {
        marginTop: 20,
        color: '#003366',
        fontSize: 16,
    },
    createButton: {
        flexDirection: 'row',
        backgroundColor: '#003366',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
    },
    createButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    postCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        overflow: 'hidden',
    },
    cardContent: {
        padding: 15,
    },
    postImage: {
        width: '100%',
        height: 150,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    postTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#003366',
        flex: 1,
    },
    unreadBadge: {
        backgroundColor: '#FF4444',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginLeft: 10,
    },
    unreadText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    postContent: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
        lineHeight: 20,
    },
    categoryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    postCategory: {
        fontSize: 12,
        color: '#555',
        backgroundColor: '#EEE',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    priorityBadge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 15,
    },
    priorityText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    postFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    postDate: {
        fontSize: 12,
        color: '#999',
    },
    adminInfo: {
        fontSize: 11,
        color: '#777',
        fontStyle: 'italic',
    },
    actionButtons: {
        flexDirection: 'row',
    },
    actionIcon: {
        marginLeft: 15,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: '#999',
        fontSize: 16,
    },
    bottomModalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    bottomModalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    bottomModalView: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 30,
        maxHeight: '90%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    modalHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#ccc',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 15,
    },
    modalScrollView: {
        width: '100%',
    },
    modalScrollContent: {
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#003366',
    },
    closeButton: {
        padding: 5,
    },
    formGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
        marginBottom: 8,
    },
    required: {
        color: '#FF0000',
    },
    inputField: {
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 15,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
        paddingTop: 15,
    },
    imageUploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: '#003366',
        borderRadius: 8,
        backgroundColor: 'rgba(0, 51, 102, 0.1)',
    },
    imageUploadText: {
        marginLeft: 10,
        color: '#003366',
        fontWeight: '500',
    },
    imagePreviewContainer: {
        marginTop: 15,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: 200,
    },
    uploadOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadText: {
        color: '#FFF',
        marginTop: 10,
        fontWeight: '500',
    },
    selectContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#f9f9f9',
        overflow: 'hidden',
    },
    selectInput: {
        height: 50,
        width: '100%',
        color: '#424242',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    modalButton: {
        flex: 1,
        padding: 15,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
        marginRight: 10,
    },
    submitButton: {
        backgroundColor: '#003366',
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
        case 'high': return '#FF4444';
        case 'medium': return '#FFBB33';
        case 'low': return '#00C851';
        default: return '#AAAAAA';
    }
};