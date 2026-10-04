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
import { Venue } from '@/types';

const VENUES_COLLECTION = 'venues';

export const getVenues = async (): Promise<Venue[]> => {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const snapshot = await getDocs(collection(db, VENUES_COLLECTION));
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Venue));
  } catch (error) {
    console.error('Error getting venues', error);
    return [];
  }
};

export const getVenue = async (id: string): Promise<Venue | null> => {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const docRef = doc(db, VENUES_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { ...snapshot.data(), id: snapshot.id } as Venue;
    }
    return null;
  } catch (error) {
    console.error('Error getting venue', error);
    return null;
  }
};

export const createVenue = async (data: Omit<Venue, 'id'>): Promise<string> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  const docRef = await addDoc(collection(db, VENUES_COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
};

export const updateVenue = async (id: string, data: Partial<Venue>): Promise<void> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  const docRef = doc(db, VENUES_COLLECTION, id);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
};

export const deleteVenue = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  await deleteDoc(doc(db, VENUES_COLLECTION, id));
};
