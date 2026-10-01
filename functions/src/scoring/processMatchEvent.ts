import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

/**
 * DEPRECATED / LEGACY: Canonical scoring is handled atomically via `scoringService.ts`
 * inside Firestore transactions on `matches/{matchId}` and `matches/{matchId}/events/{eventId}`.
 * This function listened to the legacy root `matchEvents` collection and is kept inert to avoid
 * conflicting with sport-specific atomic score calculations.
 */
export const processMatchEvent = functions.firestore.onDocumentWritten('matchEvents/{eventId}', async (event) => {
  const change = event.data;
  if (!change) return;

  const data = change.after.exists ? change.after.data() : change.before.data();
  if (!data) return;

  const matchId = data.matchId;
  if (!matchId) return;

  // Assuming simple additive scoring for now, can be extended per sport
  const matchRef = admin.firestore().collection('matches').doc(matchId);
  
  await admin.firestore().runTransaction(async (transaction) => {
    const matchDoc = await transaction.get(matchRef);
    if (!matchDoc.exists) return;
    
    // In a real scenario, we'd query all events and recalculate
    // to handle undone events properly.
    const eventsSnapshot = await transaction.get(
      admin.firestore().collection('matchEvents').where('matchId', '==', matchId).where('undone', '!=', true)
    );
    
    let scoreA = 0;
    let scoreB = 0;

    eventsSnapshot.forEach((doc) => {
      const eventData = doc.data();
      if (eventData.team === 'A' || eventData.team === 'teamA') scoreA += (eventData.points || 1);
      if (eventData.team === 'B' || eventData.team === 'teamB') scoreB += (eventData.points || 1);
    });

    transaction.update(matchRef, {
      'score.teamA': scoreA,
      'score.teamB': scoreB,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
});
