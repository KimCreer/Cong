import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Share, 
  Dimensions, ActivityIndicator, Alert, Linking
} from "react-native";
import { Button, Chip, ProgressBar, Card } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Carousel from "react-native-reanimated-carousel";
import { getFirestore, doc, onSnapshot } from '@react-native-firebase/firestore';
import LinearGradient from "react-native-linear-gradient";

const { width } = Dimensions.get("window");

// Helper function to sanitize project data for navigation
const sanitizeProjectData = (project) => {
  return {
    ...project,
    createdAt: project.createdAt ? project.createdAt.toISOString() : null,
    updatedAt: project.updatedAt ? project.updatedAt.toISOString() : null,
    // Add any other date fields your project might have
  };
};

// Helper function to restore dates after navigation
const restoreProjectDates = (project) => {
  return {
    ...project,
    createdAt: project.createdAt ? new Date(project.createdAt) : null,
    updatedAt: project.updatedAt ? new Date(project.updatedAt) : null,
    // Add any other date fields your project might have
  };
};

export default function ProjectDetailsScreen({ route, navigation }) {
  // Restore dates from sanitized navigation params
  const initialProject = restoreProjectDates(route.params.project);
  
  // State variables
  const [project, setProject] = useState(initialProject);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      setLoading(true);
      try {
        const unsubscribe = onSnapshot(
          doc(getFirestore(), 'projects', initialProject.id),
          (docSnapshot) => {
            if (docSnapshot.exists) {
              const updatedProject = {
                id: docSnapshot.id,
                title: docSnapshot.data().title || "No title",
                description: docSnapshot.data().remarks || "No description",
                location: docSnapshot.data().location || "Location not specified",
                contractor: docSnapshot.data().contractor || "Contractor not specified",
                contractAmount: docSnapshot.data().contractAmount 
                  ? `₱${docSnapshot.data().contractAmount.toLocaleString()}` 
                  : "N/A",
                accomplishment: docSnapshot.data().accomplishment 
                  ? `${docSnapshot.data().accomplishment.replace('%', '')}%` 
                  : "0%",
                progress: parseFloat(docSnapshot.data().accomplishment) / 100 || 0,
                imageUrl: docSnapshot.data().imageUrl || null,
                status: docSnapshot.data().status || "active",
                additionalImages: docSnapshot.data().additionalImages || [],
                documents: docSnapshot.data().documents || [],
                createdAt: docSnapshot.data().createdAt?.toDate() || null,
                updatedAt: docSnapshot.data().updatedAt?.toDate() || null
              };
              setProject(updatedProject);
              setAdditionalImages(updatedProject.additionalImages);
            }
            setLoading(false);
          },
          (err) => {
            setError("Failed to load project details.");
            console.error(err);
            setLoading(false);
          }
        );

        return () => unsubscribe();
      } catch (err) {
        setError("Failed to load project details.");
        console.error(err);
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [initialProject.id]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this project: ${project.title}\n\n` +
                 `Location: ${project.location}\n` +
                 `Contractor: ${project.contractor}\n` +
                 `Progress: ${project.accomplishment} Completed\n` +
                 `Description: ${project.description}`,
      });
    } catch (error) {
      Alert.alert("Share failed", "Could not share project.");
      console.error("Error sharing project:", error);
    }
  };

  const handleDocumentPress = (url) => {
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert("Error", "Unable to open document");
      }
    });
  };

  // Loading State
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#003366" />
        <Text style={styles.loadingText}>Loading project details...</Text>
      </View>
    );
  }

  // Error State
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button 
          mode="contained" 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
          labelStyle={styles.buttonText}
        >
          Back to Projects
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <LinearGradient colors={["#001F3F", "#003366"]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Project Details</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Icon name="share-variant" size={24} color="#ffffff" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.scrollContainer}>
        {/* Main Project Image */}
        {project.imageUrl && (
          <Image source={{ uri: project.imageUrl }} style={styles.topImage} />
        )}

        {/* Image Carousel */}
        {additionalImages.length > 0 ? (
          <View style={styles.carouselContainer}>
            <Carousel
              loop
              width={width * 0.9}
              height={200}
              data={additionalImages}
              scrollAnimationDuration={1000}
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={styles.carouselImage} />
              )}
            />
          </View>
        ) : (
          <Text style={styles.noImageText}>No additional images available</Text>
        )}

        {/* Project Title */}
        <Text style={styles.title}>{project.title}</Text>

        {/* Status & Location */}
        <View style={styles.row}>
          <Chip icon="map-marker" style={styles.locationChip}>
            {project.location}
          </Chip>
          <Chip
            style={[
              styles.statusChip,
              project.status === "completed" ? styles.completedStatus : styles.ongoingStatus,
            ]}
          >
            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
          </Chip>
        </View>

        {/* Project Description */}
        <Text style={styles.description}>{project.description}</Text>

        {/* Project Details */}
        <Card style={styles.detailsCard}>
          <Card.Content>
            <View style={styles.detailItem}>
              <Icon name="account-hard-hat" size={20} color="#003366" />
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Contractor: </Text>
                {project.contractor}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Icon name="cash" size={20} color="#003366" />
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Contract Amount: </Text>
                {project.contractAmount}
              </Text>
            </View>

            {project.createdAt && (
              <View style={styles.detailItem}>
                <Icon name="calendar" size={20} color="#003366" />
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Created: </Text>
                  {project.createdAt.toLocaleDateString()}
                </Text>
              </View>
            )}

            {project.updatedAt && (
              <View style={styles.detailItem}>
                <Icon name="calendar-edit" size={20} color="#003366" />
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Last Updated: </Text>
                  {project.updatedAt.toLocaleDateString()}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Progress Section */}
        <Card style={styles.progressCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Project Progress</Text>
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
              {project.accomplishment} Completed
            </Text>
          </Card.Content>
        </Card>

        {/* Documents Section */}
        {project.documents && project.documents.length > 0 && (
          <Card style={styles.documentsCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Project Documents</Text>
              {project.documents.map((doc, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.documentItem}
                  onPress={() => handleDocumentPress(doc.url)}
                >
                  <Icon name="file-document" size={24} color="#003366" />
                  <Text style={styles.documentText}>{doc.name}</Text>
                </TouchableOpacity>
              ))}
            </Card.Content>
          </Card>
        )}
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
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 6,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    padding: 8,
  },
  shareButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffffff",
  },
  scrollContainer: {
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  topImage: {
    width: "100%",
    height: 250,
    borderRadius: 16,
    marginBottom: 15,
  },
  carouselContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  carouselImage: {
    width: "100%",
    height: 200,
    borderRadius: 16,
  },
  noImageText: {
    textAlign: "center",
    fontSize: 14,
    color: "#888",
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#003366",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  locationChip: {
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
    color: "#ffffff",
  },
  ongoingStatus: {
    backgroundColor: "#FFC107",
    color: "#000",
  },
  description: {
    fontSize: 16,
    color: "#666",
    lineHeight: 22,
    marginBottom: 15,
  },
  detailsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  detailText: {
    fontSize: 16,
    color: "#444",
    marginLeft: 10,
  },
  detailLabel: {
    fontWeight: "bold",
  },
  progressCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#003366",
    marginBottom: 10,
  },
  progressBar: {
    height: 10,
    borderRadius: 6,
    marginBottom: 5,
  },
  progressText: {
    fontSize: 16,
    color: "#444",
    textAlign: "right",
  },
  documentsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  documentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  documentText: {
    fontSize: 16,
    color: "#003366",
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#003366",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  errorText: {
    fontSize: 18,
    color: "#FF0000",
    marginBottom: 20,
    textAlign: "center",
  },
  backButton: {
    backgroundColor: "#003366",
    marginTop: 10,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
});

// Export the sanitize function to use when navigating to this screen
export { sanitizeProjectData };