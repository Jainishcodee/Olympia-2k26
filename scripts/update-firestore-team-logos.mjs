/**
 * OLYMPIA 2K26 — Firestore Team Logo Updater
 * Connects to Firebase and sets the logo field for all teams in Firestore.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
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

const LOGO_MAP = {
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

function normalize(str) {
  return (str || '').toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9]/g, '');
}

async function run() {
  console.log(`Connecting to Firestore project: ${config.projectId}...`);
  const teamsCol = collection(db, 'teams');
  const snap = await getDocs(teamsCol);

  console.log(`Found ${snap.docs.length} team documents in Firestore.`);
  let updated = 0;

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const nameNorm = normalize(data.name);
    const idNorm = normalize(docSnap.id);

    const logo = LOGO_MAP[nameNorm] || LOGO_MAP[idNorm];
    if (logo) {
      await updateDoc(doc(db, 'teams', docSnap.id), { logo });
      console.log(`✅ Updated team "${data.name}" (${docSnap.id}) -> ${logo}`);
      updated++;
    } else {
      console.log(`⚠️ No logo match for "${data.name}" (${docSnap.id})`);
    }
  }

  console.log(`\n🎉 Successfully updated ${updated} teams in Firestore!`);
  process.exit(0);
}

run().catch((err) => {
  console.error('Error updating teams:', err);
  process.exit(1);
});
