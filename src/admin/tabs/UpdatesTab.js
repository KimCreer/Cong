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
import { getFirestore, collection, query, where, getDocs, onSnapshot, orderBy } from "@react-native-firebase/firestore";

const UpdatesTab = ({ navigation }) => {
    const [updates, setUpdates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchUpdates = async () => {
        try {
            setRefreshing(true);
            const db = getFirestore();
            const q = query(
                collection(db, "updates"),
                where("status", "==", "draft"),
                orderBy("createdAt", "desc")
            );
            
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt.toDate()
            }));
            
            setUpdates(data);
        } catch (error) {
            console.error("Error fetching updates:", error);
            Alert.alert("Error", "Failed to load updates");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchUpdates();
        
        // Real-time listener
        const db = getFirestore();
        const q = query(
            collection(db, "updates"),
            where("status", "==", "draft"),
            orderBy("createdAt", "desc")
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const updatedData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt.toDate()
            }));
            setUpdates(updatedData);
        });
        
        return () => unsubscribe();
    }, []);

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const UpdateCard = ({ update, onPress }) => (
        <TouchableOpacity style={styles.updateCard} onPress={onPress}>
            <Text style={styles.updateTitle}>{update.title}</Text>
            <Text style={styles.updateSummary} numberOfLines={2}>
                {update.summary}
            </Text>
            <View style={styles.updateFooter}>
                <Text style={styles.updateDate}>
                    Created: {formatDate(update.createdAt)}
                </Text>
                <View style={styles.draftBadge}>
                    <Text style={styles.draftText}>Draft</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {loading && !refreshing ? (
                <ActivityIndicator size="large" color="#003366" style={styles.loader} />
            ) : (
                <FlatList
                    data={updates}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <UpdateCard 
                            update={item}
                            onPress={() => navigation.navigate('EditUpdate', { id: item.id })}
                        />
                    )}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No draft updates found</Text>
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={fetchUpdates}
                            colors={["#003366", "#0275d8"]}
                        />
                    }
                    contentContainerStyle={updates.length === 0 && styles.emptyContainer}
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
    updateCard: {
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
    updateTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#003366',
        marginBottom: 5,
    },
    updateSummary: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
    },
    updateFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    updateDate: {
        fontSize: 12,
        color: '#999',
    },
    draftBadge: {
        backgroundColor: '#FFC107',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 15,
    },
    draftText: {
        color: '#000',
        fontSize: 12,
        fontWeight: 'bold',
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

export default UpdatesTab;