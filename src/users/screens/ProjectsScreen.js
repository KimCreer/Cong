import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Card, Button, Chip, ProgressBar } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import projects from "../../../data/projectsData"; // Import project data

export default function ProjectsScreen() {
  const navigation = useNavigation();

  // State variables
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [projectList, setProjectList] = useState([]);

  // Animated scaling effect (useRef to persist value)
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

  // Simulate data fetching
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate a network request
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate delay
      setProjectList(projects); // Replace with actual API call
    } catch (err) {
      setError("Failed to load projects. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#003366" />
        <Text style={styles.loadingText}>Fetching Projects...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button
          mode="contained"
          onPress={fetchData}
          style={styles.retryButton}
          labelStyle={styles.retryButtonText}
        >
          Retry
        </Button>
      </View>
    );
  }

  if (projectList.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="folder-open-outline" size={64} color="#999" />
        <Text style={styles.emptyText}>No projects available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <LinearGradient colors={["#001F3F", "#003366"]} style={styles.header}>
        <Icon name="clipboard-list" size={32} color="#ffffff" style={styles.headerIcon} />
        <Text style={styles.headerTitle}>Projects</Text>
      </LinearGradient>

      {/* Scrollable List of Projects */}
      <ScrollView
        style={styles.projectsContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#003366"]} />
        }
      >
        {projectList.map((project) => (
          <TouchableOpacity
            key={project.id}
            activeOpacity={0.9}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => navigation.navigate("ProjectDetails", { project })}
          >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Card style={styles.projectCard}>
                {/* Project Image */}
                <Card.Cover source={{ uri: project.image }} style={styles.projectImage} />

                {/* Project Details */}
                <Card.Content style={styles.cardContent}>
                  {/* Category & Status Labels */}
                  <View style={styles.row}>
                    <Chip icon={project.icon} style={styles.categoryChip}>
                      {project.category}
                    </Chip>
                    <Chip
                      style={[
                        styles.statusChip,
                        project.status === "Completed"
                          ? styles.completedStatus
                          : styles.ongoingStatus,
                      ]}
                    >
                      {project.status}
                    </Chip>
                  </View>

                  {/* Title & Description */}
                  <Text style={styles.projectTitle}>{project.title}</Text>
                  <Text style={styles.projectDescription}>{project.description}</Text>

                  {/* Additional Details */}
                  <View style={styles.additionalDetails}>
                    <Text style={[styles.detailText, styles.bold]}>
                      Start Date:{" "}
                      <Text style={[styles.detailText]}>{project.startDate || "N/A"}</Text>
                    </Text>
                    <Text style={[styles.detailText, styles.bold]}>
                      End Date:{" "}
                      <Text style={[styles.detailText]}>{project.endDate || "N/A"}</Text>
                    </Text>
                    <Text style={[styles.detailText, styles.bold]}>
                      Team Size:{" "}
                      <Text style={[styles.detailText]}>{project.teamSize || "N/A"} members</Text>
                    </Text>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressContainer}>
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
                    <Text style={styles.progressText}>
                      {Math.round(project.progress * 100)}% Completed
                    </Text>
                  </View>

                  {/* Learn More Button */}
                  <Button
                    mode="contained"
                    style={styles.learnMoreButton}
                    labelStyle={styles.learnMoreText}
                    onPress={() => navigation.navigate("ProjectDetails", { project })}
                  >
                    Learn More
                  </Button>
                </Card.Content>
              </Card>
            </Animated.View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerIcon: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#ffffff",
  },
  projectsContainer: {
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  projectCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    overflow: "hidden",
  },
  projectImage: {
    height: 190,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  
    cardContent: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    categoryChip: {
        backgroundColor: "#e3f2fd",
        fontSize: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    statusChip: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 16,
        fontWeight: "bold",
    },
    completedStatus: {
        backgroundColor: "#4CAF50",
        color:"#ffffff",
    },
    ongoingStatus:{
      backgroundColor:"#FFC107", 
      color:"#000"
   },
   projectTitle:{
      fontSize :22 ,
      fontWeight:"bold", 
      color:"#003366", 
      marginBottom :6
   },
   projectDescription:{
      fontSize :14 ,
      color:"#666", 
      lineHeight :20 , 
      marginBottom :8
   },
   progressContainer:{
      marginTop :10
   },
   progressBar:{
      height :10 , 
      borderRadius :6
   },
   progressText:{
      fontSize :13 , 
      color :"#444", 
      textAlign :"right", 
      marginTop :5
   },
   learnMoreButton:{
      marginTop :15 , 
      backgroundColor :"#003366", 
      borderRadius :10 , 
      paddingVertical :6
   },
   learnMoreText:{
       fontSize :15 , 
       fontWeight :"bold"
   },
   loadingContainer:{
       flex :1 ,
       justifyContent :"center" ,
       alignItems :"center"
   },
   loadingText:{
       marginTop :10 ,
       fontSize :16
   }
});
