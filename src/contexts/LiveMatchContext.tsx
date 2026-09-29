import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Match } from '@/types';
import { docToData } from '@/utils/firestore';

interface LiveMatchContextType {
  liveMatches: Match[];
  isLoading: boolean;
  error: Error | null;
}

const LiveMatchContext = createContext<LiveMatchContextType | undefined>(undefined);

export const LiveMatchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!db) {
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'matches'),
      where('status', '==', 'live')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const matches = snapshot.docs.map(doc => docToData<Match>(doc));
        setLiveMatches(matches);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error listening to live matches:", err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <LiveMatchContext.Provider value={{ liveMatches, isLoading, error }}>
      {children}
    </LiveMatchContext.Provider>
  );
};

export const useLiveMatches = () => {
  const context = useContext(LiveMatchContext);
  if (context === undefined) {
    throw new Error('useLiveMatches must be used within a LiveMatchProvider');
  }
  return context;
};
