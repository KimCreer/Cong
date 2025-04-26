import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet 
} from 'react-native';
import { Surface, Avatar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatDistanceToNow } from 'date-fns';

import PostImage from './PostImage';
import PriorityBadge from './PriorityBadge';
import { CARD_MARGIN, AVATAR_SIZE } from './constants'; // Add this import
import styles from './styles'; // Import styles from central styles file

const PostCard = React.memo(({ 
  post, 
  onPress,
  onBookmark 
}) => {
  const [bookmarked, setBookmarked] = useState(false);
  
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      const isBookmarked = await AsyncStorage.getItem(`bookmarked_${post.id}`);
      setBookmarked(!!isBookmarked);
    };
    checkBookmarkStatus();
  }, [post.id]);

  const toggleBookmark = async () => {
    const newBookmarked = !bookmarked;
    setBookmarked(newBookmarked);
    await AsyncStorage.setItem(
      `bookmarked_${post.id}`, 
      newBookmarked ? 'true' : ''
    );
    onBookmark?.(post.id, newBookmarked);
  };

  return (
    <Surface style={styles.postCard}>
      <TouchableOpacity 
        onPress={() => onPress(post.id)}
        activeOpacity={0.95}
      >
        <View style={styles.postHeader}>
          <LinearGradient
            colors={['#4a6da7', '#6c8fc7']}
            style={styles.avatarContainer}
          >
            <Avatar.Image 
              size={AVATAR_SIZE} 
              source={post.adminAvatar ? { uri: post.adminAvatar } : require('../../../../assets/admin-icon.png')} 
              style={styles.avatarImage}
            />
          </LinearGradient>
          <View style={styles.postHeaderInfo}>
            <Text style={styles.postAuthor}>{post.adminName}</Text>
            <View style={styles.postMetaRow}>
              <Text style={styles.postTime}>
                {formatDistanceToNow(post.createdAt?.toDate?.() || post.createdAt, { addSuffix: true })}
              </Text>
              <Icon name="earth" size={14} color="#868e96" />
            </View>
          </View>
          {post.priority && <PriorityBadge priority={post.priority} />}
        </View>
        
        <View style={styles.postContent}>
          <Text style={styles.postTitle}>{post.title}</Text>
          <Text style={styles.postText} numberOfLines={3}>
            {post.content}
          </Text>
        </View>
      </TouchableOpacity>
      
      {post.imageUrl && <PostImage uri={post.imageUrl} />}
      
      <View style={styles.postFooter}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{post.category || 'General'}</Text>
        </View>
        <View style={styles.footerActions}>
          <TouchableOpacity onPress={toggleBookmark} style={styles.bookmarkButton}>
            <Icon 
              name={bookmarked ? "bookmark" : "bookmark-outline"} 
              size={20} 
              color={bookmarked ? "#4a6da7" : "#868e96"} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.readMoreContainer}
            onPress={() => onPress(post.id)}
          >
            <Text style={styles.readMoreText}>Read more</Text>
            <Icon name="chevron-right" size={16} color="#4a6da7" />
          </TouchableOpacity>
        </View>
      </View>
    </Surface>
  );
});

// Remove the local styles definition since we're importing from styles.js
export default PostCard;