import { initializeApp, getApps, applicationDefault, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as path from 'path';

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
    projectId: config.VITE_FIREBASE_PROJECT_ID,
    clientEmail: config.FIREBASE_CLIENT_EMAIL,
    privateKey: config.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };
}

async function setAdminClaim(email: string) {
  const firebaseConfig = loadFirebaseConfig();
  
  if (!getApps().length) {
    if (firebaseConfig.clientEmail && firebaseConfig.privateKey) {
      initializeApp({
        credential: cert({
          projectId: firebaseConfig.projectId,
          clientEmail: firebaseConfig.clientEmail,
          privateKey: firebaseConfig.privateKey,
        }),
      });
    } else {
      // Fall back to application default with project ID
      initializeApp({
        credential: applicationDefault(),
        projectId: firebaseConfig.projectId,
      });
    }
    console.log(`🔥 Connected to Firebase Project: "${firebaseConfig.projectId}"`);
  }

  const adminAuth = getAuth();
  
  try {
    const userRecord = await adminAuth.getUserByEmail(email);
    console.log(`Found user: ${userRecord.uid} (${userRecord.email})`);
    
    // Set admin custom claim
    await adminAuth.setCustomUserClaims(userRecord.uid, { admin: true });
    console.log(`✅ Set admin: true custom claim for ${email}`);
    
    // Verify
    const updatedUser = await adminAuth.getUser(userRecord.uid);
    console.log(`Verified claims:`, updatedUser.customClaims);
    
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      console.error(`❌ User ${email} not found in Firebase Auth`);
      console.log('Run `npm run seed:csv` first to create the user');
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

const email = process.argv[2] || 'jainish@olympia.com';
setAdminClaim(email).then(() => process.exit(0)).catch(() => process.exit(1));