import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { auth, db, isFirebaseConfigured } from '@/config/firebase';
import { Vote, VoteAggregate } from '@/types';

/**
 * Ensures user has an authentic Firebase Auth session (anonymous if not signed in)
 */
export const ensureEngagementAuthUid = async (): Promise<string> => {
  if (!auth) throw new Error('Auth not configured');
  if (auth.currentUser) return auth.currentUser.uid;
  try {
    const cred = await signInAnonymously(auth);
    return cred.user.uid;
  } catch (err) {
    // If anonymous sign-in is disabled in project, generate local persistent visitor ID
    let guestId = localStorage.getItem('olympia_guest_uid');
    if (!guestId) {
      guestId = 'guest_' + Math.random().toString(36).substring(2, 12);
      localStorage.setItem('olympia_guest_uid', guestId);
    }
    return guestId;
  }
};

/**
 * Persists one user's prediction to matches/{matchId}/votes/{uid}.
 * Updating an existing vote changes the prediction rather than creating duplicate votes.
 */
export const castVote = async (matchId: string, selectedTeam: 'A' | 'B' | string): Promise<void> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');

  const uid = await ensureEngagementAuthUid();
  const voteRef = doc(db, `matches/${matchId}/votes`, uid);

  await setDoc(
    voteRef,
    {
      matchId,
      userId: uid,
      selectedTeam,
      teamId: selectedTeam,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
};

/**
 * Reads current user's existing prediction from matches/{matchId}/votes/{uid}.
 */
export const getUserVote = async (matchId: string): Promise<string | null> => {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const uid = auth?.currentUser?.uid || localStorage.getItem('olympia_guest_uid');
    if (!uid) return null;

    const voteRef = doc(db, `matches/${matchId}/votes`, uid);
    const snap = await getDoc(voteRef);

    if (snap.exists()) {
      const data = snap.data();
      return (data.selectedTeam || data.teamId || null) as string | null;
    }
    return null;
  } catch (error) {
    console.error('Error getting user vote', error);
    return null;
  }
};

/**
 * Subscribes in real-time to authoritative votes for a match directly from matches/{matchId}/votes documents.
 */
export const subscribeToVotes = (
  matchId: string,
  teamAKey: string = 'A',
  teamBKey: string = 'B',
  callback: (data: { aggregates: VoteAggregate; userVote: string | null }) => void
): Unsubscribe => {
  if (!isFirebaseConfigured || !db || !matchId) {
    callback({
      aggregates: { matchId, teamACounts: 0, teamBCounts: 0, total: 0 },
      userVote: null,
    });
    return () => {};
  }

  const votesCol = collection(db, `matches/${matchId}/votes`);

  return onSnapshot(
    votesCol,
    (snapshot) => {
      let teamACounts = 0;
      let teamBCounts = 0;
      const currentUid = auth?.currentUser?.uid || localStorage.getItem('olympia_guest_uid');
      let userVote: string | null = null;

      snapshot.docs.forEach((d) => {
        const data = d.data();
        const sel = String(data.selectedTeam || data.teamId || '');

        if (d.id === currentUid || data.userId === currentUid) {
          userVote = sel;
        }

        if (sel === 'A' || sel === 'teamA' || sel === teamAKey) {
          teamACounts++;
        } else if (sel === 'B' || sel === 'teamB' || sel === teamBKey) {
          teamBCounts++;
        } else {
          // Default increment to team A or B based on match ID if specific string matches
          teamACounts++;
        }
      });

      const total = teamACounts + teamBCounts;

      callback({
        aggregates: {
          matchId,
          teamACounts,
          teamBCounts,
          total,
        },
        userVote,
      });
    },
    (err) => {
      console.warn('Voting subscription listener fallback', err);
      callback({
        aggregates: { matchId, teamACounts: 0, teamBCounts: 0, total: 0 },
        userVote: null,
      });
    }
  );
};
