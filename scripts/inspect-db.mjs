import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
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

async function inspect() {
  const sportsSnap = await getDocs(collection(db, 'sports'));
  console.log('SPORTS:', sportsSnap.size);
  sportsSnap.forEach(d => console.log('Sport:', d.id, d.data().name, 'teamBased:', d.data().teamBased));

  const teamsSnap = await getDocs(collection(db, 'teams'));
  console.log('TEAMS:', teamsSnap.size);
  teamsSnap.forEach(d => console.log('Team:', d.id, d.data().name, d.data().sportId, 'pts:', d.data().points, 'W/L:', d.data().wins, d.data().losses));

  const playersSnap = await getDocs(collection(db, 'players'));
  console.log('PLAYERS:', playersSnap.size);
}

inspect().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
