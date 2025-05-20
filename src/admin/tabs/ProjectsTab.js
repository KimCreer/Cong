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
    Animated,
    ScrollView,
    TextInput
} from 'react-native';
import { FontAwesome5, AntDesign } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

// Import components and utilities
import ProjectCard from './projectcomps/ProjectCard';
import CreateProjectModal from './projectcomps/CreateProjectModal';
import EditProjectModal from './projectcomps/EditProjectModal';
import { fetchProjects, setupProjectsListener } from './projectcomps/projectsService';
import { formatCurrency, getStatusColor } from './projectcomps/projectsUtils';

const PROJECT_TYPES = [
    { id: 'all', label: 'All' },
    { id: 'infrastructure', label: 'Infrastructure' },
    { id: 'educational', label: 'Educational' },
    { id: 'health', label: 'Health & Medical' },
    { id: 'livelihood', label: 'Livelihood' },
    { id: 'social', label: 'Social Services' },
    { id: 'environmental', label: 'Environmental' },
    { id: 'sports', label: 'Sports & Recreation' },
    { id: 'disaster', label: 'Disaster Response' },
    { id: 'youth', label: 'Youth Development' },
    { id: 'senior', label: 'Senior Citizen' }
];

const ProjectsTab = () => {
    const navigation = useNavigation();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [currentProject, setCurrentProject] = useState(null);
    const [selectedType, setSelectedType] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    
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

    // Filtered projects based on selectedType and searchQuery
    const filteredProjects = projects.filter(p => {
        const matchesType = selectedType === 'all' || p.projectType === selectedType;
        const query = searchQuery.trim().toLowerCase();
        const matchesSearch =
            !query ||
            (p.title && p.title.toLowerCase().includes(query)) ||
            (p.contractor && p.contractor.toLowerCase().includes(query)) ||
            (p.location && p.location.toLowerCase().includes(query)) ||
            (p.remarks && p.remarks.toLowerCase().includes(query));
        return matchesType && matchesSearch;
    });

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

            {/* Search Filter */}
            <View style={styles.searchBarWrapper}>
                <AntDesign name="search1" size={18} color="#003366" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search projects..."
                    placeholderTextColor="#9E9E9E"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    returnKeyType="search"
                    clearButtonMode="while-editing"
                    autoCorrect={false}
                    autoCapitalize="none"
                />
            </View>

            {/* Category Filter - sticky, shadow, fade edges */}
            <View style={styles.filterBarWrapper}>
                <LinearGradient
                    colors={["#f5f5f5", "rgba(245,245,245,0)"]}
                    style={styles.filterFadeLeft}
                    pointerEvents="none"
                />
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScroll}
                    style={styles.filterBar}
                >
                    {PROJECT_TYPES.map(type => (
                        <TouchableOpacity
                            key={type.id}
                            style={[
                                styles.filterButton,
                                selectedType === type.id && styles.filterButtonSelected
                            ]}
                            onPress={() => setSelectedType(type.id)}
                            activeOpacity={0.85}
                        >
                            <Text style={[
                                styles.filterButtonText,
                                selectedType === type.id && styles.filterButtonTextSelected,
                                selectedType === type.id && { transform: [{ scale: 1.08 }] }
                            ]}>
                                {type.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                <LinearGradient
                    colors={["rgba(245,245,245,0)", "#f5f5f5"]}
                    style={styles.filterFadeRight}
                    pointerEvents="none"
                />
            </View>

            {loading && !refreshing ? (
                <ActivityIndicator size="large" color="#003366" style={styles.loader} />
            ) : (
                <FlatList
                    data={filteredProjects}
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
                    contentContainerStyle={filteredProjects.length === 0 ? styles.emptyListContainer : styles.listContainer}
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
    filterBarWrapper: {
        position: 'relative',
        backgroundColor: '#f5f5f5',
        paddingVertical: 4,
        marginBottom: 8,
        zIndex: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 2,
    },
    filterBar: {
        marginHorizontal: 24,
        minHeight: 48,
    },
    filterScroll: {
        paddingVertical: 8,
        alignItems: 'center',
    },
    filterButton: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        marginBottom: 2,
        minWidth: 60,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: 'transparent',
        elevation: 0,
        transitionDuration: '150ms',
    },
    filterButtonSelected: {
        backgroundColor: '#003366',
        borderColor: '#003366',
        shadowColor: '#003366',
        elevation: 2,
    },
    filterButtonText: {
        color: '#003366',
        fontWeight: '500',
        fontSize: 15,
        letterSpacing: 0.1,
    },
    filterButtonTextSelected: {
        color: '#fff',
        fontWeight: 'bold',
    },
    filterFadeLeft: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 24,
        zIndex: 3,
    },
    filterFadeRight: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 24,
        zIndex: 3,
    },
    searchBarWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 24,
        marginHorizontal: 16,
        marginBottom: 8,
        paddingHorizontal: 16,
        paddingVertical: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 1,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#003366',
        paddingVertical: 6,
        backgroundColor: 'transparent',
    },
});

export default ProjectsTab;