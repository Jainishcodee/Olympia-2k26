import { useState, useEffect, useCallback } from 'react';
import {
  MatchReview,
  subscribeToMatchReviews,
  submitReview as submitReviewService,
} from '@/services/reviews/reviewService';

export type { MatchReview };

export function useReviews(matchId: string) {
  const [reviews, setReviews] = useState<MatchReview[]>([]);
  const [userReview, setUserReview] = useState<MatchReview | null>(null);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!matchId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeToMatchReviews(matchId, (data) => {
      setReviews(data.reviews);
      setUserReview(data.userReview);
      setAverageRating(data.averageRating);
      setTotalCount(data.totalCount);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [matchId]);

  const submitReview = useCallback(
    async (content: string, rating: number, displayName?: string) => {
      if (!matchId) return;
      await submitReviewService(matchId, content, rating, displayName);
    },
    [matchId]
  );

  return {
    reviews,
    userReview,
    averageRating,
    totalCount,
    submitReview,
    isLoading,
  };
}
