import { Timestamp } from 'firebase/firestore';

export type ScoringType = 'goals' | 'runs' | 'sets_points' | 'games_points' | 'rounds' | 'race' | 'result' | 'configurable';

export type SportSlug = 'football' | 'cricket' | 'badminton' | 'volleyball' | 'hand-tennis' | 'table-tennis' | 'chess' | 'carrom' | 'smash-karts' | 'counter-strike';

export interface Sport {
  id: string;
  name: string;
  slug: SportSlug;
  icon: string;
  description: string;
  active: boolean;
  scoringType: ScoringType;
  teamBased: boolean;
  maxPlayersPerTeam: number;
  minPlayersPerTeam: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
