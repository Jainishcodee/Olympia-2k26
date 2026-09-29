import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Tournament } from '@/types';
import { docToData } from '@/utils/firestore';

export function useTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTournaments = async () => {
      if (!db) {
        setIsLoading(false);
        return;
      }
      try {
        const q = query(collection(db, 'tournaments'), orderBy('startDate', 'desc'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => docToData<Tournament>(doc));
        setTournaments(data);
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTournaments();
  }, []);

  return { tournaments, isLoading, error };
}
