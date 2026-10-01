import { useState, useEffect, useCallback } from 'react';
import { subscribeToVotes, castVote as castVoteService } from '@/services/voting/votingService';
import { VoteAggregate } from '@/types';

export interface UseVotingReturn {
  aggregates: Record<string, number> & {
    teamACounts: number;
    teamBCounts: number;
    total: number;
    pctA: number;
    pctB: number;
  };
  userVote: string | null;
  castVote: (optionId: string) => Promise<void>;
  isLoading: boolean;
}

export function useVoting(matchId: string, teamAKey: string = 'A', teamBKey: string = 'B'): UseVotingReturn {
  const [aggregates, setAggregates] = useState<Record<string, number> & {
    teamACounts: number;
    teamBCounts: number;
    total: number;
    pctA: number;
    pctB: number;
  }>({
    teamACounts: 0,
    teamBCounts: 0,
    total: 0,
    pctA: 50,
    pctB: 50,
    A: 0,
    B: 0,
  });
  const [userVote, setUserVote] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!matchId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeToVotes(matchId, teamAKey, teamBKey, (data) => {
      const { teamACounts, teamBCounts, total } = data.aggregates;
      const pctA = total === 0 ? 50 : Math.round((teamACounts / total) * 100);
      const pctB = total === 0 ? 50 : 100 - pctA;

      setAggregates({
        teamACounts,
        teamBCounts,
        total,
        pctA,
        pctB,
        A: teamACounts,
        B: teamBCounts,
        [teamAKey]: teamACounts,
        [teamBKey]: teamBCounts,
      });

      setUserVote(data.userVote);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [matchId, teamAKey, teamBKey]);

  const castVote = useCallback(
    async (optionId: string) => {
      if (!matchId) return;
      try {
        await castVoteService(matchId, optionId);
        setUserVote(optionId);
      } catch (error) {
        console.error('Failed to cast vote', error);
      }
    },
    [matchId]
  );

  return { aggregates, userVote, castVote, isLoading };
}
