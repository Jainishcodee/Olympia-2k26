import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Team } from '@/types';
import { docToData } from '@/utils/firestore';

export function useTeams(sportId?: string) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTeams = useCallback(async () => {
    if (!db) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      let q = query(collection(db, 'teams'));
      if (sportId) {
        q = query(q, where('sportId', '==', sportId));
      }

      const snapshot = await getDocs(q);
      const teamsData = snapshot.docs.map(doc => docToData<Team>(doc));
      setTeams(teamsData);
      setError(null);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [sportId]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  return { teams, isLoading, error, refetch: fetchTeams };
}
