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
exports.createAdmin = void 0;
const functions = __importStar(require("firebase-functions/v2"));
const admin = __importStar(require("firebase-admin"));
const adminCheck_1 = require("../utils/adminCheck");
exports.createAdmin = functions.https.onCall(async (request) => {
    (0, adminCheck_1.verifyAdmin)(request);
    const { email, password, role = 'admin', displayName = 'Admin' } = request.data;
    if (!email || !password) {
        throw new functions.https.HttpsError('invalid-argument', 'Email and password are required');
    }
    try {
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName,
        });
        await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true, role });
        await admin.firestore().collection('admins').doc(userRecord.uid).set({
            email,
            role,
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
        if (error.code === 'auth/email-already-exists') {
            throw new functions.https.HttpsError('already-exists', 'Email already in use.');
        }
        if (error.code === 'auth/invalid-password') {
            throw new functions.https.HttpsError('invalid-argument', 'Weak password.');
        }
        throw new functions.https.HttpsError('internal', 'Error creating admin user.');
    }
});
//# sourceMappingURL=createAdmin.js.map