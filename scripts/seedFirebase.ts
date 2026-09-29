import * as admin from 'firebase-admin';
import { SEED_SPORTS, SEED_VENUES, SEED_TEAMS, SEED_PLAYERS, SEED_MATCHES, SEED_TOURNAMENTS, SEED_ANNOUNCEMENTS } from '../src/data/seedData';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
}

const db = admin.firestore();

async function seedCollection(collectionName: string, data: any[]) {
  console.log(`Seeding ${collectionName}...`);
  const batch = db.batch();
  data.forEach((item) => {
    const docRef = db.collection(collectionName).doc(item.id);
    batch.set(docRef, item);
  });
  await batch.commit();
  console.log(`Successfully seeded ${collectionName}.`);
}

async function clearCollection(collectionName: string) {
  console.log(`Clearing ${collectionName}...`);
  const snapshot = await db.collection(collectionName).get();
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  console.log(`Cleared ${collectionName}.`);
}

async function main() {
  const args = process.argv.slice(2);
  const clearFirst = args.includes('--clear');

  const collections = {
    sports: SEED_SPORTS,
    venues: SEED_VENUES,
    teams: SEED_TEAMS,
    players: SEED_PLAYERS,
    matches: SEED_MATCHES,
    tournaments: SEED_TOURNAMENTS,
    announcements: SEED_ANNOUNCEMENTS
  };

  try {
    if (clearFirst) {
      for (const key of Object.keys(collections)) {
        await clearCollection(key);
      }
    }

    for (const [key, data] of Object.entries(collections)) {
      await seedCollection(key, data);
    }

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

main();
