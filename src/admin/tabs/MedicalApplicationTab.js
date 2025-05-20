import React, { useState, useEffect } from "react";
import { 
    View, 
    Text, 
    FlatList, 
    TouchableOpacity, 
    ActivityIndicator,
    RefreshControl,
    Alert,
    Modal,
    TextInput,
    Linking,
    ScrollView
} from "react-native";
import { FontAwesome5, Feather, MaterialIcons } from "@expo/vector-icons";
import { getFirestore, collection, query, getDocs, onSnapshot, orderBy, where, updateDoc, doc } from "@react-native-firebase/firestore";
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';
import DateTimePicker from '@react-native-community/datetimepicker';

import MedicalAppCard from './medcomps/MedicalAppCard';
import styles from './medcomps/styles/MedicalApplicationStyles';
import { 
    formatTimeAgo, 
    getStatusColor, 
    formatStatusText, 
    groupByDate, 
    filterByDate, 
    formatDate, 
    calculateStats 
} from './medcomps/utils/utils';

const MedicalApplicationTab = () => {
    const navigation = useNavigation();
    const [medicalApps, setMedicalApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [selectedAssistanceFilter, setSelectedAssistanceFilter] = useState('all');
    const [selectedApplications, setSelectedApplications] = useState([]);
    const [isActionModalVisible, setIsActionModalVisible] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingApplication, setEditingApplication] = useState(null);
    const [assistanceType, setAssistanceType] = useState('');
    const [dateFilter, setDateFilter] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [groupedApplications, setGroupedApplications] = useState({});
    const [stats, setStats] = useState({
        today: 0,
        yesterday: 0,
        thisWeek: 0,
        thisMonth: 0,
        total: 0
    });

    const assistanceTypes = [
        'all',
        'Medical Assistance',
        'Financial Assistance',
        'Medicine Support',
        'Therapy Support',
        'Other'
    ];

    const fetchMedicalApplications = async (statusFilter = 'all', assistanceFilter = 'all') => {
        try {
            setRefreshing(true);
            const db = getFirestore();
            let q;
            
            if (statusFilter === 'all') {
                q = query(
                    collection(db, "medicalApplications"),
                    orderBy("createdAt", "desc")
                );
            } else {
                const statusValue = statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1).toLowerCase();
                q = query(
                    collection(db, "medicalApplications"),
                    where("status", "==", statusValue),
                    orderBy("createdAt", "desc")
                );
            }
            
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot) {
                throw new Error("Query returned null snapshot");
            }
            
            let data = querySnapshot.docs.map(doc => {
                const docData = doc.data();
                return {
                    id: doc.id,
                    ...docData,
                    status: docData.status?.toLowerCase(),
                    timeAgo: docData.createdAt ? formatTimeAgo(docData.createdAt.toDate()) : "Unknown date"
                };
            });
            
            if (assistanceFilter !== 'all') {
                data = data.filter(app => 
                    app.assistanceType && 
                    app.assistanceType.toLowerCase() === assistanceFilter.toLowerCase()
                );
            }
            
            setMedicalApps(data);
            updateStatsAndGrouping(data);
        } catch (error) {
            console.error("Error fetching medical applications:", error);
            
            if (error.code === 'failed-precondition') {
                Alert.alert(
                    "Index Required",
                    "Please create the required Firestore index for proper filtering.",
                    [
                        {
                            text: "Create Index",
                            onPress: () => Linking.openURL(error.message.match(/https:\/\/[^\s]+/)[0])
                        },
                        { text: "OK" }
                    ]
                );
            } else {
                Alert.alert("Error", "Failed to load medical applications");
            }
            
            setMedicalApps([]);
            setGroupedApplications({});
            setStats({
                today: 0,
                yesterday: 0,
                thisWeek: 0,
                thisMonth: 0,
                total: 0
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const updateStatsAndGrouping = (applications) => {
        const filtered = dateFilter ? filterByDate(applications, dateFilter) : applications;
        setGroupedApplications(groupByDate(filtered));
        setStats(calculateStats(filtered));
    };
    

    useEffect(() => {
        let unsubscribe;
        
        const setupListener = async () => {
            try {
                const db = getFirestore();
                let q = query(
                    collection(db, "medicalApplications"),
                    orderBy("createdAt", "desc")
                );
                
                unsubscribe = onSnapshot(q, 
                    (snapshot) => {
                        let updatedData = snapshot.docs.map(doc => {
                            const docData = doc.data();
                            return {
                                id: doc.id,
                                ...docData,
                                status: docData.status?.toLowerCase(),
                                timeAgo: docData.createdAt ? formatTimeAgo(docData.createdAt.toDate()) : "Unknown date"
                            };
                        });
                        
                        if (selectedAssistanceFilter !== 'all') {
                            updatedData = updatedData.filter(app => 
                                app.assistanceType && 
                                app.assistanceType.toLowerCase() === selectedAssistanceFilter.toLowerCase()
                            );
                        }
                        
                        if (selectedFilter !== 'all') {
                            updatedData = updatedData.filter(app => 
                                app.status === selectedFilter.toLowerCase()
                            );
                        }
                        
                        setMedicalApps(updatedData);
                        updateStatsAndGrouping(updatedData);
                    },
                    (error) => {
                        console.error("Listener error:", error);
                        if (error.code === 'failed-precondition') {
                            Alert.alert(
                                "Index Required",
                                "Please create the required Firestore index",
                                [
                                    {
                                        text: "Create Index",
                                        onPress: () => Linking.openURL(error.message.match(/https:\/\/[^\s]+/)[0])
                                    },
                                    { text: "OK" }
                                ]
                            );
                        }
                    }
                );
            } catch (error) {
                console.error("Error setting up listener:", error);
            }
        };
        
        setupListener();
        fetchMedicalApplications(selectedFilter, selectedAssistanceFilter);
        
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [selectedFilter, selectedAssistanceFilter, dateFilter]);

    const toggleApplicationSelection = (id) => {
        setSelectedApplications(prev => 
            prev.includes(id) 
                ? prev.filter(appId => appId !== id) 
                : [...prev, id]
        );
    };

    const approveSelectedApplications = async () => {
        try {
            setIsProcessing(true);
            const db = getFirestore();
            
            await Promise.all(
                selectedApplications.map(async (appId) => {
                    const appRef = doc(db, "medicalApplications", appId);
                    await updateDoc(appRef, { 
                        status: "approved",
                        updatedAt: new Date() 
                    });
                })
            );
            
            Alert.alert("Success", "Selected applications have been approved");
            setSelectedApplications([]);
            setIsActionModalVisible(false);
        } catch (error) {
            console.error("Error approving applications:", error);
            Alert.alert("Error", "Failed to approve applications");
        } finally {
            setIsProcessing(false);
        }
    };

    const rejectSelectedApplications = async () => {
        try {
            setIsProcessing(true);
            const db = getFirestore();
            
            await Promise.all(
                selectedApplications.map(async (appId) => {
                    const appRef = doc(db, "medicalApplications", appId);
                    await updateDoc(appRef, { 
                        status: "rejected",
                        updatedAt: new Date() 
                    });
                })
            );
            
            Alert.alert("Success", "Selected applications have been rejected");
            setSelectedApplications([]);
            setIsActionModalVisible(false);
        } catch (error) {
            console.error("Error rejecting applications:", error);
            Alert.alert("Error", "Failed to reject applications");
        } finally {
            setIsProcessing(false);
        }
    };

    const updateAssistanceType = async () => {
        if (!editingApplication || !assistanceType.trim()) return;
        
        try {
            setIsProcessing(true);
            const db = getFirestore();
            const appRef = doc(db, "medicalApplications", editingApplication.id);
            
            await updateDoc(appRef, { 
                assistanceType: assistanceType.trim(),
                updatedAt: new Date() 
            });
            
            Alert.alert("Success", "Assistance type updated successfully");
            setEditingApplication(null);
            setAssistanceType('');
        } catch (error) {
            console.error("Error updating assistance type:", error);
            Alert.alert("Error", "Failed to update assistance type");
        } finally {
            setIsProcessing(false);
        }
    };

    const exportToExcel = async () => {
        try {
            setIsProcessing(true);
            
            // Use the filtered applications based on search and all active filters
            const filteredApps = medicalApps.filter(app => {
                const matchesSearch = searchQuery === '' || 
                    app.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    app.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    app.contactNumber?.includes(searchQuery) ||
                    app.programName?.toLowerCase().includes(searchQuery.toLowerCase());
                
                // Apply date filter if active
                const matchesDate = !dateFilter || 
                    (app.createdAt && 
                     new Date(app.createdAt.toDate()).toDateString() === new Date(dateFilter).toDateString());
                
                return matchesSearch && matchesDate;
            });
            
            const dataToExport = selectedApplications.length > 0
                ? filteredApps.filter(app => selectedApplications.includes(app.id))
                : filteredApps;
            
            if (dataToExport.length === 0) {
                Alert.alert("No Data", "There are no applications to export");
                return;
            }
            
            const excelData = dataToExport.map(app => ({
                "Full Name": app.fullName || "N/A",
                "Email": app.email || "N/A",
                "Contact Number": app.contactNumber || "N/A",
                "Address": app.address || "N/A",
                "Medical Condition": app.medicalCondition || "N/A",
                "Patient Status": app.patientStatus || "N/A",
                "Hospitals": app.programName || "N/A",
                "Assistance Type": app.assistanceType || "Not specified"
            }));
            
            const ws = XLSX.utils.json_to_sheet(excelData);
            
            const wscols = [
                {wch: 20}, {wch: 25}, {wch: 15}, {wch: 25}, 
                {wch: 25}, {wch: 15}, {wch: 30}, {wch: 20}
            ];
            ws['!cols'] = wscols;
            
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Medical Applications");
            
            const wbout = XLSX.write(wb, { 
                type: 'base64', 
                bookType: 'xlsx',
                bookSST: true
            });
            
            const uri = FileSystem.cacheDirectory + 'medical_applications.xlsx';
            await FileSystem.writeAsStringAsync(uri, wbout, {
                encoding: FileSystem.EncodingType.Base64
            });
            
            await Sharing.shareAsync(uri, {
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                dialogTitle: 'Export Medical Applications',
                UTI: 'com.microsoft.excel.xlsx'
            });
            
            setSelectedApplications([]);
            setIsActionModalVisible(false);
        } catch (error) {
            console.error("Error exporting to Excel:", error);
            Alert.alert("Error", "Failed to export data to Excel");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDateSelect = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setDateFilter(selectedDate);
        }
    };

    const clearDateFilter = () => {
        setDateFilter(null);
    };

    const filteredApplications = medicalApps.filter(app => {
        const matchesSearch = searchQuery === '' || 
            app.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.contactNumber?.includes(searchQuery) ||
            app.programName?.toLowerCase().includes(searchQuery.toLowerCase());
        
        return matchesSearch;
    });

    return (
        <View style={styles.container}>
          

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search applications..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#999"
                />
                <Feather name="search" size={20} color="#999" style={styles.searchIcon} />
            </View>

            {/* Date Filter */}
            <View style={styles.dateFilterContainer}>
                <TouchableOpacity 
                    style={styles.dateFilterButton}
                    onPress={() => setShowDatePicker(true)}
                >
                    <Feather name="calendar" size={16} color="#003366" />
                    <Text style={styles.dateFilterText}>
                        {dateFilter ? formatDate(dateFilter) : "Filter by date"}
                    </Text>
                </TouchableOpacity>
                {dateFilter && (
                    <TouchableOpacity 
                        style={styles.clearDateFilterButton}
                        onPress={clearDateFilter}
                    >
                        <Feather name="x" size={16} color="#f44336" />
                    </TouchableOpacity>
                )}
            </View>

            {showDatePicker && (
                <DateTimePicker
                    value={dateFilter || new Date()}
                    mode="date"
                    display="default"
                    onChange={handleDateSelect}
                />
            )}

            {/* Status Filter Buttons */}
            <View style={styles.filterContainer}>
                <TouchableOpacity 
                    style={[
                        styles.filterButton, 
                        selectedFilter === 'all' && styles.activeFilter
                    ]}
                    onPress={() => setSelectedFilter('all')}
                >
                    <Text style={[
                        styles.filterText,
                        selectedFilter === 'all' && styles.activeFilterText
                    ]}>
                        All
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[
                        styles.filterButton, 
                        selectedFilter === 'pending' && styles.activeFilter
                    ]}
                    onPress={() => setSelectedFilter('pending')}
                >
                    <Text style={[
                        styles.filterText,
                        selectedFilter === 'pending' && styles.activeFilterText
                    ]}>
                        Pending
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[
                        styles.filterButton, 
                        selectedFilter === 'approved' && styles.activeFilter
                    ]}
                    onPress={() => setSelectedFilter('approved')}
                >
                    <Text style={[
                        styles.filterText,
                        selectedFilter === 'approved' && styles.activeFilterText
                    ]}>
                        Approved
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[
                        styles.filterButton, 
                        selectedFilter === 'rejected' && styles.activeFilter
                    ]}
                    onPress={() => setSelectedFilter('rejected')}
                >
                    <Text style={[
                        styles.filterText,
                        selectedFilter === 'rejected' && styles.activeFilterText
                    ]}>
                        Rejected
                    </Text>
                </TouchableOpacity>
            </View>
            
            {/* Assistance Type Filter */}
            <View style={styles.assistanceFilterContainer}>
                <Text style={styles.filterLabel}>Assistance Type:</Text>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.assistanceFilterList}
                >
                    {assistanceTypes.map((type) => (
                        <TouchableOpacity
                            key={type}
                            style={[
                                styles.assistanceFilterButton,
                                selectedAssistanceFilter.toLowerCase() === type.toLowerCase() && styles.activeAssistanceFilter
                            ]}
                            onPress={() => setSelectedAssistanceFilter(type)}
                        >
                            <Text style={[
                                styles.assistanceFilterText,
                                selectedAssistanceFilter.toLowerCase() === type.toLowerCase() && styles.activeAssistanceFilterText
                            ]}>
                                {type === 'all' ? 'All Types' : type}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
            
            {/* Selected Applications Info */}
            {selectedApplications.length > 0 && (
                <View style={styles.selectionInfo}>
                    <Text style={styles.selectionText}>
                        {selectedApplications.length} selected
                    </Text>
                    <TouchableOpacity 
                        onPress={() => setSelectedApplications([])}
                        style={styles.clearSelectionButton}
                    >
                        <Text style={styles.clearSelectionText}>Clear</Text>
                    </TouchableOpacity>
                </View>
            )}
            
            {/* Export All Button */}
            <TouchableOpacity 
                style={styles.exportButton}
                onPress={exportToExcel}
            >
                <Feather name="download" size={20} color="white" />
                <Text style={styles.exportButtonText}>Export Data</Text>
            </TouchableOpacity>

            {/* Action Button */}
            {selectedApplications.length > 0 && (
                <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => setIsActionModalVisible(true)}
                >
                    <Feather name="edit" size={20} color="white" />
                </TouchableOpacity>
            )}

            {loading && !refreshing ? (
                <ActivityIndicator size="large" color="#003366" style={styles.loader} />
            ) : (
                <FlatList
                    data={Object.entries(groupedApplications)}
                    keyExtractor={([date]) => date}
                    renderItem={({ item: [date, apps] }) => (
                        <View>
                            <Text style={styles.dateHeader}>{date}</Text>
                            {apps.map(application => (
                                <MedicalAppCard 
                                    key={application.id}
                                    application={application}
                                    onPress={() => navigation.navigate('MedicalApplicationDetail', { 
                                        applicationId: application.id 
                                    })}
                                    isSelected={selectedApplications.includes(application.id)}
                                    toggleSelection={toggleApplicationSelection}
                                />
                            ))}
                        </View>
                    )}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <FontAwesome5 name="hospital" size={40} color="#ccc" />
                            <Text style={styles.emptyText}>No medical applications found</Text>
                            {searchQuery !== '' && (
                                <Text style={styles.emptySubtext}>Try a different search term</Text>
                            )}
                        </View>
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => fetchMedicalApplications(selectedFilter, selectedAssistanceFilter)}
                            colors={["#003366", "#0275d8"]}
                        />
                    }
                    contentContainerStyle={medicalApps.length === 0 && styles.emptyListContainer}
                />
            )}
            
            {/* Action Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isActionModalVisible}
                onRequestClose={() => setIsActionModalVisible(false)}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Application Actions</Text>
                        <Text style={styles.modalSubtitle}>{selectedApplications.length} applications selected</Text>
                        
                        <TouchableOpacity 
                            style={[styles.modalButton, styles.approveButton]}
                            onPress={approveSelectedApplications}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Feather name="check-circle" size={20} color="white" />
                                    <Text style={styles.modalButtonText}>Approve Selected</Text>
                                </>
                            )}
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.modalButton, styles.rejectButton]}
                            onPress={rejectSelectedApplications}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Feather name="x-circle" size={20} color="white" />
                                    <Text style={styles.modalButtonText}>Reject Selected</Text>
                                </>
                            )}
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.modalButton, styles.updateButton]}
                            onPress={() => {
                                setIsActionModalVisible(false);
                                setEditingApplication(medicalApps.find(app => app.id === selectedApplications[0]));
                                setAssistanceType(medicalApps.find(app => app.id === selectedApplications[0])?.assistanceType || '');
                            }}
                            disabled={isProcessing || selectedApplications.length !== 1}
                        >
                            <Feather name="edit" size={20} color="white" />
                            <Text style={styles.modalButtonText}>Update Assistance Type</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.modalButton, styles.exportButtonModal]}
                            onPress={exportToExcel}
                            disabled={isProcessing}
                        >
                            <Feather name="download" size={20} color="white" />
                            <Text style={styles.modalButtonText}>Export Selected</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.modalButton, styles.cancelButton]}
                            onPress={() => setIsActionModalVisible(false)}
                            disabled={isProcessing}
                        >
                            <Text style={[styles.modalButtonText, {color: '#003366'}]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            
            {/* Assistance Type Update Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={!!editingApplication}
                onRequestClose={() => setEditingApplication(null)}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Update Assistance Type</Text>
                        <Text style={styles.modalSubtitle}>For: {editingApplication?.fullName || 'Unknown'}</Text>
                        
                        <TextInput
                            style={styles.textInput}
                            placeholder="Enter assistance type (e.g., Medical, Financial)"
                            value={assistanceType}
                            onChangeText={setAssistanceType}
                            placeholderTextColor="#999"
                        />
                        
                        <View style={styles.buttonRow}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.cancelButton, {flex: 1}]}
                                onPress={() => setEditingApplication(null)}
                                disabled={isProcessing}
                            >
                                <Text style={[styles.modalButtonText, {color: '#003366'}]}>Cancel</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.updateButton, {flex: 1}]}
                                onPress={updateAssistanceType}
                                disabled={isProcessing || !assistanceType.trim()}
                            >
                                {isProcessing ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.modalButtonText}>Update</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default MedicalApplicationTab;