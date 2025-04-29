import React, { useState, useEffect } from "react";
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    ActivityIndicator,
    RefreshControl,
    Alert,
    Modal,
    Pressable
} from "react-native";
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { 
    getFirestore, 
    collection, 
    query, 
    where, 
    getDocs, 
    onSnapshot, 
    orderBy 
} from "@react-native-firebase/firestore";
import { useNavigation } from '@react-navigation/native';

const categoryData = {
  'General': {
    icon: 'alert-circle-outline',
    color: '#0275d8',
  },
  'Issue': {
    icon: 'alert-octagon',
    color: '#dc3545',
  },
  'Complaint': {
    icon: 'account-alert',
    color: '#fd7e14',
  },
  'Suggestion': {
    icon: 'lightbulb-on',
    color: '#ffc107',
  }
};

const statusOptions = ['All', 'Pending', 'In Progress'];

const ConcernsTab = () => {
    const navigation = useNavigation();
    const [concerns, setConcerns] = useState([]);
    const [filteredConcerns, setFilteredConcerns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedStatus, setSelectedStatus] = useState('All');

    const fetchConcerns = async () => {
        try {
            setRefreshing(true);
            const db = getFirestore();
            const q = query(
                collection(db, "concerns"),
                where("status", "in", ["Pending", "In Progress"]),
                orderBy("createdAt", "desc")
            );
            
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timeAgo: doc.data().createdAt ? formatTimeAgo(doc.data().createdAt.toDate()) : "Unknown date"
            }));
            
            setConcerns(data);
            applyFilters(data, selectedCategory, selectedStatus);
        } catch (error) {
            console.error("Error fetching concerns:", error);
            Alert.alert("Error", "Failed to load concerns");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const applyFilters = (data, category, status) => {
        let filtered = [...data];
        
        if (category !== 'All') {
            filtered = filtered.filter(item => item.category === category);
        }
        
        if (status !== 'All') {
            filtered = filtered.filter(item => item.status === status);
        }
        
        setFilteredConcerns(filtered);
    };

    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
        applyFilters(concerns, category, selectedStatus);
        setShowFilterModal(false);
    };

    const handleStatusSelect = (status) => {
        setSelectedStatus(status);
        applyFilters(concerns, selectedCategory, status);
        setShowFilterModal(false);
    };

    const resetFilters = () => {
        setSelectedCategory('All');
        setSelectedStatus('All');
        setFilteredConcerns(concerns);
        setShowFilterModal(false);
    };

    const formatTimeAgo = (date) => {
        if (!date) return "Unknown date";
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = Math.floor(seconds / 31536000);
        
        if (interval >= 1) return `${interval} year${interval === 1 ? '' : 's'} ago`;
        interval = Math.floor(seconds / 2592000);
        if (interval >= 1) return `${interval} month${interval === 1 ? '' : 's'} ago`;
        interval = Math.floor(seconds / 86400);
        if (interval >= 1) return `${interval} day${interval === 1 ? '' : 's'} ago`;
        interval = Math.floor(seconds / 3600);
        if (interval >= 1) return `${interval} hour${interval === 1 ? '' : 's'} ago`;
        interval = Math.floor(seconds / 60);
        if (interval >= 1) return `${interval} minute${interval === 1 ? '' : 's'} ago`;
        return `${Math.floor(seconds)} second${seconds === 1 ? '' : 's'} ago`;
    };

    useEffect(() => {
        fetchConcerns();
        
        // Real-time listener
        const db = getFirestore();
        const q = query(
            collection(db, "concerns"),
            where("status", "in", ["Pending", "In Progress"]),
            orderBy("createdAt", "desc")
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const updatedData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timeAgo: doc.data().createdAt ? formatTimeAgo(doc.data().createdAt.toDate()) : "Unknown date"
            }));
            setConcerns(updatedData);
            applyFilters(updatedData, selectedCategory, selectedStatus);
        });
        
        return () => unsubscribe();
    }, []);

    const getStatusColor = (status) => {
        if (!status) return '#9E9E9E';
        switch(status.toLowerCase()) {
            case 'pending': return '#FF9800';
            case 'in progress': return '#2196F3';
            case 'resolved': return '#4CAF50';
            default: return '#9E9E9E';
        }
    };

    const formatStatusText = (status) => {
        if (!status) return 'Unknown';
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    };

    const getCategoryInfo = (category) => {
        return categoryData[category] || {
            icon: 'help-circle',
            color: '#9E9E9E'
        };
    };

    const renderAdditionalInfo = (concern) => {
        switch(concern.category) {
            case 'Issue':
                return concern.urgency ? (
                    <Text style={styles.additionalInfo}>Urgency: {concern.urgency}</Text>
                ) : null;
            case 'Complaint':
                return concern.against ? (
                    <Text style={styles.additionalInfo}>Against: {concern.against}</Text>
                ) : null;
            case 'Suggestion':
                return concern.department ? (
                    <Text style={styles.additionalInfo}>Department: {concern.department}</Text>
                ) : null;
            default:
                return null;
        }
    };

    const ConcernCard = ({ concern, onPress }) => {
        const categoryInfo = getCategoryInfo(concern.category);
        
        return (
            <TouchableOpacity style={styles.concernCard} onPress={onPress}>
                <View style={styles.cardHeader}>
                    <View style={[styles.categoryBadge, { backgroundColor: categoryInfo.color }]}>
                        <MaterialCommunityIcons 
                            name={categoryInfo.icon} 
                            size={16} 
                            color="#fff" 
                            style={styles.categoryIcon} 
                        />
                        <Text style={styles.categoryText}>
                            {concern.category || 'General'}
                        </Text>
                    </View>
                    <Text style={styles.concernDate}>
                        {concern.timeAgo || "Unknown date"}
                    </Text>
                </View>
                
                <Text style={styles.concernTitle} numberOfLines={2}>
                    {concern.title || "No title"}
                </Text>
                <Text style={styles.concernDescription} numberOfLines={2}>
                    {concern.description || "No description"}
                </Text>
                
                {renderAdditionalInfo(concern)}
                
                <View style={styles.cardFooter}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(concern.status) }]}>
                        <Text style={styles.statusText}>{formatStatusText(concern.status)}</Text>
                    </View>
                    {concern.location && (
                        <View style={styles.locationContainer}>
                            <MaterialCommunityIcons 
                                name="map-marker" 
                                size={14} 
                                color="#666" 
                            />
                            <Text style={styles.locationText} numberOfLines={1}>
                                {concern.location}
                            </Text>
                        </View>
                    )}
                </View>
                
                {concern.imageUrl && (
                    <FontAwesome5 
                        name="camera" 
                        size={16} 
                        color="#666" 
                        style={styles.photoIcon} 
                    />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.filterContainer}>
                <TouchableOpacity 
                    style={styles.filterButton}
                    onPress={() => setShowFilterModal(true)}
                >
                    <MaterialCommunityIcons name="filter" size={20} color="#0275d8" />
                    <Text style={styles.filterButtonText}>Filter</Text>
                </TouchableOpacity>
                
                {(selectedCategory !== 'All' || selectedStatus !== 'All') && (
                    <TouchableOpacity 
                        style={styles.activeFilterBadge}
                        onPress={resetFilters}
                    >
                        <Text style={styles.activeFilterText}>
                            {selectedCategory !== 'All' ? `${selectedCategory}` : ''}
                            {selectedCategory !== 'All' && selectedStatus !== 'All' ? ' • ' : ''}
                            {selectedStatus !== 'All' ? `${selectedStatus}` : ''}
                        </Text>
                        <MaterialCommunityIcons name="close" size={16} color="#0275d8" />
                    </TouchableOpacity>
                )}
            </View>

            {loading && !refreshing ? (
                <ActivityIndicator size="large" color="#003366" style={styles.loader} />
            ) : (
                <FlatList
                    data={filteredConcerns}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <ConcernCard 
                            concern={item}
                            onPress={() => navigation.navigate('ConcernDetails', { concernId: item.id })}
                        />
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>
                                {selectedCategory !== 'All' || selectedStatus !== 'All' 
                                    ? "No concerns match your filters" 
                                    : "No unresolved concerns found"}
                            </Text>
                            {(selectedCategory !== 'All' || selectedStatus !== 'All') && (
                                <TouchableOpacity 
                                    style={styles.resetButton}
                                    onPress={resetFilters}
                                >
                                    <Text style={styles.resetButtonText}>Reset filters</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={fetchConcerns}
                            colors={["#003366", "#0275d8"]}
                        />
                    }
                    contentContainerStyle={filteredConcerns.length === 0 && styles.emptyListContainer}
                />
            )}

            <Modal
                visible={showFilterModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowFilterModal(false)}
            >
                <Pressable 
                    style={styles.modalOverlay} 
                    onPress={() => setShowFilterModal(false)}
                />
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Filter Concerns</Text>
                    
                    <Text style={styles.filterSectionTitle}>Category</Text>
                    <View style={styles.filterOptions}>
                        {['All', ...Object.keys(categoryData)].map(category => (
                            <TouchableOpacity
                                key={category}
                                style={[
                                    styles.filterOption,
                                    selectedCategory === category && styles.selectedFilterOption,
                                    selectedCategory === category && {
                                        backgroundColor: category === 'All' ? '#0275d8' : categoryData[category]?.color || '#0275d8'
                                    }
                                ]}
                                onPress={() => handleCategorySelect(category)}
                            >
                                {category !== 'All' && (
                                    <MaterialCommunityIcons 
                                        name={categoryData[category]?.icon || 'help-circle'} 
                                        size={16} 
                                        color={selectedCategory === category ? '#fff' : categoryData[category]?.color || '#9E9E9E'} 
                                        style={styles.filterOptionIcon} 
                                    />
                                )}
                                <Text style={[
                                    styles.filterOptionText,
                                    selectedCategory === category && styles.selectedFilterOptionText
                                ]}>
                                    {category}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    
                    <Text style={styles.filterSectionTitle}>Status</Text>
                    <View style={styles.filterOptions}>
                        {statusOptions.map(status => (
                            <TouchableOpacity
                                key={status}
                                style={[
                                    styles.filterOption,
                                    selectedStatus === status && styles.selectedFilterOption,
                                    selectedStatus === status && {
                                        backgroundColor: getStatusColor(status)
                                    }
                                ]}
                                onPress={() => handleStatusSelect(status)}
                            >
                                <Text style={[
                                    styles.filterOptionText,
                                    selectedStatus === status && styles.selectedFilterOptionText
                                ]}>
                                    {status}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    
                    <View style={styles.modalButtons}>
                        <TouchableOpacity 
                            style={styles.modalButton}
                            onPress={resetFilters}
                        >
                            <Text style={styles.modalButtonText}>Reset</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.modalButton, styles.applyButton]}
                            onPress={() => setShowFilterModal(false)}
                        >
                            <Text style={[styles.modalButtonText, styles.applyButtonText]}>Apply</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 15,
        backgroundColor: '#f5f5f5',
    },
    filterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#0275d8',
        marginRight: 10,
    },
    filterButtonText: {
        color: '#0275d8',
        marginLeft: 5,
        fontWeight: '500',
    },
    activeFilterBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 15,
    },
    activeFilterText: {
        color: '#0275d8',
        fontSize: 12,
        marginRight: 4,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    concernCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 15,
    },
    categoryIcon: {
        marginRight: 5,
    },
    categoryText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    concernTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#003366',
        marginBottom: 5,
    },
    concernDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    additionalInfo: {
        fontSize: 13,
        color: '#555',
        marginBottom: 8,
        fontStyle: 'italic',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 15,
    },
    statusText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginLeft: 10,
    },
    locationText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
        flexShrink: 1,
    },
    concernDate: {
        fontSize: 12,
        color: '#999',
    },
    photoIcon: {
        position: 'absolute',
        top: 50,
        right: 15,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        color: '#999',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 10,
    },
    resetButton: {
        padding: 8,
        backgroundColor: '#0275d8',
        borderRadius: 5,
    },
    resetButtonText: {
        color: '#fff',
    },
    emptyListContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#003366',
        marginBottom: 20,
        textAlign: 'center',
    },
    filterSectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
        marginBottom: 10,
    },
    filterOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
    },
    filterOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        marginRight: 8,
        marginBottom: 8,
    },
    selectedFilterOption: {
        borderColor: 'transparent',
    },
    filterOptionIcon: {
        marginRight: 5,
    },
    filterOptionText: {
        fontSize: 14,
        color: '#555',
    },
    selectedFilterOptionText: {
        color: '#fff',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    modalButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        marginHorizontal: 5,
    },
    applyButton: {
        backgroundColor: '#0275d8',
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#555',
    },
    applyButtonText: {
        color: '#fff',
    },
});

export default ConcernsTab;