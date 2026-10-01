import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
  limit,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/config/firebase';
import { EventType, Match, MatchEvent, MatchStatus, Score, SportPositioning } from '@/types';

/* ============================================================================
 *  Sport-Specific Positioning Formatter
 * ==========================================================================*/

export const formatSportPositioning = (
  sportId: string,
  pos?: SportPositioning,
  clock?: string
): string => {
  if (!pos) return clock || 'LIVE';
  const s = (sportId || '').toLowerCase();

  if (s.includes('cricket')) {
    const inn = pos.innings ? `Inn ${pos.innings} · ` : '';
    const ov = pos.over !== undefined && pos.ball !== undefined ? `Over ${pos.over}.${pos.ball}` : '';
    return `${inn}${ov}` || 'Cricket';
  }

  if (s.includes('football') || s.includes('soccer')) {
    const period = pos.period === 1 ? '1H' : pos.period === 2 ? '2H' : pos.period ? `P${pos.period}` : '';
    const time = clock || (pos.matchSecond ? `${Math.floor(pos.matchSecond / 60)}'` : '');
    return [period, time].filter(Boolean).join(' ') || 'Match play';
  }

  if (s.includes('volleyball') || s.includes('tennis')) {
    const set = pos.set !== undefined ? `Set ${pos.set}` : '';
    const rally = pos.rally !== undefined ? `Rally ${pos.rally}` : '';
    return [set, rally].filter(Boolean).join(' · ') || 'Set play';
  }

  if (s.includes('badminton') || s.includes('table-tennis') || s.includes('table_tennis')) {
    const game = pos.game !== undefined ? `Game ${pos.game}` : '';
    const rally = pos.rally !== undefined ? `Rally ${pos.rally}` : '';
    return [game, rally].filter(Boolean).join(' · ') || 'Game play';
  }

  if (s.includes('strike') || s.includes('cs') || s.includes('lan')) {
    const map = pos.map !== undefined ? `Map ${pos.map}` : '';
    const round = pos.round !== undefined ? `Round ${pos.round}` : '';
    return [map, round].filter(Boolean).join(' · ') || 'Round play';
  }

  if (pos.lap !== undefined) {
    return `Lap ${pos.lap}`;
  }

  return clock || 'LIVE';
};

/* ============================================================================
 *  Event-Sourced Event Input Types
 * ==========================================================================*/

export interface RecordEventInput {
  matchId: string;
  sportId: string;
  type: EventType;
  team?: 'teamA' | 'teamB' | '';
  teamName?: string;
  playerId?: string;
  playerName?: string;
  description: string;
  matchTime?: string;
  positioning?: SportPositioning;
  data?: Record<string, unknown>;
  newScore: Record<string, unknown>;
  newLiveState?: Record<string, unknown>;
  newStatus?: MatchStatus;
  createdBy?: string;
}

export interface CorrectEventInput {
  matchId: string;
  sportId: string;
  originalEventId: string;
  correctionNote: string;
  newType: EventType;
  newDescription: string;
  team?: 'teamA' | 'teamB' | '';
  teamName?: string;
  correctedScore: Record<string, unknown>;
  correctedLiveState?: Record<string, unknown>;
  positioning?: SportPositioning;
  correctedBy?: string;
}

/* ============================================================================
 *  Core Event Sourcing Operations
 * ==========================================================================*/

/**
 * Records a single scoring / timeline event and atomicity synchronizes the match state.
 * Emits monotonic sequence, positioning telemetry, state snapshot, and updates `matches/{id}`.
 */
export const recordMatchEvent = async (input: RecordEventInput): Promise<{ eventId: string; sequence: number }> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');

  const matchRef = doc(db, 'matches', input.matchId);
  const matchSnap = await getDoc(matchRef);
  const matchData = matchSnap.data() as Match | undefined;

  const currentSequence = Number(matchData?.lastSequence || 0);
  const nextSequence = currentSequence + 1;

  const positioningText = formatSportPositioning(input.sportId, input.positioning, input.matchTime);

  const eventPayload: Omit<MatchEvent, 'id'> = {
    sequence: nextSequence,
    matchId: input.matchId,
    sportId: input.sportId,
    type: input.type,
    timestamp: Timestamp.now(),
    matchTime: input.matchTime || '',
    team: input.team || '',
    teamName: input.teamName || '',
    playerId: input.playerId || '',
    playerName: input.playerName || '',
    description: input.description,
    positioning: input.positioning || {},
    positioningText,
    data: input.data || {},
    snapshot: {
      score: input.newScore,
      liveState: input.newLiveState || {},
    },
    undone: false,
    createdBy: input.createdBy || 'admin',
  };

  const eventsCollRef = collection(db, `matches/${input.matchId}/events`);
  const eventDocRef = await addDoc(eventsCollRef, {
    ...eventPayload,
    createdAt: serverTimestamp(),
  });

  const matchUpdate: Record<string, unknown> = {
    score: input.newScore,
    liveState: input.newLiveState || matchData?.liveState || {},
    lastSequence: nextSequence,
    updatedAt: serverTimestamp(),
  };

  if (input.newStatus) {
    matchUpdate.status = input.newStatus;
  }

  await updateDoc(matchRef, matchUpdate);

  return { eventId: eventDocRef.id, sequence: nextSequence };
};

/**
 * Undoes the latest active event in the match and restores the prior snapshot.
 */
export const undoLastActiveEvent = async (
  matchId: string,
  operatorId: string = 'admin',
  fallbackInitialScore?: Record<string, unknown>,
  fallbackInitialLiveState?: Record<string, unknown>
): Promise<{ undoneEvent: MatchEvent; restoredScore: Record<string, unknown>; restoredLiveState: Record<string, unknown> }> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');

  const eventsRef = collection(db, `matches/${matchId}/events`);
  const q = query(eventsRef, orderBy('sequence', 'desc'));
  const snap = await getDocs(q);

  const allEvents = snap.docs.map((d) => ({ id: d.id, ...d.data() } as MatchEvent));
  const activeEvents = allEvents.filter((e) => !e.undone);

  if (activeEvents.length === 0) {
    throw new Error('No active events found to undo.');
  }

  const targetEvent = activeEvents[0]; // highest sequence active event
  const previousEvent = activeEvents[1]; // event immediately prior to target

  // Mark event as undone
  const targetEventRef = doc(db, `matches/${matchId}/events`, targetEvent.id);
  await updateDoc(targetEventRef, {
    undone: true,
    undoneAt: serverTimestamp(),
    undoneBy: operatorId,
  });

  // Determine restored score and liveState
  const restoredScore = previousEvent?.snapshot?.score || fallbackInitialScore || { teamA: 0, teamB: 0, details: {} };
  const restoredLiveState = previousEvent?.snapshot?.liveState || fallbackInitialLiveState || {};

  const matchRef = doc(db, 'matches', matchId);
  await updateDoc(matchRef, {
    score: restoredScore as unknown as Match['score'],
    liveState: restoredLiveState as unknown as Match['liveState'],
    updatedAt: serverTimestamp(),
  });

  return {
    undoneEvent: targetEvent,
    restoredScore,
    restoredLiveState,
  };
};

/**
 * Corrects an earlier event with an auditable replacement event and updates the match state.
 */
export const correctMatchEvent = async (input: CorrectEventInput): Promise<{ newEventId: string; sequence: number }> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');

  const originalRef = doc(db, `matches/${input.matchId}/events`, input.originalEventId);
  const origSnap = await getDoc(originalRef);
  if (!origSnap.exists()) throw new Error('Original event not found');

  const originalEvent = { id: origSnap.id, ...origSnap.data() } as MatchEvent;

  const matchRef = doc(db, 'matches', input.matchId);
  const matchSnap = await getDoc(matchRef);
  const matchData = matchSnap.data() as Match | undefined;

  const currentSequence = Number(matchData?.lastSequence || 0);
  const nextSequence = currentSequence + 1;

  const positioningText = formatSportPositioning(input.sportId, input.positioning || originalEvent.positioning);

  // 1. Mark original event as corrected/undone
  await updateDoc(originalRef, {
    undone: true,
    correctionNote: input.correctionNote,
    correctedByEventSequence: nextSequence,
    updatedAt: serverTimestamp(),
  });

  // 2. Append new correction event with monotonic sequence
  const eventsCollRef = collection(db, `matches/${input.matchId}/events`);
  const newEventPayload: Omit<MatchEvent, 'id'> = {
    sequence: nextSequence,
    matchId: input.matchId,
    sportId: input.sportId,
    type: input.newType,
    timestamp: Timestamp.now(),
    matchTime: originalEvent.matchTime || '',
    team: input.team || originalEvent.team || '',
    teamName: input.teamName || originalEvent.teamName || '',
    description: input.newDescription,
    positioning: input.positioning || originalEvent.positioning || {},
    positioningText,
    data: {
      originalEventId: originalEvent.id,
      replacesSequence: originalEvent.sequence,
      reason: input.correctionNote,
    },
    snapshot: {
      score: input.correctedScore,
      liveState: input.correctedLiveState || {},
    },
    undone: false,
    isCorrection: true,
    correctionNote: input.correctionNote,
    replacesSequence: originalEvent.sequence,
    createdBy: input.correctedBy || 'admin',
  };

  const newDocRef = await addDoc(eventsCollRef, {
    ...newEventPayload,
    createdAt: serverTimestamp(),
  });

  // 3. Atomically update match doc
  await updateDoc(matchRef, {
    score: input.correctedScore as unknown as Match['score'],
    liveState: (input.correctedLiveState || matchData?.liveState || {}) as unknown as Match['liveState'],
    lastSequence: nextSequence,
    updatedAt: serverTimestamp(),
  });

  return { newEventId: newDocRef.id, sequence: nextSequence };
};

/* ============================================================================
 *  Backward Compatibility & Utility Methods
 * ==========================================================================*/

export const updateScore = async (matchId: string, score: Score): Promise<void> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  const matchRef = doc(db, 'matches', matchId);
  await updateDoc(matchRef, { score, updatedAt: serverTimestamp() });
};

export const addMatchEvent = async (matchId: string, event: Omit<MatchEvent, 'id' | 'createdAt'>): Promise<string> => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  const eventsRef = collection(db, `matches/${matchId}/events`);
  const docRef = await addDoc(eventsRef, { ...event, createdAt: serverTimestamp() });
  return docRef.id;
};

export const undoLastEvent = async (matchId: string): Promise<void> => {
  await undoLastActiveEvent(matchId);
};

export const getMatchEvents = async (matchId: string): Promise<MatchEvent[]> => {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const eventsRef = collection(db, `matches/${matchId}/events`);
    const q = query(eventsRef, orderBy('sequence', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MatchEvent));
  } catch (error) {
    console.error('Error getting match events', error);
    return [];
  }
};

export const subscribeToMatchEvents = (
  matchId: string,
  callback: (events: MatchEvent[]) => void
): Unsubscribe => {
  if (!isFirebaseConfigured || !db) return () => {};
  const eventsRef = collection(db, `matches/${matchId}/events`);
  const q = query(eventsRef, orderBy('sequence', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MatchEvent)));
  });
};

export const subscribeToScore = (
  matchId: string,
  callback: (score: Score | null) => void
): Unsubscribe => {
  if (!isFirebaseConfigured || !db) return () => {};
  return onSnapshot(doc(db, 'matches', matchId), (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      callback((data.score as Score) || null);
    } else {
      callback(null);
    }
  });
};
