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
  const email = process.argv[2] || process.env.ADMIN_EMAIL || 'p@olympia.com';
  const password = process.argv[3] || process.env.ADMIN_INITIAL_PASSWORD || 'olympia11';
  let user;
  try {
    user = await auth.getUserByEmail(email);
    console.log(`Found existing user in Auth: ${user.uid} (${email})`);
    // Ensure password is updated if provided
    if (password) {
      await auth.updateUser(user.uid, { password });
      console.log(`✅ Updated password for ${email}`);
    }
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      user = await auth.createUser({
        email,
        password,
        displayName: 'Olympia Admin',
      });
      console.log(`✅ Created admin user in Auth: ${user.uid} (${email})`);
    } else {
      throw err;
    }
  }

  await auth.setCustomUserClaims(user.uid, { admin: true });
  console.log(`✅ Set admin: true custom claim for ${email} (${user.uid})`);

  // Ensure authoritative admins/{uid} document exists in Firestore
  const { getFirestore, FieldValue } = await import('firebase-admin/firestore');
  const db = getFirestore();
  await db.doc(`admins/${user.uid}`).set({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || 'Jainish',
    role: 'super_admin',
    active: true,
    permissions: ['all'],
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  console.log(`✅ Verified admins/${user.uid} document in Firestore`);

  console.log('\n👑 Production Administrator Provisioning Complete!');
  console.log(`• Email: ${email}`);
  console.log(`• UID:   ${user.uid}`);
  console.log(`• Claim: admin = true`);
  process.exit(0);
}

main().catch(e => { console.error('❌ Error provisioning admin:', e.message); process.exit(1); });