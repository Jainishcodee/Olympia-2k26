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
import { Sport } from '@/types';

const SPORTS_COLLECTION = 'sports';

export const getSports = async (): Promise<Sport[]> => {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const snapshot = await getDocs(collection(db, SPORTS_COLLECTION));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sport));
  } catch (error) {
    console.error('Error getting sports', error);
    return [];
  }
};

export const getSport = async (id: string): Promise<Sport | null> => {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const docRef = doc(db, SPORTS_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as Sport;
    }
    return null;
  } catch (error) {
    console.error('Error getting sport', error);
    return null;
  }
};

export const createSport = async (data: Omit<Sport, 'id'>): Promise<string> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  const docRef = await addDoc(collection(db, SPORTS_COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
};

export const updateSport = async (id: string, data: Partial<Sport>): Promise<void> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  const docRef = doc(db, SPORTS_COLLECTION, id);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
};

export const deleteSport = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  await deleteDoc(doc(db, SPORTS_COLLECTION, id));
};
