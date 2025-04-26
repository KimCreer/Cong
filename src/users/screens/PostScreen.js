import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  View, 
  ScrollView, 
  SafeAreaView, 
  AppState, 
  StatusBar, 
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  RefreshControl  
} from 'react-native';
import { Surface } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { formatDistanceToNow } from 'date-fns';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ErrorBoundary from '../components/ErrorBoundary';

// Components
import PostCard from './postcomps/PostCard';
import CategoryFilter from './postcomps/CategoryFilter';
import EmptyState from './postcomps/EmptyState';
import ErrorState from './postcomps/ErrorState';
import LoadingFooter from './postcomps/LoadingFooter';

// Utils
import { 
  requestNotificationPermissions,
  setupNotificationChannels,
  fetchFCMToken,
  handleNotificationTap
} from './postcomps/utils/notifications';
import {
  loadCachedPosts,
  cachePosts,
  getLastSeenPostId,
  setLastSeenPostId
} from './postcomps/utils/storage';
import {
  fetchAdminProfile,
  createPostsQuery,
  subscribeToPosts
} from './postcomps/utils/api';

// Constants & Styles
import { 
  CATEGORIES,
  isCloseToBottom
} from './postcomps/constants';
import styles from './postcomps/styles';

const PostScreen = ({ navigation }) => {
  // State management
  const [posts, setPosts] = useState([]);
  const [cachedPosts, setCachedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notificationPermission, setNotificationPermission] = useState(null);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Refs
  const scrollViewRef = useRef(null);
  const unsubscribeRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const lastPostIdRef = useRef(null);
  const tokenRefreshUnsubscribe = useRef(null);
  const notificationListener = useRef();
  const responseListener = useRef();

  // Memoized filtered posts
  const filteredPosts = useMemo(() => {
    if (!searchQuery) return posts;
    
    const query = searchQuery.toLowerCase();
    return posts.filter(post => 
      post.title.toLowerCase().includes(query) || 
      post.content.toLowerCase().includes(query)
    );
  }, [posts, searchQuery]);

  // Load cached posts
  const loadInitialData = useCallback(async () => {
    try {
      const cached = await loadCachedPosts();
      setCachedPosts(cached);
      await fetchPosts();
    } catch (err) {
      console.error('Initial load error:', err);
      setError(err);
      setLoading(false);
    }
  }, []);

  // Fetch posts with pagination and filtering
  const fetchPosts = useCallback(async (loadMore = false) => {
    try {
      if (!loadMore) setLoading(true);
      
      const postsQuery = createPostsQuery(activeCategory, loadMore ? lastVisible : null);
      
      const unsubscribe = subscribeToPosts(postsQuery, async (snapshot) => {
        if (snapshot.empty && loadMore) {
          setHasMore(false);
          return;
        }
        
        const postsData = await Promise.all(snapshot.docs.map(async (doc) => {
          const postData = doc.data();
          const adminData = await fetchAdminProfile(postData.adminId);

          return {
            id: doc.id,
            ...postData,
            createdAt: postData.createdAt,
            adminName: adminData.name,
            adminAvatar: adminData.avatarUrl
          };
        }));
        
        // Handle new post notifications
        if (postsData.length > 0 && !loadMore) {
          const latestPostId = postsData[0].id;
          const storedLastPostId = await getLastSeenPostId();
          
          if (!lastPostIdRef.current) {
            lastPostIdRef.current = storedLastPostId || null;
          }
          
          if (lastPostIdRef.current && latestPostId !== lastPostIdRef.current) {
            const wasViewed = await AsyncStorage.getItem(`viewed_${latestPostId}`);
            
            if (!wasViewed) {
              await sendLocalNotification(
                "New Post", 
                postsData[0].content.length > 100 
                  ? `${postsData[0].content.substring(0, 100)}...` 
                  : postsData[0].content,
                { 
                  postId: postsData[0].id,
                  type: postsData[0].priority === 'High' ? 
                    'IMPORTANT_ALERT' : 
                    'NEW_POST',
                  important: postsData[0].priority === 'High'
                }
              );
            }
          }
          
          lastPostIdRef.current = latestPostId;
          await setLastSeenPostId(latestPostId);
        }
        
        setPosts(prev => loadMore ? [...prev, ...postsData] : postsData);
        if (!loadMore) await cachePosts(postsData);
        
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setLoading(false);
        setError(null);
      }, async (error) => {
        console.error("Firestore snapshot error:", error);
        setLoading(false);
        setError(error);
        if (cachedPosts.length > 0) setPosts(cachedPosts);
      });
  
      if (!loadMore) unsubscribeRef.current = unsubscribe;
      
      return unsubscribe;
    } catch (err) {
      console.error("Fetch error:", err);
      setLoading(false);
      setError(err);
      if (cachedPosts.length > 0) setPosts(cachedPosts);
      return () => {};
    }
  }, [lastVisible, cachedPosts, activeCategory]);

  // Handlers
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setHasMore(true);
    await fetchPosts();
    setRefreshing(false);
  }, [fetchPosts]);

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchPosts(true);
  }, [hasMore, loading, fetchPosts]);

  const handleCategorySelect = useCallback((category) => {
    setActiveCategory(category);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const handlePostPress = useCallback((postId) => {
    navigation.navigate('PostDetail', { postId });
  }, [navigation]);

  const handleBookmark = useCallback(async (postId, bookmarked) => {
    // You might want to sync this with a backend service
    console.log(`Post ${postId} ${bookmarked ? 'bookmarked' : 'unbookmarked'}`);
  }, []);

  // Effects
  useEffect(() => {
    let unsubscribe;
    const loadData = async () => {
      await loadInitialData();
      
      // Setup notifications
      const permission = await requestNotificationPermissions();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        const token = await fetchFCMToken();
        setExpoPushToken(token);
      }
    };
    
    loadData();
    
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
      if (tokenRefreshUnsubscribe.current) tokenRefreshUnsubscribe.current();
    };
  }, []);

  useEffect(() => {
    const setupNotificationListeners = () => {
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received:', notification);
      });

      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        handleNotificationTap(response, navigation);
      });
    };

    setupNotificationListeners();

    const appStateSubscription = AppState.addEventListener('change', nextAppState => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        handleRefresh();
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
      appStateSubscription.remove();
    };
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [activeCategory]);

  return (
    <ErrorBoundary fallback={<Text style={styles.errorText}>Something went wrong with the posts feed.</Text>}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Surface style={styles.header} elevation={2}>
            <Text style={styles.headerTitle}>Community Feed</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                onPress={requestNotificationPermissions} 
                style={styles.iconButton}
              >
                <Icon 
                  name={notificationPermission === 'granted' ? "bell" : "bell-outline"} 
                  size={24} 
                  color={notificationPermission === 'granted' ? '#4a6da7' : '#212121'} 
                />
                {notificationPermission === 'denied' && (
                  <View style={styles.notificationBadge}>
                    <Icon name="close" size={10} color="white" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </Surface>
          
          {error && <ErrorState error={error} onRetry={handleRefresh} hasCachedData={cachedPosts.length > 0} />}
          
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search posts..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#868e96"
            />
            <Icon name="magnify" size={20} color="#868e96" style={styles.searchIcon} />
          </View>
          
          <CategoryFilter 
            categories={CATEGORIES} 
            activeCategory={activeCategory} 
            onSelect={handleCategorySelect} 
          />
          
          <ScrollView
            ref={scrollViewRef}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#4a6da7']}
                tintColor="#4a6da7"
              />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onScroll={({ nativeEvent }) => {
              if (isCloseToBottom(nativeEvent)) {
                handleLoadMore();
              }
            }}
            scrollEventThrottle={400}
          >
            {loading && posts.length === 0 ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#4a6da7" />
              </View>
            ) : filteredPosts.length === 0 ? (
              <EmptyState activeCategory={activeCategory} onRefresh={handleRefresh} />
            ) : (
              filteredPosts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  onPress={handlePostPress}
                  onBookmark={handleBookmark}
                />
              ))
            )}
            <LoadingFooter hasMore={hasMore} />
          </ScrollView>
        </View>
      </SafeAreaView>
    </ErrorBoundary>
  );
};

export default PostScreen;