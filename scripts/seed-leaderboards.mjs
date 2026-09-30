/**
 * ============================================================
 *  OLYMPIA 2K26 — Dedicated Leaderboards Collection Seeder
 * ============================================================
 *
 *  STRICT SAFETY SPECIFICATION:
 *  - ONLY AND ONLY touches the 'leaderboards' collection in Firestore.
 *  - Adds ONE fake test record for testing/verification.
 *  - DOES NOT touch, overwrite, or re-add any existing teams,
 *    players, matches, sports, venues, or tournaments.
 *
 *  Usage: node scripts/seed-leaderboards.mjs
 * ============================================================
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Load Firebase configuration
const jsonPath = path.join(rootDir, 'src', 'config', 'firebaseConfig.json');
let config = {};

if (fs.existsSync(jsonPath)) {
  try {
    config = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } catch (err) {
    console.error('Error reading firebaseConfig.json:', err.message);
  }
}

if (!config.apiKey) {
  const envPath = path.join(rootDir, '.env');
  if (fs.existsSync(envPath)) {
    const envLines = fs.readFileSync(envPath, 'utf8').split('\n');
    const envVars = {};
    for (const line of envLines) {
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

const app = initializeApp(config);
const db = getFirestore(app);

// 2. ONLY AND ONLY write ONE fake test record into 'leaderboards' collection
async function seedLeaderboardOnly() {
  console.log('--- Seeding ONLY the "leaderboards" collection ---');
  console.log('Target Project:', config.projectId);

  const testDocId = 'test-standings-preview';
  const testRecord = {
    sportId: 'test-discipline',
    sportName: 'Test Discipline',
    category: 'team',
    lastUpdated: Timestamp.now(),
    isTestRecord: true,
    entries: [
      {
        position: 1,
        entityId: 'test-team-alpha',
        entityType: 'team',
        entityName: 'Alpha Titans [TEST ENTRY - FEEL FREE TO DELETE]',
        logo: '/logos/reign-fc.jpg',
        sportId: 'test-discipline',
        points: 999,
        wins: 10,
        draws: 0,
        losses: 0,
        matchesPlayed: 10,
        stats: {
          goalsFor: 35,
          goalsAgainst: 2,
          goalDifference: 33
        }
      }
    ]
  };

  try {
    const leaderDocRef = doc(db, 'leaderboards', testDocId);
    await setDoc(leaderDocRef, testRecord);

    console.log(`\n✅ SUCCESS: Created document 'leaderboards/${testDocId}' in Firestore!`);
    console.log('You can now see the "leaderboards" collection in Firebase Console.');
    console.log('Document contains 1 test entry with points: 999.');
    console.log('\n🔒 SAFETY GUARANTEE: Zero other collections were modified or overwritten.');
  } catch (err) {
    console.error('❌ Failed to write to leaderboards collection:', err);
    process.exit(1);
  }
}

seedLeaderboardOnly()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
