import { useState, useEffect } from 'react';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore, collection, query, where, orderBy, serverTimestamp, getDocs, addDoc } from '@react-native-firebase/firestore';

export const useConcerns = () => {
  const [concerns, setConcerns] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);
  
  const db = getFirestore();
  const firebaseAuth = getAuth();

  const fetchConcerns = async () => {
    setIsFetching(true);
    setError(null);
    const user = firebaseAuth.currentUser;
    
    if (!user) {
      setError("You must be logged in to view concerns");
      setIsFetching(false);
      return;
    }

    try {
      const concernsRef = collection(db, 'concerns');
      const q = query(
        concernsRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const concernsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      setConcerns(concernsList);
    } catch (err) {
      console.error("Error fetching concerns: ", err);
      setError("There was an issue fetching your concerns");
    } finally {
      setIsFetching(false);
    }
  };

  const submitConcern = async (concernData) => {
    try {
      const user = firebaseAuth.currentUser;
      if (!user) throw new Error("User not authenticated.");

      const concernsRef = collection(db, 'concerns');
      await addDoc(concernsRef, {
        ...concernData,
        userId: user.uid,
        userEmail: user.email,
        createdAt: serverTimestamp(),
      });
      
      return true;
    } catch (err) {
      console.error("Error adding concern:", err);
      throw err;
    }
  };

  return {
    concerns,
    isFetching,
    error,
    fetchConcerns,
    submitConcern
  };
};