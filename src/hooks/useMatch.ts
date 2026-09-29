import { useState, useEffect } from 'react';
import { doc, onSnapshot, getDoc, collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Match, MatchEvent } from '@/types';
import { docToData } from '@/utils/firestore';

export function useMatch(matchId: string) {
  const [match, setMatch] = useState<Match | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [score, setScore] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const currentDb = db;
    if (!currentDb || !matchId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    let unsubscribeMatch: () => void;
    let unsubscribeEvents: () => void;

    const fetchMatch = async () => {
      try {
        const matchRef = doc(currentDb, 'matches', matchId);
        
        unsubscribeMatch = onSnapshot(matchRef, (docSnap) => {
          if (docSnap.exists()) {
            const matchData = docToData<Match>(docSnap);
            setMatch(matchData);
            setScore(matchData.score || null);
            
            if (matchData.status === 'completed') {
              // Optionally fall back to static fetch if completed to save reads
            }
          } else {
            setError(new Error('Match not found'));
          }
          setIsLoading(false);
        }, (err) => {
          setError(err);
          setIsLoading(false);
        });

        const eventsRef = collection(currentDb, `matches/${matchId}/events`);
        const q = query(eventsRef, orderBy('timestamp', 'desc'));
        unsubscribeEvents = onSnapshot(q, (snapshot) => {
          const eventsData = snapshot.docs.map(d => docToData<MatchEvent>(d));
          setEvents(eventsData);
        });

      } catch (err: any) {
        setError(err);
        setIsLoading(false);
      }
    };

    fetchMatch();

    return () => {
      if (unsubscribeMatch) unsubscribeMatch();
      if (unsubscribeEvents) unsubscribeEvents();
    };
  }, [matchId]);

  return { match, events, score, isLoading, error };
}
