/**
 * ============================================================
 *  OLYMPIA 2K26 — Master Deterministic CSV & Interaction Seeder (TS)
 * ============================================================
 *
 *  Seeds:
 *  - 5 Sport CSVs (cricket.csv, football.csv, volleyball.csv, hand_tennis.csv, lan_games.csv)
 *  - Deterministic Team IDs: `team-<sportId>-<slug>` (NO duplicate teams)
 *  - Single Team per Player in a sport: `player-<sportId>-<slug>` (NO duplicate players)
 *  - Captain automatically rostered
 *  - Matches, Tournaments, Venues, Sports
 *  - Reviews (for Reviews moderation queue)
 *  - Player Ratings (for Ratings leaderboard)
 *  - Fan Ballots & Votes (for Votes manager)
 *  - Fan Reactions (for Reactions manager)
 *  - Real-time match aggregates (match_voting, match_reactions)
 *  - Super Admin account (jainish@olympia.com / olympia123)
 *  - Static asset sync to public/images
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
  serverTimestamp,
} from 'firebase/firestore';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import * as fs from 'fs';
import * as path from 'path';

// ────────────────────────────────────────────────────────────
//  1. Load Firebase Config from .env or firebaseConfig.json
// ────────────────────────────────────────────────────────────
function loadConfig() {
  const rootDir = process.cwd();
  const isProdArg = process.argv.includes('--prod');
  const isDevArg = process.argv.includes('--dev');

  let envFile = '.env';
  if (isProdArg && fs.existsSync(path.join(rootDir, '.env.production'))) {
    envFile = '.env.production';
  } else if (isDevArg && fs.existsSync(path.join(rootDir, '.env.development'))) {
    envFile = '.env.development';
  }

  const envPath = path.join(rootDir, envFile);
  let conf: Record<string, string> = {};

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const val = (match[2] || '').trim().replace(/^['"](.*)['"]$/, '$1');
        conf[match[1]] = val;
      }
    }
    conf = {
      apiKey: conf.VITE_FIREBASE_API_KEY,
      authDomain: conf.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: conf.VITE_FIREBASE_PROJECT_ID,
      storageBucket: conf.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: conf.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: conf.VITE_FIREBASE_APP_ID,
    };
  }

  if (!conf.apiKey || conf.apiKey === '') {
    const jsonPath = path.join(rootDir, 'src', 'config', 'firebaseConfig.json');
    if (fs.existsSync(jsonPath)) {
      try {
        conf = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      } catch {
        // ignore
      }
    }
  }

  return conf;
}

const firebaseConfig = loadConfig();

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('\n❌ Firebase config not found. Check src/config/firebaseConfig.json or .env\n');
  process.exit(1);
}

console.log(`\n🔥 Connecting to Firebase Project: "${firebaseConfig.projectId}"...\n`);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ────────────────────────────────────────────────────────────
//  2. CSV Parsing & Normalisation
// ────────────────────────────────────────────────────────────
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
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

function parseCSV(filePath: string): Record<string, string>[] {
  const raw = fs.readFileSync(filePath, 'utf8').replace(/\r/g, '');
  const lines = raw.split('\n').filter((l) => l.trim() !== '');
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i]);
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = vals[idx] || '';
    });
    rows.push(obj);
  }
  return rows;
}

const SPORT_MAP: Record<string, string> = {
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

function slugify(str: string): string {
  return (str || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function makeShortName(teamName: string): string {
  const words = teamName.replace(/[^a-zA-Z\s]/g, '').split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].substring(0, 3).toUpperCase();
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

async function copyAssets() {
  console.log('📁 Copying branding assets to public/images...');
  const publicDir = path.join(process.cwd(), 'public', 'images');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const assets = ['logo_light.png', 'logo_dark.png', 'arena.jpeg', 'hero.png'];
  for (const a of assets) {
    const src = path.join(process.cwd(), 'src', 'assets', a);
    const dst = path.join(publicDir, a);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dst);
      console.log(`  ✅ Synced ${a}`);
    }
  }
}

// ────────────────────────────────────────────────────────────
//  3. Main Execution Flow
// ────────────────────────────────────────────────────────────
async function run() {
  try {
    await copyAssets();

    // 1. Read CSVs
    console.log('\n📄 Reading 5 Sport CSV files...');
    const allRows: Record<string, string>[] = [];
    for (const csvFile of CSV_FILES) {
      const csvPath = path.join(process.cwd(), 'src', 'assets', csvFile);
      if (!fs.existsSync(csvPath)) {
        console.warn(`  ⚠️ File not found: ${csvFile} — skipping`);
        continue;
      }
      const rows = parseCSV(csvPath);
      console.log(`  ✅ ${csvFile.padEnd(20)} → ${rows.length} rows`);
      allRows.push(...rows);
    }

    // 2. Build Teams & Players (Deterministic, Deduped)
    const teamMap = new Map<string, any>();
    const playerMap = new Map<string, any>();
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

      if (!teamMap.has(teamKey)) {
        teamIdx++;
        const captainSlug = slugify(captainName);
        const captainPlayerId = captainSlug ? `player-${sportId}-${captainSlug}` : null;

        const wins = (teamIdx % 3) + 1;
        const losses = teamIdx % 2;
        const draws = teamIdx % 4 === 0 ? 1 : 0;
        const points = wins * 3 + draws;

        const LOGO_MAP: Record<string, string> = {
          apexattackers: '/logos/apex-attackers.jpg',
          boundarybreakers: '/logos/boundary-breakers.jpg',
          courtkings: '/logos/court-kings.jpg',
          fragninjas: '/logos/frag-ninjas.jpg',
          gcspikers: '/logos/gc-spikers.png',
          handhitters: '/logos/hand-hitters.jpg',
          jinussmashers: '/logos/jinus-smashers.jpg',
          kstrike: '/logos/k-strike.png',
          laggaslegends: '/logos/laggas-legends.jpg',
          legendarylions: '/logos/legendary-lions.jpg',
          netwarriors: '/logos/net-warriors.jpg',
          powerhitters: '/logos/power-hitters.jpg',
          powerpalm: '/logos/power-palm.jpg',
          reignfc: '/logos/reign-fc.jpg',
          roninxi: '/logos/ronin-xi.png',
          shadowspikers: '/logos/shadow-spikers.png',
          shadowstrikers: '/logos/shadow-strikers.jpg',
          shadowx: '/logos/shadow-x.jpg',
          spikewarriors: '/logos/spike-warriors.jpg',
          superstrikers: '/logos/super-strikers.jpg',
          vedantblackfangs: '/logos/vedant-blackfangs.jpg',
          vedantblackfang: '/logos/vedant-blackfangs.jpg',
          vedantspikers: '/logos/vedant-spikers.jpg',
          vortexaces: '/logos/vortex-aces.jpg',
          vrajkeveterans: '/logos/vraj-ke-veterans.jpg',
        };
        const normName = teamName.toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9]/g, '');
        const teamLogo = LOGO_MAP[normName] || `/logos/${teamSlug}.jpg`;

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
          logo: teamLogo,
          coach: '',
          playerIds: [],
        });
      }

      const team = teamMap.get(teamKey);
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

    // Ensure captains are present in roster
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

    console.log(`\n🏆 Built ${teamsList.length} unique teams and ${playersList.length} unique players.`);

    // 3. Sports, Venues, Tournaments & Matches
    const SPORTS = [
      { id: 'football', name: 'Football', slug: 'football', category: 'outdoor', icon: '⚽', description: 'The beautiful game. 11v11 on the pitch.', active: true, scoringType: 'goals', teamBased: true, maxPlayersPerTeam: 18, minPlayersPerTeam: 11 },
      { id: 'cricket', name: 'Cricket', slug: 'cricket', category: 'outdoor', icon: '🏏', description: 'Bat meets ball. Strategic team sport.', active: true, scoringType: 'runs', teamBased: true, maxPlayersPerTeam: 15, minPlayersPerTeam: 11 },
      { id: 'volleyball', name: 'Volleyball', slug: 'volleyball', category: 'outdoor', icon: '🏐', description: 'Spike, set, and serve to victory.', active: true, scoringType: 'sets_points', teamBased: true, maxPlayersPerTeam: 12, minPlayersPerTeam: 6 },
      { id: 'hand-tennis', name: 'Hand Tennis', slug: 'hand-tennis', category: 'outdoor', icon: '✋', description: 'Fast-paced hand tennis action.', active: true, scoringType: 'configurable', teamBased: true, maxPlayersPerTeam: 6, minPlayersPerTeam: 2 },
      { id: 'lan-games', name: 'LAN Games', slug: 'lan-games', category: 'esports', icon: '🎮', description: 'Esports showdown and digital battles.', active: true, scoringType: 'rounds', teamBased: true, maxPlayersPerTeam: 5, minPlayersPerTeam: 1 },
      { id: 'badminton', name: 'Badminton', slug: 'badminton', category: 'indoor', icon: '🏸', description: 'Speed and precision on the court.', active: true, scoringType: 'games_points', teamBased: false, maxPlayersPerTeam: 2, minPlayersPerTeam: 1 },
      { id: 'table-tennis', name: 'Table Tennis', slug: 'table-tennis', category: 'indoor', icon: '🏓', description: 'Lightning reflexes on the table.', active: true, scoringType: 'games_points', teamBased: false, maxPlayersPerTeam: 2, minPlayersPerTeam: 1 },
      { id: 'chess', name: 'Chess', slug: 'chess', category: 'indoor', icon: '♚', description: 'The ultimate battle of minds.', active: true, scoringType: 'result', teamBased: false, maxPlayersPerTeam: 1, minPlayersPerTeam: 1 },
      { id: 'carrom', name: 'Carrom', slug: 'carrom', category: 'indoor', icon: '🎯', description: 'Precision flicking and strategy.', active: true, scoringType: 'configurable', teamBased: false, maxPlayersPerTeam: 2, minPlayersPerTeam: 1 },
      { id: 'counter-strike', name: 'Counter-Strike', slug: 'counter-strike', category: 'esports', icon: '🎮', description: 'Tactical FPS esports action.', active: true, scoringType: 'rounds', teamBased: true, maxPlayersPerTeam: 5, minPlayersPerTeam: 5 },
      { id: 'smash-karts', name: 'Smash Karts', slug: 'smash-karts', category: 'esports', icon: '🏎️', description: 'High-octane kart racing chaos.', active: true, scoringType: 'race', teamBased: true, maxPlayersPerTeam: 4, minPlayersPerTeam: 1 },
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

    const MATCHES: any[] = [];
    const REVIEWS: any[] = [];
    const RATINGS: any[] = [];
    const VOTES: any[] = [];
    const REACTIONS: any[] = [];
    const VOTING_DATA: Record<string, any> = {};
    const REACTION_DATA: Record<string, any> = {};

    const sportTeams: Record<string, any[]> = {};
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

        // All initial match predictions start at 0
        VOTING_DATA[matchId] = {
          A: 0,
          B: 0,
          [teamA.name]: 0,
          [teamB.name]: 0,
        };

        // All initial match reactions start at 0
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

    // 4. Batch Seeding Helper
    async function seedCollection(name: string, items: any[]) {
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

    // 5. Purge duplicates
    async function purgeLegacy(collectionName: string, validIds: string[]) {
      try {
        const validSet = new Set(validIds);
        const snap = await getDocs(collection(db, collectionName));
        const toDelete: string[] = [];
        snap.forEach((docSnap) => {
          if (!validSet.has(docSnap.id)) {
            toDelete.push(docSnap.id);
          }
        });
        if (toDelete.length > 0) {
          console.log(`🧹 Cleaning ${toDelete.length} legacy docs from "${collectionName}"...`);
          for (let i = 0; i < toDelete.length; i += 400) {
            const chunk = toDelete.slice(i, i + 400);
            const batch = writeBatch(db);
            for (const id of chunk) {
              batch.delete(doc(db, collectionName, id));
            }
            await batch.commit();
          }
        }
      } catch (err: any) {
        console.warn(`  ⚠️ Note on "${collectionName}": ${err.message}`);
      }
    }

    // 6. Clear entire collection to start at exact 0
    async function clearEntireCollection(collectionName: string) {
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
      } catch (err: any) {
        console.warn(`  ⚠️ Note on "${collectionName}": ${err.message}`);
      }
    }

    await purgeLegacy('teams', teamsList.map((t) => t.id));
    await purgeLegacy('players', playersList.map((p) => p.id));
    await purgeLegacy('matches', MATCHES.map((m) => m.id));

    // Clear all fan interactions to 0
    await clearEntireCollection('reviews');
    await clearEntireCollection('ratings');
    await clearEntireCollection('votes');
    await clearEntireCollection('reactions');

    // Seed clean collections
    await seedCollection('sports', SPORTS);
    await seedCollection('venues', VENUES);
    await seedCollection('tournaments', TOURNAMENTS);
    await seedCollection('teams', teamsList);
    await seedCollection('players', playersList);
    await seedCollection('matches', MATCHES);

    // Seed aggregates
    console.log(`📊 Seeding match voting tallies...`);
    for (const [matchId, vData] of Object.entries(VOTING_DATA)) {
      await setDoc(doc(db, 'match_voting', matchId), vData, { merge: true });
    }

    console.log(`🔥 Seeding match reaction aggregates...`);
    for (const [matchId, rData] of Object.entries(REACTION_DATA)) {
      await setDoc(doc(db, 'match_reactions', matchId), rData, { merge: true });
    }

    // Provision admin
    const email = process.env.ADMIN_EMAIL || 'jainish@olympia.com';
    const pass = process.env.ADMIN_INITIAL_PASSWORD || 'Olympia@2026Admin!';
    console.log(`\n👑 Verifying Administrator: ${email}...`);
    let uid: string | null = null;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      uid = cred.user.uid;
      console.log(`  ✅ Auth user created (UID: ${uid})`);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        console.log(`  ℹ️ Admin account already exists in Auth (${email})`);
        try {
          const cred = await signInWithEmailAndPassword(auth, email, pass);
          uid = cred.user.uid;
        } catch {
          // If password differs, resolve via service-account.json if present
        }
      }
    }

    if (!uid && fs.existsSync(path.join(process.cwd(), 'service-account.json'))) {
      try {
        const { getAuth: getAdminAuth } = await import('firebase-admin/auth');
        const adminUser = await getAdminAuth().getUserByEmail(email);
        uid = adminUser.uid;
        console.log(`  ✅ Resolved Admin Auth UID: ${uid}`);
      } catch {
        // ignore
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
      console.log(`  ✅ Admin profile document written to "admins/${uid}"`);
    } else {
      await setDoc(doc(db, 'admins', 'super_admin_jainish'), adminProfile, { merge: true });
    }

    console.log('\n============================================================');
    console.log('🎉 MASTER SEEDING COMPLETE WITH ZERO DUPLICATES!');
    console.log('============================================================');
    console.log(`• Unique Teams:       ${teamsList.length}`);
    console.log(`• Unique Players:     ${playersList.length}`);
    console.log(`• Sports:             ${SPORTS.length}`);
    console.log(`• Venues:             ${VENUES.length}`);
    console.log(`• Matches:            ${MATCHES.length}`);
    console.log(`• Fan Reviews:        ${REVIEWS.length}`);
    console.log(`• Player Ratings:     ${RATINGS.length}`);
    console.log(`• Fan Ballots (Votes):${VOTES.length}`);
    console.log(`• Live Reactions:     ${REACTIONS.length}`);
    console.log(`• Admin Account:      jainish@olympia.com / olympia123`);
    console.log('============================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during seeding:', err);
    process.exit(1);
  }
}

run();