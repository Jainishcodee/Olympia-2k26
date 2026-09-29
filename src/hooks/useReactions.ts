import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc, increment } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';

export function useReactions(matchId: string) {
  const [aggregates, setAggregates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const lastReactionTime = useRef<number>(0);

  useEffect(() => {
    if (!db || !matchId) {
      setIsLoading(false);
      return;
    }

    const docRef = doc(db, 'match_reactions', matchId);
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setAggregates(snap.data() as Record<string, number>);
      } else {
        setAggregates({});
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [matchId]);

  const addReaction = useCallback(async (type: string) => {
    if (!db || !matchId || !user) return;
    
    const now = Date.now();
    if (now - lastReactionTime.current < 1000) {
      // Rate limit: max 1 reaction per second
      return;
    }
    lastReactionTime.current = now;

    try {
      const docRef = doc(db, 'match_reactions', matchId);
      await setDoc(docRef, {
        [type]: increment(1)
      }, { merge: true });
    } catch (error) {
      console.error("Failed to add reaction", error);
    }
  }, [matchId, user]);

  return { aggregates, addReaction, isLoading };
}
