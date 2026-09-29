import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

export const aggregateReactions = functions.firestore.onDocumentCreated('reactions/{reactionId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const data = snapshot.data();
  const matchId = data.matchId;
  const userId = data.userId;
  const type = data.type; // e.g. 'like', 'fire'

  if (!matchId || !userId || !type) return;

  const now = Date.now();
  const reactionTime = data.timestamp ? data.timestamp.toMillis() : now;

  // Rate limiting check
  const recentReactions = await admin.firestore().collection('reactions')
    .where('userId', '==', userId)
    .where('matchId', '==', matchId)
    .orderBy('timestamp', 'desc')
    .limit(2)
    .get();

  if (recentReactions.docs.length > 1) {
    const lastReaction = recentReactions.docs[1].data();
    if (lastReaction.timestamp) {
      const timeDiff = reactionTime - lastReaction.timestamp.toMillis();
      if (timeDiff < 2000) {
        // Rate limited: less than 2 seconds since last reaction
        await snapshot.ref.delete();
        return;
      }
    }
  }

  const matchRef = admin.firestore().collection('matches').doc(matchId);
  
  await admin.firestore().runTransaction(async (transaction) => {
    const matchDoc = await transaction.get(matchRef);
    if (!matchDoc.exists) return;

    const currentCounts = matchDoc.data()?.reactionCounts || {};
    const newCount = (currentCounts[type] || 0) + 1;

    transaction.update(matchRef, {
      [`reactionCounts.${type}`]: newCount,
    });
  });
});
