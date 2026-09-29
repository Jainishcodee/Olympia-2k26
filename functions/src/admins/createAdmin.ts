import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { verifyAdmin } from '../utils/adminCheck';

export const createAdmin = functions.https.onCall(async (request) => {
  verifyAdmin(request);

  const { email, password, role = 'admin', displayName = 'Admin' } = request.data;

  if (!email || !password) {
    throw new functions.https.HttpsError('invalid-argument', 'Email and password are required');
  }

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
    });

    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true, role });

    await admin.firestore().collection('admins').doc(userRecord.uid).set({
      email,
      role,
      displayName,
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      uid: userRecord.uid,
      email: userRecord.email,
    };
  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
      throw new functions.https.HttpsError('already-exists', 'Email already in use.');
    }
    if (error.code === 'auth/invalid-password') {
      throw new functions.https.HttpsError('invalid-argument', 'Weak password.');
    }
    throw new functions.https.HttpsError('internal', 'Error creating admin user.');
  }
});
