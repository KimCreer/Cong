import { getFirestore, collection, query, orderBy, onSnapshot, doc, getDoc, limit, startAfter, where } from '@react-native-firebase/firestore';

export const fetchAdminProfile = async (adminId) => {
  try {
    if (!adminId) return { name: 'Admin', avatarUrl: null };
    
    const db = getFirestore();
    const adminRef = doc(db, "admins", adminId);
    const adminSnap = await getDoc(adminRef);

    if (!adminSnap.exists) {
      return { name: 'Admin', avatarUrl: null };
    }

    const adminData = adminSnap.data() || {};
    return {
      name: adminData.name || 'Admin',
      avatarUrl: adminData.avatarUrl || null
    };
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    return { name: 'Admin', avatarUrl: null };
  }
};

export const createPostsQuery = (category = 'All', lastVisible = null) => {
  const db = getFirestore();
  const queryConditions = [
    orderBy('createdAt', 'desc'),
    limit(10)
  ];
  
  if (category !== 'All') {
    queryConditions.unshift(where('category', '==', category));
  }
  
  if (lastVisible) {
    queryConditions.push(startAfter(lastVisible));
  }

  return query(
    collection(db, 'posts'),
    ...queryConditions
  );
};

export const subscribeToPosts = (postsQuery, callback) => {
  return onSnapshot(postsQuery, callback);
};