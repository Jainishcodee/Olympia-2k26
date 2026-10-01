import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/config/firebase';
import { ensureEngagementAuthUid } from '@/services/voting/votingService';

export interface MatchReview {
  id: string;
  matchId: string;
  userId: string;
  rating: number;
  text: string;
  content: string;
  displayName: string;
  status: 'approved' | 'pending' | 'hidden';
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Persists user review to canonical path matches/{matchId}/reviews/{uid}
 */
export const submitReview = async (
  matchId: string,
  content: string,
  rating: number,
  displayName?: string
): Promise<void> => {
  if (!isFirebaseConfigured || !db || !matchId) return;

  const uid = await ensureEngagementAuthUid();
  const reviewRef = doc(db, `matches/${matchId}/reviews`, uid);
  const name = displayName || auth?.currentUser?.displayName || 'Spectator';

  await setDoc(
    reviewRef,
    {
      matchId,
      userId: uid,
      displayName: name,
      rating: Math.max(1, Math.min(5, rating)),
      content,
      text: content,
      status: 'approved',
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
};

/**
 * Real-time subscription to authoritative reviews under matches/{matchId}/reviews
 */
export const subscribeToMatchReviews = (
  matchId: string,
  callback: (data: {
    reviews: MatchReview[];
    averageRating: number;
    totalCount: number;
    userReview: MatchReview | null;
  }) => void
): Unsubscribe => {
  if (!isFirebaseConfigured || !db || !matchId) {
    callback({ reviews: [], averageRating: 0, totalCount: 0, userReview: null });
    return () => {};
  }

  const reviewsCol = collection(db, `matches/${matchId}/reviews`);
  return onSnapshot(
    reviewsCol,
    (snapshot) => {
      const currentUid = auth?.currentUser?.uid || localStorage.getItem('olympia_guest_uid');
      const list: MatchReview[] = [];
      let userReview: MatchReview | null = null;
      let ratingSum = 0;

      snapshot.docs.forEach((d) => {
        const raw = d.data();
        const item: MatchReview = {
          id: d.id,
          matchId: raw.matchId || matchId,
          userId: raw.userId || d.id,
          rating: Number(raw.rating || 0),
          text: raw.text || raw.content || '',
          content: raw.content || raw.text || '',
          displayName: raw.displayName || 'Spectator',
          status: raw.status || 'approved',
          createdAt: raw.createdAt,
          updatedAt: raw.updatedAt,
        };

        if (d.id === currentUid || raw.userId === currentUid) {
          userReview = item;
        }

        if (item.status !== 'hidden') {
          list.push(item);
          ratingSum += item.rating;
        }
      });

      // Sort newest first
      list.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || a.updatedAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || b.updatedAt?.toMillis?.() || 0;
        return timeB - timeA;
      });

      const totalCount = list.length;
      const averageRating = totalCount > 0 ? Number((ratingSum / totalCount).toFixed(1)) : 0;

      callback({
        reviews: list,
        averageRating,
        totalCount,
        userReview,
      });
    },
    (err) => {
      console.warn('Reviews subscription fallback', err);
      callback({ reviews: [], averageRating: 0, totalCount: 0, userReview: null });
    }
  );
};

export const updateReviewStatus = async (
  matchId: string,
  reviewId: string,
  status: 'approved' | 'hidden'
): Promise<void> => {
  if (!isFirebaseConfigured || !db) return;
  const reviewRef = doc(db, `matches/${matchId}/reviews`, reviewId);
  await updateDoc(reviewRef, { status, updatedAt: serverTimestamp() });
};

export const deleteMatchReview = async (matchId: string, reviewId: string): Promise<void> => {
  if (!isFirebaseConfigured || !db) return;
  const reviewRef = doc(db, `matches/${matchId}/reviews`, reviewId);
  await deleteDoc(reviewRef);
};
