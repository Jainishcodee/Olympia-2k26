import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Unsubscribe
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/config/firebase';
import { Match, MatchFilter } from '@/types';

const MATCHES_COLLECTION = 'matches';

export const getMatches = async (filters?: MatchFilter): Promise<Match[]> => {
  if (!isFirebaseConfigured || !db) return [];
  try {
    let q = query(collection(db, MATCHES_COLLECTION));
    // Apply basic filters if needed. For complex, might need multiple queries or client-side filtering
    if (filters?.status) {
      q = query(q, where('status', '==', filters.status));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
  } catch (error) {
    console.error('Error getting matches', error);
    return [];
  }
};

export const getMatch = async (id: string): Promise<Match | null> => {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const docRef = doc(db, MATCHES_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as Match;
    }
    return null;
  } catch (error) {
    console.error('Error getting match', error);
    return null;
  }
};

export const getLiveMatches = async (): Promise<Match[]> => {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const q = query(collection(db, MATCHES_COLLECTION), where('status', '==', 'live'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
  } catch (error) {
    console.error('Error getting live matches', error);
    return [];
  }
};

export const getUpcomingMatches = async (): Promise<Match[]> => {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const q = query(collection(db, MATCHES_COLLECTION), where('status', '==', 'upcoming'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
  } catch (error) {
    console.error('Error getting upcoming matches', error);
    return [];
  }
};

export const getCompletedMatches = async (): Promise<Match[]> => {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const q = query(collection(db, MATCHES_COLLECTION), where('status', '==', 'completed'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
  } catch (error) {
    console.error('Error getting completed matches', error);
    return [];
  }
};

export const getFeaturedMatches = async (): Promise<Match[]> => {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const q = query(collection(db, MATCHES_COLLECTION), where('isFeatured', '==', true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
  } catch (error) {
    console.error('Error getting featured matches', error);
    return [];
  }
};

export const getMatchesBySport = async (sportId: string): Promise<Match[]> => {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const q = query(collection(db, MATCHES_COLLECTION), where('sportId', '==', sportId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
  } catch (error) {
    console.error('Error getting matches by sport', error);
    return [];
  }
};

export const getMatchesByTournament = async (tournamentId: string): Promise<Match[]> => {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const q = query(collection(db, MATCHES_COLLECTION), where('tournamentId', '==', tournamentId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
  } catch (error) {
    console.error('Error getting matches by tournament', error);
    return [];
  }
};

export const createMatch = async (data: Omit<Match, 'id'>): Promise<string> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  const docRef = await addDoc(collection(db, MATCHES_COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
};

export const updateMatch = async (id: string, data: Partial<Match>): Promise<void> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  const docRef = doc(db, MATCHES_COLLECTION, id);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
};

export const deleteMatch = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  await deleteDoc(doc(db, MATCHES_COLLECTION, id));
};

export const updateMatchStatus = async (id: string, status: Match['status']): Promise<void> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  await updateDoc(doc(db, MATCHES_COLLECTION, id), { status, updatedAt: serverTimestamp() });
};

export const startMatch = async (id: string): Promise<void> => {
  await updateMatchStatus(id, 'live');
};

export const pauseMatch = async (id: string): Promise<void> => {
  await updateMatchStatus(id, 'paused');
};

export const resumeMatch = async (id: string): Promise<void> => {
  await updateMatchStatus(id, 'live');
};

export const endMatch = async (id: string): Promise<void> => {
  await updateMatchStatus(id, 'completed');
};

export const subscribeToMatch = (id: string, callback: (match: Match | null) => void): Unsubscribe => {
  if (!isFirebaseConfigured || !db) return () => {};
  return onSnapshot(doc(db, MATCHES_COLLECTION, id), (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() } as Match);
    } else {
      callback(null);
    }
  });
};

export const subscribeToLiveMatches = (callback: (matches: Match[]) => void): Unsubscribe => {
  if (!isFirebaseConfigured || !db) return () => {};
  const q = query(collection(db, MATCHES_COLLECTION), where('status', '==', 'live'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match)));
  });
};
