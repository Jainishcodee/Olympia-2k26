import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Sport } from '@/types';
import { docToData } from '@/utils/firestore';

export function useSports() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSports = async () => {
      if (!db) {
        setIsLoading(false);
        return;
      }
      try {
        const snapshot = await getDocs(collection(db, 'sports'));
        const sportsData = snapshot.docs.map(doc => docToData<Sport>(doc));
        setSports(sportsData);
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSports();
  }, []);

  return { sports, isLoading, error };
}
