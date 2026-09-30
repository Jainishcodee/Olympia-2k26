/**
 * ============================================================
 *  OLYMPIA 2K26 — Master Deterministic CSV & Interaction Seeder
 * ============================================================
 *
 *  Fixes:
 *  - Deterministic Team IDs: `team-<sportId>-<slug>` (NO duplicate teams)
 *  - Single Team per Player in a sport: `player-<sportId>-<slug>` (NO duplicate players)
 *  - Captain automatically created as rostered player if not in player rows
 *  - Auto-cleans legacy duplicate / demo teams and players in Firestore
 *  - Seeds baseline reviews, fan predictions, reactions, and Super Admin
 *
 *  Usage:  node scripts/seed-csv.mjs
 * ============================================================
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  writeBatch,
  serverTimestamp,
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
//  1.  Load Firebase Config
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
//  2.  CSV Parsing & Normalisation
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

const SPORT_MAP = {
  Cricket: 'cricket',
  Football: 'football',
  Volleyball: 'volleyball',
  'Hand Tennis': 'hand-tennis',
  'LAN Games': 'lan-games',
};

const CSV_FILES = [
  'cricket.csv',
  'football.csv',
  'volleyball.csv',
  'hand_tennis.csv',
  'lan_games.csv',
];

function slugify(str) {
  return (str || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function makeShortName(teamName) {
  const words = teamName.replace(/[^a-zA-Z\s]/g, '').split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].substring(0, 3).toUpperCase();
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

// ────────────────────────────────────────────────────────────
//  3.  Parse CSV Rows
// ────────────────────────────────────────────────────────────
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

// ────────────────────────────────────────────────────────────
//  4.  Build Deterministic Teams & Players
// ────────────────────────────────────────────────────────────

// Key: `<sportId>__<teamSlug>`
const teamMap = new Map();

// Key: `<sportId>__<playerSlug>` -> Ensures 1 player per sport in exactly 1 team
const playerMap = new Map();

let teamIdx = 0;

for (const row of allRows) {
  const sport = row['Sport'] || '';
  const teamName = (row['Team'] || '').trim();
  const captainName = (row['Captain'] || '').trim();
  const playerName = (row['Player'] || '').trim();
  const position = (row['Position'] || '').trim();

  if (!teamName || !playerName) continue;

  const sportId = SPORT_MAP[sport] || slugify(sport);
  const teamSlug = slugify(teamName);
  const teamKey = `${sportId}__${teamSlug}`;
  const teamDocId = `team-${sportId}-${teamSlug}`;

  // 1. Register or update team
  if (!teamMap.has(teamKey)) {
    teamIdx++;
    const captainSlug = slugify(captainName);
    const captainPlayerId = captainSlug ? `player-${sportId}-${captainSlug}` : null;

    const wins = 0;
    const losses = 0;
    const draws = 0;
    const points = 0;

    teamMap.set(teamKey, {
      id: teamDocId,
      name: teamName,
      shortName: makeShortName(teamName),
      sportId,
      captainName,
      captainId: captainPlayerId,
      description: `${teamName} — official squad for ${sport} at Olympia 2K26`,
      active: true,
      wins: 0,
      losses: 0,
      draws: 0,
      points: 0,
      logo: '',
      coach: '',
      playerIds: [],
    });
  }

  const team = teamMap.get(teamKey);

  // 2. Register player (Strict Dedup: exactly 1 player document per sport)
  const playerSlug = slugify(playerName);
  const playerKey = `${sportId}__${playerSlug}`;
  const playerDocId = `player-${sportId}-${playerSlug}`;

  const isCaptain = captainName && playerSlug === slugify(captainName);

  if (!playerMap.has(playerKey)) {
    const playerObj = {
      id: playerDocId,
      name: playerName,
      teamId: team.id,
      sportId,
      role: isCaptain ? 'captain' : 'player',
      position: position !== 'N/A' ? position : '',
      photo: '',
      jerseyNumber: (playerMap.size % 99) + 1,
      gender: 'male',
      bio: '',
      active: true,
      stats: {
        matchesPlayed: 0,
        points: 0,
        rating: 0,
        goals: 0,
        assists: 0,
        runs: 0,
        wickets: 0,
        wins: 0,
        losses: 0,
      },
    };

    playerMap.set(playerKey, playerObj);
    team.playerIds.push(playerDocId);
  }
}

// 3. Ensure every Team's Captain exists in the roster
for (const team of teamMap.values()) {
  if (team.captainName) {
    const capSlug = slugify(team.captainName);
    const capKey = `${team.sportId}__${capSlug}`;
    const capDocId = `player-${team.sportId}-${capSlug}`;

    if (!playerMap.has(capKey)) {
      const captainObj = {
        id: capDocId,
        name: team.captainName,
        teamId: team.id,
        sportId: team.sportId,
        role: 'captain',
        position: 'Captain',
        photo: '',
        jerseyNumber: 1,
        gender: 'male',
        bio: `Captain of ${team.name}`,
        active: true,
        stats: {
          matchesPlayed: 0,
          points: 0,
          rating: 0,
          goals: 0,
          assists: 0,
          runs: 0,
          wickets: 0,
          wins: 0,
          losses: 0,
        },
      };
      playerMap.set(capKey, captainObj);
      team.playerIds.unshift(capDocId);
    } else {
      // Ensure captain role is set
      const p = playerMap.get(capKey);
      p.role = 'captain';
      if (!team.playerIds.includes(capDocId)) {
        team.playerIds.unshift(capDocId);
      }
    }
  }
}

const teamsList = Array.from(teamMap.values());
const playersList = Array.from(playerMap.values());

console.log(`\n🏆 Processed ${teamsList.length} unique teams and ${playersList.length} unique players (zero duplicates).`);

// ────────────────────────────────────────────────────────────
//  5.  Sports, Venues, Tournaments & Matches
// ────────────────────────────────────────────────────────────
const SPORTS = [
  { id: 'football', name: 'Football', category: 'outdoor', icon: '⚽', active: true },
  { id: 'cricket', name: 'Cricket', category: 'outdoor', icon: '🏏', active: true },
  { id: 'volleyball', name: 'Volleyball', category: 'outdoor', icon: '🏐', active: true },
  { id: 'hand-tennis', name: 'Hand Tennis', category: 'outdoor', icon: '🎾', active: true },
  { id: 'lan-games', name: 'LAN Games', category: 'esports', icon: '🎮', active: true },
  { id: 'badminton', name: 'Badminton', category: 'indoor', icon: '🏸', active: true },
  { id: 'table-tennis', name: 'Table Tennis', category: 'indoor', icon: '🏓', active: true },
  { id: 'chess', name: 'Chess', category: 'indoor', icon: '♟️', active: true },
  { id: 'carrom', name: 'Carrom', category: 'indoor', icon: '🎯', active: true },
  { id: 'counter-strike', name: 'Counter-Strike', category: 'esports', icon: '🔫', active: true },
  { id: 'smash-karts', name: 'Smash Karts', category: 'esports', icon: '🏎️', active: true },
];

const VENUES = [
  { id: 'main-arena', name: 'Olympia Main Stadium', capacity: 5000, active: true },
  { id: 'sports-complex', name: 'Indoor Sports Complex', capacity: 1500, active: true },
  { id: 'esports-dome', name: 'Cyber Arena & LAN Dome', capacity: 800, active: true },
  { id: 'court-alpha', name: 'Outdoor Arena Oval A', capacity: 2000, active: true },
];

const TOURNAMENTS = [
  {
    id: 'olympia-championship-2k26',
    name: 'Olympia 2K26 Championship',
    season: '2026',
    status: 'active',
    startDate: new Date('2026-10-01'),
    endDate: new Date('2026-10-15'),
  },
];

const MATCHES = [];
const REVIEWS = [];
const RATINGS = [];
const VOTES = [];
const REACTIONS = [];
const VOTING_DATA = {};
const REACTION_DATA = {};

// Group teams by sport to generate initial matches
const sportTeams = {};
for (const team of teamsList) {
  if (!sportTeams[team.sportId]) sportTeams[team.sportId] = [];
  sportTeams[team.sportId].push(team);
}

let matchNumber = 1;
for (const [sportId, tList] of Object.entries(sportTeams)) {
  if (tList.length >= 2) {
    const teamA = tList[0];
    const teamB = tList[1];
    const matchId = `match-${sportId}-${matchNumber}`;

    const matchObj = {
      id: matchId,
      matchNumber,
      sportId,
      tournamentId: 'olympia-championship-2k26',
      venueId: VENUES[matchNumber % VENUES.length].id,
      teamAId: teamA.id,
      teamBId: teamB.id,
      participantA: { id: teamA.id, name: teamA.name, score: 0 },
      participantB: { id: teamB.id, name: teamB.name, score: 0 },
      score: { teamA: 0, teamB: 0 },
      status: 'scheduled',
      featured: matchNumber === 1,
      allowVoting: true,
      allowReactions: true,
      scheduledAt: new Date(Date.now() + matchNumber * 3600000 * 6),
      liveState: {
        clock: 'SCHEDULED',
        period: 'Period 1',
        isPaused: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    MATCHES.push(matchObj);

    // Initial baseline fan prediction start at 0
    VOTING_DATA[matchId] = {
      A: 0,
      B: 0,
      [teamA.name]: 0,
      [teamB.name]: 0,
    };

    // Initial baseline reactions start at 0
    REACTION_DATA[matchId] = {
      fire: 0,
      clap: 0,
      zap: 0,
      lightning: 0,
      heart: 0,
      wow: 0,
      trophy: 0,
      muscle: 0,
    };

    matchNumber++;
  }
}

// ────────────────────────────────────────────────────────────
//  6.  Purge Legacy / Duplicate Documents
// ────────────────────────────────────────────────────────────
async function purgeLegacyDuplicates(collectionName, validIds) {
  try {
    const validSet = new Set(validIds);
    const snap = await getDocs(collection(db, collectionName));
    const toDelete = [];

    snap.forEach((docSnap) => {
      if (!validSet.has(docSnap.id)) {
        toDelete.push(docSnap.id);
      }
    });

    if (toDelete.length > 0) {
      console.log(`🧹 Cleaning ${toDelete.length} legacy / duplicate docs from "${collectionName}"...`);
      for (let i = 0; i < toDelete.length; i += 400) {
        const chunk = toDelete.slice(i, i + 400);
        const batch = writeBatch(db);
        for (const id of chunk) {
          batch.delete(doc(db, collectionName, id));
        }
        await batch.commit();
      }
      console.log(`  ✅ Cleaned "${collectionName}"`);
    }
  } catch (err) {
    console.warn(`  ⚠️ Purge note on "${collectionName}": ${err.message}`);
  }
}

// ────────────────────────────────────────────────────────────
//  7.  Seeding Writer
// ────────────────────────────────────────────────────────────
async function seedCollection(name, items) {
  if (!items.length) return;
  console.log(`📦 Seeding "${name}" (${items.length} clean docs)...`);

  const CHUNK_SIZE = 400;
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);

    for (const item of chunk) {
      const ref = doc(db, name, item.id);
      batch.set(ref, { ...item, updatedAt: serverTimestamp() }, { merge: true });
    }

    await batch.commit();
    console.log(`  ↳ Written ${Math.min(i + CHUNK_SIZE, items.length)} / ${items.length}`);
  }
}

async function seedAdmin() {
  const email = 'jainish@olympia.com';
  const pass = 'olympia123';
  console.log(`\n👑 Provisioning Super Admin: ${email}...`);

  let uid = null;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    uid = cred.user.uid;
    console.log(`  ✅ Auth user created successfully (UID: ${uid})`);
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      console.log(`  ℹ️  Auth user already exists. Authenticating to resolve UID...`);
      try {
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        uid = cred.user.uid;
        console.log(`  ✅ Successfully authenticated existing admin (UID: ${uid})`);
      } catch (signInErr) {
        console.warn(`  ⚠️ Could not sign in: ${signInErr.message}`);
      }
    } else {
      console.warn(`  ⚠️ Auth creation note: ${err.message}`);
    }
  }

  const adminProfile = {
    email,
    displayName: 'Jainish',
    role: 'super_admin',
    active: true,
    permissions: ['all'],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (uid) {
    await setDoc(doc(db, 'admins', uid), { uid, ...adminProfile }, { merge: true });
    console.log(`  ✅ Admin profile document written to "admins/${uid}" (role: super_admin)`);
  } else {
    await setDoc(doc(db, 'admins', 'super_admin_jainish'), adminProfile, { merge: true });
    console.log(`  ✅ Admin profile document written to "admins/super_admin_jainish"`);
  }
}

// ────────────────────────────────────────────────────────────
//  8.  Execute Master Seeder
// ────────────────────────────────────────────────────────────
async function run() {
  try {
    // 6. Clear entire collection to start at exact 0
    async function clearEntireCollection(collectionName) {
      try {
        const snap = await getDocs(collection(db, collectionName));
        if (snap.empty) return;
        console.log(`🧹 Clearing ${snap.size} docs from "${collectionName}" to start clean at 0...`);
        for (let i = 0; i < snap.docs.length; i += 400) {
          const chunk = snap.docs.slice(i, i + 400);
          const batch = writeBatch(db);
          for (const docSnap of chunk) {
            batch.delete(docSnap.ref);
          }
          await batch.commit();
        }
      } catch (err) {
        console.warn(`  ⚠️ Note on "${collectionName}": ${err.message}`);
      }
    }

    // 1. Purge legacy duplicates
    await purgeLegacyDuplicates('teams', teamsList.map((t) => t.id));
    await purgeLegacyDuplicates('players', playersList.map((p) => p.id));
    await purgeLegacyDuplicates('matches', MATCHES.map((m) => m.id));

    // Clear all fan interactions to 0
    await clearEntireCollection('reviews');
    await clearEntireCollection('ratings');
    await clearEntireCollection('votes');
    await clearEntireCollection('reactions');

    // 2. Seed clean collections
    await seedCollection('sports', SPORTS);
    await seedCollection('venues', VENUES);
    await seedCollection('tournaments', TOURNAMENTS);
    await seedCollection('teams', teamsList);
    await seedCollection('players', playersList);
    await seedCollection('matches', MATCHES);

    // 3. Seed voting & reaction tallies (starting at 0)
    console.log(`📊 Initializing match voting tallies at 0...`);
    for (const [matchId, vData] of Object.entries(VOTING_DATA)) {
      await setDoc(doc(db, 'match_voting', matchId), vData, { merge: true });
    }

    console.log(`🔥 Initializing match reaction aggregates at 0...`);
    for (const [matchId, rData] of Object.entries(REACTION_DATA)) {
      await setDoc(doc(db, 'match_reactions', matchId), rData, { merge: true });
    }

    // 4. Provision admin
    await seedAdmin();

    console.log('\n============================================================');
    console.log('🎉 MASTER SEEDING COMPLETE WITH ZERO DUPLICATES (CLEAN 0 STATE)!');
    console.log('============================================================');
    console.log(`• Unique Teams:       ${teamsList.length}`);
    console.log(`• Unique Players:     ${playersList.length} (exact 1 team per sport)`);
    console.log(`• Sports:             ${SPORTS.length}`);
    console.log(`• Venues:             ${VENUES.length}`);
    console.log(`• Matches:            ${MATCHES.length} (all scheduled, score: 0-0)`);
    console.log(`• Fan Reviews:        0 (clean)`);
    console.log(`• Player Ratings:     0 (clean)`);
    console.log(`• Fan Votes:          0 (clean)`);
    console.log(`• Live Reactions:     0 (clean)`);
    console.log(`• Admin Account:      jainish@olympia.com / olympia123`);
    console.log('============================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed with error:', error);
    process.exit(1);
  }
}

run();
