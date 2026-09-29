/**
 * ============================================================
 *  OLYMPIA 2K26 — CSV Data Seeder
 * ============================================================
 *
 *  Reads 5 sport CSV files from src/assets/ and seeds REAL
 *  team + player data into Firestore.
 *
 *  Also creates the initial admin account via Firebase Auth.
 *
 *  Usage:  node scripts/seed-csv.mjs
 * ============================================================
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// ────────────────────────────────────────────────────────────
//  1.  Load Firebase config
// ────────────────────────────────────────────────────────────
let config = {};

const jsonConfigPath = path.join(rootDir, 'src', 'config', 'firebaseConfig.json');
if (fs.existsSync(jsonConfigPath)) {
  try {
    const raw = fs.readFileSync(jsonConfigPath, 'utf8');
    config = JSON.parse(raw);
  } catch {
    // ignore
  }
}

if (!config.apiKey || config.apiKey === '') {
  const envPath = path.join(rootDir, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    for (const line of envContent.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
      if (match) {
        let val = (match[2] || '').trim().replace(/^['"](.*?)['"]$/, '$1');
        envVars[match[1]] = val;
      }
    }
    config = {
      apiKey: envVars.VITE_FIREBASE_API_KEY,
      authDomain: envVars.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: envVars.VITE_FIREBASE_PROJECT_ID,
      storageBucket: envVars.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: envVars.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: envVars.VITE_FIREBASE_APP_ID,
    };
  }
}

if (!config.apiKey || !config.projectId) {
  console.error('\n❌ Firebase config not found. Check src/config/firebaseConfig.json or .env\n');
  process.exit(1);
}

console.log(`\n🔥 Connecting to Firebase Project: "${config.projectId}"...\n`);

const app = initializeApp(config);
const db = getFirestore(app);
const auth = getAuth(app);

// ────────────────────────────────────────────────────────────
//  2.  CSV Parser (simple — handles quoted fields)
// ────────────────────────────────────────────────────────────
function parseCSV(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8').replace(/\r/g, '');
  const lines = raw.split('\n').filter((l) => l.trim() !== '');
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = vals[idx] || '';
    });
    rows.push(obj);
  }
  return rows;
}

function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

// ────────────────────────────────────────────────────────────
//  3.  Normalise sport name → sportId
// ────────────────────────────────────────────────────────────
const SPORT_MAP = {
  'Cricket': 'cricket',
  'Football': 'football',
  'Volleyball': 'volleyball',
  'Hand Tennis': 'hand-tennis',
  'LAN Games': 'lan-games',
};

// ────────────────────────────────────────────────────────────
//  4.  Read & merge all 5 CSVs
// ────────────────────────────────────────────────────────────
const CSV_FILES = [
  'cricket.csv',
  'football.csv',
  'volleyball.csv',
  'hand_tennis.csv',
  'lan_games.csv',
];

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function makeShortName(teamName) {
  // Take first 3 significant letters
  const words = teamName.replace(/[^a-zA-Z\s]/g, '').split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].substring(0, 3).toUpperCase();
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

console.log('📄 Reading CSV files...\n');

const allRows = [];
for (const csvFile of CSV_FILES) {
  const csvPath = path.join(rootDir, 'src', 'assets', csvFile);
  if (!fs.existsSync(csvPath)) {
    console.warn(`  ⚠️  File not found: ${csvFile} — skipping`);
    continue;
  }
  const rows = parseCSV(csvPath);
  console.log(`  ✅ ${csvFile.padEnd(20)} → ${rows.length} rows`);
  allRows.push(...rows);
}

console.log(`\n📊 Total rows across all CSVs: ${allRows.length}\n`);

// ────────────────────────────────────────────────────────────
//  5.  Build teams & players (deduplicated)
// ────────────────────────────────────────────────────────────

// Collect unique teams per sport
// Key = "<sport>__<team_name>" to handle same name across sports
const teamMap = new Map(); // key → team object
const teamPlayersMap = new Map(); // key → player[]
const globalPlayerSet = new Set(); // for dedup by "<name>__<sport>"

for (const row of allRows) {
  const sport = row['Sport'];
  const teamName = row['Team'];
  const captainName = row['Captain'];
  const playerName = row['Player'];
  const sportId = SPORT_MAP[sport] || slugify(sport);

  const teamKey = `${sportId}__${teamName}`;
  const playerKey = `${sportId}__${teamName}__${playerName}`;

  // Register team
  if (!teamMap.has(teamKey)) {
    const teamId = slugify(`${teamName}-${sportId}`);
    teamMap.set(teamKey, {
      id: teamId,
      name: teamName,
      shortName: makeShortName(teamName),
      sportId,
      captainName,
      description: `${teamName} — competing in ${sport} at Olympia 2K26`,
      active: true,
      wins: 0,
      losses: 0,
      draws: 0,
      points: 0,
      logo: '',
      coach: '',
      playerIds: [],
    });
    teamPlayersMap.set(teamKey, []);
  }

  // Register player (dedup within same team+sport)
  if (!globalPlayerSet.has(playerKey)) {
    globalPlayerSet.add(playerKey);
    const team = teamMap.get(teamKey);
    const isCaptain = playerName === captainName;
    const playerId = slugify(`${playerName}-${sportId}-${team.id}`).substring(0, 40);

    const player = {
      id: playerId,
      name: playerName,
      teamId: team.id,
      sportId,
      role: isCaptain ? 'captain' : 'player',
      position: '',
      photo: '',
      jerseyNumber: 0,
      gender: 'male',
      bio: '',
      active: true,
      stats: {
        matchesPlayed: 0,
        goals: 0,
        assists: 0,
        runs: 0,
        wickets: 0,
        points: 0,
        wins: 0,
        losses: 0,
        rating: 0,
      },
    };

    teamPlayersMap.get(teamKey).push(player);
    team.playerIds.push(playerId);

    if (isCaptain) {
      team.captainId = playerId;
    }
  }
}

// Ensure captainId is set for every team
for (const [, team] of teamMap) {
  if (!team.captainId && team.playerIds.length > 0) {
    team.captainId = team.playerIds[0];
  }
  team.viceCaptainId = team.playerIds.length > 1 ? team.playerIds[1] : (team.captainId || '');
  // Clean up temporary field
  delete team.captainName;
}

const teams = Array.from(teamMap.values());
const players = Array.from(teamPlayersMap.values()).flat();

console.log(`🏟️  Teams extracted:   ${teams.length}`);
console.log(`🏃 Players extracted: ${players.length}`);
console.log(`🎯 Sports covered:    ${[...new Set(teams.map((t) => t.sportId))].join(', ')}\n`);

// ────────────────────────────────────────────────────────────
//  6.  Sports data (updated to include LAN Games)
// ────────────────────────────────────────────────────────────
const SPORTS = [
  { id: 'football', name: 'Football', slug: 'football', icon: '⚽', description: 'The beautiful game. 11v11 on the pitch.', active: true, scoringType: 'goals', teamBased: true, maxPlayersPerTeam: 18, minPlayersPerTeam: 11 },
  { id: 'cricket', name: 'Cricket', slug: 'cricket', icon: '🏏', description: 'Bat meets ball. Strategic team sport.', active: true, scoringType: 'runs', teamBased: true, maxPlayersPerTeam: 15, minPlayersPerTeam: 11 },
  { id: 'badminton', name: 'Badminton', slug: 'badminton', icon: '🏸', description: 'Speed and precision on the court.', active: true, scoringType: 'games_points', teamBased: false, maxPlayersPerTeam: 2, minPlayersPerTeam: 1 },
  { id: 'volleyball', name: 'Volleyball', slug: 'volleyball', icon: '🏐', description: 'Spike, set, and serve to victory.', active: true, scoringType: 'sets_points', teamBased: true, maxPlayersPerTeam: 12, minPlayersPerTeam: 6 },
  { id: 'hand-tennis', name: 'Hand Tennis', slug: 'hand-tennis', icon: '✋', description: 'Fast-paced hand tennis action.', active: true, scoringType: 'configurable', teamBased: true, maxPlayersPerTeam: 8, minPlayersPerTeam: 2 },
  { id: 'table-tennis', name: 'Table Tennis', slug: 'table-tennis', icon: '🏓', description: 'Lightning reflexes on the table.', active: true, scoringType: 'games_points', teamBased: false, maxPlayersPerTeam: 2, minPlayersPerTeam: 1 },
  { id: 'chess', name: 'Chess', slug: 'chess', icon: '♚', description: 'The ultimate battle of minds.', active: true, scoringType: 'result', teamBased: false, maxPlayersPerTeam: 1, minPlayersPerTeam: 1 },
  { id: 'carrom', name: 'Carrom', slug: 'carrom', icon: '🎯', description: 'Precision flicking and strategy.', active: true, scoringType: 'configurable', teamBased: false, maxPlayersPerTeam: 2, minPlayersPerTeam: 1 },
  { id: 'smash-karts', name: 'Smash Karts', slug: 'smash-karts', icon: '🏎️', description: 'High-octane kart racing chaos.', active: true, scoringType: 'race', teamBased: true, maxPlayersPerTeam: 4, minPlayersPerTeam: 1 },
  { id: 'counter-strike', name: 'Counter-Strike', slug: 'counter-strike', icon: '🎮', description: 'Tactical FPS esports action.', active: true, scoringType: 'rounds', teamBased: true, maxPlayersPerTeam: 5, minPlayersPerTeam: 5 },
  { id: 'lan-games', name: 'LAN Games', slug: 'lan-games', icon: '🖥️', description: 'Local Area Network gaming tournaments — Smash Karts, Counter-Strike and more.', active: true, scoringType: 'configurable', teamBased: true, maxPlayersPerTeam: 12, minPlayersPerTeam: 1 },
];

const VENUES = [
  { id: 'main-arena', name: 'Olympia Main Arena', location: 'Central Campus', capacity: 500, description: 'The flagship arena for major events', active: true },
  { id: 'indoor-court', name: 'Indoor Sports Complex', location: 'Sports Block', capacity: 200, description: 'Multi-purpose indoor facility', active: true },
  { id: 'outdoor-field', name: 'Olympia Ground', location: 'East Campus', capacity: 1000, description: 'Open air sporting ground', active: true },
  { id: 'gaming-hub', name: 'Digital Arena Hub', location: 'Tech Building', capacity: 50, description: 'Esports and gaming facility', active: true },
];

const ANNOUNCEMENTS = [
  { id: 'ann-1', title: 'OLYMPIA 2K26 IS HERE', description: 'The biggest sports event of the year kicks off! Enter the arena and witness greatness.', priority: 1, active: true },
  { id: 'ann-2', title: 'Football Finals This Weekend', description: 'The Olympia Cup 2026 football finals are scheduled for this weekend. Do not miss the action!', priority: 2, active: true },
];

// ────────────────────────────────────────────────────────────
//  7.  Seed to Firestore
// ────────────────────────────────────────────────────────────

async function seedCollection(name, items) {
  process.stdout.write(`  ⏳ Seeding ${name.padEnd(16)} (${String(items.length).padStart(3)} docs)... `);
  try {
    // Use batched writes for efficiency (max 500 per batch)
    const BATCH_SIZE = 450;
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const slice = items.slice(i, i + BATCH_SIZE);
      for (const item of slice) {
        const ref = doc(db, name, item.id);
        batch.set(ref, item, { merge: true });
      }
      await batch.commit();
    }
    console.log('✅ Done');
  } catch (err) {
    console.log(`❌ Failed: ${err.message}`);
    throw err;
  }
}

// ────────────────────────────────────────────────────────────
//  8.  Create admin account
// ────────────────────────────────────────────────────────────

async function seedAdmin() {
  const ADMIN_EMAIL = 'jainish@olympia.com';
  const ADMIN_PASSWORD = 'olympia123';

  process.stdout.write('  ⏳ Creating admin account... ');

  let uid;
  try {
    // Try creating a new account
    const cred = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    uid = cred.user.uid;
    console.log(`✅ Created (uid: ${uid.substring(0, 8)}...)`);
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      // Account already exists — sign in to get the UID
      try {
        const cred = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
        uid = cred.user.uid;
        console.log(`✅ Already exists (uid: ${uid.substring(0, 8)}...)`);
      } catch (signInErr) {
        console.log(`⚠️  Account exists but sign-in failed: ${signInErr.message}`);
        return;
      }
    } else {
      console.log(`❌ Failed: ${err.message}`);
      return;
    }
  }

  // Write admin profile document
  if (uid) {
    process.stdout.write('  ⏳ Writing admin profile... ');
    try {
      await setDoc(doc(db, 'admins', uid), {
        uid,
        email: ADMIN_EMAIL,
        displayName: 'Jainish',
        role: 'super_admin',
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      console.log('✅ Done');
    } catch (err) {
      console.log(`❌ Failed: ${err.message}`);
    }
  }
}

// ────────────────────────────────────────────────────────────
//  9.  Main
// ────────────────────────────────────────────────────────────

async function run() {
  console.log('🚀 Starting OLYMPIA 2K26 CSV Data Seeding...\n');

  try {
    // Seed static collections
    await seedCollection('sports', SPORTS);
    await seedCollection('venues', VENUES);
    await seedCollection('announcements', ANNOUNCEMENTS);

    // Seed CSV-derived data
    await seedCollection('teams', teams);
    await seedCollection('players', players);

    // Seed admin
    await seedAdmin();

    console.log('\n' + '═'.repeat(52));
    console.log('  ✨  SEEDING COMPLETE');
    console.log('═'.repeat(52));
    console.log(`  Sports:        ${SPORTS.length}`);
    console.log(`  Venues:        ${VENUES.length}`);
    console.log(`  Announcements: ${ANNOUNCEMENTS.length}`);
    console.log(`  Teams:         ${teams.length}  (from CSV)`);
    console.log(`  Players:       ${players.length}  (from CSV, deduplicated)`);
    console.log(`  Admin:         jainish@olympia.com`);
    console.log('═'.repeat(52) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:');
    console.error(error.message);
    if (error.code === 'permission-denied') {
      console.error('\n💡 Tip: Set Firestore rules to test mode in Firebase Console:');
      console.error('   rules_version = "2";');
      console.error('   service cloud.firestore {');
      console.error('     match /databases/{database}/documents {');
      console.error('       match /{document=**} {');
      console.error('         allow read, write: if true;');
      console.error('       }');
      console.error('     }');
      console.error('   }');
    }
    process.exit(1);
  }
}

run();
