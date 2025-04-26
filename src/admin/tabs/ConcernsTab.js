import React, { useState, useEffect } from "react";
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    ActivityIndicator,
    RefreshControl,
    Alert
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
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

const ConcernsTab = () => {
    const navigation = useNavigation();
    const [concerns, setConcerns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

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
        } catch (error) {
            console.error("Error fetching concerns:", error);
            Alert.alert("Error", "Failed to load concerns");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
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

    const ConcernCard = ({ concern, onPress }) => (
        <TouchableOpacity style={styles.concernCard} onPress={onPress}>
            <Text style={styles.concernTitle} numberOfLines={2}>
                {concern.title || "No title"}
            </Text>
            <Text style={styles.concernDescription} numberOfLines={2}>
                {concern.description || "No description"}
            </Text>
            <View style={styles.concernFooter}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(concern.status) }]}>
                    <Text style={styles.statusText}>{formatStatusText(concern.status)}</Text>
                </View>
                <Text style={styles.concernDate}>
                    {concern.timeAgo || "Unknown date"}
                </Text>
            </View>
            {concern.imageUrl && (
                <FontAwesome5 name="camera" size={16} color="#666" style={styles.photoIcon} />
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {loading && !refreshing ? (
                <ActivityIndicator size="large" color="#003366" style={styles.loader} />
            ) : (
                <FlatList
                    data={concerns}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <ConcernCard 
                            concern={item}
                            onPress={() => navigation.navigate('ConcernDetails', { concernId: item.id })}
                        />
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No unresolved concerns found</Text>
                        </View>
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={fetchConcerns}
                            colors={["#003366", "#0275d8"]}
                        />
                    }
                    contentContainerStyle={concerns.length === 0 && styles.emptyListContainer}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 15,
        backgroundColor: '#f5f5f5',
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
    concernTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#003366',
        marginBottom: 5,
    },
    concernDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
    },
    concernFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    concernDate: {
        fontSize: 12,
        color: '#999',
    },
    photoIcon: {
        position: 'absolute',
        top: 15,
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
    },
    emptyListContainer: {
        flex: 1,
        justifyContent: 'center',
    },
});

export default ConcernsTab;