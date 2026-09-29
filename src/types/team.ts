import { Timestamp } from 'firebase/firestore';

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  sportId: string;
  captainId: string;
  viceCaptainId: string;
  playerIds: string[];
  coach: string;
  description: string;
  active: boolean;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
