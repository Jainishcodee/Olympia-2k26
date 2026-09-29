import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  Unsubscribe
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/config/firebase';
import { Rating, RatingAggregate } from '@/types';

export const ratePlayer = async (matchId: string, playerId: string, score: number): Promise<void> => {
  if (!isFirebaseConfigured || !db || !auth?.currentUser) throw new Error('Firebase not configured or user not authenticated');
  
  const uid = auth.currentUser.uid;
  const ratingRef = doc(db, `matches/${matchId}/players/${playerId}/ratings`, uid);
  
  await setDoc(ratingRef, {
    score,
    updatedAt: serverTimestamp()
  }, { merge: true });
};

export const getUserRating = async (matchId: string, playerId: string): Promise<Rating | null> => {
  if (!isFirebaseConfigured || !db || !auth?.currentUser) return null;
  try {
    const uid = auth.currentUser.uid;
    const ratingRef = doc(db, `matches/${matchId}/players/${playerId}/ratings`, uid);
    const snapshot = await getDoc(ratingRef);
    
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as Rating;
    }
    return null;
  } catch (error) {
    console.error('Error getting user rating', error);
    return null;
  }
};

export const getPlayerRatings = async (matchId: string, playerId: string): Promise<RatingAggregate> => {
  const fallback: RatingAggregate = { averageRating: 0, totalRatings: 0, average: 0, count: 0, matchId, playerId };
  if (!isFirebaseConfigured || !db) return fallback;
  try {
    const aggRef = doc(db, `matches/${matchId}/players/${playerId}/aggregates`, 'ratings');
    const snapshot = await getDoc(aggRef);
    if (snapshot.exists()) {
      return { ...fallback, ...snapshot.data() } as RatingAggregate;
    }
    return fallback;
  } catch (error) {
    console.error('Error getting player ratings', error);
    return fallback;
  }
};

export const subscribeToRatings = (matchId: string, playerId: string, callback: (aggregates: RatingAggregate) => void): Unsubscribe => {
  const fallback: RatingAggregate = { averageRating: 0, totalRatings: 0, average: 0, count: 0, matchId, playerId };
  if (!isFirebaseConfigured || !db) return () => {};
  
  const aggRef = doc(db, `matches/${matchId}/players/${playerId}/aggregates`, 'ratings');
  return onSnapshot(aggRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ ...fallback, ...snapshot.data() } as RatingAggregate);
    } else {
      callback(fallback);
    }
  });
};
