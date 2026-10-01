import { useState, useEffect, useCallback } from 'react';
import {
  subscribeToPlayerRatings,
  ratePlayer as ratePlayerService,
} from '@/services/ratings/ratingService';

export function useRatings(matchId: string, playerId: string) {
  const [aggregate, setAggregate] = useState<{ average: number; count: number }>({
    average: 0,
    count: 0,
  });
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!matchId || !playerId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeToPlayerRatings(matchId, playerId, (data) => {
      setAggregate({ average: data.average, count: data.count });
      setUserRating(data.userRating);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [matchId, playerId]);

  const submitRating = useCallback(
    async (score: number) => {
      if (!matchId || !playerId) return;
      await ratePlayerService(matchId, playerId, score);
    },
    [matchId, playerId]
  );

  return {
    aggregate,
    userRating,
    submitRating,
    isLoading,
  };
}
