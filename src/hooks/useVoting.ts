import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc, increment } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';

export function useVoting(matchId: string) {
  const [aggregates, setAggregates] = useState<Record<string, number>>({});
  const [userVote, setUserVote] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!db || !matchId) {
      setIsLoading(false);
      return;
    }
    
    const docRef = doc(db, 'match_voting', matchId);
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

  const castVote = useCallback(async (optionId: string) => {
    if (!db || !matchId || !user || userVote === optionId) return;
    
    try {
      const voteRef = doc(db, 'match_voting', matchId);
      await setDoc(voteRef, {
        [optionId]: increment(1)
      }, { merge: true });
      setUserVote(optionId);
    } catch (error) {
      console.error("Failed to cast vote", error);
    }
  }, [matchId, user, userVote]);

  return { aggregates, userVote, castVote, isLoading };
}
