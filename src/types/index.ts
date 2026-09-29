export * from './auth';
export * from './sport';
export * from './team';
export * from './player';
export * from './match';
export * from './scoring';
export * from './matchEvent';
export * from './tournament';
export * from './venue';
export * from './interaction';
export * from './announcement';
export * from './display';
export * from './leaderboard';
export * from './admin';

import { PublicUser, Admin } from './auth';
export type User = PublicUser;
export type AdminUser = Admin;

export interface DashboardStats {
  liveMatches: number;
  upcomingMatches: number;
  completedMatches: number;
  /** Subset of the above counted against today's date */
  upcomingToday: number;
  completedToday: number;
  totalTeams: number;
  totalPlayers: number;
  totalMatches: number;
  totalTournaments: number;
  activeTournaments: number;
  totalVotes: number;
  totalReviews: number;
  totalReactions: number;
  totalRatings: number;
  totalVenues: number;
}

export interface MatchFilter {
  sport?: string;
  status?: string;
  date?: string;
  tournament?: string;
}

export interface PlayerFilter {
  teamId?: string;
  sportId?: string;
}

export interface TeamFilter {
  sportId?: string;
}

import { MatchScore } from './match';
export type Score = MatchScore | Record<string, unknown>;

// Admin Configurable Scoring Formulas & Net Score rules
export interface SportScoringRule {
  sportId: string;
  sportName: string;
  pointsForWin: number;
  pointsForDraw: number;
  pointsForLoss: number;
  hasNetScore: boolean;
  netScoreType: 'cricket_nrr' | 'goal_diff' | 'set_ratio' | 'point_diff' | 'custom';
  formulaDescription: string;
  tieBreakers: string[];
}

