import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { Card, Button, Chip, ProgressBar, Searchbar } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { getFirestore, collection, query, orderBy, onSnapshot } from '@react-native-firebase/firestore';

const { width } = Dimensions.get('window');

export default function ProjectsScreen() {
  const navigation = useNavigation();

  // State variables
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [projectList, setProjectList] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // Animated scaling effect
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  // Format accomplishment percentage
  const formatAccomplishment = (accomplishment) => {
    if (!accomplishment) return "0%";
    return accomplishment.includes("%") ? accomplishment : `${accomplishment}%`;
  };

  // Process project document from Firestore
  const processProjectDoc = (doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title || "No title",
      description: data.remarks || "No description",
      location: data.location || "Location not specified",
      contractor: data.contractor || "Contractor not specified",
      contractAmount: data.contractAmount ? `₱${data.contractAmount.toLocaleString()}` : "N/A",
      accomplishment: formatAccomplishment(data.accomplishment),
      progress: parseFloat(data.accomplishment) / 100 || 0,
      imageUrl: data.imageUrl || null,
      status: data.status || "active",
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  };

  // Fetch projects from Firestore
  const fetchProjects = useCallback(() => {
    try {
      setLoading(true);
      setError(null);

      const projectsQuery = query(
        collection(getFirestore(), 'projects'),
        orderBy('createdAt', 'desc')
      );

      return onSnapshot(projectsQuery, (snapshot) => {
        const projectsData = snapshot.docs.map(doc => processProjectDoc(doc));
        setProjectList(projectsData);
        setFilteredProjects(projectsData);
        setLoading(false);
      }, (error) => {
        console.error("Snapshot error:", error);
        setError("Failed to load projects. Please try again.");
        setLoading(false);
      });
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load projects. Please try again.");
      setLoading(false);
      return () => {};
    }
  }, []);

  // Filter and search projects
  useEffect(() => {
    let results = projectList;
    
    // Apply status filter
    if (activeFilter !== 'all') {
      results = results.filter(project => project.status === activeFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(project => 
        project.title.toLowerCase().includes(query) ||
        project.location.toLowerCase().includes(query) ||
        project.contractor.toLowerCase().includes(query)
      );
    }
    
    setFilteredProjects(results);
  }, [searchQuery, activeFilter, projectList]);

  useEffect(() => {
    const unsubscribe = fetchProjects();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchProjects]);

  const onRefresh = () => {
    setRefreshing(true);
    const unsubFn = fetchProjects();
    setRefreshing(false);
    return () => unsubFn && unsubFn();
  };

  const renderProjectCard = (project) => (
    <TouchableOpacity
      key={project.id}
      activeOpacity={0.9}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => navigation.navigate("ProjectDetails", { project })}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Card style={styles.projectCard}>
          {/* Project Image with gradient overlay */}
          {project.imageUrl && (
            <View>
              <Card.Cover source={{ uri: project.imageUrl }} style={styles.projectImage} />
              <LinearGradient 
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.imageOverlay}
              />
            </View>
          )}

          {/* Project Details */}
          <Card.Content style={styles.cardContent}>
            {/* Status & Location Labels */}
            <View style={styles.row}>
              <View style={styles.locationContainer}>
                <Icon name="map-marker" size={16} color="#555" style={styles.locationIcon} />
                <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">
                  {project.location}
                </Text>
              </View>
              <Chip
                style={[
                  styles.statusChip,
                  project.status === "completed"
                    ? styles.completedStatus
                    : styles.ongoingStatus,
                ]}
                textStyle={styles.statusText}
              >
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </Chip>
            </View>

            {/* Title & Description */}
            <Text style={styles.projectTitle}>{project.title}</Text>
            <Text style={styles.projectDescription} numberOfLines={2} ellipsizeMode="tail">
              {project.description}
            </Text>

            {/* Progress Bar with percentage */}
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Project Progress</Text>
                <Text style={styles.progressPercentage}>{project.accomplishment}</Text>
              </View>
              <ProgressBar
                progress={project.progress}
                color={
                  project.progress >= 0.8
                    ? "#4CAF50"
                    : project.progress >= 0.4
                    ? "#FFC107"
                    : "#F44336"
                }
                style={styles.progressBar}
              />
            </View>

            {/* Additional Details */}
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Icon name="account-hard-hat" size={18} color="#003366" />
                <Text style={styles.detailText} numberOfLines={1} ellipsizeMode="tail">
                  {project.contractor}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Icon name="cash" size={18} color="#003366" />
                <Text style={styles.detailText}>{project.contractAmount}</Text>
              </View>
            </View>

            {/* Learn More Button */}
            <Button
              mode="contained"
              style={styles.learnMoreButton}
              labelStyle={styles.learnMoreText}
              onPress={() => navigation.navigate("ProjectDetails", { project })}
            >
              View Details
            </Button>
          </Card.Content>
        </Card>
      </Animated.View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#003366" />
        <Text style={styles.loadingText}>Loading Projects...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={48} color="#F44336" />
        <Text style={styles.errorText}>{error}</Text>
        <Button
          mode="contained"
          onPress={fetchProjects}
          style={styles.retryButton}
          labelStyle={styles.retryButtonText}
        >
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <LinearGradient 
        colors={["#001F3F", "#003366"]} 
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <Icon name="clipboard-list" size={32} color="#ffffff" style={styles.headerIcon} />
          <Text style={styles.headerTitle}>Project Portfolio</Text>
        </View>
      </LinearGradient>

      {/* Search and Filter Section */}
      <View style={styles.filterContainer}>
        <Searchbar
          placeholder="Search projects..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor="#003366"
          placeholderTextColor="#999"
          clearIcon="close-circle-outline"
        />
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity
            style={[styles.filterButton, activeFilter === 'all' && styles.activeFilter]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.filterText, activeFilter === 'all' && styles.activeFilterText]}>
              All Projects
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, activeFilter === 'active' && styles.activeFilter]}
            onPress={() => setActiveFilter('active')}
          >
            <Text style={[styles.filterText, activeFilter === 'active' && styles.activeFilterText]}>
              Ongoing
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, activeFilter === 'completed' && styles.activeFilter]}
            onPress={() => setActiveFilter('completed')}
          >
            <Text style={[styles.filterText, activeFilter === 'completed' && styles.activeFilterText]}>
              Completed
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Scrollable List of Projects */}
      <ScrollView
        style={styles.projectsContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={["#003366"]} 
            tintColor="#003366"
          />
        }
      >
        {filteredProjects.length === 0 ? (
          <View style={styles.emptyResultsContainer}>
            <Icon name="magnify" size={48} color="#999" />
            <Text style={styles.emptyResultsText}>No projects found</Text>
            <Text style={styles.emptyResultsSubText}>Try adjusting your search or filter</Text>
          </View>
        ) : (
          filteredProjects.map(renderProjectCard)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    elevation: 6,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  headerIcon: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  filterContainer: {
    paddingHorizontal: 15,
    paddingTop: 15,
    backgroundColor: "#f8f9fa",
  },
  searchBar: {
    borderRadius: 10,
    backgroundColor: "#fff",
    elevation: 2,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchInput: {
    fontSize: 14,
    color: "#333",
  },
  filterScroll: {
    paddingBottom: 10,
  },
  filterButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#e9ecef",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  activeFilter: {
    backgroundColor: "#003366",
    borderColor: "#003366",
  },
  filterText: {
    fontSize: 14,
    color: "#495057",
    fontWeight: "500",
  },
  activeFilterText: {
    color: "#fff",
  },
  projectsContainer: {
    paddingHorizontal: 15,
    paddingTop: 5,
  },
  projectCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    overflow: "hidden",
  },
  projectImage: {
    height: 180,
    width: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '30%',
  },
  cardContent: {
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: width * 0.5,
  },
  locationIcon: {
    marginRight: 5,
  },
  locationText: {
    fontSize: 13,
    color: "#555",
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    minWidth: 90,
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  completedStatus: {
    backgroundColor: "#e8f5e9",
  },
  ongoingStatus: {
    backgroundColor: "#fff8e1", 
  },
  projectTitle: {
    fontSize: 20,
    fontWeight: "700", 
    color: "#003366", 
    marginBottom: 8,
    lineHeight: 24,
  },
  projectDescription: {
    fontSize: 14,
    color: "#666", 
    lineHeight: 20, 
    marginBottom: 15,
  },
  progressContainer: {
    marginBottom: 15,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  progressLabel: {
    fontSize: 13,
    color: "#555",
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 13,
    color: "#003366",
    fontWeight: '600',
  },
  progressBar: {
    height: 8, 
    borderRadius: 4,
    backgroundColor: '#f1f1f1',
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '48%',
  },
  detailText: {
    fontSize: 13,
    color: "#555",
    marginLeft: 8,
  },
  learnMoreButton: {
    marginTop: 5, 
    backgroundColor: "#003366", 
    borderRadius: 10, 
    paddingVertical: 6,
    elevation: 2,
  },
  learnMoreText: {
    fontSize: 15, 
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#003366",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  errorText: {
    fontSize: 16,
    color: "#F44336",
    marginVertical: 20,
    textAlign: "center",
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: "#003366",
    borderRadius: 8,
    paddingHorizontal: 25,
    paddingVertical: 8,
    elevation: 2,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
  },
  emptyResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyResultsText: {
    marginTop: 15,
    fontSize: 18,
    color: "#666",
    fontWeight: '500',
  },
  emptyResultsSubText: {
    fontSize: 14,
    color: "#999",
    marginTop: 5,
  }
});