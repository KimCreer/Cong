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

// Project type icons and names (consistent with ProjectsScreen)
const projectTypeIcons = {
  infrastructure: "home-city",
  educational: "school",
  health: "hospital-box",
  livelihood: "handshake",
  social: "account-group",
  environmental: "leaf",
  sports: "soccer",
  disaster: "alert-octagon",
  youth: "account-supervisor",
  senior: "account-star"
};

const projectTypeNames = {
  infrastructure: "Infrastructure",
  educational: "Educational",
  health: "Health & Medical",
  livelihood: "Livelihood",
  social: "Social Services",
  environmental: "Environmental",
  sports: "Sports & Recreation",
  disaster: "Disaster Response",
  youth: "Youth Development",
  senior: "Senior Citizen"
};

// Helper function to sanitize project data for navigation
const sanitizeProjectData = (project) => {
  return {
    ...project,
    createdAt: project.createdAt ? project.createdAt.toISOString() : null,
    updatedAt: project.updatedAt ? project.updatedAt.toISOString() : null,
    startDate: project.startDate ? project.startDate.toISOString() : null,
    endDate: project.endDate ? project.endDate.toISOString() : null,
  };
};

// Helper function to restore dates after navigation
const restoreProjectDates = (project) => {
  return {
    ...project,
    createdAt: project.createdAt ? new Date(project.createdAt) : null,
    updatedAt: project.updatedAt ? new Date(project.updatedAt) : null,
    startDate: project.startDate ? new Date(project.startDate) : null,
    endDate: project.endDate ? new Date(project.endDate) : null,
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
              const data = docSnapshot.data();
              const updatedProject = {
                id: docSnapshot.id,
                title: data.title || "No title",
                description: data.remarks || "No description",
                location: data.location || "Location not specified",
                contractor: data.contractor || "Contractor not specified",
                contractAmount: data.contractAmount 
                  ? `₱${data.contractAmount.toLocaleString()}` 
                  : "N/A",
                accomplishment: data.accomplishment 
                  ? `${data.accomplishment.replace('%', '')}%` 
                  : "0%",
                progress: parseFloat(data.accomplishment) / 100 || 0,
                imageUrl: data.imageUrl || null,
                status: data.status || "active",
                projectType: data.projectType || "infrastructure",
                additionalImages: data.additionalImages || [],
                documents: data.documents || [],
                // Safely handle timestamps and dates
                createdAt: data.createdAt && typeof data.createdAt.toDate === 'function' 
                  ? data.createdAt.toDate() 
                  : data.createdAt || null,
                updatedAt: data.updatedAt && typeof data.updatedAt.toDate === 'function'
                  ? data.updatedAt.toDate() 
                  : data.updatedAt || null,
                // Additional fields for different project types
                beneficiaries: data.beneficiaries || null,
                startDate: data.startDate && typeof data.startDate.toDate === 'function'
                  ? data.startDate.toDate()
                  : data.startDate || null,
                endDate: data.endDate && typeof data.endDate.toDate === 'function'
                  ? data.endDate.toDate()
                  : data.endDate || null,
                budget: data.budget ? `₱${data.budget.toLocaleString()}` : null,
                partnerAgency: data.partnerAgency || null,
                targetParticipants: data.targetParticipants || null,
                programType: data.programType || null,
                equipment: data.equipment || null,
                materials: data.materials || null,
                trainingHours: data.trainingHours || null,
                venue: data.venue || null
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
                 `Type: ${projectTypeNames[project.projectType] || "Project"}\n` +
                 `Location: ${project.location}\n` +
                 `Status: ${project.status.charAt(0).toUpperCase() + project.status.slice(1)}\n` +
                 (project.projectType === "infrastructure" ? `Progress: ${project.accomplishment}\n` : "") +
                 `Description: ${project.description.substring(0, 100)}...`,
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

  // Safely format date to string, with a null check
  const formatDate = (date) => {
    if (!date) return null;
    try {
      return date.toLocaleDateString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return null;
    }
  };

  const renderDetailItem = (icon, label, value) => {
    if (!value) return null;
    
    return (
      <View style={styles.detailItem}>
        <Icon name={icon} size={20} color="#003366" />
        <Text style={styles.detailText}>
          <Text style={styles.detailLabel}>{label}: </Text>
          {value}
        </Text>
      </View>
    );
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
        <Icon name="alert-circle" size={48} color="#F44336" />
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
      <LinearGradient 
        colors={["#001F3F", "#003366"]} 
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
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
        {project.imageUrl ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: project.imageUrl }} style={styles.topImage} />
            <LinearGradient 
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.imageOverlay}
            />
          </View>
        ) : (
          <View style={[styles.topImage, styles.noImageContainer]}>
            <Icon 
              name={projectTypeIcons[project.projectType] || "file-document"} 
              size={60} 
              color="#003366" 
            />
            <LinearGradient 
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.imageOverlay}
            />
          </View>
        )}

        {/* Image Carousel */}
        {additionalImages.length > 0 ? (
          <View style={styles.carouselContainer}>
            <Text style={styles.sectionTitle}>Project Gallery</Text>
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

        {/* Project Title and Type */}
        <View style={styles.titleContainer}>
          <View style={styles.typeBadge}>
            <Icon 
              name={projectTypeIcons[project.projectType] || "file-document"} 
              size={18} 
              color="#fff" 
            />
            <Text style={styles.typeText}>
              {projectTypeNames[project.projectType] || "Project"}
            </Text>
          </View>
          <Text style={styles.title}>{project.title}</Text>
        </View>

        {/* Status & Location */}
        <View style={styles.row}>
          <Chip 
            icon="map-marker" 
            style={styles.locationChip}
            textStyle={styles.chipText}
          >
            {project.location}
          </Chip>
          <Chip
            style={[
              styles.statusChip,
              project.status === "completed"
                ? styles.completedStatus
                : project.status === "inactive"
                ? styles.inactiveStatus
                : styles.ongoingStatus,
            ]}
            textStyle={styles.chipText}
          >
            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
          </Chip>
        </View>

        {/* Project Description */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{project.description}</Text>
          </Card.Content>
        </Card>

        {/* Project Details */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Project Details</Text>
            
            {renderDetailItem("calendar", "Created", formatDate(project.createdAt))}
            {renderDetailItem("calendar-edit", "Last Updated", formatDate(project.updatedAt))}
            {renderDetailItem("calendar-start", "Start Date", formatDate(project.startDate))}
            {renderDetailItem("calendar-end", "End Date", formatDate(project.endDate))}
            
            {project.projectType === "infrastructure" && (
              <>
                {renderDetailItem("account-hard-hat", "Contractor", project.contractor)}
                {renderDetailItem("cash", "Contract Amount", project.contractAmount)}
              </>
            )}
            
            {project.budget && renderDetailItem("cash", "Budget", project.budget)}
            {renderDetailItem("office-building", "Partner Agency", project.partnerAgency)}
            {renderDetailItem("account-multiple", "Beneficiaries", 
              project.beneficiaries || project.targetParticipants ? 
              `${project.beneficiaries || project.targetParticipants} people` : null)}
            {renderDetailItem("home", "Venue", project.venue)}
            {renderDetailItem("clock", "Training Hours", project.trainingHours)}
          </Card.Content>
        </Card>

        {/* Progress Section (for infrastructure projects) */}
        {project.projectType === "infrastructure" && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Project Progress</Text>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Completion</Text>
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
            </Card.Content>
          </Card>
        )}

        {/* Materials/Equipment Section */}
        {(project.materials || project.equipment) && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>
                {project.projectType === "infrastructure" ? "Materials" : "Resources"}
              </Text>
              {project.materials && (
                <View style={styles.detailItem}>
                  <Icon name="basket" size={20} color="#003366" />
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>Materials: </Text>
                    {project.materials}
                  </Text>
                </View>
              )}
              {project.equipment && (
                <View style={styles.detailItem}>
                  <Icon name="tools" size={20} color="#003366" />
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>Equipment: </Text>
                    {project.equipment}
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Documents Section */}
        {project.documents && project.documents.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Project Documents</Text>
              {project.documents.map((doc, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.documentItem}
                  onPress={() => handleDocumentPress(doc.url)}
                >
                  <Icon 
                    name={doc.type === 'pdf' ? 'file-pdf-box' : 'file-document'} 
                    size={24} 
                    color="#003366" 
                  />
                  <View style={styles.documentTextContainer}>
                    <Text style={styles.documentText} numberOfLines={1} ellipsizeMode="tail">
                      {doc.name}
                    </Text>
                    <Text style={styles.documentSize}>{doc.size}</Text>
                  </View>
                  <Icon name="download" size={24} color="#003366" />
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
    backgroundColor: "#f8f9fa",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  backButton: {
    padding: 8,
  },
  shareButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  scrollContainer: {
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  topImage: {
    width: "100%",
    height: 250,
    borderRadius: 16,
  },
  noImageContainer: {
    backgroundColor: '#e0e9f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    marginBottom: 15,
  },
  imageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '30%',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  carouselContainer: {
    alignItems: "center",
    marginBottom: 20,
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
    marginBottom: 20,
  },
  titleContainer: {
    marginBottom: 15,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#003366',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  typeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#003366",
    lineHeight: 28,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  locationChip: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 100,
    justifyContent: 'center',
  },
  completedStatus: {
    backgroundColor: "#e8f5e9",
  },
  ongoingStatus: {
    backgroundColor: "#fff8e1", 
  },
  inactiveStatus: {
    backgroundColor: "#ffebee",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#003366",
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: "#666",
    lineHeight: 22,
    marginBottom: 5,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    color: "#444",
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontWeight: "600",
    color: "#003366",
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: "#555",
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 14,
    color: "#003366",
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f1f1f1',
    marginBottom: 5,
  },
  documentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  documentTextContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  documentText: {
    fontSize: 16,
    color: "#003366",
    fontWeight: '500',
  },
  documentSize: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
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
  backButton: {
    backgroundColor: "#003366",
    borderRadius: 8,
    paddingHorizontal: 25,
    paddingVertical: 8,
    elevation: 2,
  },
  buttonText: {
    color: "#fff",
    fontWeight: '600',
  },
});

// Export the sanitize function to use when navigating to this screen
export { sanitizeProjectData };