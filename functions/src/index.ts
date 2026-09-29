import * as admin from 'firebase-admin';

admin.initializeApp();

// Export all functions
export * from './admins/createAdmin';
export * from './admins/disableAdmin';
export * from './admins/reactivateAdmin';
export * from './admins/setupInitialAdmin';
export * from './admin/setAdminClaim';
export * from './admin/setupAdminClaim';
export * from './scoring/processMatchEvent';
export * from './reactions/aggregateReactions';
export * from './ratings/aggregateRatings';
export * from './voting/validateVote';
export * from './auth/onUserCreate';
