import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
  limit
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/config/firebase';
import { MatchEvent, Score } from '@/types';

export const updateScore = async (matchId: string, score: Score): Promise<void> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  const matchRef = doc(db, 'matches', matchId);
  await updateDoc(matchRef, { score, updatedAt: serverTimestamp() });
};

export const addMatchEvent = async (matchId: string, event: Omit<MatchEvent, 'id' | 'createdAt'>): Promise<string> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  const eventsRef = collection(db, `matches/${matchId}/events`);
  const docRef = await addDoc(eventsRef, { ...event, createdAt: serverTimestamp() });
  return docRef.id;
};

export const undoLastEvent = async (matchId: string): Promise<void> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  const eventsRef = collection(db, `matches/${matchId}/events`);
  const q = query(eventsRef, orderBy('createdAt', 'desc'), limit(1));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    const lastEventDoc = snapshot.docs[0];
    await deleteDoc(lastEventDoc.ref);
  }
};

export const getMatchEvents = async (matchId: string): Promise<MatchEvent[]> => {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const eventsRef = collection(db, `matches/${matchId}/events`);
    const q = query(eventsRef, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MatchEvent));
  } catch (error) {
    console.error('Error getting match events', error);
    return [];
  }
};

export const subscribeToMatchEvents = (matchId: string, callback: (events: MatchEvent[]) => void): Unsubscribe => {
  if (!isFirebaseConfigured || !db) return () => {};
  const eventsRef = collection(db, `matches/${matchId}/events`);
  const q = query(eventsRef, orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MatchEvent)));
  });
};

export const subscribeToScore = (matchId: string, callback: (score: Score | null) => void): Unsubscribe => {
  if (!isFirebaseConfigured || !db) return () => {};
  return onSnapshot(doc(db, 'matches', matchId), (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      callback((data.score as Score) || null);
    } else {
      callback(null);
    }
  });
};
