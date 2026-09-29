import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  Unsubscribe
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/config/firebase';
import { ReactionAggregates } from '@/types';

export const addReaction = async (matchId: string, type: string): Promise<void> => {
  if (!isFirebaseConfigured || !db || !auth?.currentUser) throw new Error('Firebase not configured or user not authenticated');
  
  const uid = auth.currentUser.uid;
  const reactionRef = doc(db, `matches/${matchId}/reactions`, uid);
  
  await setDoc(reactionRef, {
    type,
    updatedAt: serverTimestamp()
  }, { merge: true });
};

export const getReactionAggregates = async (matchId: string): Promise<ReactionAggregates> => {
  const fallback: ReactionAggregates = {
    matchId,
    counts: { fire: 0, clap: 0, lightning: 0, heart: 0, wow: 0, trophy: 0, muscle: 0 },
    total: 0
  };
  if (!isFirebaseConfigured || !db) return fallback;
  try {
    const aggRef = doc(db, `matches/${matchId}/aggregates`, 'reactions');
    const snapshot = await getDoc(aggRef);
    if (snapshot.exists()) {
      return { ...fallback, ...snapshot.data() } as ReactionAggregates;
    }
    return fallback;
  } catch (error) {
    console.error('Error getting reaction aggregates', error);
    return fallback;
  }
};

export const subscribeToReactions = (matchId: string, callback: (aggregates: ReactionAggregates) => void): Unsubscribe => {
  const fallback: ReactionAggregates = {
    matchId,
    counts: { fire: 0, clap: 0, lightning: 0, heart: 0, wow: 0, trophy: 0, muscle: 0 },
    total: 0
  };
  if (!isFirebaseConfigured || !db) return () => {};
  
  const aggRef = doc(db, `matches/${matchId}/aggregates`, 'reactions');
  return onSnapshot(aggRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ ...fallback, ...snapshot.data() } as ReactionAggregates);
    } else {
      callback(fallback);
    }
  });
};
