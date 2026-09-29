import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

export const validateVote = functions.firestore.onDocumentCreated('votes/{voteId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const data = snapshot.data();
  const { matchId, selectedTeam, userId } = data;

  if (!matchId || !selectedTeam || !userId) {
    await snapshot.ref.delete();
    return;
  }

  const matchRef = admin.firestore().collection('matches').doc(matchId);
  const matchDoc = await matchRef.get();

  if (!matchDoc.exists) {
    await snapshot.ref.delete();
    return;
  }

  if (selectedTeam !== 'teamA' && selectedTeam !== 'teamB') {
    await snapshot.ref.delete();
    return;
  }

  // Check for duplicate vote
  const existingVotes = await admin.firestore().collection('votes')
    .where('matchId', '==', matchId)
    .where('userId', '==', userId)
    .get();

  if (existingVotes.size > 1) { // 1 because this current vote is already written
    // Delete duplicate
    await snapshot.ref.delete();
    return;
  }

  // Update match counts
  await admin.firestore().runTransaction(async (transaction) => {
    const latestMatch = await transaction.get(matchRef);
    if (!latestMatch.exists) return;
    
    const votesCount = latestMatch.data()?.votesCount || { teamA: 0, teamB: 0 };
    votesCount[selectedTeam] = (votesCount[selectedTeam] || 0) + 1;

    transaction.update(matchRef, { votesCount });
  });
});
