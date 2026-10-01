import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/config/firebase';
import { ensureEngagementAuthUid } from '@/services/voting/votingService';
import { RatingAggregate } from '@/types';

/**
 * Persists user player rating to matches/{matchId}/players/{playerId}/ratings/{uid}
 */
export const ratePlayer = async (
  matchId: string,
  playerId: string,
  score: number
): Promise<void> => {
  if (!isFirebaseConfigured || !db || !matchId || !playerId) return;

  const uid = await ensureEngagementAuthUid();
  const ratingRef = doc(db, `matches/${matchId}/players/${playerId}/ratings`, uid);
  const clampedScore = Math.max(1, Math.min(5, Math.round(score)));

  await setDoc(
    ratingRef,
    {
      matchId,
      playerId,
      userId: uid,
      score: clampedScore,
      rating: clampedScore,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
};

/**
 * Subscribes in real-time to authoritative ratings at matches/{matchId}/players/{playerId}/ratings
 */
export const subscribeToPlayerRatings = (
  matchId: string,
  playerId: string,
  callback: (data: {
    average: number;
    count: number;
    userRating: number | null;
  }) => void
): Unsubscribe => {
  if (!isFirebaseConfigured || !db || !matchId || !playerId) {
    callback({ average: 0, count: 0, userRating: null });
    return () => {};
  }

  const ratingsCol = collection(db, `matches/${matchId}/players/${playerId}/ratings`);
  return onSnapshot(
    ratingsCol,
    (snapshot) => {
      const currentUid = auth?.currentUser?.uid || localStorage.getItem('olympia_guest_uid');
      let count = 0;
      let sum = 0;
      let userRating: number | null = null;

      snapshot.docs.forEach((d) => {
        const raw = d.data();
        const score = Number(raw.score ?? raw.rating ?? 0);
        if (score >= 1 && score <= 5) {
          count++;
          sum += score;
        }

        if (d.id === currentUid || raw.userId === currentUid) {
          userRating = score;
        }
      });

      const average = count > 0 ? Number((sum / count).toFixed(1)) : 0;
      callback({ average, count, userRating });
    },
    (err) => {
      console.warn('Player ratings subscription fallback', err);
      callback({ average: 0, count: 0, userRating: null });
    }
  );
};

export const subscribeToRatings = (
  matchId: string,
  playerId: string,
  callback: (aggregates: RatingAggregate) => void
): Unsubscribe => {
  return subscribeToPlayerRatings(matchId, playerId, ({ average, count }) => {
    callback({
      averageRating: average,
      totalRatings: count,
      average,
      count,
      matchId,
      playerId,
    });
  });
};
