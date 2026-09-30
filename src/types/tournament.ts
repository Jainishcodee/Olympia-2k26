import { Timestamp } from 'firebase/firestore';

export type TournamentFormat = 'knockout' | 'league' | 'round_robin' | 'group_stage' | 'custom';
export type TournamentStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface Round {
  id: string;
  name: string;
  order: number;
  matchIds: string[];
}

export interface Tournament {
  id: string;
  name: string;
  sportId: string;
  description: string;
  startDate: Timestamp;
  endDate: Timestamp;
  venue: string;
  format: TournamentFormat;
  status: TournamentStatus;
  rounds: Round[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Fixture {
  id: string;
  tournamentId: string;
  sportId?: string;
  round: string;
  matchId: string;
  order: number;
  teamAId: string;
  teamBId: string;
  scheduledAt: Timestamp;
  venueId: string;
  status: string;
  createdAt: Timestamp;
}
