import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

export const aggregateRatings = functions.firestore.onDocumentWritten('ratings/{ratingId}', async (event) => {
  const change = event.data;
  if (!change) return;

  const data = change.after.exists ? change.after.data() : change.before.data();
  if (!data) return;

  const { matchId, playerId } = data;
  if (!matchId || !playerId) return;

  const ratingsRef = admin.firestore().collection('ratings');
  const querySnapshot = await ratingsRef
    .where('matchId', '==', matchId)
    .where('playerId', '==', playerId)
    .get();

  let totalRating = 0;
  let count = 0;

  querySnapshot.forEach((doc) => {
    const ratingValue = doc.data().rating;
    if (typeof ratingValue === 'number') {
      totalRating += ratingValue;
      count++;
    }
  });

  const averageRating = count > 0 ? totalRating / count : 0;

  // Store the aggregate
  await admin.firestore().collection('ratingAggregates')
    .doc(`${matchId}_${playerId}`)
    .set({
      matchId,
      playerId,
      averageRating,
      count,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
});
