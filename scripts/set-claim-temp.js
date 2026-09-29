import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as path from 'path';

// Load service account from .env
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found');
  process.exit(1);
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

if (!config.FIREBASE_CLIENT_EMAIL || !config.FIREBASE_PRIVATE_KEY) {
  console.error('❌ Missing FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY in .env');
  console.log('\n📋 To fix:');
  console.log('1. Go to Firebase Console → Project Settings → Service Accounts');
  console.log('2. Click "Generate new private key" → Save JSON');
  console.log('3. Add to .env:');
  console.log('   FIREBASE_CLIENT_EMAIL=your-sa@project.iam.gserviceaccount.com');
  console.log('   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nXXX\\n-----END PRIVATE KEY-----\\n"');
  process.exit(1);
}

initializeApp({
  credential: cert({
    projectId: config.VITE_FIREBASE_PROJECT_ID,
    clientEmail: config.FIREBASE_CLIENT_EMAIL,
    privateKey: config.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
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