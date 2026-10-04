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
import { Team, TeamFilter } from '@/types';

const TEAMS_COLLECTION = 'teams';

export const getTeams = async (filters?: TeamFilter): Promise<Team[]> => {
  if (!isFirebaseConfigured || !db) return [];
  try {
    let q = query(collection(db, TEAMS_COLLECTION));
    if (filters?.sportId) {
      q = query(q, where('sportId', '==', filters.sportId));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Team));
  } catch (error) {
    console.error('Error getting teams', error);
    return [];
  }
};

export const getTeam = async (id: string): Promise<Team | null> => {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const docRef = doc(db, TEAMS_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { ...snapshot.data(), id: snapshot.id } as Team;
    }
    return null;
  } catch (error) {
    console.error('Error getting team', error);
    return null;
  }
};

export const getTeamsBySport = async (sportId: string): Promise<Team[]> => {
  return getTeams({ sportId });
};

export const createTeam = async (data: Omit<Team, 'id'>): Promise<string> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  const docRef = await addDoc(collection(db, TEAMS_COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
};

export const updateTeam = async (id: string, data: Partial<Team>): Promise<void> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  const docRef = doc(db, TEAMS_COLLECTION, id);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
};

export const deleteTeam = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  await deleteDoc(doc(db, TEAMS_COLLECTION, id));
};

export const addPlayerToTeam = async (teamId: string, playerId: string): Promise<void> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  const teamRef = doc(db, TEAMS_COLLECTION, teamId);
  const teamDoc = await getDoc(teamRef);
  if (teamDoc.exists()) {
    const data = teamDoc.data() as Team;
    const playerIds = data.playerIds || [];
    if (!playerIds.includes(playerId)) {
      await updateDoc(teamRef, {
        playerIds: [...playerIds, playerId],
        updatedAt: serverTimestamp()
      });
    }
  }
};

export const removePlayerFromTeam = async (teamId: string, playerId: string): Promise<void> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  const teamRef = doc(db, TEAMS_COLLECTION, teamId);
  const teamDoc = await getDoc(teamRef);
  if (teamDoc.exists()) {
    const data = teamDoc.data() as Team;
    const playerIds = data.playerIds || [];
    await updateDoc(teamRef, {
      playerIds: playerIds.filter(id => id !== playerId),
      updatedAt: serverTimestamp()
    });
  }
};

export const setCaptain = async (teamId: string, playerId: string): Promise<void> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  const teamRef = doc(db, TEAMS_COLLECTION, teamId);
  await updateDoc(teamRef, {
    captainId: playerId,
    updatedAt: serverTimestamp()
  });
};

export const setViceCaptain = async (teamId: string, playerId: string): Promise<void> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  const teamRef = doc(db, TEAMS_COLLECTION, teamId);
  await updateDoc(teamRef, {
    viceCaptainId: playerId,
    updatedAt: serverTimestamp()
  });
};
