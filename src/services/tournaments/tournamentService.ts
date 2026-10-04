import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/config/firebase';
import { Tournament } from '@/types';

const TOURNAMENTS_COLLECTION = 'tournaments';

export const getTournaments = async (): Promise<Tournament[]> => {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const snapshot = await getDocs(collection(db, TOURNAMENTS_COLLECTION));
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Tournament));
  } catch (error) {
    console.error('Error getting tournaments', error);
    return [];
  }
};

export const getTournament = async (id: string): Promise<Tournament | null> => {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const docRef = doc(db, TOURNAMENTS_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { ...snapshot.data(), id: snapshot.id } as Tournament;
    }
    return null;
  } catch (error) {
    console.error('Error getting tournament', error);
    return null;
  }
};

export const createTournament = async (data: Omit<Tournament, 'id'>): Promise<string> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  const docRef = await addDoc(collection(db, TOURNAMENTS_COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
};

export const updateTournament = async (id: string, data: Partial<Tournament>): Promise<void> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  const docRef = doc(db, TOURNAMENTS_COLLECTION, id);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
};

export const deleteTournament = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  await deleteDoc(doc(db, TOURNAMENTS_COLLECTION, id));
};
