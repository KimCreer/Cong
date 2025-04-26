// ConcernDetail.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Share,
  Platform,
  StatusBar,
  Dimensions,
  Alert
} from 'react-native';
import { Card, Divider, Chip, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function ConcernDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const { concern } = route.params;

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return '#FFC107';
      case 'in progress': return '#2196F3';
      case 'resolved': return '#4CAF50';
      default: return '#757575';
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat.toLowerCase()) {
      case 'road': return 'road-variant';
      case 'garbage': return 'trash-can';
      case 'water': return 'water';
      case 'electricity': return 'lightning-bolt';
      default: return 'alert-circle';
    }
  };

  const getCategoryColor = (cat) => {
    switch (cat.toLowerCase()) {
      case 'road': return '#FF9800';
      case 'garbage': return '#795548';
      case 'water': return '#2196F3';
      case 'electricity': return '#FFC107';
      default: return '#9C27B0';
    }
  };

  const handleShare = async () => {
    try {
      const message = `Concern: ${concern.title}\n\nDescription: ${concern.description}\n\nLocation: ${concern.location}\n\nStatus: ${concern.status}`;
      
      await Share.share({
        message,
        title: 'Share Concern Details',
        ...(concern.imageUrl && { url: concern.imageUrl })
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share concern details');
      console.error('Error sharing:', error.message);
    }
  };

  const handleNavigate = () => {
    if (!concern.location) {
      Alert.alert('Error', 'Location information is not available');
      return;
    }

    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(concern.location)}`,
      android: `geo:0,0?q=${encodeURIComponent(concern.location)}`
    });

    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open maps application');
      }
    }).catch(err => console.error('Error opening maps:', err));
  };

  const statusColor = getStatusColor(concern.status);
  const categoryColor = getCategoryColor(concern.category);
  const categoryIcon = getCategoryIcon(concern.category);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#0275d8" barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={['#0275d8', '#025aa5']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Icon name="arrow-left" size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Report Details</Text>
          </View>
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <Icon name="share-variant" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Main Card */}
        <Card style={styles.mainCard}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <View style={styles.titleContainer}>
                <View style={[
                  styles.categoryBadge,
                  { backgroundColor: `${categoryColor}20` }
                ]}>
                  <Icon 
                    name={categoryIcon} 
                    size={20} 
                    color={categoryColor} 
                  />
                </View>
                <Text style={styles.concernTitle}>{concern.title}</Text>
              </View>
              
              <Chip 
                style={[
                  styles.statusChip, 
                  { 
                    backgroundColor: `${statusColor}20`,
                    borderColor: statusColor
                  }
                ]}
                textStyle={{ 
                  color: statusColor,
                  fontSize: 14,
                }}
              >
                {concern.status}
              </Chip>
            </View>

            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{concern.description}</Text>

            {concern.imageUrl && (
              <>
                <Text style={styles.sectionTitle}>Photo Evidence</Text>
                <Image 
                  source={{ uri: concern.imageUrl }} 
                  style={styles.concernImage} 
                  resizeMode="cover"
                  onError={() => console.log('Image failed to load')}
                  accessibilityLabel="Report photo evidence"
                />
              </>
            )}
          </Card.Content>
        </Card>

        {/* Details Card */}
        <Card style={styles.detailsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Details</Text>
            
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Icon name="map-marker" size={18} color={categoryColor} />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>{concern.location}</Text>
              </View>
              <TouchableOpacity onPress={handleNavigate} style={styles.navigateButton}>
                <Icon name="directions" size={20} color="#0275d8" />
              </TouchableOpacity>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Icon name="calendar" size={18} color={categoryColor} />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Reported On</Text>
                <Text style={styles.detailValue}>
                  {concern.createdAt?.toDate() ? 
                    format(concern.createdAt.toDate(), 'MMMM dd, yyyy hh:mm a') : 
                    'Date not available'}
                </Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Icon name="account" size={18} color={categoryColor} />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Reported By</Text>
                <Text style={styles.detailValue}>{concern.userEmail || 'Current user'}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Action Button - Only Contact Authorities remains */}
        <View style={styles.actionsContainer}>
          <Button 
            mode="contained" 
            style={styles.actionButton}
            labelStyle={styles.actionButtonText}
            onPress={() => Linking.openURL(`mailto:authorities@example.com?subject=Regarding concern: ${concern.title}&body=Reference ID: ${concern.id}`)}
          >
            <Icon name="email" size={18} color="#fff" style={styles.buttonIcon} />
            Contact Authorities
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 10,
    paddingBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '600',
  },
  shareButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  mainCard: {
    borderRadius: 12,
    backgroundColor: '#ffffff',
    marginBottom: 16,
    elevation: 2,
  },
  detailsCard: {
    borderRadius: 12,
    backgroundColor: '#ffffff',
    marginBottom: 24,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  categoryBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  concernTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusChip: {
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  descriptionText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
  concernImage: {
    width: '100%',
    height: width * 0.7,
    borderRadius: 8,
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(2, 117, 216, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: '#888',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  navigateButton: {
    padding: 8,
    marginLeft: 8,
  },
  divider: {
    backgroundColor: '#eee',
    marginHorizontal: -16,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  actionButton: {
    borderRadius: 8,
    paddingVertical: 8,
    marginBottom: 12,
    backgroundColor: '#0275d8',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  buttonIcon: {
    marginRight: 8,
  },
});