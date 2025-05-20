// ProjectCard.js
import React from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity,
    StyleSheet,
    Image,
    Alert   
} from 'react-native';
import { AntDesign } from "@expo/vector-icons";
import { deleteProject } from './projectsUtils';


const ProjectCard = ({ project, navigation, onEdit, formatCurrency, getStatusColor }) => {
    const handlePress = () => {
        navigation.navigate('ProjectDetailsAdmin', { 
            projectId: project.id,
            projectData: project
        });
    };

    const confirmDelete = (e) => {
        e.stopPropagation();
        Alert.alert(
            "Delete Project",
            `Are you sure you want to delete "${project.title}"?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", onPress: () => handleDeleteProject(project.id), style: "destructive" }
            ]
        );
    };

    const handleDeleteProject = async (id) => {
        try {
            await deleteProject(id);
        } catch (error) {
            Alert.alert("Error", "Failed to delete project");
        }
    };

    // Helper function to get relevant details based on project type
    const getProjectDetails = () => {
        switch (project.projectType) {
            case 'infrastructure':
                return [
                    { label: 'Contractor', value: project.contractor },
                    { label: 'Amount', value: formatCurrency(project.contractAmount) },
                    { label: 'Location', value: project.location }
                ];
            case 'educational':
            case 'youth':
                return [
                    { label: 'Partner Agency', value: project.partnerAgency },
                    { label: 'Target Participants', value: project.targetParticipants },
                    { label: 'Program Type', value: project.programType },
                    { label: 'Venue', value: project.venue }
                ];
            case 'health':
            case 'livelihood':
            case 'social':
            case 'senior':
                return [
                    { label: 'Partner Agency', value: project.partnerAgency },
                    { label: 'Beneficiaries', value: project.beneficiaries },
                    { label: 'Program Type', value: project.programType },
                    { label: 'Budget', value: formatCurrency(project.budget) }
                ];
            case 'environmental':
                return [
                    { label: 'Partner Agency', value: project.partnerAgency },
                    { label: 'Target Participants', value: project.targetParticipants },
                    { label: 'Location', value: project.location },
                    { label: 'Materials', value: project.materials }
                ];
            case 'sports':
                return [
                    { label: 'Partner Agency', value: project.partnerAgency },
                    { label: 'Target Participants', value: project.targetParticipants },
                    { label: 'Program Type', value: project.programType },
                    { label: 'Equipment', value: project.equipment }
                ];
            case 'disaster':
                return [
                    { label: 'Partner Agency', value: project.partnerAgency },
                    { label: 'Beneficiaries', value: project.beneficiaries },
                    { label: 'Program Type', value: project.programType },
                    { label: 'Location', value: project.location }
                ];
            default:
                return [
                    { label: 'Contractor', value: project.contractor },
                    { label: 'Amount', value: formatCurrency(project.contractAmount) }
                ];
        }
    };

    return (
        <TouchableOpacity 
            style={styles.projectCard}
            onPress={handlePress}
        >
            {project.imageUrl && (
                <Image 
                    source={{ uri: project.imageUrl }} 
                    style={styles.projectImage}
                    resizeMode="cover"
                />
            )}
            
            <View style={styles.cardHeader}>
                <View style={styles.titleContainer}>
                    <Text style={styles.projectTitle} numberOfLines={1} ellipsizeMode="tail">
                        {project.title}
                    </Text>
                    <Text style={styles.projectType}>
                        {project.projectType?.charAt(0).toUpperCase() + project.projectType?.slice(1) || 'N/A'}
                    </Text>
                </View>
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
                        {project.status?.toUpperCase() || 'N/A'}
                    </Text>
                </View>
            </View>
            
            {getProjectDetails().map((detail, index) => (
                <View key={index} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{detail.label}:</Text>
                    <Text style={styles.detailValue} numberOfLines={1} ellipsizeMode="tail">
                        {detail.value || 'N/A'}
                    </Text>
                </View>
            ))}
            
            {project.projectType === 'infrastructure' && (
                <View style={styles.progressRow}>
                    <Text style={styles.detailLabel}>Progress:</Text>
                    <View style={styles.progressContainer}>
                        <View style={[
                            styles.progressBar,
                            { 
                                width: `${parseInt(project.accomplishment) || 0}%`,
                                backgroundColor: getStatusColor(project.status)
                            }
                        ]} />
                        <Text style={styles.progressText}>{project.accomplishment || '0%'}</Text>
                    </View>
                </View>
            )}
            
            <View style={styles.cardFooter}>
                <View style={styles.dateContainer}>
                    <Text style={styles.projectDate}>
                        {project.createdAt.toLocaleDateString()}
                    </Text>
                    {project.updatedAt && (
                        <Text style={styles.updatedDate}>
                            Updated: {project.updatedAt.toLocaleDateString()}
                        </Text>
                    )}
                </View>
                <View style={styles.actionButtons}>
                    <TouchableOpacity 
                        onPress={(e) => {
                            e.stopPropagation();
                            onEdit(project);
                        }}
                        style={styles.actionButton}
                    >
                        <AntDesign name="edit" size={16} color="#003366" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={confirmDelete}
                        style={styles.actionButton}
                    >
                        <AntDesign name="delete" size={16} color="#F44336" />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    projectCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    projectImage: {
        width: '100%',
        height: 150,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    titleContainer: {
        flex: 1,
        marginRight: 10,
    },
    projectTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#003366',
        flex: 1,
        marginRight: 10,
    },
    projectType: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
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
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingVertical: 5,
        alignItems: 'center',
    },
    progressRow: {
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    detailLabel: {
        fontSize: 14,
        color: '#616161',
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 14,
        color: '#212121',
        fontWeight: '600',
        flexShrink: 1,
        marginLeft: 10,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        marginRight: 8,
        flex: 1,
    },
    progressText: {
        fontSize: 14,
        color: '#212121',
        fontWeight: '600',
        minWidth: 40,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    dateContainer: {
        flex: 1,
    },
    projectDate: {
        fontSize: 12,
        color: '#9E9E9E',
    },
    updatedDate: {
        fontSize: 10,
        color: '#BDBDBD',
        marginTop: 2,
    },
    actionButtons: {
        flexDirection: 'row',
    },
    actionButton: {
        padding: 8,
        marginLeft: 8,
    },
});

export default ProjectCard;