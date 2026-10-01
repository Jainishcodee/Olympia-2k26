import { Timestamp } from 'firebase/firestore';

/* ============================================================================
 *  Audit log — every privileged action an administrator takes.
 *  Stored in the `auditLogs` collection so it survives the session and can be
 *  used to troubleshoot during the actual event.
 * ==========================================================================*/

export type AuditAction =
  | 'MATCH_CREATED'
  | 'MATCH_UPDATED'
  | 'MATCH_STARTED'
  | 'MATCH_PAUSED'
  | 'MATCH_RESUMED'
  | 'MATCH_ENDED'
  | 'MATCH_CANCELLED'
  | 'MATCH_ARCHIVED'
  | 'MATCH_RESTORED'
  | 'MATCH_DUPLICATED'
  | 'MATCH_DELETED'
  | 'SCORE_UPDATED'
  | 'EVENT_ADDED'
  | 'EVENT_UNDONE'
  | 'EVENT_EDITED'
  | 'FIXTURE_CREATED'
  | 'FIXTURE_UPDATED'
  | 'FIXTURE_DELETED'
  | 'TOURNAMENT_CREATED'
  | 'TOURNAMENT_UPDATED'
  | 'TOURNAMENT_ARCHIVED'
  | 'TOURNAMENT_DELETED'
  | 'SPORT_CREATED'
  | 'SPORT_UPDATED'
  | 'SPORT_DISABLED'
  | 'SPORT_DELETED'
  | 'TEAM_CREATED'
  | 'TEAM_UPDATED'
  | 'TEAM_ARCHIVED'
  | 'TEAM_DELETED'
  | 'ROSTER_CHANGED'
  | 'PLAYER_CREATED'
  | 'PLAYER_UPDATED'
  | 'PLAYER_ARCHIVED'
  | 'PLAYER_DELETED'
  | 'VENUE_CREATED'
  | 'VENUE_UPDATED'
  | 'VENUE_DELETED'
  | 'ANNOUNCEMENT_PUBLISHED'
  | 'ANNOUNCEMENT_UNPUBLISHED'
  | 'ANNOUNCEMENT_UPDATED'
  | 'ANNOUNCEMENT_ARCHIVED'
  | 'ANNOUNCEMENT_DELETED'
  | 'REVIEW_HIDDEN'
  | 'REVIEW_RESTORED'
  | 'REVIEW_DELETED'
  | 'VOTING_ENABLED'
  | 'VOTING_DISABLED'
  | 'VOTING_CLOSED'
  | 'REACTIONS_DISABLED'
  | 'REACTIONS_ENABLED'
  | 'LEADERBOARD_PUBLISHED'
  | 'LEADERBOARD_DELETED'
  | 'ADMIN_CREATED'
  | 'ADMIN_DISABLED'
  | 'ADMIN_REACTIVATED'
  | 'SETTINGS_UPDATED'
  | 'ADMIN_LOGIN';

export interface AuditEntry {
  id: string;
  /** Firebase Auth uid of the acting administrator */
  adminId: string;
  adminEmail?: string;
  adminName?: string;
  action: AuditAction;
  /** e.g. `match` | `team` | `player` | `announcement` | `settings` */
  resourceType: string;
  resourceId: string;
  resourceLabel?: string;
  timestamp: Timestamp | Date | null;
  metadata?: Record<string, unknown>;
}

export type AuditEntryInput = Omit<AuditEntry, 'id' | 'timestamp'>;

/* ============================================================================
 *  System settings — `/admin/settings`
 * ==========================================================================*/

export interface SystemSettings {
  id: 'default';

  /* --- General ---------------------------------------------------------- */
  eventName: string;
  eventTagline: string;
  supportEmail: string;
  timezone: string;
  locale: string;

  /* --- Branding --------------------------------------------------------- */
  brandPrimary: string;
  brandGold: string;
  brandAccent: string;
  brandYellow: string;
  logoUrl: string;

  /* --- Live scoring ----------------------------------------------------- */
  /** How the match clock behaves out of the box */
  defaultClockMode: 'period' | 'half' | 'overs' | 'none';
  /** Seconds added to the clock automatically on a goal (0 = off) */
  goalClockPauseSeconds: number;
  allowOperatorUndo: boolean;
  autoAdvanceOvers: boolean;
  /** Require a confirmation before ending a match */
  confirmBeforeEndMatch: boolean;
  /** Custom default overs quota for cricket matches (e.g. 2, 15, 20) */
  cricketMaxOvers?: number;
  /** Full custom formula rules for cricket */
  cricketConfig?: Record<string, unknown>;

  /* --- Public interaction defaults ------------------------------------- */
  defaultReactionsEnabled: boolean;
  defaultRatingsEnabled: boolean;
  defaultReviewsEnabled: boolean;
  defaultVotingEnabled: boolean;
  /** Reaction types available to the public — others are filtered out */
  enabledReactions: string[];

  /* --- Display defaults ------------------------------------------------- */
  defaultDisplayMode: 'dual_portrait' | 'single_landscape';
  defaultFeaturedEnabled: boolean;
  showScorersOnDisplay: boolean;

  /* --- Security --------------------------------------------------------- */
  sessionTimeoutMinutes: number;
  requireConfirmOnDelete: boolean;
  auditRetentionDays: number;
  /** Minimum role allowed to open the scoring console */
  scoringAccessRole: 'super_admin' | 'admin' | 'score_operator';

  /* --- Public visibility master switches -------------------------------- */
  publicFixturesVisible: boolean;
  publicMatchesVisible: boolean;
  publicLeaderboardVisible: boolean;

  /* --- Meta ------------------------------------------------------------- */
  updatedBy?: string;
  updatedAt?: Timestamp | Date | null;
}

export const DEFAULT_SETTINGS: SystemSettings = {
  id: 'default',

  eventName: 'OLYMPIA 2K26',
  eventTagline: 'One Festival. Every Sport. All Heart.',
  supportEmail: 'support@olympia2k26.app',
  timezone: 'Asia/Kolkata',
  locale: 'en-IN',

  brandPrimary: '#1264FF',
  brandGold: '#D9A441',
  brandAccent: '#071426',
  brandYellow: '#FFD21F',
  logoUrl: '',

  defaultClockMode: 'period',
  goalClockPauseSeconds: 0,
  allowOperatorUndo: true,
  autoAdvanceOvers: true,
  confirmBeforeEndMatch: true,
  cricketMaxOvers: 20,

  defaultReactionsEnabled: true,
  defaultRatingsEnabled: true,
  defaultReviewsEnabled: true,
  defaultVotingEnabled: true,
  /** Reaction types available to the public — must match `ReactionType` */
  enabledReactions: ['fire', 'clap', 'lightning', 'heart', 'wow', 'trophy', 'muscle'],

  defaultDisplayMode: 'single_landscape',
  defaultFeaturedEnabled: false,
  showScorersOnDisplay: true,

  sessionTimeoutMinutes: 60,
  requireConfirmOnDelete: true,
  auditRetentionDays: 90,
  scoringAccessRole: 'score_operator',

  publicFixturesVisible: true,
  publicMatchesVisible: true,
  publicLeaderboardVisible: true,

  updatedBy: undefined,
  updatedAt: null,
};
