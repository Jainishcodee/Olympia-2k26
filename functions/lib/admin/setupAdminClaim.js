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
exports.setupAdminClaim = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
// Secret for one-time admin claim setup (set in Firebase Console → Functions → Environment variables)
// Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
const SETUP_SECRET = process.env.ADMIN_SETUP_SECRET || 'change-me-in-production';
exports.setupAdminClaim = (0, https_1.onRequest)(async (req, res) => {
    // Only allow POST
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    // Check secret
    const providedSecret = req.headers['x-setup-secret'] || req.query.secret;
    if (!providedSecret || providedSecret !== SETUP_SECRET) {
        res.status(401).send('Invalid secret');
        return;
    }
    const targetEmail = req.body?.email;
    if (!targetEmail) {
        res.status(400).json({ error: 'email required in body' });
        return;
    }
    try {
        const user = await admin.auth().getUserByEmail(targetEmail);
        await admin.auth().setCustomUserClaims(user.uid, { admin: true });
        // Ensure admin profile exists
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
        res.json({ success: true, uid: user.uid, email: user.email, message: 'Admin claim set. Log out and back in.' });
    }
    catch (error) {
        console.error('Error setting admin claim:', error);
        if (error.code === 'auth/user-not-found') {
            res.status(404).json({ error: `User ${targetEmail} not found` });
        }
        else {
            res.status(500).json({ error: error.message });
        }
    }
});
//# sourceMappingURL=setupAdminClaim.js.map