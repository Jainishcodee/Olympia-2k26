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
exports.setupInitialAdmin = void 0;
const functions = __importStar(require("firebase-functions/v2"));
const admin = __importStar(require("firebase-admin"));
exports.setupInitialAdmin = functions.https.onCall(async (request) => {
    const { email, password, displayName = 'Super Admin' } = request.data;
    if (!email || !password) {
        throw new functions.https.HttpsError('invalid-argument', 'Email and password are required');
    }
    const adminsRef = admin.firestore().collection('admins');
    const snapshot = await adminsRef.limit(1).get();
    if (!snapshot.empty) {
        throw new functions.https.HttpsError('permission-denied', 'Admins already exist. Use createAdmin instead.');
    }
    try {
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName,
        });
        await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true, role: 'superadmin' });
        await adminsRef.doc(userRecord.uid).set({
            email,
            role: 'superadmin',
            displayName,
            active: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return {
            uid: userRecord.uid,
            email: userRecord.email,
        };
    }
    catch (error) {
        throw new functions.https.HttpsError('internal', 'Error creating initial admin.');
    }
});
//# sourceMappingURL=setupInitialAdmin.js.map