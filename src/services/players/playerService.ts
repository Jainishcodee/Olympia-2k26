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
  serverTimestamp
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/config/firebase';
import { Player, PlayerFilter } from '@/types';

const PLAYERS_COLLECTION = 'players';

export const getPlayers = async (filters?: PlayerFilter): Promise<Player[]> => {
  if (!isFirebaseConfigured || !db) return [];
  try {
    let q = query(collection(db, PLAYERS_COLLECTION));
    if (filters?.teamId) {
      q = query(q, where('teamId', '==', filters.teamId));
    }
    if (filters?.sportId) {
      q = query(q, where('sportId', '==', filters.sportId));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Player));
  } catch (error) {
    console.error('Error getting players', error);
    return [];
  }
};

export const getPlayer = async (id: string): Promise<Player | null> => {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const docRef = doc(db, PLAYERS_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { ...snapshot.data(), id: snapshot.id } as Player;
    }
    return null;
  } catch (error) {
    console.error('Error getting player', error);
    return null;
  }
};

export const getPlayersByTeam = async (teamId: string): Promise<Player[]> => {
  return getPlayers({ teamId });
};

export const getPlayersBySport = async (sportId: string): Promise<Player[]> => {
  return getPlayers({ sportId });
};

export const createPlayer = async (data: Omit<Player, 'id'>): Promise<string> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  const docRef = await addDoc(collection(db, PLAYERS_COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
};

export const updatePlayer = async (id: string, data: Partial<Player>): Promise<void> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  const docRef = doc(db, PLAYERS_COLLECTION, id);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
};

export const deletePlayer = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  await deleteDoc(doc(db, PLAYERS_COLLECTION, id));
};
