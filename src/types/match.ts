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
  // Common / Football
  period?: number;
  clock?: string;
  half?: number;
  isHalfTime?: boolean;
  pausedDurationMs?: number;

  // Cricket State
  innings?: number;
  battingTeam?: 'teamA' | 'teamB';
  battingTeamId?: string;
  bowlingTeamId?: string;
  totalRuns?: number;
  overs?: number;
  over?: number;
  ball?: number;
  legalBalls?: number;
  wickets?: number;
  extras?: number;
  extrasDetail?: {
    wides?: number;
    noBalls?: number;
    byes?: number;
    legByes?: number;
  };
  maxOvers?: number;
  targetRuns?: number;
  requiredRuns?: number;
  ballsRemaining?: number;
  strikerId?: string;
  strikerName?: string;
  strikerRuns?: number;
  strikerBalls?: number;
  nonStrikerId?: string;
  nonStrikerName?: string;
  nonStrikerRuns?: number;
  nonStrikerBalls?: number;
  currentBowlerId?: string;
  currentBowlerName?: string;
  bowlerRunsConceded?: number;
  bowlerWickets?: number;
  bowlerOvers?: number;
  bowlerBalls?: number;
  firstInnings?: {
    team: 'teamA' | 'teamB';
    teamId?: string;
    runs: number;
    wickets: number;
    overs: number;
    balls: number;
  };
  inningsStatus?: 'in_progress' | 'completed';
  resultText?: string;
  winnerTeam?: 'teamA' | 'teamB' | 'draw' | 'tie';
  winnerTeamId?: string;

  // Volleyball fields
  currentSet?: number;
  currentSetScore?: {
    teamA: number;
    teamB: number;
  };
  setsWon?: {
    teamA: number;
    teamB: number;
  };
  targetPoints?: number;
  winByTwo?: boolean;
  setsRequiredToWin?: number;
  bestOf?: number;
  decidingSetTarget?: number;
  setStatus?: 'in_progress' | 'completed';
  completedSets?: Array<{
    set: number;
    teamA: number;
    teamB: number;
    winner: 'teamA' | 'teamB';
  }>;

  // Other sports
  set?: number;
  rally?: number;
  game?: number;
  map?: number;
  round?: number;
  matchStatus?: MatchStatus;
  [key: string]: unknown;
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
  round?: string;
  maxOvers?: number;
  lastSequence?: number;
  isHidden?: boolean;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
