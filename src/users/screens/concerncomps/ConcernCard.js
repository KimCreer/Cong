import React from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Card, Divider, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { format } from 'date-fns/esm';

const { width } = Dimensions.get('window');

const ConcernCard = ({ 
  concern, 
  onPress, 
  getCategoryIcon, 
  getCategoryColor, 
  getStatusColor 
}) => {
  return (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Card style={styles.concernCard}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleContainer}>
              <View style={[
                styles.categoryBadge,
                { backgroundColor: `${getCategoryColor(concern.category)}20` }
              ]}>
                <Icon 
                  name={getCategoryIcon(concern.category)} 
                  size={16} 
                  color={getCategoryColor(concern.category)} 
                />
              </View>
              <Text style={styles.concernTitle} numberOfLines={1} ellipsizeMode="tail">
                {concern.title}
              </Text>
            </View>
            <Chip 
              style={[
                styles.statusChip, 
                { 
                  backgroundColor: `${getStatusColor(concern.status)}20`,
                  borderColor: getStatusColor(concern.status)
                }
              ]}
              textStyle={{ 
                color: getStatusColor(concern.status),
                fontSize: 12,
              }}
            >
              {concern.status}
            </Chip>
          </View>
          
          <Text style={styles.concernDescription} numberOfLines={2} ellipsizeMode="tail">
            {concern.description}
          </Text>
          
          {concern.imageUrl && (
            <Image 
              source={{ uri: concern.imageUrl }} 
              style={styles.concernImage} 
              resizeMode="cover"
            />
          )}
          
          <Divider style={styles.divider} />
          
          <View style={styles.metadataContainer}>
            <View style={styles.detailRow}>
              <Icon name="map-marker" size={14} color="#6200ee" />
              <Text style={styles.concernDetail} numberOfLines={1} ellipsizeMode="tail">
                {concern.location}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Icon name="clock-outline" size={14} color="#6200ee" />
              <Text style={styles.concernDetail}>
                {concern.createdAt?.toDate() ? 
                  format(concern.createdAt.toDate(), 'MMM dd, yyyy') : 
                  'Date not available'}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = {
  concernCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  categoryBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  concernTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusChip: {
    height: 35,
    paddingHorizontal: 1,
    borderRadius: 15,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  concernDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 12,
    lineHeight: 20,
  },
  concernImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 12,
  },
  metadataContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    flex: 1,
    minWidth: '50%',
  },
  concernDetail: {
    fontSize: 12,
    color: '#777',
    marginLeft: 5,
    maxWidth: width * 0.4,
  },
  divider: {
    marginVertical: 12,
    backgroundColor: '#eee',
  },
};

export default ConcernCard;