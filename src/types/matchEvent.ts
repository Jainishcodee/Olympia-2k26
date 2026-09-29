import { Timestamp } from 'firebase/firestore';

export type EventType = 'goal' | 'assist' | 'yellow_card' | 'red_card' | 'substitution' | 'corner' | 'shot' | 'foul' | 'penalty' | 'run' | 'wicket' | 'four' | 'six' | 'wide' | 'no_ball' | 'dot' | 'point' | 'set_won' | 'game_won' | 'round_won' | 'map_won' | 'timeout' | 'period_start' | 'period_end' | 'match_start' | 'match_end' | 'substitution_in' | 'substitution_out';

export interface MatchEvent {
  id: string;
  matchId: string;
  sportId: string;
  type: EventType;
  timestamp: Timestamp;
  period: number;
  playerId: string;
  teamId: string;
  data: Record<string, unknown>;
  createdBy: string;
  undone: boolean;
}
