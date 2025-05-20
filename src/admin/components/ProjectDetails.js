import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    ActivityIndicator,
    Alert,
    Linking,
    Share
} from 'react-native';
import { 
    FontAwesome5, 
    Feather, 
    MaterialIcons,
    MaterialCommunityIcons,
    AntDesign
} from '@expo/vector-icons';
import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';

const ProjectDetails = () => {
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();
    const route = useRoute();
    const { projectId } = route.params;

    const fetchProject = async () => {
        try {
            setLoading(true);
            const db = getFirestore();
            const docRef = doc(db, "projects", projectId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists) {
                const projectData = docSnap.data();
                const createdAt = projectData.createdAt?.toDate();
                const updatedAt = projectData.updatedAt?.toDate();
                
                setProject({
                    id: docSnap.id,
                    ...projectData,
                    formattedCreatedAt: createdAt ? format(createdAt, 'MMMM dd, yyyy') : 'No date',
                    formattedUpdatedAt: updatedAt ? format(updatedAt, 'MMMM dd, yyyy') : 'Not updated',
                    progressPercentage: parseInt(projectData.accomplishment) || 0
                });
            } else {
                Alert.alert("Error", "Project not found");
                navigation.goBack();
            }
        } catch (error) {
            console.error("Error fetching project:", error);
            Alert.alert("Error", "Failed to load project details");
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleCallContractor = (phoneNumber) => {
        if (phoneNumber) {
            Linking.openURL(`tel:${phoneNumber.replace(/[^0-9]/g, '')}`);
        } else {
            Alert.alert("No Phone Number", "This contractor doesn't have a phone number listed");
        }
    };

    const handleShareProject = async () => {
        try {
            await Share.share({
                message: `Check out this project: ${project.title}\n\n` +
                         `Contractor: ${project.contractor}\n` +
                         `Amount: ₱${project.contractAmount}\n` +
                         `Progress: ${project.accomplishment}\n` +
                         `Status: ${project.status}`,
                title: project.title
            });
        } catch (error) {
            console.error("Error sharing project:", error);
        }
    };

    useEffect(() => {
        fetchProject();
    }, [projectId]);

    if (loading || !project) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#003366" />
                <Text style={styles.loadingText}>Loading project details...</Text>
            </View>
        );
    }

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'active': return '#4CAF50';
            case 'inactive': return '#F44336';
            case 'completed': return '#2196F3';
            default: return '#9E9E9E';
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount || 0).replace('PHP', '₱');
    };

    // Helper function to get relevant details based on project type
    const getProjectDetails = () => {
        switch (project.projectType) {
            case 'infrastructure':
                return [
                    { icon: 'user-tie', label: 'Contractor', value: project.contractor },
                    { icon: 'map-marker-alt', label: 'Location', value: project.location },
                    { icon: 'money-bill-wave', label: 'Contract Amount', value: formatCurrency(project.contractAmount) }
                ];
            case 'educational':
            case 'youth':
                return [
                    { icon: 'building', label: 'Partner Agency', value: project.partnerAgency },
                    { icon: 'users', label: 'Target Participants', value: project.targetParticipants },
                    { icon: 'clipboard-list', label: 'Program Type', value: project.programType },
                    { icon: 'map-marker-alt', label: 'Venue', value: project.venue },
                    { icon: 'calendar-alt', label: 'Start Date', value: project.startDate },
                    { icon: 'calendar-alt', label: 'End Date', value: project.endDate }
                ];
            case 'health':
            case 'livelihood':
            case 'social':
            case 'senior':
                return [
                    { icon: 'building', label: 'Partner Agency', value: project.partnerAgency },
                    { icon: 'users', label: 'Beneficiaries', value: project.beneficiaries },
                    { icon: 'clipboard-list', label: 'Program Type', value: project.programType },
                    { icon: 'money-bill-wave', label: 'Budget', value: formatCurrency(project.budget) },
                    { icon: 'map-marker-alt', label: 'Venue', value: project.venue }
                ];
            case 'environmental':
                return [
                    { icon: 'building', label: 'Partner Agency', value: project.partnerAgency },
                    { icon: 'users', label: 'Target Participants', value: project.targetParticipants },
                    { icon: 'map-marker-alt', label: 'Location', value: project.location },
                    { icon: 'box', label: 'Materials', value: project.materials }
                ];
            case 'sports':
                return [
                    { icon: 'building', label: 'Partner Agency', value: project.partnerAgency },
                    { icon: 'users', label: 'Target Participants', value: project.targetParticipants },
                    { icon: 'clipboard-list', label: 'Program Type', value: project.programType },
                    { icon: 'map-marker-alt', label: 'Venue', value: project.venue },
                    { icon: 'dumbbell', label: 'Equipment', value: project.equipment }
                ];
            case 'disaster':
                return [
                    { icon: 'building', label: 'Partner Agency', value: project.partnerAgency },
                    { icon: 'users', label: 'Beneficiaries', value: project.beneficiaries },
                    { icon: 'clipboard-list', label: 'Program Type', value: project.programType },
                    { icon: 'money-bill-wave', label: 'Budget', value: formatCurrency(project.budget) },
                    { icon: 'map-marker-alt', label: 'Location', value: project.location }
                ];
            default:
                return [
                    { icon: 'user-tie', label: 'Contractor', value: project.contractor },
                    { icon: 'money-bill-wave', label: 'Contract Amount', value: formatCurrency(project.contractAmount) }
                ];
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#003366" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Project Details</Text>
                <TouchableOpacity onPress={handleShareProject} style={styles.shareButton}>
                    <Feather name="share-2" size={20} color="#003366" />
                </TouchableOpacity>
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <FontAwesome5 name="project-diagram" size={24} color="#003366" />
                    <Text style={styles.projectTitle}>{project.title}</Text>
                    <View style={[
                        styles.statusBadge,
                        { 
                            backgroundColor: `${getStatusColor(project.status)}20`,
                            borderColor: getStatusColor(project.status)
                        }
                    ]}>
                        <Text style={[
                            styles.statusText,
                            { color: getStatusColor(project.status) }
                        ]}>
                            {project.status.toUpperCase()}
                        </Text>
                    </View>
                </View>

                {/* Project Type Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Project Type</Text>
                    <Text style={styles.projectTypeText}>{project.projectType?.charAt(0).toUpperCase() + project.projectType?.slice(1)}</Text>
                </View>

                {/* Dynamic Details Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Details</Text>
                    {getProjectDetails().map((detail, idx) => (
                        <DetailRow 
                            key={idx}
                            icon={detail.icon}
                            label={detail.label}
                            value={detail.value || 'Not specified'}
                        />
                    ))}
                </View>

                {/* Progress for infrastructure only */}
                {project.projectType === 'infrastructure' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Progress</Text>
                        <View style={styles.progressContainer}>
                            <View style={styles.progressHeader}>
                                <Text style={styles.progressLabel}>Accomplishment:</Text>
                                <Text style={styles.progressPercentage}>{project.accomplishment}</Text>
                            </View>
                            <View style={styles.progressBarBackground}>
                                <View style={[
                                    styles.progressBarFill,
                                    { 
                                        width: `${project.progressPercentage}%`,
                                        backgroundColor: getStatusColor(project.status)
                                    }
                                ]} />
                            </View>
                        </View>
                    </View>
                )}

                {/* Dates Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Dates</Text>
                    <DetailRow 
                        icon="calendar-alt" 
                        label="Date Created" 
                        value={project.formattedCreatedAt} 
                    />
                    {project.updatedAt && (
                        <DetailRow 
                            icon="edit" 
                            label="Last Updated" 
                            value={project.formattedUpdatedAt} 
                        />
                    )}
                </View>

                {project.remarks && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Remarks</Text>
                        <View style={styles.remarksContainer}>
                            <Text style={styles.remarksText}>{project.remarks}</Text>
                        </View>
                    </View>
                )}
            </View>
        </ScrollView>
    );
};

const DetailRow = ({ icon, label, value }) => {
    const IconComponent = icon === 'user-tie' ? FontAwesome5 :
                         icon === 'map-marker-alt' ? FontAwesome5 :
                         icon === 'money-bill-wave' ? FontAwesome5 :
                         icon === 'calendar-alt' ? FontAwesome5 :
                         icon === 'edit' ? MaterialIcons : FontAwesome5;

    return (
        <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
                <IconComponent name={icon} size={16} color="#666" />
            </View>
            <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailValue}>{value}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        paddingBottom: 30,
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    backButton: {
        marginRight: 15,
    },
    shareButton: {
        marginLeft: 'auto',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#003366',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 15,
    },
    projectTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 10,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#003366',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 8,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    detailIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f0f4f8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 15,
        color: '#333',
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
        fontSize: 14,
        color: '#666',
    },
    progressPercentage: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#003366',
    },
    progressBarBackground: {
        height: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 5,
    },
    remarksContainer: {
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 12,
    },
    remarksText: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        marginHorizontal: 5,
    },
    callButton: {
        backgroundColor: '#4CAF50',
    },
    editButton: {
        backgroundColor: '#E3F2FD',
        borderWidth: 1,
        borderColor: '#BBDEFB',
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    projectTypeText: {
        fontSize: 15,
        color: '#003366',
        fontWeight: 'bold',
        marginBottom: 8,
    },
});

export default ProjectDetails;