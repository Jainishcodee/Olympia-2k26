import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/config/firebase';
import { Admin, DashboardStats } from '@/types';

const ADMINS_COLLECTION = 'admins';

export const getAdmins = async (): Promise<Admin[]> => {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const snapshot = await getDocs(collection(db, ADMINS_COLLECTION));
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as unknown as Admin));
  } catch (error) {
    console.error('Error getting admins', error);
    return [];
  }
};

export const getAdmin = async (uid: string): Promise<Admin | null> => {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const docRef = doc(db, ADMINS_COLLECTION, uid);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { uid: snapshot.id, ...snapshot.data() } as unknown as Admin;
    }
    return null;
  } catch (error) {
    console.error('Error getting admin', error);
    return null;
  }
};

export const createAdminProfile = async (uid: string, data: Omit<Admin, 'id'>): Promise<void> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  await setDoc(doc(db, ADMINS_COLLECTION, uid), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

export const updateAdminProfile = async (uid: string, data: Partial<Admin>): Promise<void> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  await updateDoc(doc(db, ADMINS_COLLECTION, uid), {
    ...data,
    updatedAt: serverTimestamp()
  });
};

export const disableAdmin = async (uid: string): Promise<void> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  await updateDoc(doc(db, ADMINS_COLLECTION, uid), {
    isActive: false,
    updatedAt: serverTimestamp()
  });
};

export const reactivateAdmin = async (uid: string): Promise<void> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  await updateDoc(doc(db, ADMINS_COLLECTION, uid), {
    isActive: true,
    updatedAt: serverTimestamp()
  });
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
  if (!isFirebaseConfigured || !db) {
    return {
      liveMatches: 0, upcomingMatches: 0, completedMatches: 0,
      upcomingToday: 0, completedToday: 0,
      totalTeams: 0, totalPlayers: 0, totalMatches: 0,
      totalTournaments: 0, activeTournaments: 0,
      totalVotes: 0, totalReviews: 0, totalReactions: 0,
      totalRatings: 0, totalVenues: 0
    };
  }
  try {
    const statsDoc = await getDoc(doc(db, 'system', 'dashboardStats'));
    if (statsDoc.exists()) {
      return statsDoc.data() as DashboardStats;
    }
    return {
      liveMatches: 0, upcomingMatches: 0, completedMatches: 0,
      upcomingToday: 0, completedToday: 0,
      totalTeams: 0, totalPlayers: 0, totalMatches: 0,
      totalTournaments: 0, activeTournaments: 0,
      totalVotes: 0, totalReviews: 0, totalReactions: 0,
      totalRatings: 0, totalVenues: 0
    };
  } catch (error) {
    console.error('Error getting dashboard stats', error);
    return {
      liveMatches: 0, upcomingMatches: 0, completedMatches: 0,
      upcomingToday: 0, completedToday: 0,
      totalTeams: 0, totalPlayers: 0, totalMatches: 0,
      totalTournaments: 0, activeTournaments: 0,
      totalVotes: 0, totalReviews: 0, totalReactions: 0,
      totalRatings: 0, totalVenues: 0
    };
  }
};
