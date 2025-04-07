import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    ActivityIndicator, 
    RefreshControl,
    Alert,
    Image
} from 'react-native';
import { FontAwesome5 } from "@expo/vector-icons";
import firestore from '@react-native-firebase/firestore';

const ProjectsTab = ({ navigation }) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const querySnapshot = await firestore()
                .collection("projects")
                .orderBy("createdAt", "desc")
                .get();
    
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            }));
    
            setProjects(data);
        } catch (error) {
            console.error("Error fetching projects:", error);
            Alert.alert("Error", "Failed to load projects");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    
    useEffect(() => {
        const unsubscribe = firestore()
            .collection("projects")
            .orderBy("createdAt", "desc")
            .onSnapshot((snapshot) => {
                const updatedData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate() || new Date()
                }));
                setProjects(updatedData);
            });
    
        return () => unsubscribe();
    }, []);
    
    const onRefresh = () => {
        setRefreshing(true);
        fetchProjects();
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const ProjectCard = ({ project, onPress }) => (
        <TouchableOpacity style={styles.projectCard} onPress={onPress}>
            <View style={styles.projectHeader}>
                <FontAwesome5 
                    name="project-diagram" 
                    size={20} 
                    color={project.status === 'active' ? '#4CAF50' : '#9E9E9E'} 
                />
                <Text style={styles.projectTitle}>{project.title}</Text>
                <View style={[
                    styles.statusBadge,  // Changed from statusBadge to statusBadge
                    { 
                        backgroundColor: project.status === 'active' ? '#E8F5E9' : '#F5F5F5',
                        borderColor: project.status === 'active' ? '#4CAF50' : '#9E9E9E'
                    }
                ]}>
                    <Text style={[
                        styles.statusText,
                        { color: project.status === 'active' ? '#4CAF50' : '#9E9E9E' }
                    ]}>
                        {project.status === 'active' ? 'Active' : 'Inactive'}
                    </Text>
                </View>
            </View>
            
            <Text style={styles.projectDescription} numberOfLines={2}>
                {project.description}
            </Text>
            
            <View style={styles.projectFooter}>
                <Text style={styles.projectDate}>
                    Created: {formatDate(project.createdAt)}
                </Text>
                {project.assignedTo && (
                    <View style={styles.assignedContainer}>
                        <Image
                            source={{ uri: project.assignedTo.photoURL || 'https://via.placeholder.com/30' }}
                            style={styles.assignedAvatar}
                        />
                        <Text style={styles.assignedName}>
                            {project.assignedTo.displayName || 'Unassigned'}
                        </Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#003366" />
                    <Text style={styles.loadingText}>Loading Projects...</Text>
                </View>
            ) : (
                <FlatList
                    data={projects}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <ProjectCard 
                            project={item}
                            onPress={() => navigation.navigate('ProjectDetail', { id: item.id })}
                        />
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <FontAwesome5 name="project-diagram" size={50} color="#E0E0E0" />
                            <Text style={styles.emptyText}>No projects found</Text>
                            <Text style={styles.emptySubtext}>Create a new project to get started</Text>
                        </View>
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={["#003366", "#0275d8"]}
                            tintColor="#003366"
                        />
                    }
                    contentContainerStyle={projects.length === 0 ? styles.emptyListContainer : null}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        paddingBottom: 80,
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
    emptyListContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 18,
        color: '#9E9E9E',
        marginTop: 20,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#BDBDBD',
        marginTop: 5,
    },
    projectCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 15,
        marginHorizontal: 15,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    projectHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    projectTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#003366',
        marginLeft: 10,
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    projectDescription: {
        fontSize: 14,
        color: '#616161',
        marginBottom: 15,
    },
    projectFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    projectDate: {
        fontSize: 12,
        color: '#9E9E9E',
    },
    assignedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    assignedAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 8,
    },
    assignedName: {
        fontSize: 12,
        color: '#616161',
    },
});

export default ProjectsTab;