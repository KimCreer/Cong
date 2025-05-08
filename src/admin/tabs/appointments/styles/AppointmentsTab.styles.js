import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    tabButton: {
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    activeTabButton: {
        borderBottomColor: '#003366',
    },
    tabButtonText: {
        color: '#666',
        fontWeight: '500',
    },
    activeTabButtonText: {
        color: '#003366',
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#003366',
    },
    filterBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
    },
    filterButtonText: {
        marginLeft: 8,
        color: '#003366',
        fontWeight: '500',
    },
    listContainer: {
        paddingBottom: 20,
        flexGrow: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    emptyListContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 20,
        color: '#003366',
        textAlign: 'center',
    },
    filterOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        marginBottom: 5,
        borderRadius: 6,
    },
    selectedFilterOption: {
        backgroundColor: '#e6f2ff',
    },
    filterOptionText: {
        marginLeft: 10,
        fontSize: 16,
        color: '#666',
    },
    selectedFilterOptionText: {
        color: '#003366',
        fontWeight: '500',
    },
    typeIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCloseButton: {
        marginTop: 15,
        padding: 12,
        backgroundColor: '#003366',
        borderRadius: 6,
        alignItems: 'center',
    },
    modalCloseButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    blockedDatesContainer: {
        flex: 1,
        padding: 15,
    },
    addBlockedDateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#dc3545',
        padding: 12,
        borderRadius: 6,
        marginBottom: 15,
    },
    addBlockedDateButtonText: {
        color: '#fff',
        fontWeight: '600',
        marginLeft: 8,
    },
    blockedDatesList: {
        paddingBottom: 20,
    },
    reasonInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        padding: 12,
        marginBottom: 15,
    },
    modalButtonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        padding: 12,
        borderRadius: 6,
        width: '48%',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#6c757d',
    },
    confirmButton: {
        backgroundColor: '#dc3545',
    },
    modalButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
}); 