import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  Unsubscribe
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/config/firebase';
import { Vote, VoteAggregate } from '@/types';

export const castVote = async (matchId: string, selectedTeamId: string): Promise<void> => {
  if (!isFirebaseConfigured || !db || !auth?.currentUser) throw new Error('Firebase not configured or user not authenticated');
  
  const uid = auth.currentUser.uid;
  const voteRef = doc(db, `matches/${matchId}/votes`, uid);
  
  await setDoc(voteRef, {
    teamId: selectedTeamId,
    updatedAt: serverTimestamp()
  }, { merge: true });
};

export const getUserVote = async (matchId: string): Promise<Vote | null> => {
  if (!isFirebaseConfigured || !db || !auth?.currentUser) return null;
  try {
    const uid = auth.currentUser.uid;
    const voteRef = doc(db, `matches/${matchId}/votes`, uid);
    const snapshot = await getDoc(voteRef);
    
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as Vote;
    }
    return null;
  } catch (error) {
    console.error('Error getting user vote', error);
    return null;
  }
};

export const getVoteAggregates = async (matchId: string): Promise<VoteAggregate> => {
  const fallback: VoteAggregate = {
    matchId,
    teamACounts: 0,
    teamBCounts: 0,
    total: 0
  };
  if (!isFirebaseConfigured || !db) return fallback;
  try {
    const aggRef = doc(db, `matches/${matchId}/aggregates`, 'votes');
    const snapshot = await getDoc(aggRef);
    if (snapshot.exists()) {
      return { ...fallback, ...snapshot.data() } as VoteAggregate;
    }
    return fallback;
  } catch (error) {
    console.error('Error getting vote aggregates', error);
    return fallback;
  }
};

export const subscribeToVotes = (matchId: string, callback: (aggregates: VoteAggregate) => void): Unsubscribe => {
  const fallback: VoteAggregate = {
    matchId,
    teamACounts: 0,
    teamBCounts: 0,
    total: 0
  };
  if (!isFirebaseConfigured || !db) return () => {};
  
  const aggRef = doc(db, `matches/${matchId}/aggregates`, 'votes');
  return onSnapshot(aggRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ ...fallback, ...snapshot.data() } as VoteAggregate);
    } else {
      callback(fallback);
    }
  });
};
