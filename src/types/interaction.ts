import { Timestamp } from 'firebase/firestore';

export type ReactionType = 'fire' | 'clap' | 'lightning' | 'heart' | 'wow' | 'trophy' | 'muscle';

export interface Reaction {
  id: string;
  matchId: string;
  userId: string;
  type: ReactionType;
  timestamp: Timestamp;
}

export interface ReactionAggregates {
  matchId: string;
  counts: Record<ReactionType, number>;
  total: number;
}

export interface Rating {
  id: string;
  matchId: string;
  playerId: string;
  userId: string;
  score: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RatingAggregate {
  matchId?: string;
  playerId?: string;
  averageRating: number;
  totalRatings: number;
  average?: number;
  count?: number;
}

export interface Review {
  id: string;
  matchId: string;
  userId: string;
  rating: number;
  content: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Vote {
  id: string;
  matchId: string;
  userId: string;
  selectedTeam: string;
  createdAt: Timestamp;
}

export interface VoteAggregate {
  matchId: string;
  teamACounts: number;
  teamBCounts: number;
  total: number;
}
