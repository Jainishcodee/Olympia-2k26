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
exports.setAdminClaim = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
exports.setAdminClaim = (0, https_1.onCall)(async (request) => {
    // Only allow if caller is already an admin (has admin claim)
    if (!request.auth || request.auth.token.admin !== true) {
        throw new https_1.HttpsError('permission-denied', 'Only existing admins can grant admin access');
    }
    const targetEmail = request.data.email;
    if (!targetEmail) {
        throw new https_1.HttpsError('invalid-argument', 'email is required');
    }
    try {
        const user = await admin.auth().getUserByEmail(targetEmail);
        await admin.auth().setCustomUserClaims(user.uid, { admin: true });
        // Also ensure admin profile exists in Firestore
        await admin.firestore().collection('admins').doc(user.uid).set({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || targetEmail,
            role: 'super_admin',
            active: true,
            permissions: ['all'],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        return { success: true, uid: user.uid, email: user.email };
    }
    catch (error) {
        if (error.code === 'auth/user-not-found') {
            throw new https_1.HttpsError('not-found', `User ${targetEmail} not found`);
        }
        throw new https_1.HttpsError('internal', error.message);
    }
});
//# sourceMappingURL=setAdminClaim.js.map