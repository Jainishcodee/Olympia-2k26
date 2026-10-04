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
  Timestamp,
  Unsubscribe
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/config/firebase';
import { Match, MatchFilter } from '@/types';
import { syncSportLeaderboardToFirestore } from '@/services/standings/standingsService';
import { cleanFirestoreData } from '@/utils/firestore';

const MATCHES_COLLECTION = 'matches';

/** Normalise a Firestore Timestamp / Date / epoch-ms value to epoch milliseconds. */
const toMillis = (value: unknown): number | null => {
  if (!value) return null;
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'object') {
    const candidate = value as { toMillis?: () => number; seconds?: number };
    if (typeof candidate.toMillis === 'function') return candidate.toMillis();
    if (typeof candidate.seconds === 'number') return candidate.seconds * 1000;
  }
  return null;
};

/** Recompute + persist the sport standings after a match reaches `completed`. */
const syncLeaderboardForSport = (sportId: string): void => {
  const isIndiv = ['badminton', 'table-tennis', 'chess', 'carrom'].includes(sportId.toLowerCase());
  syncSportLeaderboardToFirestore(sportId, sportId, isIndiv ? 'individual' : 'team').catch((err) => {
    console.warn('[standings] Auto-sync failed:', err);
  });
};

export const getMatches = async (filters?: MatchFilter): Promise<Match[]> => {
  if (!isFirebaseConfigured || !db) return [];
  try {
    let q = query(collection(db, MATCHES_COLLECTION));
    // Apply basic filters if needed. For complex, might need multiple queries or client-side filtering
    if (filters?.status) {
      q = query(q, where('status', '==', filters.status));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Match));
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
      return { ...snapshot.data(), id: snapshot.id } as Match;
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
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Match));
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
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Match));
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
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Match));
  } catch (error) {
    console.error('Error getting completed matches', error);
    return [];
  }
};

export const getFeaturedMatches = async (): Promise<Match[]> => {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const q = query(collection(db, MATCHES_COLLECTION), where('featured', '==', true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Match));
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
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Match));
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
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Match));
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

  if (data.status === 'completed') {
    if (data.sportId) {
      const isIndiv = ['badminton', 'table-tennis', 'chess', 'carrom'].includes(data.sportId.toLowerCase());
      syncSportLeaderboardToFirestore(data.sportId, data.sportId, isIndiv ? 'individual' : 'team').catch((err) => {
        console.warn('[standings] Auto-sync on updateMatch failed:', err);
      });
    } else {
      getMatch(id).then((match) => {
        if (match?.sportId) {
          const isIndiv = ['badminton', 'table-tennis', 'chess', 'carrom'].includes(match.sportId.toLowerCase());
          syncSportLeaderboardToFirestore(match.sportId, match.sportId, isIndiv ? 'individual' : 'team').catch((err) => {
            console.warn('[standings] Auto-sync on updateMatch failed:', err);
          });
        }
      }).catch(() => {});
    }
  }
};

export const deleteMatch = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  await deleteDoc(doc(db, MATCHES_COLLECTION, id));
};

export const updateMatchStatus = async (id: string, status: Match['status']): Promise<void> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  const ref = doc(db, MATCHES_COLLECTION, id);
  const snapshot = await getDoc(ref);
  const data = (snapshot.exists() ? snapshot.data() : {}) as Partial<Match>;

  // Keep the pause markers consistent no matter which surface flips the status
  // (scoring console, live control room, match detail), so clocks freeze and
  // resume from the same instant everywhere.
  const patch: Record<string, unknown> = { status, updatedAt: serverTimestamp() };
  if (status === 'paused' && !data.pausedAt) {
    patch.pausedAt = Timestamp.now();
  }
  if ((status === 'live' || status === 'completed') && data.pausedAt) {
    const pausedAtMs = toMillis(data.pausedAt);
    if (pausedAtMs) {
      const liveState: Record<string, unknown> = { ...(data.liveState ?? {}) };
      const banked = Number(liveState.pausedDurationMs || 0);
      liveState.pausedDurationMs = banked + Math.max(0, Date.now() - pausedAtMs);
      patch.liveState = liveState;
    }
    patch.pausedAt = null;
  }

  await updateDoc(ref, patch);

  if (status === 'completed') {
    getMatch(id).then((match) => {
      if (match?.sportId) {
        const isIndiv = ['badminton', 'table-tennis', 'chess', 'carrom'].includes(match.sportId.toLowerCase());
        syncSportLeaderboardToFirestore(match.sportId, match.sportId, isIndiv ? 'individual' : 'team').catch((err) => {
          console.warn('[standings] Auto-sync on updateMatchStatus failed:', err);
        });
      }
    }).catch(() => {});
  }
};

export const startMatch = async (id: string): Promise<void> => {
  await updateMatchStatus(id, 'live');
};

/**
 * Pause a match and stamp `pausedAt` so every clock (console, public pages,
 * HUD) freezes at the same instant instead of drifting.
 */
export const pauseMatch = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  const ref = doc(db, MATCHES_COLLECTION, id);
  const snapshot = await getDoc(ref);
  const data = (snapshot.exists() ? snapshot.data() : {}) as Partial<Match>;

  await updateDoc(
    ref,
    cleanFirestoreData({
      status: 'paused',
      pausedAt: data.pausedAt ?? Timestamp.now(),
      updatedAt: serverTimestamp(),
    }),
  );
};

/**
 * Resume a paused match: clears `pausedAt`, banks the paused span into
 * `liveState.pausedDurationMs` (so elapsed time never includes the break) and
 * clears the half-time flag so sport panels return to their live controls.
 */
export const resumeMatch = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  const ref = doc(db, MATCHES_COLLECTION, id);
  const snapshot = await getDoc(ref);
  const data = (snapshot.exists() ? snapshot.data() : {}) as Partial<Match>;

  const liveState: Record<string, unknown> = { ...(data.liveState ?? {}) };
  const pausedAtMs = toMillis(data.pausedAt);
  if (pausedAtMs) {
    const banked = Number(liveState.pausedDurationMs || 0);
    liveState.pausedDurationMs = banked + Math.max(0, Date.now() - pausedAtMs);
  }
  if (liveState.isHalfTime) liveState.isHalfTime = false;

  await updateDoc(
    ref,
    cleanFirestoreData({
      status: 'live',
      startedAt: data.startedAt ?? Timestamp.now(),
      pausedAt: null,
      liveState,
      updatedAt: serverTimestamp(),
    }),
  );
};

/**
 * End a match: stamps `endedAt` (once), flips status and syncs standings.
 * A match finished while paused banks the trailing paused span first and clears
 * `pausedAt`, so completed documents never keep a dangling pause marker and
 * elapsed-time maths (`endedAt - startedAt - pausedDurationMs`) stay correct.
 */
export const endMatch = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  const ref = doc(db, MATCHES_COLLECTION, id);
  const snapshot = await getDoc(ref);
  const data = (snapshot.exists() ? snapshot.data() : {}) as Partial<Match>;

  const liveState: Record<string, unknown> = { ...(data.liveState ?? {}) };
  const pausedAtMs = toMillis(data.pausedAt);
  if (pausedAtMs) {
    const banked = Number(liveState.pausedDurationMs || 0);
    liveState.pausedDurationMs = banked + Math.max(0, Date.now() - pausedAtMs);
  }
  if (liveState.isHalfTime) liveState.isHalfTime = false;

  await updateDoc(
    ref,
    cleanFirestoreData({
      status: 'completed',
      endedAt: data.endedAt ?? Timestamp.now(),
      pausedAt: null,
      liveState,
      updatedAt: serverTimestamp(),
    }),
  );

  if (data.sportId) {
    syncLeaderboardForSport(data.sportId);
  } else {
    const match = await getMatch(id);
    if (match?.sportId) syncLeaderboardForSport(match.sportId);
  }
};

export const subscribeToMatch = (id: string, callback: (match: Match | null) => void): Unsubscribe => {
  if (!isFirebaseConfigured || !db) return () => {};
  return onSnapshot(doc(db, MATCHES_COLLECTION, id), (snapshot) => {
    if (snapshot.exists()) {
      callback({ ...snapshot.data(), id: snapshot.id } as Match);
    } else {
      callback(null);
    }
  });
};

export const subscribeToLiveMatches = (callback: (matches: Match[]) => void): Unsubscribe => {
  if (!isFirebaseConfigured || !db) return () => {};
  const q = query(collection(db, MATCHES_COLLECTION), where('status', '==', 'live'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Match)));
  });
};
