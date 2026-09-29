// Run with: node set-admin-claim.js
// Requires: FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in .env

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(process.cwd(), '.env');
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
  console.log('Get them from: Firebase Console → Project Settings → Service Accounts → Generate Private Key');
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
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });