import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

admin.initializeApp();

// Secret for one-time admin claim setup (set in Firebase Console → Functions → Environment variables)
// Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
const SETUP_SECRET = process.env.ADMIN_SETUP_SECRET || 'change-me-in-production';

export const setupAdminClaim = onRequest(async (req, res) => {
  // Only allow POST
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  // Check secret
  const providedSecret = req.headers['x-setup-secret'] || req.query.secret;
  if (!providedSecret || providedSecret !== SETUP_SECRET) {
    res.status(401).send('Invalid secret');
    return;
  }

  const targetEmail = req.body?.email;
  if (!targetEmail) {
    res.status(400).json({ error: 'email required in body' });
    return;
  }

  try {
    const user = await admin.auth().getUserByEmail(targetEmail);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    
    // Ensure admin profile exists
    await admin.firestore().collection('admins').doc(user.uid).set({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || targetEmail,
      role: 'super_admin',
      active: true,
      permissions: ['all'],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    res.json({ success: true, uid: user.uid, email: user.email, message: 'Admin claim set. Log out and back in.' });
  } catch (error: any) {
    console.error('Error setting admin claim:', error);
    if (error.code === 'auth/user-not-found') {
      res.status(404).json({ error: `User ${targetEmail} not found` });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});