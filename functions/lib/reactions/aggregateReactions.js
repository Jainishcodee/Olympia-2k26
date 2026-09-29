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
exports.aggregateReactions = void 0;
const functions = __importStar(require("firebase-functions/v2"));
const admin = __importStar(require("firebase-admin"));
exports.aggregateReactions = functions.firestore.onDocumentCreated('reactions/{reactionId}', async (event) => {
    const snapshot = event.data;
    if (!snapshot)
        return;
    const data = snapshot.data();
    const matchId = data.matchId;
    const userId = data.userId;
    const type = data.type; // e.g. 'like', 'fire'
    if (!matchId || !userId || !type)
        return;
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
        if (!matchDoc.exists)
            return;
        const currentCounts = matchDoc.data()?.reactionCounts || {};
        const newCount = (currentCounts[type] || 0) + 1;
        transaction.update(matchRef, {
            [`reactionCounts.${type}`]: newCount,
        });
    });
});
//# sourceMappingURL=aggregateReactions.js.map