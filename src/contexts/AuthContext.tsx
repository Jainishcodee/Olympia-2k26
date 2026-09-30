import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInAnonymously as firebaseSignInAnonymously,
  signOut as firebaseSignOut,
  getIdTokenResult,
} from 'firebase/auth';
import { auth, db } from '@/config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { AdminUser } from '@/types';

interface AuthContextType {
  user: User | null;
  admin: AdminUser | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email?: string, password?: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser && !firebaseUser.isAnonymous) {
        try {
          // Force refresh token to ensure real-time claims verification (no stale tokens)
          const idTokenResult = await getIdTokenResult(firebaseUser, true);
          let userIsAdmin = !!idTokenResult.claims.admin;
          let adminData: AdminUser | null = null;

          if (db) {
            try {
              const adminDoc = await getDoc(doc(db, 'admins', firebaseUser.uid));
              if (adminDoc.exists()) {
                const data = adminDoc.data();
                if (data?.active !== false) {
                  userIsAdmin = true;
                  adminData = { id: adminDoc.id, uid: adminDoc.id, ...data } as unknown as AdminUser;
                } else {
                  // Explicitly deactivated in Firestore
                  userIsAdmin = false;
                  adminData = null;
                }
              }
            } catch (err) {
              console.warn('Could not read admin profile doc', err);
            }
          }

          setIsAdmin(userIsAdmin);
          setAdmin(adminData);
        } catch (error) {
          console.error('Error fetching admin status', error);
          setIsAdmin(false);
          setAdmin(null);
        }
      } else {
        // Unauthenticated or Anonymous user
        setIsAdmin(false);
        setAdmin(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email?: string, password?: string) => {
    if (!auth) throw new Error('Firebase authentication is not configured.');
    if (!email || !password) throw new Error('Email and password are required.');

    setIsLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      // Immediately verify admin claim and admin profile before completing
      const token = await getIdTokenResult(cred.user, true);
      let userIsAdmin = !!token.claims.admin;
      let adminProfile: AdminUser | null = null;

      if (db) {
        try {
          const adminDoc = await getDoc(doc(db, 'admins', cred.user.uid));
          if (adminDoc.exists()) {
            const data = adminDoc.data();
            if (data?.active === false) {
              await firebaseSignOut(auth);
              throw new Error('This administrator account has been deactivated.');
            }
            userIsAdmin = true;
            adminProfile = { id: adminDoc.id, uid: adminDoc.id, ...data } as unknown as AdminUser;
          }
        } catch (docErr: any) {
          if (docErr.message?.includes('deactivated')) throw docErr;
          console.warn('Admin profile check warning:', docErr);
        }
      }

      if (!userIsAdmin) {
        await firebaseSignOut(auth);
        throw new Error('Access denied. This account does not have administrator privileges.');
      }

      // Synchronously set local state so there is zero race condition
      setUser(cred.user);
      setIsAdmin(true);
      setAdmin(adminProfile);
    } catch (err) {
      setUser(null);
      setIsAdmin(false);
      setAdmin(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    // 1. Immediately wipe all local admin state to prevent stale access
    setIsLoading(true);
    setIsAdmin(false);
    setAdmin(null);
    setUser(null);

    // 2. Sign out from Firebase
    try {
      if (auth) {
        await firebaseSignOut(auth);
      }
    } catch (err) {
      console.error('Error during signOut:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const signInAnonymously = async () => {
    if (auth && !auth.currentUser) {
      try {
        await firebaseSignInAnonymously(auth);
      } catch (error) {
        console.error('Anonymous sign-in failed', error);
      }
    }
  };

  const value = {
    user,
    admin,
    isAdmin,
    isAuthenticated: !!user && !user.isAnonymous && isAdmin,
    isLoading,
    signIn,
    signOut,
    signInAnonymously,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

