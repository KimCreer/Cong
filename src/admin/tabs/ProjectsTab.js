import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    ActivityIndicator, 
    RefreshControl,
    Alert,
    Animated
} from 'react-native';
import { FontAwesome5, AntDesign } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';

// Import components and utilities
import ProjectCard from './projectcomps/ProjectCard';
import CreateProjectModal from './projectcomps/CreateProjectModal';
import EditProjectModal from './projectcomps/EditProjectModal';
import { fetchProjects, setupProjectsListener } from './projectcomps/projectsService';
import { formatCurrency, getStatusColor } from './projectcomps/projectsUtils';

const ProjectsTab = () => {
    const navigation = useNavigation();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [currentProject, setCurrentProject] = useState(null);
    
    // Animation values
    const slideAnim = useRef(new Animated.Value(0)).current;
    const editSlideAnim = useRef(new Animated.Value(0)).current;

    const handleRefresh = useCallback(async () => {
        try {
            setRefreshing(true);
            const data = await fetchProjects();
            setProjects(data);
        } catch (error) {
            console.error("Error fetching projects:", error);
            Alert.alert("Error", "Failed to load projects");
        } finally {
            setRefreshing(false);
        }
    }, []);

    // Animation effects
    useEffect(() => {
        if (modalVisible) {
            Animated.timing(slideAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [modalVisible]);

    useEffect(() => {
        if (editModalVisible) {
            Animated.timing(editSlideAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(editSlideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [editModalVisible]);

    useEffect(() => {
        const loadProjects = async () => {
            try {
                setLoading(true);
                const data = await fetchProjects();
                setProjects(data);
            } catch (error) {
                console.error("Error fetching projects:", error);
                Alert.alert("Error", "Failed to load projects");
            } finally {
                setLoading(false);
            }
        };
        
        loadProjects();
        
        // Setup real-time listener
        const unsubscribe = setupProjectsListener((updatedProjects) => {
            setProjects(updatedProjects);
        });
        
        return () => unsubscribe();
    }, []);

    const openEditModal = useCallback((project) => {
        setCurrentProject(project);
        setEditModalVisible(true);
    }, []);

    const closeModals = useCallback(() => {
        setModalVisible(false);
        setEditModalVisible(false);
        setCurrentProject(null);
    }, []);

    return (
        <View style={styles.container}>
            {/* Create Project Button */}
            <TouchableOpacity 
                style={styles.createButton}
                onPress={() => setModalVisible(true)}
            >
                <AntDesign name="plus" size={18} color="#FFF" />
                <Text style={styles.createButtonText}>Create Project</Text>
            </TouchableOpacity>

            {loading && !refreshing ? (
                <ActivityIndicator size="large" color="#003366" style={styles.loader} />
            ) : (
                <FlatList
                    data={projects}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <ProjectCard 
                            project={item} 
                            navigation={navigation} 
                            onEdit={openEditModal}
                            formatCurrency={formatCurrency}
                            getStatusColor={getStatusColor}
                        />
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <FontAwesome5 name="project-diagram" size={50} color="#E0E0E0" />
                            <Text style={styles.emptyText}>No projects found</Text>
                            <Text style={styles.emptySubtext}>Create your first project</Text>
                        </View>
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={["#003366", "#0275d8"]}
                            tintColor="#003366"
                        />
                    }
                    contentContainerStyle={projects.length === 0 ? styles.emptyListContainer : styles.listContainer}
                    keyboardShouldPersistTaps="handled"
                />
            )}

            {/* Create Project Modal */}
            <CreateProjectModal
                visible={modalVisible}
                onClose={closeModals}
                slideAnim={slideAnim}
            />

            {/* Edit Project Modal */}
            <EditProjectModal
                visible={editModalVisible}
                onClose={closeModals}
                project={currentProject}
                slideAnim={editSlideAnim}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    createButton: {
        flexDirection: 'row',
        backgroundColor: '#003366',
        padding: 15,
        borderRadius: 8,
        margin: 15,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
    },
    createButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        padding: 15,
        paddingBottom: 80,
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
});

export default ProjectsTab;