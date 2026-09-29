import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/config/firebase';
import { Announcement } from '@/types';

const ANNOUNCEMENTS_COLLECTION = 'announcements';

export const getAnnouncements = async (): Promise<Announcement[]> => {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const q = query(collection(db, ANNOUNCEMENTS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
  } catch (error) {
    console.error('Error getting announcements', error);
    return [];
  }
};

export const createAnnouncement = async (data: Omit<Announcement, 'id'>): Promise<string> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  const docRef = await addDoc(collection(db, ANNOUNCEMENTS_COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
};

export const updateAnnouncement = async (id: string, data: Partial<Announcement>): Promise<void> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  const docRef = doc(db, ANNOUNCEMENTS_COLLECTION, id);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
};

export const deleteAnnouncement = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  await deleteDoc(doc(db, ANNOUNCEMENTS_COLLECTION, id));
};
