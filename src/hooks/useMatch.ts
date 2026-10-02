import { useState, useEffect } from 'react';
import { doc, onSnapshot, getDocs, collection, query, orderBy } from 'firebase/firestore';
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
    let unsubscribeMatch: (() => void) | undefined;
    let unsubscribeEvents: (() => void) | undefined;
    let eventsFetchedOnce = false;

    const fetchMatch = async () => {
      try {
        const matchRef = doc(currentDb, 'matches', matchId);

        unsubscribeMatch = onSnapshot(
          matchRef,
          async (docSnap) => {
            if (docSnap.exists()) {
              const matchData = docToData<Match>(docSnap);
              setMatch(matchData);
              setScore(matchData.score || null);

              const eventsRef = collection(currentDb, `matches/${matchId}/events`);
              const q = query(eventsRef, orderBy('sequence', 'desc'));

              if (matchData.status === 'completed') {
                // Once completed, telemetry is immutable: unsubscribe live listener
                if (unsubscribeEvents) {
                  unsubscribeEvents();
                  unsubscribeEvents = undefined;
                }
                if (!eventsFetchedOnce) {
                  eventsFetchedOnce = true;
                  try {
                    const snap = await getDocs(q);
                    setEvents(snap.docs.map((d) => docToData<MatchEvent>(d)));
                  } catch (e) {
                    console.error('Error fetching completed match events', e);
                  }
                }
              } else {
                // Live or scheduled: subscribe in real-time if not already active
                if (!unsubscribeEvents) {
                  unsubscribeEvents = onSnapshot(
                    q,
                    (snapshot) => {
                      const eventsData = snapshot.docs.map((d) => docToData<MatchEvent>(d));
                      setEvents(eventsData);
                    },
                    (err) => {
                      console.error('Events listener error:', err);
                    }
                  );
                }
              }
            } else {
              setError(new Error('Match not found'));
            }
            setIsLoading(false);
          },
          (err) => {
            setError(err);
            setIsLoading(false);
          }
        );
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
