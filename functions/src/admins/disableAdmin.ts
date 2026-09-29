import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { verifyAdmin } from '../utils/adminCheck';

export const disableAdmin = functions.https.onCall(async (request) => {
  verifyAdmin(request);

  const { uid } = request.data;
  
  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'UID is required');
  }

  if (uid === request.auth?.uid) {
    throw new functions.https.HttpsError('permission-denied', 'Cannot disable yourself');
  }

  try {
    await admin.auth().updateUser(uid, { disabled: true });
    
    await admin.firestore().collection('admins').doc(uid).update({
      active: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true };
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', 'Error disabling admin.');
  }
});
