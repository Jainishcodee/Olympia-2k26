import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Match } from '@/types';
import { docToData } from '@/utils/firestore';

export function useMatches(filters?: { sport?: string; status?: string; tournament?: string }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMatches = useCallback(async () => {
    if (!db) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      let q = query(collection(db, 'matches'), orderBy('scheduledAt', 'desc'));
      
      if (filters?.sport) {
        q = query(q, where('sportId', '==', filters.sport));
      }
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters?.tournament) {
        q = query(q, where('tournamentId', '==', filters.tournament));
      }

      const snapshot = await getDocs(q);
      const matchesData = snapshot.docs.map(doc => docToData<Match>(doc));
      setMatches(matchesData);
      setError(null);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [filters?.sport, filters?.status, filters?.tournament]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  return { matches, isLoading, error, refetch: fetchMatches };
}
