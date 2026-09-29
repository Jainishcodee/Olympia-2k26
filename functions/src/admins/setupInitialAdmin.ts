import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

export const setupInitialAdmin = functions.https.onCall(async (request) => {
  const { email, password, displayName = 'Super Admin' } = request.data;

  if (!email || !password) {
    throw new functions.https.HttpsError('invalid-argument', 'Email and password are required');
  }

  const adminsRef = admin.firestore().collection('admins');
  const snapshot = await adminsRef.limit(1).get();

  if (!snapshot.empty) {
    throw new functions.https.HttpsError('permission-denied', 'Admins already exist. Use createAdmin instead.');
  }

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
    });

    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true, role: 'superadmin' });

    await adminsRef.doc(userRecord.uid).set({
      email,
      role: 'superadmin',
      displayName,
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      uid: userRecord.uid,
      email: userRecord.email,
    };
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', 'Error creating initial admin.');
  }
});
