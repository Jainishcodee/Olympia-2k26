import { useState, useEffect, useCallback, useRef } from 'react';
import {
  addMatchReaction,
  subscribeToReactions,
  addEventReaction,
  subscribeToEventReactions,
} from '@/services/reactions/reactionService';

export function useReactions(matchId: string) {
  const [aggregates, setAggregates] = useState<Record<string, number>>({
    fire: 0,
    clap: 0,
    lightning: 0,
    heart: 0,
    wow: 0,
    trophy: 0,
  });
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const lastReactionTime = useRef<number>(0);

  useEffect(() => {
    if (!matchId) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeToReactions(matchId, (data) => {
      setAggregates(data.counts);
      setTotal(data.total);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [matchId]);

  const addReaction = useCallback(
    async (type: string) => {
      if (!matchId) return;

      const now = Date.now();
      if (now - lastReactionTime.current < 400) {
        // Rate limit: 400ms
        return;
      }
      lastReactionTime.current = now;

      // Optimistic local update
      setAggregates((prev) => ({
        ...prev,
        [type]: (prev[type] || 0) + 1,
      }));
      setTotal((prev) => prev + 1);

      try {
        await addMatchReaction(matchId, type);
      } catch (error) {
        console.error('Failed to add reaction', error);
      }
    },
    [matchId]
  );

  return { aggregates, total, addReaction, isLoading };
}

export function useEventReactions(matchId: string, eventId: string) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastReactionTime = useRef<number>(0);

  useEffect(() => {
    if (!matchId || !eventId) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeToEventReactions(matchId, eventId, (c, uReaction) => {
      setCounts(c);
      setUserReaction(uReaction);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [matchId, eventId]);

  const react = useCallback(
    async (type: string) => {
      if (!matchId || !eventId) return;

      const now = Date.now();
      if (now - lastReactionTime.current < 400) return;
      lastReactionTime.current = now;

      // Optimistic local update
      setCounts((prev) => ({
        ...prev,
        [type]: (prev[type] || 0) + 1,
      }));
      setUserReaction(type);

      try {
        await addEventReaction(matchId, eventId, type);
      } catch (error) {
        console.error('Failed to add event reaction', error);
      }
    },
    [matchId, eventId]
  );

  return { counts, userReaction, react, isLoading };
}
