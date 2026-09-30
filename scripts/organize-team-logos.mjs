import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const sourceDir = path.join(rootDir, 'src', 'assets', 'Logos', 'Logos');
const targetAssetsDir = path.join(rootDir, 'src', 'assets', 'Logos');
const targetPublicDir = path.join(rootDir, 'public', 'logos');

if (!fs.existsSync(sourceDir)) {
  console.error('Source directory does not exist:', sourceDir);
  process.exit(1);
}

if (!fs.existsSync(targetAssetsDir)) {
  fs.mkdirSync(targetAssetsDir, { recursive: true });
}

if (!fs.existsSync(targetPublicDir)) {
  fs.mkdirSync(targetPublicDir, { recursive: true });
}

export const TEAMS = [
  { name: "Apex Attackers", sport: "lan-games", file: "Apex Attackers.jpg", slug: "apex-attackers" },
  { name: "Boundary Breakers", sport: "cricket", file: "Boundary Breakers.jpg", slug: "boundary-breakers" },
  { name: "Court Kings", sport: "hand-tennis", file: "Court Kings.jpg", slug: "court-kings" },
  { name: "Frag Ninjas", sport: "lan-games", file: "Frag Ninjas.jpg", slug: "frag-ninjas" },
  { name: "G.C. Spikers", sport: "hand-tennis", file: "G.C. Spikers.png", slug: "gc-spikers", aliases: ["GC Spikers", "G C Spikers"] },
  { name: "Hand Hitters", sport: "hand-tennis", file: "Hand Hitters.jpg", slug: "hand-hitters" },
  { name: "Jinu's Smashers", sport: "volleyball", file: "Jinu's Smashers.jpg", slug: "jinus-smashers", aliases: ["Jinus Smashers", "Jinu Smashers"] },
  { name: "K-Strike", sport: "lan-games", file: "K-Strike.png", slug: "k-strike", aliases: ["K Strike", "KStrike"] },
  { name: "Lagga's Legends", sport: "lan-games", file: "Lagga's Legends.jpg", slug: "laggas-legends", aliases: ["Laggas Legends", "Lagga Legends"] },
  { name: "Legendary Lions", sport: "cricket", file: "Legendary Lions.jpg", slug: "legendary-lions" },
  { name: "Net Warriors", sport: "volleyball", file: "Net Warriors.jpg", slug: "net-warriors" },
  { name: "Power Hitters", sport: "cricket", file: "Power Hitters.jpg", slug: "power-hitters" },
  { name: "Power Palm", sport: "hand-tennis", file: "Power Palm.jpg", slug: "power-palm" },
  { name: "Reign FC", sport: "football", file: "Reign FC.jpg", slug: "reign-fc", aliases: ["ReignFC", "Reign"] },
  { name: "Ronin XI", sport: "cricket", file: "ronin XI.png", slug: "ronin-xi", aliases: ["ronin XI", "Ronin 11", "Ronin-XI"] },
  { name: "Shadow Spikers", sport: "hand-tennis", file: "Shadow Spikers.png", slug: "shadow-spikers" },
  { name: "Shadow Strikers", sport: "football", file: "Shadow Strikers.jpg", slug: "shadow-strikers" },
  { name: "Shadow X", sport: "hand-tennis", file: "Shadow X.jpg", slug: "shadow-x", aliases: ["ShadowX"] },
  { name: "Spike Warriors", sport: "volleyball", file: "Spike Warriors.jpg", slug: "spike-warriors" },
  { name: "Super Strikers", sport: "football", file: "Super Strikers.jpg", slug: "super-strikers" },
  { name: "Vedant Blackfangs", sport: "football", file: "Vedant Blackfang.jpg", slug: "vedant-blackfangs", aliases: ["Vedant Blackfang", "Vedant Black Fangs"] },
  { name: "Vedant Spikers", sport: "volleyball", file: "Vedant Spikers.jpg", slug: "vedant-spikers" },
  { name: "Vortex Aces", sport: "volleyball", file: "Vortex Aces.jpg", slug: "vortex-aces" },
  { name: "Vraj ke Veterans", sport: "volleyball", file: "Vraj ke Veterans.jpg", slug: "vraj-ke-veterans", aliases: ["Vraj Ke Veterans", "Vraj Veterans"] }
];

console.log('Copying and arranging team logos...');

let copiedCount = 0;
for (const team of TEAMS) {
  const srcFilePath = path.join(sourceDir, team.file);
  if (!fs.existsSync(srcFilePath)) {
    console.warn(`⚠️ Source file not found: ${srcFilePath}`);
    continue;
  }

  const ext = path.extname(team.file);

  // 1. Copy directly into src/assets/Logos/<file>
  const assetTarget = path.join(targetAssetsDir, team.file);
  fs.copyFileSync(srcFilePath, assetTarget);

  // 2. Copy into public/logos/<file>
  const publicTargetExact = path.join(targetPublicDir, team.file);
  fs.copyFileSync(srcFilePath, publicTargetExact);

  // 3. Copy into public/logos/<slug><ext>
  const publicTargetSlug = path.join(targetPublicDir, `${team.slug}${ext}`);
  fs.copyFileSync(srcFilePath, publicTargetSlug);

  copiedCount++;
  console.log(`✅ [${team.sport}] ${team.name} -> ${team.file} & ${team.slug}${ext}`);
}

console.log(`\n🎉 Processed ${copiedCount} team logos successfully!`);
