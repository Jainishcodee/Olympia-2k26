import { Timestamp } from 'firebase/firestore';

export interface LeaderboardEntry {
  position: number;
  entityId: string;
  entityType: 'team' | 'player';
  entityName: string;
  logo: string;
  sportId: string;
  stats: Record<string, number>;
  points: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface Leaderboard {
  id: string;
  sportId: string;
  sportName?: string;
  category?: 'team' | 'individual';
  isHidden?: boolean;
  entries: LeaderboardEntry[];
  lastUpdated: Timestamp;
}
