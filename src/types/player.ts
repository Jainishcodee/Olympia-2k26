import { Timestamp } from 'firebase/firestore';

export interface PlayerStats {
  matchesPlayed: number;
  goals: number;
  assists: number;
  runs: number;
  wickets: number;
  points: number;
  wins: number;
  losses: number;
  rating: number;
}

export interface Player {
  id: string;
  name: string;
  photo: string;
  jerseyNumber: number;
  gender: 'male' | 'female' | 'other';
  teamId: string;
  sportId: string;
  role: 'player' | 'captain' | 'vice_captain';
  position: string;
  bio: string;
  active: boolean;
  stats: PlayerStats;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
