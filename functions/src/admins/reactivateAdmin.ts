import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { verifyAdmin } from '../utils/adminCheck';

export const reactivateAdmin = functions.https.onCall(async (request) => {
  verifyAdmin(request);

  const { uid } = request.data;
  
  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'UID is required');
  }

  try {
    await admin.auth().updateUser(uid, { disabled: false });
    
    await admin.firestore().collection('admins').doc(uid).update({
      active: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true };
  } catch (error: any) {
    throw new functions.https.HttpsError('internal', 'Error reactivating admin.');
  }
});
