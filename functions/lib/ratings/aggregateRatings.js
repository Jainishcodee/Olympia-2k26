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
exports.aggregateRatings = void 0;
const functions = __importStar(require("firebase-functions/v2"));
const admin = __importStar(require("firebase-admin"));
exports.aggregateRatings = functions.firestore.onDocumentWritten('ratings/{ratingId}', async (event) => {
    const change = event.data;
    if (!change)
        return;
    const data = change.after.exists ? change.after.data() : change.before.data();
    if (!data)
        return;
    const { matchId, playerId } = data;
    if (!matchId || !playerId)
        return;
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
//# sourceMappingURL=aggregateRatings.js.map