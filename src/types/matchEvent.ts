import { Timestamp } from 'firebase/firestore';

export type EventType =
  | 'goal'
  | 'goal_removed'
  | 'assist'
  | 'yellow_card'
  | 'red_card'
  | 'substitution'
  | 'corner'
  | 'shot'
  | 'foul'
  | 'penalty'
  | 'penalty_shootout_start'
  | 'penalty_kick'
  | 'penalty_scored'
  | 'penalty_missed'
  | 'penalty_shootout_end'
  | 'run'
  | 'dot'
  | 'single'
  | 'double'
  | 'triple'
  | 'four'
  | 'six'
  | 'ten'
  | 'wicket'
  | 'wide'
  | 'no_ball'
  | 'bye'
  | 'leg_bye'
  | 'point'
  | 'point_removed'
  | 'set_started'
  | 'set_completed'
  | 'set_won'
  | 'game_won'
  | 'round_won'
  | 'map_won'
  | 'timeout'
  | 'period_start'
  | 'period_end'
  | 'match_start'
  | 'match_pause'
  | 'match_resume'
  | 'half_time'
  | 'second_half'
  | 'match_end'
  | 'full_time'
  | 'ball'
  | 'over_completed'
  | 'innings_start'
  | 'innings_end'
  | 'innings_completed'
  | 'drinks_break'
  | 'break'
  | 'substitution_in'
  | 'substitution_out'
  | 'correction'
  | string;

export interface SportPositioning {
  /** Cricket positioning */
  innings?: number;
  over?: number;
  ball?: number;
  /** Football / timed match positioning */
  period?: number | string;
  matchSecond?: number;
  addedTime?: number;
  isShootout?: boolean;
  penaltyRound?: number;
  penaltyKickNumber?: number;
  /** Volleyball / Tennis / Hand tennis */
  set?: number;
  rally?: number;
  /** Badminton / Table tennis */
  game?: number;
  /** Counter-strike / LAN */
  map?: number;
  round?: number;
  /** Carrom / Racing */
  lap?: number;
  board?: number;
  /** Chess */
  move?: number;
  [key: string]: unknown;
}

export interface MatchEvent {
  id: string;
  sequence: number;
  matchId: string;
  sportId: string;
  type: EventType;
  timestamp: Timestamp;
  matchTime?: string;
  period?: number;
  team?: 'teamA' | 'teamB' | '';
  teamId?: string;
  teamName?: string;
  playerId?: string;
  playerName?: string;
  description: string;
  positioning?: SportPositioning;
  positioningText?: string;
  data?: Record<string, unknown>;
  snapshot?: {
    score: Record<string, unknown>;
    liveState: Record<string, unknown>;
  };
  undone: boolean;
  undoneAt?: Timestamp;
  undoneBy?: string;
  isCorrection?: boolean;
  correctionNote?: string;
  replacesSequence?: number;
  createdBy: string;
}
