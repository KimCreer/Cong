// components/NewsCard.js
import React, { memo } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image,
  Dimensions 
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');

const NewsCard = ({ item, onPress }) => {
  const handlePress = () => {
    onPress(item);
  };

  return (
    <TouchableOpacity 
      style={styles.cardContainer}
      onPress={handlePress}
      activeOpacity={0.8}
      accessibilityLabel={`News post: ${item.title}. Tap to read more`}
      accessibilityRole="button"
    >
      {item.imageUrl && (
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: item.imageUrl }}
            style={styles.image}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
          {!item.read && <View style={styles.unreadIndicator} />}
        </View>
      )}
      
      <View style={styles.contentContainer}>
        {/* Post Header with Admin Info */}
        <View style={styles.headerContainer}>
          <View style={styles.adminInfo}>
            {item.adminAvatar && (
              <Image 
                source={{ uri: item.adminAvatar }}
                style={styles.avatar}
                accessibilityLabel={`Admin avatar`}
              />
            )}
            <Text style={styles.adminName} numberOfLines={1}>
              {item.adminName}
            </Text>
          </View>
          
          {item.priority === "High" && (
            <View style={styles.priorityBadge}>
              <FontAwesome5 name="exclamation" size={10} color="#FFF" />
              <Text style={styles.priorityText}>High Priority</Text>
            </View>
          )}
        </View>

        {/* Post Content */}
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.description} numberOfLines={3}>
          {item.content}
        </Text>

        {/* Post Meta */}
        <View style={styles.metaContainer}>
          <View style={[styles.categoryTag, { backgroundColor: getCategoryColor(item.category) }]}>
            <Text style={styles.categoryText}>
              {item.category}
            </Text>
          </View>
          <View style={styles.timeContainer}>
            <FontAwesome5 name="clock" size={12} color="#888" />
            <Text style={styles.timestamp}>
              {item.createdAt ? format(item.createdAt.toDate(), 'MMM d, yyyy') : ''}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Helper function for category colors
const getCategoryColor = (category) => {
  const colors = {
    'Announcement': '#E8EEF7',
    'Event': '#F0F7E8',
    'Update': '#F7E8F0',
    'Alert': '#F7E8E8',
    'News': '#E8F7F7'
  };
  return colors[category] || '#E8EEF7';
};

NewsCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    imageUrl: PropTypes.string,
    category: PropTypes.string,
    createdAt: PropTypes.object,
    priority: PropTypes.string,
    adminName: PropTypes.string,
    adminAvatar: PropTypes.string,
    read: PropTypes.bool,
  }).isRequired,
  onPress: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 16,
    width: width * 0.8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  imageContainer: {
    position: 'relative'
  },
  image: {
    width: '100%',
    height: 160,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 12,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'space-between'
  },
  adminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0'
  },
  adminName: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500'
  },
  priorityBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center'
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
    lineHeight: 22
  },
  description: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 12,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto'
  },
  categoryTag: {
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#003580',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginLeft: 4
  },
  unreadIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF9800',
    borderWidth: 2,
    borderColor: '#FFF'
  },
});

export default memo(NewsCard);