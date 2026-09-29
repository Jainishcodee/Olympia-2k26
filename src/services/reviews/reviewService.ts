import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/config/firebase';
import { Review } from '@/types';

export const submitReview = async (matchId: string, content: string, rating: number): Promise<void> => {
  if (!isFirebaseConfigured || !db || !auth?.currentUser) throw new Error('Firebase not configured or user not authenticated');
  
  const uid = auth.currentUser.uid;
  const reviewRef = doc(db, `matches/${matchId}/reviews`, uid);
  
  await setDoc(reviewRef, {
    content,
    rating,
    updatedAt: serverTimestamp()
  }, { merge: true });
};

export const getUserReview = async (matchId: string): Promise<Review | null> => {
  if (!isFirebaseConfigured || !db || !auth?.currentUser) return null;
  try {
    const uid = auth.currentUser.uid;
    const reviewRef = doc(db, `matches/${matchId}/reviews`, uid);
    const snapshot = await getDoc(reviewRef);
    
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as Review;
    }
    return null;
  } catch (error) {
    console.error('Error getting user review', error);
    return null;
  }
};

export const getMatchReviews = async (matchId: string): Promise<Review[]> => {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const reviewsRef = collection(db, `matches/${matchId}/reviews`);
    const q = query(reviewsRef, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
  } catch (error) {
    console.error('Error getting match reviews', error);
    return [];
  }
};
