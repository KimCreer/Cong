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
import { getFirestore, collection, query, where, getDocs, onSnapshot } from "@react-native-firebase/firestore";

const ConcernsTab = ({ navigation }) => {
    const [concerns, setConcerns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchConcerns = async () => {
        try {
            setRefreshing(true);
            const db = getFirestore();
            const q = query(
                collection(db, "concerns"),
                where("status", "in", ["new", "in-progress"]),
                orderBy("createdAt", "desc")
            );
            
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
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

    useEffect(() => {
        fetchConcerns();
        
        // Real-time listener
        const db = getFirestore();
        const q = query(
            collection(db, "concerns"),
            where("status", "in", ["new", "in-progress"]),
            orderBy("createdAt", "desc")
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const updatedData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setConcerns(updatedData);
        });
        
        return () => unsubscribe();
    }, []);

    const getStatusColor = (status) => {
        switch(status) {
            case 'new': return '#FF9800';
            case 'in-progress': return '#2196F3';
            case 'resolved': return '#4CAF50';
            default: return '#9E9E9E';
        }
    };

    const ConcernCard = ({ concern, onPress }) => (
        <TouchableOpacity style={styles.concernCard} onPress={onPress}>
            <Text style={styles.concernTitle} numberOfLines={2}>
                {concern.title}
            </Text>
            <Text style={styles.concernDescription} numberOfLines={2}>
                {concern.description}
            </Text>
            <View style={styles.concernFooter}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(concern.status) }]}>
                    <Text style={styles.statusText}>{concern.status}</Text>
                </View>
                <Text style={styles.concernDate}>
                    {new Date(concern.createdAt?.toDate()).toLocaleDateString()}
                </Text>
            </View>
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
                            onPress={() => navigation.navigate('ConcernDetail', { id: item.id })}
                        />
                    )}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No unresolved concerns found</Text>
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={fetchConcerns}
                            colors={["#003366", "#0275d8"]}
                        />
                    }
                    contentContainerStyle={concerns.length === 0 && styles.emptyContainer}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 15,
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
        textTransform: 'capitalize',
    },
    concernDate: {
        fontSize: 12,
        color: '#999',
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
});

export default ConcernsTab;