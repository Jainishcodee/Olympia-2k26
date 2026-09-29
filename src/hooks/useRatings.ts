import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';

export function useRatings(matchId: string, playerId: string) {
  const [aggregate, setAggregate] = useState<{ average: number; count: number }>({ average: 0, count: 0 });
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!db || !matchId || !playerId) {
      setIsLoading(false);
      return;
    }

    const aggRef = doc(db, `ratings/${matchId}_${playerId}`);
    const unsubscribe = onSnapshot(aggRef, (snap) => {
      if (snap.exists()) {
        setAggregate(snap.data() as { average: number; count: number });
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [matchId, playerId]);

  useEffect(() => {
    const fetchUserRating = async () => {
      if (!db || !matchId || !playerId || !user) return;
      const userRatingRef = doc(db, `users/${user.uid}/ratings/${matchId}_${playerId}`);
      const snap = await getDoc(userRatingRef);
      if (snap.exists()) {
        setUserRating(snap.data().rating);
      }
    };
    fetchUserRating();
  }, [matchId, playerId, user]);

  const submitRating = useCallback(async (rating: number) => {
    if (!db || !matchId || !playerId || !user) return;
    try {
      const userRatingRef = doc(db, `users/${user.uid}/ratings/${matchId}_${playerId}`);
      await setDoc(userRatingRef, { rating });
      setUserRating(rating);
      // Firebase cloud function or trigger should handle the aggregation update
    } catch (error) {
      console.error("Failed to submit rating", error);
    }
  }, [matchId, playerId, user]);

  return { aggregate, userRating, submitRating, isLoading };
}
