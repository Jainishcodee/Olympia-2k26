import { Timestamp } from 'firebase/firestore';
import { DisplayMode } from './match';

export interface DisplayConfig {
  id: string;
  matchId: string;
  mode: DisplayMode;
  showReactions: boolean;
  showVoting: boolean;
  showRatings: boolean;
  showReviews: boolean;
  showTimeline: boolean;
  showStats: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
