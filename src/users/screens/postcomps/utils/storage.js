import AsyncStorage from '@react-native-async-storage/async-storage';

export const loadCachedPosts = async () => {
  try {
    const cached = await AsyncStorage.getItem('cachedPosts');
    return cached ? JSON.parse(cached) : [];
  } catch (err) {
    console.error('Error loading cached posts:', err);
    return [];
  }
};

export const cachePosts = async (posts) => {
  try {
    await AsyncStorage.setItem('cachedPosts', JSON.stringify(posts));
  } catch (err) {
    console.error('Error caching posts:', err);
  }
};

export const getBookmarkStatus = async (postId) => {
  try {
    const isBookmarked = await AsyncStorage.getItem(`bookmarked_${postId}`);
    return !!isBookmarked;
  } catch (err) {
    console.error('Error getting bookmark status:', err);
    return false;
  }
};

export const setBookmarkStatus = async (postId, bookmarked) => {
  try {
    await AsyncStorage.setItem(
      `bookmarked_${postId}`, 
      bookmarked ? 'true' : ''
    );
  } catch (err) {
    console.error('Error setting bookmark:', err);
  }
};

export const getLastSeenPostId = async () => {
  try {
    return await AsyncStorage.getItem('lastSeenPostId');
  } catch (err) {
    console.error('Error getting last seen post ID:', err);
    return null;
  }
};

export const setLastSeenPostId = async (postId) => {
  try {
    await AsyncStorage.setItem('lastSeenPostId', postId);
  } catch (err) {
    console.error('Error setting last seen post ID:', err);
  }
};