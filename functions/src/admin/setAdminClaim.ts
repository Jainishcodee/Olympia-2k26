import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const setAdminClaim = onCall(async (request) => {
  // Only allow if caller is already an admin (has admin claim)
  if (!request.auth || request.auth.token.admin !== true) {
    throw new HttpsError('permission-denied', 'Only existing admins can grant admin access');
  }

  const targetEmail = request.data.email;
  if (!targetEmail) {
    throw new HttpsError('invalid-argument', 'email is required');
  }

  try {
    const user = await admin.auth().getUserByEmail(targetEmail);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    
    // Also ensure admin profile exists in Firestore
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

    return { success: true, uid: user.uid, email: user.email };
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      throw new HttpsError('not-found', `User ${targetEmail} not found`);
    }
    throw new HttpsError('internal', error.message);
  }
});