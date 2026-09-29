import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection, writeBatch, getDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';

// Load Firebase config from .env
function loadFirebaseConfig() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env file not found');
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const config: Record<string, string> = {};
  
  for (const line of envContent.split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = match[2] || '';
      val = val.trim().replace(/^['"](.*)['"]$/, '$1');
      config[match[1]] = val;
    }
  }
  
  return {
    apiKey: config.VITE_FIREBASE_API_KEY,
    authDomain: config.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: config.VITE_FIREBASE_PROJECT_ID,
    storageBucket: config.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: config.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: config.VITE_FIREBASE_APP_ID,
    measurementId: config.VITE_FIREBASE_MEASUREMENT_ID,
  };
}

const firebaseConfig = loadFirebaseConfig();

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Firebase configuration missing in .env');
  process.exit(1);
}

console.log(`🔥 Connecting to Firebase Project: "${firebaseConfig.projectId}"`);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// CSV file paths - expects simplified format in src/assets/teams.csv
const CSV_FILE = 'src/assets/teams.csv';

// Sport name to sport ID mapping
const SPORT_MAP: Record<string, string> = {
  'Football': 'football',
  'Cricket': 'cricket',
  'Volleyball': 'volleyball',
  'Hand Tennis': 'hand-tennis',
  'LAN Games': 'counter-strike',
};

interface CSVRow {
  Sport: string;
  Team: string;
  Captain: string;
  Players: string;
}

interface ParsedTeam {
  id: string;
  name: string;
  sportId: string;
  captainName: string;
  captainPlayerId: string;
  playerIds: string[];
}

interface ParsedPlayer {
  id: string;
  name: string;
  teamId: string;
  sportId: string;
  isCaptain: boolean;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function parseCSVFile(): Promise<{ teams: ParsedTeam[]; players: ParsedPlayer[] }> {
  const fullPath = path.join(process.cwd(), CSV_FILE);
  
  if (!fs.existsSync(fullPath)) {
    console.warn(`CSV file not found: ${fullPath}`);
    console.log('Expected format: Sport,Team,Captain,Players (semicolon-separated)');
    return { teams: [], players: [] };
  }

  const rows: CSVRow[] = [];

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(fullPath)
      .pipe(csv({ skipLines: 0 }))
      .on('data', (row: CSVRow) => rows.push(row))
      .on('end', () => resolve())
      .on('error', reject);
  });

  if (rows.length === 0) {
    console.warn('No data rows found in CSV');
    return { teams: [], players: [] };
  }

  console.log(`CSV columns: ${Object.keys(rows[0]).join(', ')}`);

  const teamMap = new Map<string, ParsedTeam>();
  const playerMap = new Map<string, ParsedPlayer>();

  for (const row of rows) {
    const sportName = row.Sport?.trim();
    const sportId = SPORT_MAP[sportName];
    if (!sportId) {
      console.warn(`Unknown sport: "${sportName}" - skipping row`);
      continue;
    }

    const teamName = row.Team?.trim();
    const captainName = row.Captain?.trim();
    const playersStr = row.Players?.trim();

    if (!teamName || !captainName || !playersStr) {
      console.warn(`Missing required fields in row: ${JSON.stringify(row)}`);
      continue;
    }

    const teamId = slugify(teamName);
    const playerNames = playersStr.split(';').map(p => p.trim()).filter(Boolean);
    
    if (!playerNames.includes(captainName)) {
      console.warn(`Captain "${captainName}" not in players list for team "${teamName}" - skipping`);
      continue;
    }

    if (!teamMap.has(teamId)) {
      teamMap.set(teamId, {
        id: teamId,
        name: teamName,
        sportId,
        captainName,
        captainPlayerId: `${sportId}-${slugify(captainName)}`,
        playerIds: [],
      });
    }
    const team = teamMap.get(teamId)!;

    for (const playerName of playerNames) {
      const playerKey = `${sportId}-${slugify(playerName)}`;
      if (!playerMap.has(playerKey)) {
        const isCaptain = playerName === captainName;
        playerMap.set(playerKey, {
          id: playerKey,
          name: playerName,
          teamId,
          sportId,
          isCaptain,
        });
        team.playerIds.push(playerKey);
      }
    }
  }

  return {
    teams: Array.from(teamMap.values()),
    players: Array.from(playerMap.values()),
  };
}

function serverTimestamp() {
  return new Date().toISOString();
}

async function seedSports() {
  const sports = [
    { id: 'football', name: 'Football', slug: 'football', icon: '⚽', description: 'The beautiful game. 11v11 on the pitch.', active: true, scoringType: 'goals', teamBased: true, maxPlayersPerTeam: 18, minPlayersPerTeam: 11 },
    { id: 'cricket', name: 'Cricket', slug: 'cricket', icon: '🏏', description: 'Bat meets ball. Strategic team sport.', active: true, scoringType: 'runs', teamBased: true, maxPlayersPerTeam: 15, minPlayersPerTeam: 11 },
    { id: 'volleyball', name: 'Volleyball', slug: 'volleyball', icon: '🏐', description: 'Spike, set, and serve to victory.', active: true, scoringType: 'sets_points', teamBased: true, maxPlayersPerTeam: 12, minPlayersPerTeam: 6 },
    { id: 'hand-tennis', name: 'Hand Tennis', slug: 'hand-tennis', icon: '✋', description: 'Fast-paced hand tennis action.', active: true, scoringType: 'configurable', teamBased: true, maxPlayersPerTeam: 6, minPlayersPerTeam: 2 },
    { id: 'counter-strike', name: 'Counter-Strike', slug: 'counter-strike', icon: '🎮', description: 'Tactical FPS esports action.', active: true, scoringType: 'rounds', teamBased: true, maxPlayersPerTeam: 5, minPlayersPerTeam: 5 },
  ];

  console.log('Seeding sports (upsert)...');
  const batch = writeBatch(db);
  for (const sport of sports) {
    const docRef = doc(db, 'sports', sport.id);
    // Check if exists first
    const existing = await getDoc(docRef);
    if (!existing.exists()) {
      batch.set(docRef, { ...sport, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    }
  }
  await batch.commit();
  console.log('Sports upserted.');
  
  const verify = await getDocs(collection(db, 'sports'));
  console.log(`Verified: ${verify.size} sports in Firestore`);
}

async function seedVenues() {
  const venues = [
    { id: 'main-arena', name: 'Olympia Main Arena', location: 'Central Campus', capacity: 500, description: 'The flagship arena for major events', active: true },
    { id: 'indoor-court', name: 'Indoor Sports Complex', location: 'Sports Block', capacity: 200, description: 'Multi-purpose indoor facility', active: true },
    { id: 'outdoor-field', name: 'Olympia Ground', location: 'East Campus', capacity: 1000, description: 'Open air sporting ground', active: true },
    { id: 'gaming-hub', name: 'Digital Arena Hub', location: 'Tech Building', capacity: 50, description: 'Esports and gaming facility', active: true },
  ];

  console.log('Seeding venues (upsert)...');
  const batch = writeBatch(db);
  for (const venue of venues) {
    const docRef = doc(db, 'venues', venue.id);
    const existing = await getDoc(docRef);
    if (!existing.exists()) {
      batch.set(docRef, { ...venue, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    }
  }
  await batch.commit();
  console.log('Venues upserted.');
  
  const verify = await getDocs(collection(db, 'venues'));
  console.log(`Verified: ${verify.size} venues in Firestore`);
}

async function seedTeams(teams: ParsedTeam[]) {
  console.log(`Upserting ${teams.length} teams...`);
  const batch = writeBatch(db);

  for (const team of teams) {
    const shortName = team.name
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 3);
    
    const docRef = doc(db, 'teams', team.id);
    // Use merge: true to upsert (preserve existing fields not specified)
    batch.set(docRef, {
      id: team.id,
      name: team.name,
      shortName,
      logo: '',
      sportId: team.sportId,
      captainId: team.captainPlayerId,
      viceCaptainId: '',
      playerIds: team.playerIds,
      coach: '',
      description: '',
      active: true,
      wins: 0,
      losses: 0,
      draws: 0,
      points: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }
  await batch.commit();
  console.log('Teams upserted.');
  
  const verify = await getDocs(collection(db, 'teams'));
  console.log(`Verified: ${verify.size} teams in Firestore`);
}

async function seedPlayers(players: ParsedPlayer[]) {
  console.log(`Upserting ${players.length} players...`);
  const batch = writeBatch(db);

  for (const player of players) {
    const docRef = doc(db, 'players', player.id);
    batch.set(docRef, {
      id: player.id,
      name: player.name,
      photo: '',
      jerseyNumber: 0,
      gender: 'male',
      teamId: player.teamId,
      sportId: player.sportId,
      role: player.isCaptain ? 'captain' : 'player',
      position: '',
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
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }
  await batch.commit();
  console.log('Players upserted.');
  
  const verify = await getDocs(collection(db, 'players'));
  console.log(`Verified: ${verify.size} players in Firestore`);
}

async function seedAdminUser() {
  console.log('Seeding admin user...');
  
  const adminEmail = 'jainish@olympia.com';
  const adminPassword = 'olympia123';
  const adminDisplayName = 'Jainish Admin';

  let userCredential;
  try {
    // Try to create the user
    userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    console.log(`Created auth user: ${userCredential.user.uid}`);
    
    // Update display name
    await updateProfile(userCredential.user, { displayName: adminDisplayName });
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('Admin user already exists in Auth, signing in...');
      userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    } else {
      throw error;
    }
  }

  // Set custom claim for admin (requires Firebase Admin SDK or callable function)
  // For client SDK, we'll create the admin profile in Firestore
  // The custom claim should be set via Cloud Function or Admin SDK separately
  
  // Create admin profile in Firestore
  const adminDoc = {
    uid: userCredential.user.uid,
    email: adminEmail,
    displayName: adminDisplayName,
    role: 'super_admin',
    active: true,
    permissions: ['all'],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'admins', userCredential.user.uid), adminDoc, { merge: true });
  console.log('Admin profile created/updated in Firestore.');
  console.log('ℹ️  Note: Set custom claim "admin: true" via Cloud Function or Firebase Console for full access.');

  return userCredential.user.uid;
}

async function copyAssetsToPublic() {
  console.log('Copying assets to public/images...');
  const publicImagesDir = path.join(process.cwd(), 'public/images');
  if (!fs.existsSync(publicImagesDir)) {
    fs.mkdirSync(publicImagesDir, { recursive: true });
  }

  const assets = ['logo_light.png', 'logo_dark.png', 'arena.jpeg', 'hero.png'];
  for (const asset of assets) {
    const src = path.join(process.cwd(), 'src/assets', asset);
    const dest = path.join(publicImagesDir, asset);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`Copied ${asset} to public/images/`);
    } else {
      console.warn(`Source not found: ${src}`);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const clearFirst = args.includes('--clear');

  try {
    await copyAssetsToPublic();

    if (clearFirst) {
      console.log('Clearing existing data...');
      const collections = ['sports', 'venues', 'teams', 'players', 'admins'];
      for (const coll of collections) {
        const snapshot = await getDocs(collection(db, coll));
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        console.log(`Cleared ${coll}`);
      }
    }

    await seedSports();
    await seedVenues();

    const { teams, players } = await parseCSVFile();
    console.log(`\nParsed ${teams.length} unique teams and ${players.length} unique players from CSV\n`);

    await seedTeams(teams);
    await seedPlayers(players);
    await seedAdminUser();

    console.log('\n✅ All seed data completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

main();