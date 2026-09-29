import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

export const verifyAdmin = (request: functions.https.CallableRequest<any>) => {
  if (!request.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }
  if (request.auth.token.admin !== true) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'The function must be called by an admin.'
    );
  }
};

export const getAdminRole = async (uid: string): Promise<string | null> => {
  const doc = await admin.firestore().collection('admins').doc(uid).get();
  if (doc.exists) {
    return doc.data()?.role || null;
  }
  return null;
};
