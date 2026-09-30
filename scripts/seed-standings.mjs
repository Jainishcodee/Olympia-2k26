/**
 * OLYMPIA 2K26 — Realtime Championship Standings Seeder
 * Populates realistic, dynamic standings in Firestore for:
 * 1. 24 Teams across Football, Cricket, Volleyball, Hand Tennis, LAN Games
 * 2. Top 3 Individual Athletes across Badminton, Table Tennis, Chess, Carrom
 * 
 * All data connects directly to Firestore and reflects in Admin Panel.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, updateDoc, setDoc, Timestamp } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const jsonPath = path.join(rootDir, 'src', 'config', 'firebaseConfig.json');
const config = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const app = initializeApp(config);
const db = getFirestore(app);

// 1. Team Championship Standings with sport-specific metrics
const TEAM_STANDINGS = {
  // Football: Matches, Wins, Draws, Losses, Goals For, Goals Against, Goal Diff, Points
  'team-football-reign-fc': {
    points: 31, wins: 10, draws: 1, losses: 1,
    goalsFor: 28, goalsAgainst: 9, goalDifference: 19,
    matchesPlayed: 12
  },
  'team-football-super-strikers': {
    points: 28, wins: 9, draws: 1, losses: 2,
    goalsFor: 25, goalsAgainst: 12, goalDifference: 13,
    matchesPlayed: 12
  },
  'team-football-vedant-blackfangs': {
    points: 24, wins: 7, draws: 3, losses: 2,
    goalsFor: 21, goalsAgainst: 14, goalDifference: 7,
    matchesPlayed: 12
  },
  'team-football-shadow-strikers': {
    points: 16, wins: 5, draws: 1, losses: 6,
    goalsFor: 15, goalsAgainst: 18, goalDifference: -3,
    matchesPlayed: 12
  },

  // Cricket: Matches, Wins, Losses, Net Run Rate, Points
  'team-cricket-ronin-xi': {
    points: 28, wins: 9, draws: 0, losses: 1,
    netRunRate: '+2.14', runs: 1140, wickets: 68,
    matchesPlayed: 10
  },
  'team-cricket-power-hitters': {
    points: 24, wins: 8, draws: 0, losses: 2,
    netRunRate: '+1.65', runs: 1080, wickets: 62,
    matchesPlayed: 10
  },
  'team-cricket-legendary-lions': {
    points: 18, wins: 6, draws: 0, losses: 4,
    netRunRate: '+0.42', runs: 950, wickets: 54,
    matchesPlayed: 10
  },
  'team-cricket-boundary-breakers': {
    points: 12, wins: 4, draws: 0, losses: 6,
    netRunRate: '-0.88', runs: 880, wickets: 45,
    matchesPlayed: 10
  },

  // Volleyball: Matches, Wins, Losses, Sets Won, Sets Lost, Points
  'team-volleyball-spike-warriors': {
    points: 30, wins: 10, draws: 0, losses: 1,
    setsWon: 22, setsLost: 5, setRatio: '4.40',
    matchesPlayed: 11
  },
  'team-volleyball-jinus-smashers': {
    points: 27, wins: 9, draws: 0, losses: 2,
    setsWon: 20, setsLost: 8, setRatio: '2.50',
    matchesPlayed: 11
  },
  'team-volleyball-net-warriors': {
    points: 21, wins: 7, draws: 0, losses: 4,
    setsWon: 16, setsLost: 11, setRatio: '1.45',
    matchesPlayed: 11
  },
  'team-volleyball-vedant-spikers': {
    points: 18, wins: 6, draws: 0, losses: 5,
    setsWon: 14, setsLost: 13, setRatio: '1.07',
    matchesPlayed: 11
  },
  'team-volleyball-vortex-aces': {
    points: 12, wins: 4, draws: 0, losses: 7,
    setsWon: 10, setsLost: 16, setRatio: '0.62',
    matchesPlayed: 11
  },
  'team-volleyball-vraj-ke-veterans': {
    points: 6, wins: 2, draws: 0, losses: 9,
    setsWon: 6, setsLost: 20, setRatio: '0.30',
    matchesPlayed: 11
  },

  // Hand Tennis: Matches, Wins, Losses, Sets/Points, Championship Points
  'team-hand-tennis-court-kings': {
    points: 32, wins: 11, draws: 0, losses: 1,
    setsWon: 24, setsLost: 4, pointsDiff: '+124',
    matchesPlayed: 12
  },
  'team-hand-tennis-hand-hitters': {
    points: 29, wins: 10, draws: 0, losses: 2,
    setsWon: 21, setsLost: 7, pointsDiff: '+98',
    matchesPlayed: 12
  },
  'team-hand-tennis-power-palm': {
    points: 24, wins: 8, draws: 0, losses: 4,
    setsWon: 18, setsLost: 10, pointsDiff: '+62',
    matchesPlayed: 12
  },
  'team-hand-tennis-g-c-spikers': {
    points: 18, wins: 6, draws: 0, losses: 6,
    setsWon: 14, setsLost: 14, pointsDiff: '0',
    matchesPlayed: 12
  },
  'team-hand-tennis-shadow-spikers': {
    points: 12, wins: 4, draws: 0, losses: 8,
    setsWon: 10, setsLost: 18, pointsDiff: '-48',
    matchesPlayed: 12
  },
  'team-hand-tennis-shadow-x': {
    points: 6, wins: 2, draws: 0, losses: 10,
    setsWon: 6, setsLost: 22, pointsDiff: '-110',
    matchesPlayed: 12
  },

  // LAN Games: Matches, Wins, Losses, Rounds/Maps, Points
  'team-lan-games-k-strike': {
    points: 33, wins: 11, draws: 0, losses: 1,
    roundsWon: 142, roundsLost: 68, mapDifference: '+18',
    matchesPlayed: 12
  },
  'team-lan-games-apex-attackers': {
    points: 27, wins: 9, draws: 0, losses: 3,
    roundsWon: 128, roundsLost: 85, mapDifference: '+12',
    matchesPlayed: 12
  },
  'team-lan-games-frag-ninjas': {
    points: 21, wins: 7, draws: 0, losses: 5,
    roundsWon: 110, roundsLost: 98, mapDifference: '+4',
    matchesPlayed: 12
  },
  'team-lan-games-laggas-legends': {
    points: 12, wins: 4, draws: 0, losses: 8,
    roundsWon: 82, roundsLost: 124, mapDifference: '-14',
    matchesPlayed: 12
  }
};

// 2. Top 3 Individual Sport Athletes for Badminton, Table Tennis, Chess, Carrom
const INDIVIDUAL_ATHLETES = [
  // Badminton Top 3
  {
    id: 'player-badminton-saurav-gupta',
    name: 'Saurav Gupta',
    sportId: 'badminton',
    role: 'player',
    position: 'Singles Ace',
    gender: 'male',
    active: true,
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
    bio: 'Reigning Olympia Badminton Champion with an unstoppable smash velocity and court coverage.',
    stats: {
      points: 1240,
      matchesPlayed: 12,
      wins: 11,
      losses: 1,
      rating: 4.9,
      goals: 0,
      assists: 0,
      runs: 0,
      wickets: 0
    }
  },
  {
    id: 'player-badminton-rohan-sen',
    name: 'Rohan Sen',
    sportId: 'badminton',
    role: 'player',
    position: 'Singles Contender',
    gender: 'male',
    active: true,
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
    bio: 'Silver medalist known for rapid net play and clinical dropshots.',
    stats: {
      points: 1180,
      matchesPlayed: 12,
      wins: 10,
      losses: 2,
      rating: 4.8,
      goals: 0,
      assists: 0,
      runs: 0,
      wickets: 0
    }
  },
  {
    id: 'player-badminton-pranav-nair',
    name: 'Pranav Nair',
    sportId: 'badminton',
    role: 'player',
    position: 'Singles Contender',
    gender: 'male',
    active: true,
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80',
    bio: 'Dynamic defensive specialist with high rally endurance.',
    stats: {
      points: 1120,
      matchesPlayed: 11,
      wins: 9,
      losses: 2,
      rating: 4.7,
      goals: 0,
      assists: 0,
      runs: 0,
      wickets: 0
    }
  },

  // Table Tennis Top 3
  {
    id: 'player-table-tennis-manav-thakkar',
    name: 'Manav Thakkar',
    sportId: 'table-tennis',
    role: 'player',
    position: 'Attacking Loop Specialist',
    gender: 'male',
    active: true,
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80',
    bio: 'Undisputed Table Tennis #01 seed with devastating forehand topspin and backhand flips.',
    stats: {
      points: 1290,
      matchesPlayed: 14,
      wins: 13,
      losses: 1,
      rating: 4.9,
      goals: 0,
      assists: 0,
      runs: 0,
      wickets: 0
    }
  },
  {
    id: 'player-table-tennis-yashaswini-g',
    name: 'Yashaswini Ghorpade',
    sportId: 'table-tennis',
    role: 'player',
    position: 'Counter-Puncher',
    gender: 'female',
    active: true,
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=80',
    bio: 'Tenacious counter-driver with exceptional close-to-the-table reflexes.',
    stats: {
      points: 1220,
      matchesPlayed: 13,
      wins: 11,
      losses: 2,
      rating: 4.8,
      goals: 0,
      assists: 0,
      runs: 0,
      wickets: 0
    }
  },
  {
    id: 'player-table-tennis-ayhika-mukherjee',
    name: 'Ayhika Mukherjee',
    sportId: 'table-tennis',
    role: 'player',
    position: 'Pips Tactician',
    gender: 'female',
    active: true,
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80',
    bio: 'Unorthodox defensive master whose anti-spin returns disrupt fast attackers.',
    stats: {
      points: 1160,
      matchesPlayed: 12,
      wins: 10,
      losses: 2,
      rating: 4.7,
      goals: 0,
      assists: 0,
      runs: 0,
      wickets: 0
    }
  },

  // Chess Top 3
  {
    id: 'player-chess-nihal-sarin',
    name: 'Nihal Sarin',
    sportId: 'chess',
    role: 'player',
    position: 'Grandmaster / #1 Seed',
    gender: 'male',
    active: true,
    photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80',
    bio: 'Speed chess prodigy with flawless endgame calculation and time scramble mastery.',
    stats: {
      points: 1480,
      matchesPlayed: 15,
      wins: 14,
      losses: 1,
      rating: 5.0,
      goals: 0,
      assists: 0,
      runs: 0,
      wickets: 0
    }
  },
  {
    id: 'player-chess-praggnanandhaa',
    name: 'R. Praggnanandhaa',
    sportId: 'chess',
    role: 'player',
    position: 'Grandmaster',
    gender: 'male',
    active: true,
    photo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=800&auto=format&fit=crop&q=80',
    bio: 'Deep opening preparation and relentless positional squeeze against elite opposition.',
    stats: {
      points: 1420,
      matchesPlayed: 15,
      wins: 13,
      losses: 2,
      rating: 4.9,
      goals: 0,
      assists: 0,
      runs: 0,
      wickets: 0
    }
  },
  {
    id: 'player-chess-gukesh-d',
    name: 'D. Gukesh',
    sportId: 'chess',
    role: 'player',
    position: 'Grandmaster',
    gender: 'male',
    active: true,
    photo: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=800&auto=format&fit=crop&q=80',
    bio: 'World championship challenger with unmatched tactical vision and fearless complications.',
    stats: {
      points: 1390,
      matchesPlayed: 14,
      wins: 12,
      losses: 2,
      rating: 4.9,
      goals: 0,
      assists: 0,
      runs: 0,
      wickets: 0
    }
  },

  // Carrom Top 3
  {
    id: 'player-carrom-k-srinivas',
    name: 'K. Srinivas',
    sportId: 'carrom',
    role: 'player',
    position: 'National Champion',
    gender: 'male',
    active: true,
    photo: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=800&auto=format&fit=crop&q=80',
    bio: 'White slam maestro with legendary double-pocket cut shots and thumb rebound precision.',
    stats: {
      points: 1190,
      matchesPlayed: 12,
      wins: 11,
      losses: 1,
      rating: 4.9,
      goals: 0,
      assists: 0,
      runs: 0,
      wickets: 0
    }
  },
  {
    id: 'player-carrom-prashant-more',
    name: 'Prashant More',
    sportId: 'carrom',
    role: 'player',
    position: 'Board Master',
    gender: 'male',
    active: true,
    photo: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=800&auto=format&fit=crop&q=80',
    bio: 'Master of defensive board manipulation and clinical center carrom strikes.',
    stats: {
      points: 1140,
      matchesPlayed: 12,
      wins: 10,
      losses: 2,
      rating: 4.7,
      goals: 0,
      assists: 0,
      runs: 0,
      wickets: 0
    }
  },
  {
    id: 'player-carrom-zaheer-pasha',
    name: 'Zaheer Pasha',
    sportId: 'carrom',
    role: 'player',
    position: 'Striker Specialist',
    gender: 'male',
    active: true,
    photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&auto=format&fit=crop&q=80',
    bio: 'Rapid striker execution with exceptional bank pocketing accuracy.',
    stats: {
      points: 1090,
      matchesPlayed: 11,
      wins: 9,
      losses: 2,
      rating: 4.6,
      goals: 0,
      assists: 0,
      runs: 0,
      wickets: 0
    }
  }
];

async function seedStandings() {
  console.log('--- 1. Updating 24 Team Standings in Firestore ---');
  for (const [teamId, stats] of Object.entries(TEAM_STANDINGS)) {
    try {
      const teamRef = doc(db, 'teams', teamId);
      await updateDoc(teamRef, {
        ...stats,
        updatedAt: Timestamp.now()
      });
      console.log(`Updated team ${teamId} -> pts: ${stats.points}`);
    } catch (err) {
      console.error(`Failed to update ${teamId}:`, err.message);
    }
  }

  console.log('\n--- 2. Seeding Top 3 Contenders for Individual Sports in Firestore ---');
  for (const p of INDIVIDUAL_ATHLETES) {
    try {
      const pRef = doc(db, 'players', p.id);
      await setDoc(pRef, {
        ...p,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }, { merge: true });
      console.log(`Seeded player ${p.id} (${p.name}) for ${p.sportId} -> pts: ${p.stats.points}`);
    } catch (err) {
      console.error(`Failed to seed player ${p.id}:`, err.message);
    }
  }

  console.log('\nAll Standings & Individual Top 3 successfully written to Firestore!');
}

seedStandings().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
