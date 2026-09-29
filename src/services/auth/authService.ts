import {
  signInWithEmailAndPassword,
  signOut,
  signInAnonymously,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  UserCredential,
  User,
  Unsubscribe,
  getIdTokenResult
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/config/firebase';
import { Admin } from '@/types';

export const signInAdmin = async (email: string, password: string): Promise<UserCredential> => {
  if (!isFirebaseConfigured || !auth) throw new Error('Firebase is not configured');
  return await signInWithEmailAndPassword(auth, email, password);
};

export const signOutAdmin = async (): Promise<void> => {
  if (!isFirebaseConfigured || !auth) throw new Error('Firebase is not configured');
  await signOut(auth);
};

export const signInAnonymousUser = async (): Promise<UserCredential> => {
  if (!isFirebaseConfigured || !auth) throw new Error('Firebase is not configured');
  return await signInAnonymously(auth);
};

export const getCurrentUser = (): User | null => {
  if (!isFirebaseConfigured || !auth) return null;
  return auth.currentUser;
};

export const onAuthStateChanged = (callback: (user: User | null) => void): Unsubscribe => {
  if (!isFirebaseConfigured || !auth) {
    return () => {};
  }
  return firebaseOnAuthStateChanged(auth, callback);
};

export const isAdmin = async (user: User): Promise<boolean> => {
  if (!isFirebaseConfigured) return false;
  try {
    const token = await getIdTokenResult(user);
    return !!token.claims.admin;
  } catch (error) {
    console.error('Error checking admin status', error);
    return false;
  }
};

export const getAdminProfile = async (uid: string): Promise<Admin | null> => {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const adminDoc = await getDoc(doc(db, 'admins', uid));
    if (adminDoc.exists()) {
      return { uid: adminDoc.id, ...adminDoc.data() } as unknown as Admin;
    }
    return null;
  } catch (error) {
    console.error('Error getting admin profile', error);
    return null;
  }
};
