import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as path from 'path';

// Load service account from file
const saPath = path.join(process.cwd(), 'service-account.json');
if (!fs.existsSync(saPath)) {
  console.error('❌ service-account.json not found in project root');
  console.log('\n📋 To fix:');
  console.log('1. Firebase Console → Project Settings → Service Accounts');
  console.log('2. "Generate new private key" → Save as service-account.json in project root');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(saPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount),
});

const auth = getAuth();

async function main() {
  const email = 'jainish@olympia.com';
  const user = await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(user.uid, { admin: true });
  console.log(`✅ Set admin claim for ${email} (${user.uid})`);
  console.log('🔄 Log out and back in (or wait ~1hr for token refresh)');
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });