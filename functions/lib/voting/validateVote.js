"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateVote = void 0;
const functions = __importStar(require("firebase-functions/v2"));
const admin = __importStar(require("firebase-admin"));
exports.validateVote = functions.firestore.onDocumentCreated('votes/{voteId}', async (event) => {
    const snapshot = event.data;
    if (!snapshot)
        return;
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
        if (!latestMatch.exists)
            return;
        const votesCount = latestMatch.data()?.votesCount || { teamA: 0, teamB: 0 };
        votesCount[selectedTeam] = (votesCount[selectedTeam] || 0) + 1;
        transaction.update(matchRef, { votesCount });
    });
});
//# sourceMappingURL=validateVote.js.map