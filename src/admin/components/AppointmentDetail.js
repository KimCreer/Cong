import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';

const AppointmentDetail = () => {
  const route = useRoute();
  const { appointment } = route.params;

  const handleOpenImage = (url) => {
    if (url) {
      Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    }
  };

  const renderInfoRow = (label, value, isStatus = false) => (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, isStatus && { color: getStatusColor(value) }]}>
        {value}
      </Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Appointment Details</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusBackgroundColor(appointment.status) }]}>
          <Text style={[styles.statusText, { color: getStatusColor(appointment.status) }]}>
            {appointment.status}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          <Icon name="calendar-alt" style={styles.sectionIcon} /> Appointment
        </Text>
        
        {renderInfoRow('Type:', appointment.type)}
        {renderInfoRow('Purpose:', appointment.purpose)}
        {renderInfoRow('Date:', new Date(appointment.date).toLocaleDateString())}
        {renderInfoRow('Time:', appointment.time)}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          <Icon name="user" style={styles.sectionIcon} /> Client Information
        </Text>
        
        {renderInfoRow('Name:', `${appointment.userFirstName} ${appointment.userLastName}`)}

        {/* Profile Image */}
        {appointment.userProfileImage && (
          <>
            <Text style={styles.label}>Profile Photo:</Text>
            <TouchableOpacity 
              onPress={() => handleOpenImage(appointment.userProfileImage)}
              activeOpacity={0.8}
            >
              <Image 
                source={{ uri: appointment.userProfileImage }} 
                style={styles.image}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay}>
                <Icon name="expand" size={16} color="#fff" />
                <Text style={styles.imageOverlayText}>Tap to view</Text>
              </View>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Additional Images Section */}
      {appointment.imageUrl && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            <Icon name="file-image" style={styles.sectionIcon} /> Documents
          </Text>
          <TouchableOpacity 
            onPress={() => handleOpenImage(appointment.imageUrl)}
            activeOpacity={0.8}
          >
            <Image 
              source={{ uri: appointment.imageUrl }} 
              style={styles.image}
              resizeMode="contain"
            />
            <View style={styles.imageOverlay}>
              <Icon name="expand" size={16} color="#fff" />
              <Text style={styles.imageOverlayText}>Tap to view</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* No Images Message */}
      {!appointment.userProfileImage && !appointment.imageUrl && (
        <View style={styles.card}>
          <Text style={styles.noImagesText}>
            <Icon name="image" size={16} color="#888" /> No images available
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case 'pending': return '#FFA500';
    case 'approved': return '#28A745';
    case 'rejected': return '#DC3545';
    case 'completed': return '#6C757D';
    default: return '#343A40';
  }
};

const getStatusBackgroundColor = (status) => {
  switch (status.toLowerCase()) {
    case 'pending': return '#FFF3CD';
    case 'approved': return '#D4EDDA';
    case 'rejected': return '#F8D7DA';
    case 'completed': return '#E2E3E5';
    default: return '#F8F9FA';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2C3E50',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#E2E3E5',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
    paddingBottom: 8,
  },
  sectionIcon: {
    marginRight: 8,
    color: '#4A6FA5',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#718096',
    flex: 1,
  },
  value: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2D3748',
    flex: 1.5,
    textAlign: 'right',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageOverlayText: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '500',
  },
  noImagesText: {
    textAlign: 'center',
    paddingVertical: 16,
    color: '#718096',
    fontSize: 15,
  },
});

export default AppointmentDetail;