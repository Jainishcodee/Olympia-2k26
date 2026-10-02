/**
 * ============================================================================
 *  OLYMPIA 2K26 — COMPLETE PRODUCTION POPULATION SCRIPT
 * ============================================================================
 *
 *  Populates all missing collections in Olympia-2K26-Production (olympia-2k26--prod):
 *  1. settings/default (Tournament rules, branding, public toggles)
 *  2. announcements (Official tournament announcements)
 *  3. fixtures (Full schedule board linked to venues and matches)
 *  4. matches (Completed, Live, and Scheduled matches with real scores & clock)
 *  5. matches/{id}/events (Realistic timelines for matches)
 *  6. leaderboards/{sportId} (Canonical standings for ALL 11 disciplines)
 *  7. Fan Engagement:
 *     - matches/{id}/reactions & match_reactions/{id}
 *     - matches/{id}/votes & match_voting/{id}
 *     - matches/{id}/reviews (Moderated spectator reviews)
 *     - matches/{id}/players/{playerId}/ratings (Athlete star ratings)
 *
 *  STRICT PRESERVATION:
 *  - NEVER deletes or alters admins/ (p@olympia.com stays super_admin)
 *  - Preserves existing teams and players
 * ============================================================================
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Initialize Firebase Admin SDK using service-account.json
const serviceAccountPath = path.join(rootDir, 'service-account.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ service-account.json not found in project root!');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = getFirestore();

console.log(`\n🚀 Initialized Firebase Admin for: "${serviceAccount.project_id}"\n`);

async function seedSettings() {
  console.log('⚙️  Seeding settings/default...');
  const settingsData = {
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
    enabledReactions: ['fire', 'clap', 'lightning', 'heart', 'wow', 'trophy', 'muscle'],
    defaultDisplayMode: 'single_landscape',
    defaultFeaturedEnabled: true,
    showScorersOnDisplay: true,
    sessionTimeoutMinutes: 60,
    requireConfirmOnDelete: true,
    auditRetentionDays: 90,
    scoringAccessRole: 'score_operator',
    publicFixturesVisible: true,
    publicMatchesVisible: true,
    publicLeaderboardVisible: true,
    tournamentScoringRules: {
      football: { winPoints: 3, drawPoints: 1, lossPoints: 0 },
      cricket: { winPoints: 2, drawPoints: 1, lossPoints: 0 },
      volleyball: { winPoints: 2, drawPoints: 0, lossPoints: 0 },
      'hand-tennis': { winPoints: 2, drawPoints: 0, lossPoints: 0 },
      'lan-games': { winPoints: 2, drawPoints: 0, lossPoints: 0 },
      'counter-strike': { winPoints: 2, drawPoints: 0, lossPoints: 0 },
      badminton: { winPoints: 2, drawPoints: 0, lossPoints: 0 },
      'table-tennis': { winPoints: 2, drawPoints: 0, lossPoints: 0 },
      chess: { winPoints: 1, drawPoints: 0.5, lossPoints: 0 },
      carrom: { winPoints: 2, drawPoints: 0, lossPoints: 0 },
      'smash-karts': { winPoints: 2, drawPoints: 0, lossPoints: 0 },
    },
    updatedAt: Timestamp.now(),
  };

  await db.doc('settings/default').set(settingsData, { merge: true });
  console.log('  ✅ settings/default active');
}

async function seedAnnouncements() {
  console.log('📢 Seeding announcements...');
  const items = [
    {
      id: 'ann-1',
      title: '🚨 OLYMPIA 2K26 OFFICIALLY LAUNCHED',
      description: 'The biggest collegiate sports festival of the year kicks off! Experience live scoring, real-time reactions, and interactive rankings across all arenas.',
      content: 'The biggest collegiate sports festival of the year kicks off! Experience live scoring, real-time reactions, and interactive rankings across all arenas.',
      priority: 1,
      active: true,
      publishedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
    },
    {
      id: 'ann-2',
      title: '🏆 CHAMPIONSHIP FIXTURES ANNOUNCED',
      description: 'The tournament bracket is locked. Check the Fixtures tab for full schedules across the Main Stadium, Sports Complex, and Digital Arena Hub.',
      content: 'The tournament bracket is locked. Check the Fixtures tab for full schedules across the Main Stadium, Sports Complex, and Digital Arena Hub.',
      priority: 2,
      active: true,
      publishedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
    },
    {
      id: 'ann-3',
      title: '⭐ FAN INTERACTION & LIVE RATINGS ARE OPEN',
      description: 'Rate standout athlete performances, vote in match outcome predictions, and send live applause in real time during every fixture.',
      content: 'Rate standout athlete performances, vote in match outcome predictions, and send live applause in real time during every fixture.',
      priority: 3,
      active: true,
      publishedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
    },
    {
      id: 'ann-4',
      title: '🎮 DIGITAL ESPORTS ARENA LIVE BROADCAST',
      description: 'LAN Games and tactical FPS showdowns are streaming live from the Cyber Arena. Support your squad in the tournament!',
      content: 'LAN Games and tactical FPS showdowns are streaming live from the Cyber Arena. Support your squad in the tournament!',
      priority: 4,
      active: true,
      publishedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
    },
  ];

  const batch = db.batch();
  for (const ann of items) {
    batch.set(db.doc(`announcements/${ann.id}`), ann, { merge: true });
  }
  await batch.commit();
  console.log(`  ✅ ${items.length} announcements seeded`);
}

async function seedMatchesAndFixtures() {
  console.log('🏟️  Seeding matches, events, and fixtures...');

  const now = Date.now();
  const dayMs = 24 * 3600 * 1000;

  const matches = [
    // 1. FOOTBALL MATCH 1: COMPLETED
    {
      id: 'match-football-1',
      matchNumber: 1,
      sportId: 'football',
      tournamentId: 'olympia-championship-2k26',
      venueId: 'main-arena',
      round: 'Quarter-Final',
      teamAId: 'team-football-reign-fc',
      teamBId: 'team-football-apex-attackers',
      participantA: { id: 'team-football-reign-fc', name: 'Reign FC', shortName: 'RFC' },
      participantB: { id: 'team-football-apex-attackers', name: 'Apex Attackers', shortName: 'AA' },
      status: 'completed',
      score: { teamA: 3, teamB: 1, details: { period: 'Full Time', matchTime: 90 } },
      liveState: { period: 'Full Time', clock: '90:00', isPaused: false },
      featured: true,
      allowVoting: true,
      allowReactions: true,
      allowRatings: true,
      allowReviews: true,
      scheduledAt: Timestamp.fromMillis(now - dayMs * 2),
      startedAt: Timestamp.fromMillis(now - dayMs * 2),
      endedAt: Timestamp.fromMillis(now - dayMs * 2 + 6000000),
    },

    // 2. FOOTBALL MATCH 2: COMPLETED
    {
      id: 'match-football-2',
      matchNumber: 2,
      sportId: 'football',
      tournamentId: 'olympia-championship-2k26',
      venueId: 'main-arena',
      round: 'Quarter-Final',
      teamAId: 'team-football-super-strikers',
      teamBId: 'team-football-shadow-strikers',
      participantA: { id: 'team-football-super-strikers', name: 'Super Strikers', shortName: 'SS' },
      participantB: { id: 'team-football-shadow-strikers', name: 'Shadow Strikers', shortName: 'SHS' },
      status: 'completed',
      score: { teamA: 2, teamB: 2, details: { period: 'Full Time', matchTime: 90 } },
      liveState: { period: 'Full Time', clock: '90:00', isPaused: false },
      featured: false,
      allowVoting: true,
      allowReactions: true,
      allowRatings: true,
      allowReviews: true,
      scheduledAt: Timestamp.fromMillis(now - dayMs),
      startedAt: Timestamp.fromMillis(now - dayMs),
      endedAt: Timestamp.fromMillis(now - dayMs + 6000000),
    },

    // 3. FOOTBALL MATCH 3: LIVE
    {
      id: 'match-football-3',
      matchNumber: 3,
      sportId: 'football',
      tournamentId: 'olympia-championship-2k26',
      venueId: 'main-arena',
      round: 'Semi-Final',
      teamAId: 'team-football-reign-fc',
      teamBId: 'team-football-super-strikers',
      participantA: { id: 'team-football-reign-fc', name: 'Reign FC', shortName: 'RFC' },
      participantB: { id: 'team-football-super-strikers', name: 'Super Strikers', shortName: 'SS' },
      status: 'live',
      score: { teamA: 2, teamB: 1, details: { period: '2nd Half', matchTime: 68 } },
      liveState: { period: 2, clock: '68:14', isPaused: false, isHalfTime: false },
      featured: true,
      allowVoting: true,
      allowReactions: true,
      allowRatings: true,
      allowReviews: true,
      scheduledAt: Timestamp.fromMillis(now - 3600000 * 2),
      startedAt: Timestamp.fromMillis(now - 3600000),
      endedAt: null,
    },

    // 4. CRICKET MATCH 1: COMPLETED
    {
      id: 'match-cricket-1',
      matchNumber: 1,
      sportId: 'cricket',
      tournamentId: 'olympia-championship-2k26',
      venueId: 'court-alpha',
      round: 'Group Stage',
      teamAId: 'team-cricket-ronin-xi',
      teamBId: 'team-cricket-boundary-breakers',
      participantA: { id: 'team-cricket-ronin-xi', name: 'Ronin XI', shortName: 'RON' },
      participantB: { id: 'team-cricket-boundary-breakers', name: 'Boundary Breakers', shortName: 'BBR' },
      status: 'completed',
      score: { teamA: 184, teamB: 156, details: { oversA: 20, wicketsA: 4, oversB: 20, wicketsB: 9 } },
      liveState: { clock: 'COMPLETED', period: 'Match Ended' },
      featured: true,
      allowVoting: true,
      allowReactions: true,
      allowRatings: true,
      allowReviews: true,
      scheduledAt: Timestamp.fromMillis(now - dayMs * 3),
      startedAt: Timestamp.fromMillis(now - dayMs * 3),
      endedAt: Timestamp.fromMillis(now - dayMs * 3 + 12000000),
    },

    // 5. CRICKET MATCH 2: COMPLETED
    {
      id: 'match-cricket-2',
      matchNumber: 2,
      sportId: 'cricket',
      tournamentId: 'olympia-championship-2k26',
      venueId: 'court-alpha',
      round: 'Group Stage',
      teamAId: 'team-cricket-power-hitters',
      teamBId: 'team-cricket-legendary-lions',
      participantA: { id: 'team-cricket-power-hitters', name: 'Power Hitters', shortName: 'PWH' },
      participantB: { id: 'team-cricket-legendary-lions', name: 'Legendary Lions', shortName: 'LGL' },
      status: 'completed',
      score: { teamA: 162, teamB: 148, details: { oversA: 20, wicketsA: 6, oversB: 20, wicketsB: 8 } },
      liveState: { clock: 'COMPLETED', period: 'Match Ended' },
      featured: false,
      allowVoting: true,
      allowReactions: true,
      allowRatings: true,
      allowReviews: true,
      scheduledAt: Timestamp.fromMillis(now - dayMs * 2),
      startedAt: Timestamp.fromMillis(now - dayMs * 2),
      endedAt: Timestamp.fromMillis(now - dayMs * 2 + 12000000),
    },

    // 6. CRICKET MATCH 3: LIVE
    {
      id: 'match-cricket-3',
      matchNumber: 3,
      sportId: 'cricket',
      tournamentId: 'olympia-championship-2k26',
      venueId: 'court-alpha',
      round: 'Championship Final',
      teamAId: 'team-cricket-ronin-xi',
      teamBId: 'team-cricket-power-hitters',
      participantA: { id: 'team-cricket-ronin-xi', name: 'Ronin XI', shortName: 'RON' },
      participantB: { id: 'team-cricket-power-hitters', name: 'Power Hitters', shortName: 'PWH' },
      status: 'live',
      score: { teamA: 118, teamB: 0, details: { innings: 1, overs: 14, balls: 2, wickets: 2, target: null } },
      liveState: { clock: '14.2 OVERS', period: '1st Innings', isPaused: false },
      featured: true,
      allowVoting: true,
      allowReactions: true,
      allowRatings: true,
      allowReviews: true,
      scheduledAt: Timestamp.fromMillis(now - 3600000),
      startedAt: Timestamp.fromMillis(now - 3600000),
      endedAt: null,
    },

    // 7. VOLLEYBALL MATCH 1: COMPLETED
    {
      id: 'match-volleyball-1',
      matchNumber: 1,
      sportId: 'volleyball',
      tournamentId: 'olympia-championship-2k26',
      venueId: 'sports-complex',
      round: 'Semi-Final',
      teamAId: 'team-volleyball-gc-spikers',
      teamBId: 'team-volleyball-spike-warriors',
      participantA: { id: 'team-volleyball-gc-spikers', name: 'GC Spikers', shortName: 'GCS' },
      participantB: { id: 'team-volleyball-spike-warriors', name: 'Spike Warriors', shortName: 'SPW' },
      status: 'completed',
      score: { teamA: 25, teamB: 21, details: { setsA: 2, setsB: 0, set1: '25-21', set2: '25-19' } },
      liveState: { clock: 'COMPLETED', period: 'Match Ended' },
      featured: false,
      allowVoting: true,
      allowReactions: true,
      allowRatings: true,
      allowReviews: true,
      scheduledAt: Timestamp.fromMillis(now - dayMs * 2),
      startedAt: Timestamp.fromMillis(now - dayMs * 2),
      endedAt: Timestamp.fromMillis(now - dayMs * 2 + 5400000),
    },

    // 8. HAND TENNIS MATCH 1: COMPLETED
    {
      id: 'match-hand-tennis-1',
      matchNumber: 1,
      sportId: 'hand-tennis',
      tournamentId: 'olympia-championship-2k26',
      venueId: 'sports-complex',
      round: 'Quarter-Final',
      teamAId: 'team-hand-tennis-power-palm',
      teamBId: 'team-hand-tennis-court-kings',
      participantA: { id: 'team-hand-tennis-power-palm', name: 'Power Palm', shortName: 'PWP' },
      participantB: { id: 'team-hand-tennis-court-kings', name: 'Court Kings', shortName: 'CK' },
      status: 'completed',
      score: { teamA: 21, teamB: 15, details: { set1: '21-15' } },
      liveState: { clock: 'COMPLETED', period: 'Match Ended' },
      featured: false,
      allowVoting: true,
      allowReactions: true,
      allowRatings: true,
      allowReviews: true,
      scheduledAt: Timestamp.fromMillis(now - dayMs * 2),
      startedAt: Timestamp.fromMillis(now - dayMs * 2),
      endedAt: Timestamp.fromMillis(now - dayMs * 2 + 3600000),
    },

    // 9. LAN GAMES / CS MATCH 1: COMPLETED
    {
      id: 'match-lan-games-1',
      matchNumber: 1,
      sportId: 'lan-games',
      tournamentId: 'olympia-championship-2k26',
      venueId: 'esports-dome',
      round: 'Grand Final',
      teamAId: 'team-lan-games-frag-ninjas',
      teamBId: 'team-lan-games-k-strike',
      participantA: { id: 'team-lan-games-frag-ninjas', name: 'Frag Ninjas', shortName: 'FN' },
      participantB: { id: 'team-lan-games-k-strike', name: 'K-Strike', shortName: 'KS' },
      status: 'completed',
      score: { teamA: 16, teamB: 12, details: { map: 'Inferno', roundsA: 16, roundsB: 12 } },
      liveState: { clock: 'COMPLETED', period: 'Match Ended' },
      featured: true,
      allowVoting: true,
      allowReactions: true,
      allowRatings: true,
      allowReviews: true,
      scheduledAt: Timestamp.fromMillis(now - dayMs),
      startedAt: Timestamp.fromMillis(now - dayMs),
      endedAt: Timestamp.fromMillis(now - dayMs + 5400000),
    },

    // 10. FOOTBALL MATCH 4: UPCOMING / SCHEDULED
    {
      id: 'match-football-4',
      matchNumber: 4,
      sportId: 'football',
      tournamentId: 'olympia-championship-2k26',
      venueId: 'main-arena',
      round: 'Grand Final',
      teamAId: 'team-football-reign-fc',
      teamBId: 'team-football-apex-attackers',
      participantA: { id: 'team-football-reign-fc', name: 'Reign FC', shortName: 'RFC' },
      participantB: { id: 'team-football-apex-attackers', name: 'Apex Attackers', shortName: 'AA' },
      status: 'upcoming',
      score: { teamA: 0, teamB: 0 },
      liveState: { clock: 'SCHEDULED', period: 'Period 1' },
      featured: true,
      allowVoting: true,
      allowReactions: true,
      allowRatings: true,
      allowReviews: true,
      scheduledAt: Timestamp.fromMillis(now + dayMs * 2),
      startedAt: null,
      endedAt: null,
    },
  ];

  // Batch write matches
  const matchBatch = db.batch();
  for (const m of matches) {
    matchBatch.set(
      db.doc(`matches/${m.id}`),
      { ...m, createdAt: Timestamp.now(), updatedAt: Timestamp.now() },
      { merge: true }
    );
  }
  await matchBatch.commit();
  console.log(`  ✅ ${matches.length} matches written`);

  // Batch write fixtures
  const fixtureBatch = db.batch();
  for (const m of matches) {
    const fixtureId = `fix-${m.id}`;
    const fixtureDoc = {
      id: fixtureId,
      matchId: m.id,
      tournamentId: m.tournamentId,
      sportId: m.sportId,
      round: m.round,
      order: m.matchNumber,
      teamAId: m.teamAId,
      teamBId: m.teamBId,
      venueId: m.venueId,
      scheduledAt: m.scheduledAt,
      status: m.status,
      isHidden: false,
      createdAt: Timestamp.now(),
    };
    fixtureBatch.set(db.doc(`fixtures/${fixtureId}`), fixtureDoc, { merge: true });
  }
  await fixtureBatch.commit();
  console.log(`  ✅ ${matches.length} fixtures written`);

  // Seed events timeline for match-football-1
  const events = [
    { id: 'ev-1', sequence: 1, type: 'kickoff', team: 'teamA', teamName: 'Reign FC', description: 'Referee signals kickoff! Match underway.', minute: 1 },
    { id: 'ev-2', sequence: 2, type: 'goal', team: 'teamA', teamName: 'Reign FC', playerName: 'Sam', description: '⚽ GOAL! Reign FC (Sam)', scoreDelta: { teamA: 1 }, snapshot: { score: { teamA: 1, teamB: 0 } }, minute: 18 },
    { id: 'ev-3', sequence: 3, type: 'yellow_card', team: 'teamB', teamName: 'Apex Attackers', description: '🟨 Yellow Card · Tactical foul', minute: 34 },
    { id: 'ev-4', sequence: 4, type: 'goal', team: 'teamB', teamName: 'Apex Attackers', description: '⚽ GOAL! Apex Attackers equalizes!', scoreDelta: { teamB: 1 }, snapshot: { score: { teamA: 1, teamB: 1 } }, minute: 42 },
    { id: 'ev-5', sequence: 5, type: 'half_time', description: '⏱️ Half-Time whistle. 1-1 at the break.', minute: 45 },
    { id: 'ev-6', sequence: 6, type: 'goal', team: 'teamA', teamName: 'Reign FC', playerName: 'Yash', description: '⚽ GOAL! Reign FC takes the lead! (Yash)', scoreDelta: { teamA: 1 }, snapshot: { score: { teamA: 2, teamB: 1 } }, minute: 61 },
    { id: 'ev-7', sequence: 7, type: 'goal', team: 'teamA', teamName: 'Reign FC', playerName: 'Rishi', description: '⚽ GOAL! Reign FC seals it! (Rishi)', scoreDelta: { teamA: 1 }, snapshot: { score: { teamA: 3, teamB: 1 } }, minute: 84 },
    { id: 'ev-8', sequence: 8, type: 'full_time', description: '🏁 Full-Time! Reign FC advances to the Semi-Finals 3-1!', minute: 90 },
  ];

  const evBatch = db.batch();
  for (const ev of events) {
    evBatch.set(db.doc(`matches/match-football-1/events/${ev.id}`), { ...ev, createdAt: Timestamp.now() }, { merge: true });
  }
  await evBatch.commit();
  console.log(`  ✅ ${events.length} match events written for match-football-1`);
}

async function seedLeaderboards() {
  console.log('🏆 Seeding leaderboards for all 11 disciplines...');

  const leaderboards = [
    {
      id: 'football',
      sportId: 'football',
      sportName: 'Football',
      category: 'team',
      lastUpdated: Timestamp.now(),
      autoGeneratedFromMatches: true,
      entries: [
        {
          position: 1,
          entityId: 'team-football-reign-fc',
          entityType: 'team',
          entityName: 'Reign FC',
          logo: '/logos/reign-fc.jpg',
          sportId: 'football',
          points: 10,
          wins: 3,
          draws: 1,
          losses: 0,
          stats: { played: 4, goalsFor: 11, goalsAgainst: 4, goalDifference: 7 },
        },
        {
          position: 2,
          entityId: 'team-football-apex-attackers',
          entityType: 'team',
          entityName: 'Apex Attackers',
          logo: '/logos/apex-attackers.jpg',
          sportId: 'football',
          points: 7,
          wins: 2,
          draws: 1,
          losses: 1,
          stats: { played: 4, goalsFor: 8, goalsAgainst: 6, goalDifference: 2 },
        },
        {
          position: 3,
          entityId: 'team-football-super-strikers',
          entityType: 'team',
          entityName: 'Super Strikers',
          logo: '/logos/super-strikers.jpg',
          sportId: 'football',
          points: 4,
          wins: 1,
          draws: 1,
          losses: 2,
          stats: { played: 4, goalsFor: 5, goalsAgainst: 7, goalDifference: -2 },
        },
        {
          position: 4,
          entityId: 'team-football-shadow-strikers',
          entityType: 'team',
          entityName: 'Shadow Strikers',
          logo: '/logos/shadow-strikers.jpg',
          sportId: 'football',
          points: 1,
          wins: 0,
          draws: 1,
          losses: 3,
          stats: { played: 4, goalsFor: 3, goalsAgainst: 10, goalDifference: -7 },
        },
      ],
    },

    {
      id: 'cricket',
      sportId: 'cricket',
      sportName: 'Cricket',
      category: 'team',
      lastUpdated: Timestamp.now(),
      autoGeneratedFromMatches: true,
      entries: [
        {
          position: 1,
          entityId: 'team-cricket-ronin-xi',
          entityType: 'team',
          entityName: 'Ronin XI',
          logo: '/logos/ronin-xi.png',
          sportId: 'cricket',
          points: 6,
          wins: 3,
          draws: 0,
          losses: 0,
          stats: { played: 3, runs: 530, wickets: 24, netRunRate: '+1.650' },
        },
        {
          position: 2,
          entityId: 'team-cricket-boundary-breakers',
          entityType: 'team',
          entityName: 'Boundary Breakers',
          logo: '/logos/boundary-breakers.jpg',
          sportId: 'cricket',
          points: 4,
          wins: 2,
          draws: 0,
          losses: 1,
          stats: { played: 3, runs: 480, wickets: 19, netRunRate: '+0.420' },
        },
        {
          position: 3,
          entityId: 'team-cricket-power-hitters',
          entityType: 'team',
          entityName: 'Power Hitters',
          logo: '/logos/power-hitters.jpg',
          sportId: 'cricket',
          points: 2,
          wins: 1,
          draws: 0,
          losses: 2,
          stats: { played: 3, runs: 440, wickets: 15, netRunRate: '-0.210' },
        },
        {
          position: 4,
          entityId: 'team-cricket-legendary-lions',
          entityType: 'team',
          entityName: 'Legendary Lions',
          logo: '/logos/legendary-lions.jpg',
          sportId: 'cricket',
          points: 0,
          wins: 0,
          draws: 0,
          losses: 3,
          stats: { played: 3, runs: 390, wickets: 12, netRunRate: '-1.860' },
        },
      ],
    },

    {
      id: 'volleyball',
      sportId: 'volleyball',
      sportName: 'Volleyball',
      category: 'team',
      lastUpdated: Timestamp.now(),
      autoGeneratedFromMatches: true,
      entries: [
        {
          position: 1,
          entityId: 'team-volleyball-gc-spikers',
          entityType: 'team',
          entityName: 'GC Spikers',
          logo: '/logos/gc-spikers.png',
          sportId: 'volleyball',
          points: 8,
          wins: 4,
          draws: 0,
          losses: 0,
          stats: { played: 4, setsWon: 8, setsLost: 1 },
        },
        {
          position: 2,
          entityId: 'team-volleyball-spike-warriors',
          entityType: 'team',
          entityName: 'Spike Warriors',
          logo: '/logos/spike-warriors.jpg',
          sportId: 'volleyball',
          points: 6,
          wins: 3,
          draws: 0,
          losses: 1,
          stats: { played: 4, setsWon: 6, setsLost: 3 },
        },
        {
          position: 3,
          entityId: 'team-volleyball-shadow-spikers',
          entityType: 'team',
          entityName: 'Shadow Spikers',
          logo: '/logos/shadow-spikers.png',
          sportId: 'volleyball',
          points: 4,
          wins: 2,
          draws: 0,
          losses: 2,
          stats: { played: 4, setsWon: 5, setsLost: 5 },
        },
        {
          position: 4,
          entityId: 'team-volleyball-vedant-spikers',
          entityType: 'team',
          entityName: 'Vedant Spikers',
          logo: '/logos/vedant-spikers.jpg',
          sportId: 'volleyball',
          points: 2,
          wins: 1,
          draws: 0,
          losses: 3,
          stats: { played: 4, setsWon: 3, setsLost: 7 },
        },
      ],
    },

    {
      id: 'hand-tennis',
      sportId: 'hand-tennis',
      sportName: 'Hand Tennis',
      category: 'team',
      lastUpdated: Timestamp.now(),
      autoGeneratedFromMatches: true,
      entries: [
        {
          position: 1,
          entityId: 'team-hand-tennis-power-palm',
          entityType: 'team',
          entityName: 'Power Palm',
          logo: '/logos/power-palm.jpg',
          sportId: 'hand-tennis',
          points: 6,
          wins: 3,
          draws: 0,
          losses: 0,
          stats: { played: 3 },
        },
        {
          position: 2,
          entityId: 'team-hand-tennis-court-kings',
          entityType: 'team',
          entityName: 'Court Kings',
          logo: '/logos/court-kings.jpg',
          sportId: 'hand-tennis',
          points: 4,
          wins: 2,
          draws: 0,
          losses: 1,
          stats: { played: 3 },
        },
        {
          position: 3,
          entityId: 'team-hand-tennis-hand-hitters',
          entityType: 'team',
          entityName: 'Hand Hitters',
          logo: '/logos/hand-hitters.jpg',
          sportId: 'hand-tennis',
          points: 2,
          wins: 1,
          draws: 0,
          losses: 2,
          stats: { played: 3 },
        },
        {
          position: 4,
          entityId: 'team-hand-tennis-net-warriors',
          entityType: 'team',
          entityName: 'Net Warriors',
          logo: '/logos/net-warriors.jpg',
          sportId: 'hand-tennis',
          points: 0,
          wins: 0,
          draws: 0,
          losses: 3,
          stats: { played: 3 },
        },
      ],
    },

    {
      id: 'lan-games',
      sportId: 'lan-games',
      sportName: 'LAN Games',
      category: 'team',
      lastUpdated: Timestamp.now(),
      autoGeneratedFromMatches: true,
      entries: [
        {
          position: 1,
          entityId: 'team-lan-games-frag-ninjas',
          entityType: 'team',
          entityName: 'Frag Ninjas',
          logo: '/logos/frag-ninjas.jpg',
          sportId: 'lan-games',
          points: 8,
          wins: 4,
          draws: 0,
          losses: 0,
          stats: { played: 4, roundsWon: 64, roundsLost: 41 },
        },
        {
          position: 2,
          entityId: 'team-lan-games-k-strike',
          entityType: 'team',
          entityName: 'K-Strike',
          logo: '/logos/k-strike.png',
          sportId: 'lan-games',
          points: 6,
          wins: 3,
          draws: 0,
          losses: 1,
          stats: { played: 4, roundsWon: 58, roundsLost: 49 },
        },
        {
          position: 3,
          entityId: 'team-lan-games-shadow-x',
          entityType: 'team',
          entityName: 'Shadow X',
          logo: '/logos/shadow-x.jpg',
          sportId: 'lan-games',
          points: 4,
          wins: 2,
          draws: 0,
          losses: 2,
          stats: { played: 4, roundsWon: 54, roundsLost: 56 },
        },
        {
          position: 4,
          entityId: 'team-lan-games-vortex-aces',
          entityType: 'team',
          entityName: 'Vortex Aces',
          logo: '/logos/vortex-aces.jpg',
          sportId: 'lan-games',
          points: 2,
          wins: 1,
          draws: 0,
          losses: 3,
          stats: { played: 4, roundsWon: 45, roundsLost: 62 },
        },
      ],
    },

    {
      id: 'counter-strike',
      sportId: 'counter-strike',
      sportName: 'Counter-Strike',
      category: 'team',
      lastUpdated: Timestamp.now(),
      autoGeneratedFromMatches: true,
      entries: [
        {
          position: 1,
          entityId: 'team-lan-games-frag-ninjas',
          entityType: 'team',
          entityName: 'Frag Ninjas',
          logo: '/logos/frag-ninjas.jpg',
          sportId: 'counter-strike',
          points: 8,
          wins: 4,
          draws: 0,
          losses: 0,
          stats: { played: 4, roundsWon: 64, roundsLost: 41 },
        },
        {
          position: 2,
          entityId: 'team-lan-games-k-strike',
          entityType: 'team',
          entityName: 'K-Strike',
          logo: '/logos/k-strike.png',
          sportId: 'counter-strike',
          points: 6,
          wins: 3,
          draws: 0,
          losses: 1,
          stats: { played: 4, roundsWon: 58, roundsLost: 49 },
        },
        {
          position: 3,
          entityId: 'team-lan-games-shadow-x',
          entityType: 'team',
          entityName: 'Shadow X',
          logo: '/logos/shadow-x.jpg',
          sportId: 'counter-strike',
          points: 4,
          wins: 2,
          draws: 0,
          losses: 2,
          stats: { played: 4, roundsWon: 54, roundsLost: 56 },
        },
      ],
    },

    {
      id: 'smash-karts',
      sportId: 'smash-karts',
      sportName: 'Smash Karts',
      category: 'team',
      lastUpdated: Timestamp.now(),
      autoGeneratedFromMatches: true,
      entries: [
        {
          position: 1,
          entityId: 'team-lan-games-frag-ninjas',
          entityType: 'team',
          entityName: 'Frag Ninjas Racing',
          logo: '/logos/frag-ninjas.jpg',
          sportId: 'smash-karts',
          points: 24,
          wins: 6,
          draws: 0,
          losses: 1,
          stats: { played: 7 },
        },
        {
          position: 2,
          entityId: 'team-lan-games-vortex-aces',
          entityType: 'team',
          entityName: 'Vortex Aces GP',
          logo: '/logos/vortex-aces.jpg',
          sportId: 'smash-karts',
          points: 18,
          wins: 4,
          draws: 0,
          losses: 3,
          stats: { played: 7 },
        },
      ],
    },

    // INDIVIDUAL DISCIPLINES (Top 3 Podium)
    {
      id: 'badminton',
      sportId: 'badminton',
      sportName: 'Badminton',
      category: 'individual',
      lastUpdated: Timestamp.now(),
      autoGeneratedFromMatches: true,
      entries: [
        {
          position: 1,
          entityId: 'player-badminton-aryan-patel',
          entityType: 'player',
          entityName: 'Aryan Patel',
          logo: '',
          sportId: 'badminton',
          points: 15,
          wins: 5,
          losses: 0,
          draws: 0,
          stats: { played: 5, setsWon: 10, setsLost: 2 },
        },
        {
          position: 2,
          entityId: 'player-badminton-rohan-desai',
          entityType: 'player',
          entityName: 'Rohan Desai',
          logo: '',
          sportId: 'badminton',
          points: 12,
          wins: 4,
          losses: 1,
          draws: 0,
          stats: { played: 5, setsWon: 8, setsLost: 4 },
        },
        {
          position: 3,
          entityId: 'player-badminton-tanmay-shah',
          entityType: 'player',
          entityName: 'Tanmay Shah',
          logo: '',
          sportId: 'badminton',
          points: 9,
          wins: 3,
          losses: 2,
          draws: 0,
          stats: { played: 5, setsWon: 6, setsLost: 5 },
        },
      ],
    },

    {
      id: 'table-tennis',
      sportId: 'table-tennis',
      sportName: 'Table Tennis',
      category: 'individual',
      lastUpdated: Timestamp.now(),
      autoGeneratedFromMatches: true,
      entries: [
        {
          position: 1,
          entityId: 'player-table-tennis-siddharth-mehta',
          entityType: 'player',
          entityName: 'Siddharth Mehta',
          logo: '',
          sportId: 'table-tennis',
          points: 18,
          wins: 6,
          losses: 0,
          draws: 0,
          stats: { played: 6, setsWon: 18, setsLost: 3 },
        },
        {
          position: 2,
          entityId: 'player-table-tennis-kevin-shah',
          entityType: 'player',
          entityName: 'Kevin Shah',
          logo: '',
          sportId: 'table-tennis',
          points: 15,
          wins: 5,
          losses: 1,
          draws: 0,
          stats: { played: 6, setsWon: 15, setsLost: 6 },
        },
        {
          position: 3,
          entityId: 'player-table-tennis-manav-joshi',
          entityType: 'player',
          entityName: 'Manav Joshi',
          logo: '',
          sportId: 'table-tennis',
          points: 12,
          wins: 4,
          losses: 2,
          draws: 0,
          stats: { played: 6, setsWon: 13, setsLost: 9 },
        },
      ],
    },

    {
      id: 'chess',
      sportId: 'chess',
      sportName: 'Chess',
      category: 'individual',
      lastUpdated: Timestamp.now(),
      autoGeneratedFromMatches: true,
      entries: [],
    },

    {
      id: 'carrom',
      sportId: 'carrom',
      sportName: 'Carrom',
      category: 'individual',
      lastUpdated: Timestamp.now(),
      autoGeneratedFromMatches: true,
      entries: [
        {
          position: 1,
          entityId: 'player-carrom-meet-patel',
          entityType: 'player',
          entityName: 'Meet Patel',
          logo: '',
          sportId: 'carrom',
          points: 14,
          wins: 5,
          losses: 0,
          draws: 0,
          stats: { played: 5, whiteCoins: 48, queens: 5 },
        },
        {
          position: 2,
          entityId: 'player-carrom-neel-soni',
          entityType: 'player',
          entityName: 'Neel Soni',
          logo: '',
          sportId: 'carrom',
          points: 11,
          wins: 4,
          losses: 1,
          draws: 0,
          stats: { played: 5, whiteCoins: 39, queens: 3 },
        },
        {
          position: 3,
          entityId: 'player-carrom-raj-rathod',
          entityType: 'player',
          entityName: 'Raj Rathod',
          logo: '',
          sportId: 'carrom',
          points: 8,
          wins: 3,
          losses: 2,
          draws: 0,
          stats: { played: 5, whiteCoins: 32, queens: 2 },
        },
      ],
    },
  ];

  const batch = db.batch();
  for (const lb of leaderboards) {
    batch.set(db.doc(`leaderboards/${lb.id}`), lb, { merge: true });
  }
  await batch.commit();
  console.log(`  ✅ ${leaderboards.length} leaderboards written`);
}

async function seedEngagement() {
  console.log('❤️  Seeding fan engagement (reactions, votes, reviews, ratings)...');

  const matchIds = ['match-football-1', 'match-football-2', 'match-football-3', 'match-cricket-1', 'match-cricket-2', 'match-cricket-3', 'match-lan-games-1'];
  const rxTypes = ['fire', 'clap', 'lightning', 'heart', 'wow', 'trophy', 'muscle'];

  for (const mId of matchIds) {
    // 1. Reactions
    const rxCounts = { fire: 14 + Math.floor(Math.random() * 20), clap: 12 + Math.floor(Math.random() * 15), lightning: 18 + Math.floor(Math.random() * 25), heart: 9 + Math.floor(Math.random() * 12), wow: 6 + Math.floor(Math.random() * 8), trophy: 15 + Math.floor(Math.random() * 18), muscle: 11 + Math.floor(Math.random() * 14) };
    const rxTotal = Object.values(rxCounts).reduce((a, b) => a + b, 0);

    await db.doc(`match_reactions/${mId}`).set({ ...rxCounts, total: rxTotal, matchId: mId }, { merge: true });

    // Individual reaction docs in subcollection
    const rxBatch = db.batch();
    for (let i = 1; i <= 15; i++) {
      const uId = `fan_${mId}_${i}`;
      const type = rxTypes[i % rxTypes.length];
      rxBatch.set(db.doc(`matches/${mId}/reactions/${uId}`), {
        matchId: mId,
        userId: uId,
        type,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }, { merge: true });
    }
    await rxBatch.commit();

    // 2. Voting
    const voteA = 28 + Math.floor(Math.random() * 30);
    const voteB = 22 + Math.floor(Math.random() * 25);
    await db.doc(`match_voting/${mId}`).set({ A: voteA, B: voteB, teamA: voteA, teamB: voteB, total: voteA + voteB, matchId: mId }, { merge: true });

    const voteBatch = db.batch();
    for (let i = 1; i <= 20; i++) {
      const uId = `voter_${mId}_${i}`;
      const choice = i % 2 === 0 ? 'A' : 'B';
      voteBatch.set(db.doc(`matches/${mId}/votes/${uId}`), {
        matchId: mId,
        userId: uId,
        selectedTeam: choice,
        teamId: choice,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }, { merge: true });
    }
    await voteBatch.commit();

    // 3. Reviews
    const sampleReviews = [
      { text: 'Incredible atmosphere and high intensity from both sides!', rating: 5, user: 'Spectator_92' },
      { text: 'Outstanding tactical execution and great individual moments.', rating: 5, user: 'ArenaFan_44' },
      { text: 'One of the best matchups of Olympia 2K26 so far.', rating: 4, user: 'CampusCheer' },
      { text: 'Super thrilling finish right down to the final minutes!', rating: 5, user: 'VibeWatcher' },
    ];
    const revBatch = db.batch();
    sampleReviews.forEach((rev, idx) => {
      const uId = `rev_${mId}_${idx + 1}`;
      revBatch.set(db.doc(`matches/${mId}/reviews/${uId}`), {
        id: uId,
        matchId: mId,
        userId: uId,
        displayName: rev.user,
        rating: rev.rating,
        text: rev.text,
        content: rev.text,
        status: 'approved',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }, { merge: true });
    });
    await revBatch.commit();

    // 4. Ratings for athletes
    const playerRatings = [
      { id: 'p_rating_1', score: 5 },
      { id: 'p_rating_2', score: 4 },
      { id: 'p_rating_3', score: 5 },
    ];
    const ratBatch = db.batch();
    playerRatings.forEach((pr, idx) => {
      const uId = `rater_${mId}_${idx + 1}`;
      const athleteId = `athlete_${idx + 1}`;
      ratBatch.set(db.doc(`matches/${mId}/players/${athleteId}/ratings/${uId}`), {
        matchId: mId,
        playerId: athleteId,
        userId: uId,
        score: pr.score,
        rating: pr.score,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }, { merge: true });
    });
    await ratBatch.commit();
  }

  console.log(`  ✅ Engagement seeded for ${matchIds.length} matches`);
}

async function run() {
  console.log('============================================================');
  console.log('🌟 OLYMPIA 2K26 — MASTER PRODUCTION SEEDING');
  console.log('============================================================\n');

  try {
    await seedSettings();
    await seedAnnouncements();
    await seedMatchesAndFixtures();
    await seedLeaderboards();
    await seedEngagement();

    console.log('\n============================================================');
    console.log('🎉 ALL PRODUCTION COLLECTIONS AND DATA SEEDED SUCCESSFULLY!');
    console.log('============================================================');
    console.log('• settings/default:      Created with full configuration');
    console.log('• announcements:         4 official announcements active');
    console.log('• fixtures:              10 fixtures scheduled and linked');
    console.log('• matches:               Completed, Live & Scheduled matches with scores');
    console.log('• events:                Real match timeline events written');
    console.log('• leaderboards:          All 11 disciplines seeded');
    console.log('• fan engagement:        Reactions, Votes, Reviews & Ratings seeded');
    console.log('============================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

run();
