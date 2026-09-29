import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const isAnonymous = user.providerData.length === 0;

  await admin.firestore().collection('users').doc(user.uid).set({
    uid: user.uid,
    email: user.email || null,
    displayName: user.displayName || null,
    photoURL: user.photoURL || null,
    isAnonymous,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
});
