import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Player } from '@/types';
import { docToData } from '@/utils/firestore';

export function usePlayers(filters?: { teamId?: string; sportId?: string }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPlayers = useCallback(async () => {
    if (!db) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      let q = query(collection(db, 'players'));
      
      if (filters?.teamId) {
        q = query(q, where('teamId', '==', filters.teamId));
      }
      if (filters?.sportId) {
        q = query(q, where('sportId', '==', filters.sportId));
      }

      const snapshot = await getDocs(q);
      const playersData = snapshot.docs.map(doc => docToData<Player>(doc));
      setPlayers(playersData);
      setError(null);
    } catch (err: any) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [filters?.teamId, filters?.sportId]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  return { players, isLoading, error, refetch: fetchPlayers };
}
