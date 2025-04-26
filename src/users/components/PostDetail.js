import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Linking,
  Share,
  Alert,
  ActivityIndicator,
  StatusBar,
  Platform
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
// Updated Firebase imports using the modular API
import { getFirestore, collection, doc, getDoc } from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FastImage from 'react-native-fast-image';
import { SafeAreaView } from 'react-native-safe-area-context';

const PostDetail = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [imageLoading, setImageLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [error, setError] = useState(null);
  const { postId } = route.params || {};
  
  // Initialize Firestore
  const db = getFirestore();

  const safeGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  };

  const fetchAdminDetails = async (adminId) => {
    try {
      if (!adminId) return null;
      
      // Check cache first
      const cachedAdmin = await AsyncStorage.getItem(`admin_${adminId}`);
      if (cachedAdmin) {
        return JSON.parse(cachedAdmin);
      }

      // Fetch from Firestore using the modular API
      const adminDocRef = doc(db, 'admins', adminId);
      const adminDoc = await getDoc(adminDocRef);
      
      // Fixed: exists is a property, not a function
      if (!adminDoc.exists) {
        return null;
      }
      
      const adminData = {
        id: adminDoc.id,
        name: adminDoc.data()?.name || 'Admin',
        avatarUrl: adminDoc.data()?.avatarUrl || 'https://example.com/default-avatar.jpg',
        ...adminDoc.data()
      };

      // Cache the admin data
      await AsyncStorage.setItem(`admin_${adminId}`, JSON.stringify(adminData));
      
      return adminData;
    } catch (error) {
      console.error('Error fetching admin:', error);
      return null;
    }
  };

  const fetchPostDetails = async () => {
    try {
      if (!postId) {
        throw new Error("Post ID is missing");
      }

      setLoading(true);
      setError(null);

      // Check cache first
      const cachedPost = await AsyncStorage.getItem(`post_${postId}`);
      if (cachedPost) {
        const parsedPost = JSON.parse(cachedPost);
        setPost(parsedPost);
        
        if (parsedPost.adminId) {
          const adminData = await fetchAdminDetails(parsedPost.adminId);
          setAdmin(adminData);
        }
      }

      // Fetch fresh data from Firestore using the modular API
      const postDocRef = doc(db, 'posts', postId);
      const postDoc = await getDoc(postDocRef);

      // Fixed: exists is a property, not a function
      if (!postDoc.exists) {
        throw new Error("Post not found");
      }

      const postData = {
        id: postDoc.id,
        ...postDoc.data(),
        createdAt: postDoc.data().createdAt?.toDate() || new Date(),
        updatedAt: postDoc.data().updatedAt?.toDate() || null
      };

      setPost(postData);
      await AsyncStorage.setItem(`post_${postId}`, JSON.stringify(postData));

      if (postData.adminId) {
        const adminData = await fetchAdminDetails(postData.adminId);
        setAdmin(adminData);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching post:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      if (!post) return;
      
      const shareContent = {
        title: post.title || 'Important Post',
        message: generateShareMessage(),
        url: post.imageUrl || ''
      };

      if (Platform.OS === 'android') {
        shareContent.message = `${shareContent.message}\n\n${shareContent.url}`;
        delete shareContent.url;
      }

      await Share.share(shareContent);
    } catch (error) {
      Alert.alert("Error", "Failed to share post");
      console.error('Sharing error:', error);
    }
  };

  const generateShareMessage = () => {
    const { 
      title = 'Post', 
      content = '', 
      category = 'General', 
      priority = 'Normal',
      createdAt = new Date()
    } = post;

    const adminName = admin?.name || post.adminName || 'Admin';

    return `
📌 ${title}

${content}

ℹ️ Details:
- Priority: ${priority}
- Category: ${category}
- Posted by: ${adminName}
- Date: ${formatDate(createdAt, true)}

Shared via MyApp
    `.trim();
  };

  const handleOpenImage = () => {
    if (post?.imageUrl) {
      Linking.openURL(post.imageUrl).catch(() => {
        Alert.alert("Error", "Could not open image");
      });
    }
  };

  const formatDate = (date, forShare = false) => {
    try {
      if (!date) return "Date not available";
      const d = date instanceof Date ? date : new Date(date);
      
      if (forShare) {
        return d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
      
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return "Date not available";
    }
  };

  const getPriorityColor = (priority) => {
    switch ((priority || '').toLowerCase()) {
      case 'high': return '#FF3B30';
      case 'medium': return '#FF9500';
      case 'low': return '#34C759';
      default: return '#8E8E93';
    }
  };

  const getOptimizedImageUrl = (url) => {
    if (!url) return null;
    if (url.includes('res.cloudinary.com')) {
      return url.replace('/upload/', '/upload/w_800,h_600,c_fill,f_auto,q_auto:low/');
    }
    return url;
  };

  useEffect(() => {
    fetchPostDetails();
  }, [postId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading post...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <FontAwesome5 name="exclamation-circle" size={50} color="#FF3B30" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.errorButton}
          onPress={safeGoBack}
          activeOpacity={0.7}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <Text style={styles.errorText}>Post not available</Text>
        <TouchableOpacity 
          style={styles.errorButton}
          onPress={safeGoBack}
          activeOpacity={0.7}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const {
    title = 'Post Not Found',
    content = 'The requested post could not be loaded.',
    category = 'General',
    priority = 'Medium',
    createdAt = new Date(),
    updatedAt = null,
    imageUrl,
    adminId
  } = post;

  // Use admin data if available, otherwise fallback to post data or defaults
  const adminName = admin?.name || post.adminName || 'Admin';
  const adminAvatar = admin?.avatarUrl || post.adminAvatar || 'https://example.com/default-avatar.jpg';
  const optimizedImageUrl = getOptimizedImageUrl(imageUrl);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={safeGoBack}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          activeOpacity={0.6}
          style={styles.headerButton}
        >
          <FontAwesome5 name="arrow-left" size={20} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Post Details</Text>
        <TouchableOpacity 
          onPress={handleShare}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          activeOpacity={0.6}
          style={[styles.headerButton, styles.shareButton]}
        >
          <FontAwesome5 name="share-alt" size={20} color="#FFFFFF" />
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Image section */}
        {optimizedImageUrl && (
          <View style={styles.imageContainer}>
            <TouchableOpacity 
              onPress={handleOpenImage} 
              activeOpacity={0.9}
              disabled={!optimizedImageUrl}
            >
              <FastImage
                source={{
                  uri: optimizedImageUrl,
                  priority: FastImage.priority.high,
                }}
                style={styles.postImage}
                resizeMode={FastImage.resizeMode.cover}
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
                onError={() => {
                  setImageLoading(false);
                  console.log('Image loading failed');
                }}
                fallback
              />
              {imageLoading && (
                <View style={styles.imageLoadingOverlay}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Content section */}
        <View style={styles.contentContainer}>
          {/* Title and Priority */}
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
              {title}
            </Text>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(priority) }]}>
              <Text style={styles.priorityText}>{priority}</Text>
            </View>
          </View>

          {/* Category and Date */}
          <View style={styles.metaContainer}>
            <View style={styles.categoryBadge}>
              <FontAwesome5 name="tag" size={12} color="#007AFF" />
              <Text style={styles.categoryText}>{category}</Text>
            </View>
            <View style={styles.dateContainer}>
              <FontAwesome5 name="clock" size={12} color="#8E8E93" style={styles.dateIcon} />
              <Text style={styles.date}>
                {formatDate(createdAt)}
                {updatedAt && ` (Updated: ${formatDate(updatedAt)})`}
              </Text>
            </View>
          </View>

          {/* Main Content */}
          <Text style={styles.content}>{content}</Text>

          {/* Admin Info */}
          <View style={styles.adminContainer}>
            <View style={styles.avatarContainer}>
              <FastImage
                source={{ 
                  uri: adminAvatar,
                  priority: FastImage.priority.normal,
                }}
                style={styles.adminAvatar}
                defaultSource={require('../../../assets/admin-icon.png')}
                onError={() => console.log('Admin avatar loading failed')}
                fallback
              />
            </View>
            <View style={styles.adminInfo}>
              <Text style={styles.adminName} numberOfLines={1}>
                Posted by {adminName}
              </Text>
              <Text style={styles.adminRole}>Administrator</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    color: '#FF3B30',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '500',
  },
  errorButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    backgroundColor: '#FFFFFF',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  shareButton: {
    flexDirection: 'row',
    width: 'auto',
    paddingHorizontal: 12,
    backgroundColor: '#007AFF',
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  imageContainer: {
    backgroundColor: '#1C1C1E',
    width: '100%',
  },
  postImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#F2F2F7',
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  contentContainer: {
    padding: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
    marginRight: 16,
    letterSpacing: 0.35,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 80,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 13,
    color: '#007AFF',
    marginLeft: 6,
    fontWeight: '600',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    marginRight: 6,
  },
  date: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  content: {
    fontSize: 17,
    lineHeight: 26,
    color: '#333333',
    marginBottom: 30,
    letterSpacing: 0.24,
  },
  adminContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  avatarContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  adminAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F2F2F7',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  adminInfo: {
    flex: 1,
  },
  adminName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  adminRole: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  adminId: {
    fontSize: 12,
    color: '#CCCCCC',
    marginTop: 4,
  },
});

export default React.memo(PostDetail);