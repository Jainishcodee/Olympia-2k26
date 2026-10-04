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
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/config/firebase';
import { Fixture } from '@/types';

const FIXTURES_COLLECTION = 'fixtures';

/** Payload accepted by `createFixture` — Firestore assigns the id. */
export type FixtureInput = Omit<Fixture, 'id'>;
/** Patch payload accepted by `updateFixture`. */
export type FixturePatch = Partial<Fixture>;
/** One entry of a reorder write: the fixture and the `order` it moves to. */
export interface FixtureOrderUpdate {
  id: string;
  order: number;
}

export const getFixtures = async (): Promise<Fixture[]> => {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const snapshot = await getDocs(collection(db, FIXTURES_COLLECTION));
    return snapshot.docs.map(entry => ({ ...entry.data(), id: entry.id } as Fixture));
  } catch (error) {
    console.error('Error getting fixtures', error);
    return [];
  }
};

export const getFixturesByTournament = async (tournamentId: string): Promise<Fixture[]> => {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const q = query(collection(db, FIXTURES_COLLECTION), where('tournamentId', '==', tournamentId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(entry => ({ ...entry.data(), id: entry.id } as Fixture));
  } catch (error) {
    console.error('Error getting fixtures by tournament', error);
    return [];
  }
};

export const getFixture = async (id: string): Promise<Fixture | null> => {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const docRef = doc(db, FIXTURES_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { ...snapshot.data(), id: snapshot.id } as Fixture;
    }
    return null;
  } catch (error) {
    console.error('Error getting fixture', error);
    return null;
  }
};

export const createFixture = async (data: FixtureInput): Promise<string> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  const docRef = await addDoc(collection(db, FIXTURES_COLLECTION), {
    ...data,
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

export const updateFixture = async (id: string, data: FixturePatch): Promise<void> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  const docRef = doc(db, FIXTURES_COLLECTION, id);
  await updateDoc(docRef, { ...data });
};

export const deleteFixture = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  await deleteDoc(doc(db, FIXTURES_COLLECTION, id));
};

/**
 * Writes a set of new `order` values in a single batch so a move never
 * leaves two fixtures claiming the same position mid-write.
 */
export const reorderFixtures = async (updates: FixtureOrderUpdate[]): Promise<void> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  if (updates.length === 0) return;
  const firestore = db;
  const batch = writeBatch(firestore);
  updates.forEach(update => {
    batch.update(doc(firestore, FIXTURES_COLLECTION, update.id), { order: update.order });
  });
  await batch.commit();
};
