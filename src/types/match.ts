import { Timestamp } from 'firebase/firestore';

export type MatchStatus = 'scheduled' | 'upcoming' | 'live' | 'paused' | 'completed' | 'cancelled';

export type DisplayMode = 'dual_portrait' | 'single_landscape';

export interface Participant {
  id: string;
  name: string;
  logo: string;
  type: 'team' | 'player';
}

export interface MatchScore {
  teamA: number;
  teamB: number;
  details: Record<string, unknown>;
}

export interface LiveState {
  period?: number;
  clock?: string;
  half?: number;
  set?: number;
  game?: number;
  innings?: number;
  over?: number;
  ball?: number;
  map?: number;
  round?: number;
}

export interface Match {
  id: string;
  sportId: string;
  tournamentId: string;
  matchNumber: number;
  teamAId: string;
  teamBId: string;
  participantA: Participant;
  participantB: Participant;
  venueId: string;
  scheduledAt: Timestamp;
  startedAt: Timestamp | null;
  pausedAt: Timestamp | null;
  endedAt: Timestamp | null;
  status: MatchStatus;
  score: MatchScore;
  liveState: LiveState;
  displayMode: DisplayMode;
  featured: boolean;
  featuredPriority: number;
  allowReactions: boolean;
  allowVoting: boolean;
  allowRatings: boolean;
  allowReviews: boolean;
  archived: boolean;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
