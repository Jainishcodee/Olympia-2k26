export const SPORTS = [
  'football',
  'cricket',
  'badminton',
  'volleyball',
  'hand-tennis',
  'table-tennis',
  'chess',
  'carrom',
  'smash-karts',
  'counter-strike'
] as const;

export type Sport = typeof SPORTS[number];

export const MATCH_STATUSES = {
  SCHEDULED: 'scheduled',
  UPCOMING: 'upcoming',
  LIVE: 'live',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

export const DISPLAY_MODES = {
  DUAL_PORTRAIT: 'dual_portrait',
  SINGLE_LANDSCAPE: 'single_landscape'
} as const;

export const REACTION_TYPES = [
  'fire',
  'clap',
  'lightning',
  'heart',
  'wow',
  'trophy',
  'muscle'
] as const;

export const RATING_SCALE = {
  MIN: 1,
  MAX: 5
} as const;

export const MAX_REVIEW_LENGTH = 1000;

export const ADMIN_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  SCORE_OPERATOR: 'score_operator',
  CONTENT_MANAGER: 'content_manager'
} as const;
