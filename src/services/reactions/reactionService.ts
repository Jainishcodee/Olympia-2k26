import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/config/firebase';
import { ensureEngagementAuthUid } from '@/services/voting/votingService';
import { ReactionAggregates } from '@/types';

/**
 * Persists an event-specific reaction to matches/{matchId}/events/{eventId}/reactions/{uid}
 */
export const addEventReaction = async (
  matchId: string,
  eventId: string,
  type: string
): Promise<void> => {
  if (!isFirebaseConfigured || !db || !matchId || !eventId) return;

  const uid = await ensureEngagementAuthUid();
  const reactionRef = doc(db, `matches/${matchId}/events/${eventId}/reactions`, uid);

  await setDoc(
    reactionRef,
    {
      matchId,
      eventId,
      userId: uid,
      type,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
};

/**
 * Subscribes to event-specific reactions directly from matches/{matchId}/events/{eventId}/reactions
 */
export const subscribeToEventReactions = (
  matchId: string,
  eventId: string,
  callback: (counts: Record<string, number>, userReaction: string | null) => void
): Unsubscribe => {
  if (!isFirebaseConfigured || !db || !matchId || !eventId) {
    callback({}, null);
    return () => {};
  }

  const reactionsCol = collection(db, `matches/${matchId}/events/${eventId}/reactions`);
  return onSnapshot(
    reactionsCol,
    (snapshot) => {
      const counts: Record<string, number> = {};
      let userReaction: string | null = null;
      const guestUid = localStorage.getItem('olympia_guest_uid');

      snapshot.docs.forEach((d) => {
        const data = d.data();
        const type = String(data.type || '');
        if (type) {
          counts[type] = (counts[type] || 0) + 1;
        }
        if (d.id === guestUid || data.userId === guestUid) {
          userReaction = type;
        }
      });

      callback(counts, userReaction);
    },
    (err) => {
      console.warn('Event reaction subscription fallback', err);
      callback({}, null);
    }
  );
};

/**
 * Persists match-level reaction to matches/{matchId}/reactions/{uid}
 */
export const addReaction = async (matchId: string, type: string): Promise<void> => {
  if (!isFirebaseConfigured || !db || !matchId) return;

  const uid = await ensureEngagementAuthUid();
  const reactionRef = doc(db, `matches/${matchId}/reactions`, uid);

  await setDoc(
    reactionRef,
    {
      matchId,
      userId: uid,
      type,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const addMatchReaction = addReaction;

/**
 * Subscribes to match-level reactions directly from matches/{matchId}/reactions
 */
export const subscribeToReactions = (
  matchId: string,
  callback: (aggregates: ReactionAggregates) => void
): Unsubscribe => {
  const fallback: ReactionAggregates = {
    matchId,
    counts: { fire: 0, clap: 0, lightning: 0, heart: 0, wow: 0, trophy: 0, muscle: 0 },
    total: 0,
  };

  if (!isFirebaseConfigured || !db || !matchId) {
    callback(fallback);
    return () => {};
  }

  const reactionsCol = collection(db, `matches/${matchId}/reactions`);
  return onSnapshot(
    reactionsCol,
    (snapshot) => {
      const counts: Record<string, number> = {
        fire: 0,
        clap: 0,
        lightning: 0,
        heart: 0,
        wow: 0,
        trophy: 0,
        muscle: 0,
      };
      let total = 0;

      snapshot.docs.forEach((d) => {
        const data = d.data();
        const type = String(data.type || '');
        if (type) {
          counts[type] = (counts[type] || 0) + 1;
          total++;
        }
      });

      callback({
        matchId,
        counts,
        total,
      });
    },
    (err) => {
      console.warn('Reactions subscription fallback', err);
      callback(fallback);
    }
  );
};

export const getReactionAggregates = async (matchId: string): Promise<ReactionAggregates> => {
  return {
    matchId,
    counts: { fire: 0, clap: 0, lightning: 0, heart: 0, wow: 0, trophy: 0, muscle: 0 },
    total: 0,
  };
};
