/**
 * ============================================================
 *  OLYMPIA 2K26 — Cleanup Rogue / Duplicate Player Documents
 * ============================================================
 *
 *  Removes the 225 rogue player documents introduced by the
 *  inadvertently merged importer script, and restores canonical
 *  roster `playerIds` and `captainId` on the 24 teams.
 *
 *  Safe & targeted:
 *  - Deletes ONLY rogue player documents (player-{sport}-{team}-{id/captain})
 *  - Restores teams' `playerIds` and `captainId` to canonical IDs
 *  - Preserves all matches, fixtures, leaderboards, reviews, ratings, votes
 *
 *  Usage: node scripts/cleanup-duplicate-players.mjs [--dry-run]
 * ============================================================
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  writeBatch,
  updateDoc,
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Load config
const jsonPath = path.join(rootDir, 'src', 'config', 'firebaseConfig.json');
let config = {};
if (fs.existsSync(jsonPath)) {
  config = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
}
if (!config.apiKey) {
  const envPath = path.join(rootDir, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    const envVars = {};
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let val = match[2] || '';
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
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

const isDryRun = process.argv.includes('--dry-run');

console.log(`\n🔥 Connecting to Firebase Project: "${config.projectId}"...`);
if (isDryRun) {
  console.log(`⚠️  RUNNING IN DRY-RUN MODE (No database writes will occur)\n`);
} else {
  console.log(`⚡ RUNNING IN APPLY MODE\n`);
}

const app = initializeApp(config);
const db = getFirestore(app);

// CSV parsing
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

async function cleanup() {
  // 1. Build canonical team and player rosters from CSVs
  const teamMap = new Map();
  const playerMap = new Map();

  for (const csvFile of CSV_FILES) {
    const csvPath = path.join(rootDir, 'src', 'assets', csvFile);
    if (!fs.existsSync(csvPath)) continue;
    const rows = parseCSV(csvPath);
    for (const row of rows) {
      const sport = row['Sport'] || '';
      const teamName = (row['Team'] || '').trim();
      const captainName = (row['Captain'] || '').trim();
      const playerName = (row['Player'] || '').trim();

      if (!teamName || !playerName) continue;

      const sportId = SPORT_MAP[sport] || slugify(sport);
      const teamSlug = slugify(teamName);
      const teamKey = `${sportId}__${teamSlug}`;
      const teamDocId = `team-${sportId}-${teamSlug}`;

      if (!teamMap.has(teamKey)) {
        teamMap.set(teamKey, {
          id: teamDocId,
          name: teamName,
          sportId,
          captainName,
          captainId: null,
          playerIds: [],
        });
      }

      const team = teamMap.get(teamKey);
      const playerSlug = slugify(playerName);
      const playerKey = `${sportId}__${playerSlug}`;
      const playerDocId = `player-${sportId}-${playerSlug}`;
      const isCaptain = captainName && playerSlug === slugify(captainName);

      if (!playerMap.has(playerKey)) {
        playerMap.set(playerKey, {
          id: playerDocId,
          name: playerName,
          teamId: team.id,
          sportId,
          role: isCaptain ? 'captain' : 'player',
        });
        team.playerIds.push(playerDocId);
      }
    }
  }

  // Ensure captains exist in team rosters
  for (const team of teamMap.values()) {
    if (team.captainName) {
      const capSlug = slugify(team.captainName);
      const capKey = `${team.sportId}__${capSlug}`;
      const capDocId = `player-${team.sportId}-${capSlug}`;

      team.captainId = capDocId;

      if (!playerMap.has(capKey)) {
        playerMap.set(capKey, {
          id: capDocId,
          name: team.captainName,
          teamId: team.id,
          sportId: team.sportId,
          role: 'captain',
        });
        team.playerIds.unshift(capDocId);
      } else {
        const p = playerMap.get(capKey);
        p.role = 'captain';
        if (!team.playerIds.includes(capDocId)) {
          team.playerIds.unshift(capDocId);
        }
      }
    }
  }

  const canonicalPlayerIds = new Set(Array.from(playerMap.values()).map((p) => p.id));
  console.log(`📋 Canonical CSV player IDs identified: ${canonicalPlayerIds.size}`);
  console.log(`📋 Canonical teams identified: ${teamMap.size}`);

  // 2. Fetch all current players from Firestore
  const playersSnap = await getDocs(collection(db, 'players'));
  console.log(`📊 Current total documents in 'players' collection: ${playersSnap.size}`);

  const docsToDelete = [];
  const docsToKeep = [];

  playersSnap.forEach((docSnap) => {
    const id = docSnap.id;
    // Check if it's rogue
    const isRogue =
      /^player-[a-z0-9-]+-[a-z0-9-]+-\d+$/.test(id) ||
      /^player-[a-z0-9-]+-[a-z0-9-]+-captain-[a-z0-9-]+$/.test(id);

    if (isRogue) {
      docsToDelete.push(id);
    } else {
      docsToKeep.push(id);
    }
  });

  console.log(`\n🔍 Analysis:`);
  console.log(`  - Legitimate players to KEEP: ${docsToKeep.length}`);
  console.log(`  - Rogue duplicate documents to DELETE: ${docsToDelete.length}`);

  if (docsToDelete.length !== 225) {
    console.warn(`  ⚠️ Expected exactly 225 rogue documents, found ${docsToDelete.length}.`);
  }

  // 3. Delete rogue documents in chunks
  if (!isDryRun && docsToDelete.length > 0) {
    console.log(`\n🗑️  Deleting ${docsToDelete.length} rogue player documents...`);
    const CHUNK_SIZE = 400;
    for (let i = 0; i < docsToDelete.length; i += CHUNK_SIZE) {
      const chunk = docsToDelete.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      for (const docId of chunk) {
        batch.delete(doc(db, 'players', docId));
      }
      await batch.commit();
      console.log(`  ↳ Deleted chunk ${Math.min(i + CHUNK_SIZE, docsToDelete.length)} / ${docsToDelete.length}`);
    }
    console.log(`  ✅ Successfully deleted ${docsToDelete.length} rogue player documents.`);
  }

  // 4. Update team rosters in Firestore to restore canonical playerIds & captainId
  console.log(`\n🔄 Updating 24 teams with canonical rosters...`);
  let teamsUpdated = 0;
  for (const team of teamMap.values()) {
    if (!isDryRun) {
      await updateDoc(doc(db, 'teams', team.id), {
        captainId: team.captainId,
        playerIds: team.playerIds,
      });
    }
    teamsUpdated++;
    console.log(`  ✅ ${team.id} → ${team.playerIds.length} players, captain: ${team.captainId}`);
  }

  // 5. Verify final state
  if (!isDryRun) {
    const finalPlayersSnap = await getDocs(collection(db, 'players'));
    console.log(`\n🎉 Verification:`);
    console.log(`  Firestore 'players' collection now has: ${finalPlayersSnap.size} documents (Expected: ${docsToKeep.length})`);
    console.log(`  Teams updated: ${teamsUpdated}`);
    if (finalPlayersSnap.size === docsToKeep.length) {
      console.log(`  ✨ Cleanup 100% COMPLETE AND SUCCESSFUL!\n`);
    } else {
      console.warn(`  ⚠️ Player count mismatch: found ${finalPlayersSnap.size}, expected ${docsToKeep.length}`);
    }
  } else {
    console.log(`\n✨ Dry run complete. To apply changes, run without --dry-run.`);
  }
}

cleanup()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error during cleanup:', err);
    process.exit(1);
  });
