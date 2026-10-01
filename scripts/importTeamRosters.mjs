/**
 * Import the five team-sport auction CSVs into Firestore.
 *
 * Default behaviour is a dry run. Use `npm run import:rosters -- --apply`
 * after adding service-account.json at the repository root (it is ignored by
 * git) or setting GOOGLE_APPLICATION_CREDENTIALS to a service-account key.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apply = process.argv.includes('--apply');
const csvFiles = ['cricket.csv', 'football.csv', 'volleyball.csv', 'hand_tennis.csv', 'lan_games.csv'];
const sportIds = {
  Cricket: 'cricket',
  Football: 'football',
  Volleyball: 'volleyball',
  'Hand Tennis': 'hand-tennis',
  'LAN Games': 'lan-games',
};

const slugify = (value) => String(value ?? '')
  .toLowerCase().trim().replace(/['']/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const normalise = (value) => slugify(value).replace(/-/g, '');

function parseLine(line) {
  const values = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const character = line[i];
    if (character === '"') {
      if (quoted && line[i + 1] === '"') { value += '"'; i += 1; }
      else quoted = !quoted;
    } else if (character === ',' && !quoted) {
      values.push(value.trim()); value = '';
    } else value += character;
  }
  values.push(value.trim());
  return values;
}

function readCsv(fileName) {
  const lines = fs.readFileSync(path.join(rootDir, 'src', 'assets', fileName), 'utf8')
    .replace(/\r/g, '').split('\n').filter((line) => line.trim());
  const headers = parseLine(lines[0]);
  return lines.slice(1).map((line) => Object.fromEntries(headers.map((header, index) => [header, parseLine(line)[index] ?? ''])));
}

function logoIndex() {
  const directory = path.join(rootDir, 'public', 'logos');
  const entries = fs.readdirSync(directory)
    .filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file))
    // Prefer the lowercase deployment-safe filename when duplicate variants exist.
    .sort((a, b) => a.localeCompare(b));
  const indexed = new Map();
  for (const file of entries) {
    const key = normalise(path.parse(file).name);
    const current = indexed.get(key);
    if (!current || file === file.toLowerCase()) indexed.set(key, `/logos/${file}`);
  }
  return indexed;
}

function buildDocuments() {
  const teams = new Map();
  const players = new Map();
  const logos = logoIndex();

  for (const csvFile of csvFiles) {
    for (const row of readCsv(csvFile)) {
      const sportName = row.Sport?.trim();
      const sportId = sportIds[sportName];
      const teamName = row.Team?.trim();
      const playerName = row.Player?.trim();
      const captainName = row.Captain?.trim();
      if (!sportId || !teamName || !playerName) throw new Error(`Invalid roster row in ${csvFile}`);

      const teamSlug = slugify(teamName);
      const teamId = `team-${sportId}-${teamSlug}`;
      const team = teams.get(teamId) ?? {
        id: teamId,
        name: teamName,
        shortName: teamName.split(/\s+/).map((word) => word[0]).join('').slice(0, 4).toUpperCase(),
        sportId,
        logo: logos.get(normalise(teamName)) ?? '',
        captainName,
        captainId: '',
        viceCaptainId: '',
        playerIds: [],
        coach: '',
        description: `${teamName} - official ${sportName} squad for Olympia 2K26`,
        active: true,
        wins: 0, losses: 0, draws: 0, points: 0,
      };
      teams.set(teamId, team);

      // Auction player IDs preserve distinct people with the same display name.
      const sourcePlayerId = slugify(row['Player ID']) || slugify(playerName);
      const playerId = `player-${sportId}-${teamSlug}-${sourcePlayerId}`;
      if (!players.has(playerId)) {
        players.set(playerId, {
          id: playerId, name: playerName, teamId, sportId,
          role: normalise(playerName) === normalise(captainName) ? 'captain' : 'player',
          position: row.Position === 'N/A' ? '' : (row.Position?.trim() ?? ''),
          photo: '', jerseyNumber: Number(row['Player ID']) || 0, gender: 'male', bio: '', active: true,
          stats: { matchesPlayed: 0, goals: 0, assists: 0, runs: 0, wickets: 0, points: 0, wins: 0, losses: 0, rating: 0 },
        });
        team.playerIds.push(playerId);
      }
    }
  }

  for (const team of teams.values()) {
    const captain = [...players.values()].find((player) => player.teamId === team.id && normalise(player.name) === normalise(team.captainName));
    if (captain) {
      captain.role = 'captain';
      team.captainId = captain.id;
    } else {
      // Captains occasionally do not appear as an auction player row; retain them in the roster.
      const captainId = `player-${team.sportId}-${slugify(team.name)}-captain-${slugify(team.captainName)}`;
      players.set(captainId, {
        id: captainId, name: team.captainName, teamId: team.id, sportId: team.sportId,
        role: 'captain', position: 'Captain', photo: '', jerseyNumber: 0, gender: 'male',
        bio: `Captain of ${team.name}`, active: true,
        stats: { matchesPlayed: 0, goals: 0, assists: 0, runs: 0, wickets: 0, points: 0, wins: 0, losses: 0, rating: 0 },
      });
      team.playerIds.unshift(captainId);
      team.captainId = captainId;
    }
    if (!team.logo) throw new Error(`No public logo found for ${team.name}`);
  }
  return { teams: [...teams.values()], players: [...players.values()] };
}

function configuredProjectId() {
  const configPath = path.join(rootDir, 'src', 'config', 'firebaseConfig.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (config.projectId) return config.projectId;
  }
  return process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
}

async function writeDocuments(teams, players) {
  let adminApp;
  let adminFirestore;
  try {
    adminApp = await import('firebase-admin/app');
    adminFirestore = await import('firebase-admin/firestore');
  } catch {
    throw new Error('firebase-admin is not installed. Run npm install before importing.');
  }
  const serviceAccountPath = path.join(rootDir, 'service-account.json');
  const hasServiceAccount = fs.existsSync(serviceAccountPath);
  const hasApplicationCredentials = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  if (!hasServiceAccount && !hasApplicationCredentials) {
    throw new Error(
      'Firestore import needs server credentials. Add service-account.json to the project root, '
      + 'or set GOOGLE_APPLICATION_CREDENTIALS to the absolute path of a Firebase service-account key.'
    );
  }

  const app = adminApp.getApps()[0] ?? adminApp.initializeApp(hasServiceAccount
    ? { credential: adminApp.cert(JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))) }
    : { credential: adminApp.applicationDefault(), projectId: configuredProjectId() });
  const db = adminFirestore.getFirestore(app);
  const writes = [
    ...teams.map((team) => ['teams', team.id, team]),
    ...players.map((player) => ['players', player.id, player]),
  ];
  for (let index = 0; index < writes.length; index += 400) {
    const batch = db.batch();
    for (const [collection, id, data] of writes.slice(index, index + 400)) {
      batch.set(db.collection(collection).doc(id), { ...data, updatedAt: adminFirestore.FieldValue.serverTimestamp() }, { merge: true });
    }
    await batch.commit();
  }
}

const { teams, players } = buildDocuments();
console.log(`Prepared ${teams.length} teams and ${players.length} players from ${csvFiles.length} CSV files.`);
console.table(teams.map(({ name, sportId, captainName, playerIds, logo }) => ({ sportId, name, captainName, players: playerIds.length, logo })));
if (apply) {
  await writeDocuments(teams, players);
  console.log(`Imported ${teams.length} teams and ${players.length} players into Firestore.`);
} else {
  console.log('Dry run only. Re-run with --apply to write to Firestore.');
}
