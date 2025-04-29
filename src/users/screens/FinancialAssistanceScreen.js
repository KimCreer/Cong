import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Linking
} from 'react-native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { initializeApp } from '@react-native-firebase/app';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  onSnapshot 
} from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';
import * as Haptics from 'expo-haptics';

const FinancialAssistanceScreen = ({ navigation }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Initialize Firebase services
  const app = initializeApp();
  const db = getFirestore(app);
  const auth = getAuth(app);

  const fetchApplications = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      
      const user = auth.currentUser;
      
      if (!user) {
        Alert.alert(
          "Authentication Required", 
          "Please login to view your applications",
          [
            {
              text: "Login",
              onPress: () => navigation.navigate('Login')
            },
            {
              text: "Cancel",
              style: "cancel"
            }
          ]
        );
        return;
      }

      const applicationsRef = collection(db, 'medicalApplications');
      const applicationsQuery = query(
        applicationsRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(applicationsQuery);

      const data = querySnapshot.docs.map(doc => {
        const appData = doc.data();
        const createdAt = appData.createdAt?.toDate();
        
        return {
          id: doc.id,
          ...appData,
          assistanceType: determineAssistanceType(appData),
          formattedDate: createdAt ? formatApplicationDate(createdAt) : "Date not available",
          programName: appData.programName || 'Medical Assistance',
          estimatedCost: formatCurrency(appData.estimatedCost),
          medicalCondition: appData.medicalCondition || 'Not specified',
          status: appData.status || 'pending',
          urgencyLevel: appData.urgencyLevel || 'normal'
        };
      });

      setApplications(data);
      setHasError(false);
      
      // Trigger haptic feedback on successful load
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      setHasError(true);
      Alert.alert(
        "Error", 
        "Failed to load applications. Please check your internet connection and try again.",
        [
          {
            text: "Retry",
            onPress: () => fetchApplications()
          }
        ]
      );
      
      // Trigger haptic feedback on error
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Helper functions
  const determineAssistanceType = (appData) => {
    if (appData.programType) return appData.programType;
    if (appData.programName?.includes('Burial')) return 'Burial';
    if (appData.programName?.includes('Education')) return 'Education';
    return 'Medical';
  };

  const formatApplicationDate = (date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Not specified';
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handleCallApplicant = (phoneNumber) => {
    if (!phoneNumber) return;
    
    Alert.alert(
      "Contact Information",
      `This is your registered phone number: ${phoneNumber}`,
      [
        {
          text: "OK",
          style: "cancel"
        }
      ]
    );
  };

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (user) {
        fetchApplications();
      } else {
        setApplications([]);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Set up real-time listener when user is authenticated
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const applicationsRef = collection(db, 'medicalApplications');
    const applicationsQuery = query(
      applicationsRef,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      applicationsQuery,
      snapshot => {
        const updatedApps = snapshot.docs.map(doc => {
          const appData = doc.data();
          return {
            id: doc.id,
            ...appData,
            assistanceType: determineAssistanceType(appData),
            formattedDate: appData.createdAt?.toDate() ? 
              formatApplicationDate(appData.createdAt.toDate()) : "N/A",
            estimatedCost: formatCurrency(appData.estimatedCost),
            status: appData.status || 'pending'
          };
        });
        setApplications(updatedApps);
      },
      error => {
        console.error("Listener Error:", error);
        setHasError(true);
      }
    );

    return () => unsubscribe();
  }, [auth.currentUser]);

  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'approved': return '#4CAF50';
      case 'pending': return '#FFC107';
      case 'rejected': return '#F44336';
      case 'processing': return '#2196F3';
      case 'completed': return '#673AB7';
      default: return '#9E9E9E';
    }
  };

  const getUrgencyIcon = (urgency) => {
    switch ((urgency || '').toLowerCase()) {
      case 'high': return { name: 'warning', color: '#F44336' };
      case 'medium': return { name: 'error-outline', color: '#FF9800' };
      default: return { name: 'info-outline', color: '#2196F3' };
    }
  };

  const renderApplication = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.card,
        item.urgencyLevel === 'high' && styles.urgentCard,
        item.urgencyLevel === 'medium' && styles.mediumPriorityCard
      ]}
      onPress={() => {
        if (Platform.OS === 'ios') {
          Haptics.selectionAsync();
        }
        navigation.navigate('ApplicationDetails', { 
          application: item,
          onGoBack: () => fetchApplications(false)
        });
      }}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          {item.urgencyLevel !== 'normal' && (
            <MaterialIcons 
              name={getUrgencyIcon(item.urgencyLevel).name} 
              size={18} 
              color={getUrgencyIcon(item.urgencyLevel).color}
              style={styles.urgencyIcon}
            />
          )}
          <Text style={styles.programName} numberOfLines={1} ellipsizeMode="tail">
            {item.programName}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status?.toUpperCase() || 'PENDING'}</Text>
        </View>
      </View>

      <View style={styles.detailRow}>
        <FontAwesome5 name="stethoscope" size={14} color="#555" />
        <Text style={styles.detailValue} numberOfLines={2}>
          {item.medicalCondition}
        </Text>
      </View>

      <View style={styles.detailRow}>
        <FontAwesome5 name="money-bill-wave" size={14} color="#555" />
        <Text style={styles.detailValue}>{item.estimatedCost}</Text>
      </View>

      <View style={styles.detailRow}>
        <FontAwesome5 name="calendar-alt" size={14} color="#555" />
        <Text style={styles.detailValue}>{item.formattedDate}</Text>
      </View>

      {item.contactNumber && (
        <TouchableOpacity 
          style={styles.contactRow}
          onPress={() => handleCallApplicant(item.contactNumber)}
          activeOpacity={0.6}
        >
          <FontAwesome5 name="phone" size={14} color="#003580" />
          <Text style={styles.contactText}>{item.contactNumber}</Text>
          <MaterialIcons 
            name="call" 
            size={18} 
            color="#003580" 
            style={styles.callIcon}
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#003580" />
        </TouchableOpacity>
        <Text style={styles.header}>My Assistance Applications</Text>
        <TouchableOpacity 
          onPress={() => fetchApplications(false)}
          style={styles.refreshButton}
        >
          <FontAwesome5 name="sync" size={18} color="#003580" />
        </TouchableOpacity>
      </View>
      
      {hasError && (
        <View style={styles.errorBanner}>
          <MaterialIcons name="error-outline" size={20} color="white" />
          <Text style={styles.errorText}>Connection problem. Pull to refresh.</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" style={styles.loader} color="#003580" />
      ) : (
        <FlatList
          data={applications}
          renderItem={renderApplication}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchApplications(false)}
              colors={['#003580']}
              tintColor="#003580"
              progressBackgroundColor="#FFFFFF"
            />
          }
          ListHeaderComponent={
            applications.length > 0 && (
              <Text style={styles.resultsCount}>
                {applications.length} {applications.length === 1 ? 'application' : 'applications'} found
              </Text>
            )
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome5 name="file-alt" size={60} color="#E0E0E0" />
              <Text style={styles.emptyText}>No applications found</Text>
              <Text style={styles.emptySubtext}>
                {hasError ? 
                  "Couldn't load applications. Please try again." : 
                  "Submit an application through the Assistance section"}
              </Text>
            </View>
          }
          contentContainerStyle={applications.length === 0 && styles.emptyList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#F5F7FA'
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  backButton: {
    padding: 8,
    marginRight: 10
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#003580',
    flex: 1,
    textAlign: 'center'
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    marginLeft: 10
  },
  errorBanner: {
    backgroundColor: '#F44336',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15
  },
  errorText: {
    color: 'white',
    marginLeft: 10,
    fontWeight: '500'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 18,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3
  },
  urgentCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336'
  },
  mediumPriorityCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10
  },
  urgencyIcon: {
    marginRight: 8
  },
  programName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003580',
    flex: 1
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold'
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'center'
  },
  detailValue: {
    flex: 1,
    color: '#333',
    marginLeft: 12,
    fontSize: 14
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEE'
  },
  contactText: {
    marginLeft: 12,
    color: '#003580',
    fontWeight: '500'
  },
  callIcon: {
    marginLeft: 'auto',
    padding: 5
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    justifyContent: 'center'
  },
  emptyText: {
    fontSize: 18,
    color: '#555',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '500'
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center'
  },
  loader: {
    marginTop: 40
  },
  submitNewButton: {
    backgroundColor: '#003580',
    padding: 16,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  submitNewButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },
  resultsCount: {
    color: '#666',
    marginBottom: 10,
    fontSize: 14,
    fontStyle: 'italic'
  }
});

export default FinancialAssistanceScreen;