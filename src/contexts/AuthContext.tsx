import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInAnonymously as firebaseSignInAnonymously, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db } from '@/config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { User as AppUser, AdminUser } from '@/types';

interface AuthContextType {
  user: User | null;
  admin: AdminUser | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: () => Promise<void>;
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
      
      if (firebaseUser) {
        try {
          const idTokenResult = await firebaseUser.getIdTokenResult();
          let userIsAdmin = !!idTokenResult.claims.admin;
          
          if (db && !firebaseUser.isAnonymous) {
            try {
              const adminDoc = await getDoc(doc(db, 'admins', firebaseUser.uid));
              if (adminDoc.exists()) {
                const data = adminDoc.data();
                if (data?.active !== false) {
                  userIsAdmin = true;
                  setAdmin({ id: adminDoc.id, uid: adminDoc.id, ...data } as unknown as AdminUser);
                }
              }
            } catch (err) {
              console.warn("Could not read admin profile doc", err);
            }
          }
          
          setIsAdmin(userIsAdmin);
          if (!userIsAdmin) {
            setAdmin(null);
          }
        } catch (error) {
          console.error("Error fetching admin status", error);
          setIsAdmin(false);
          setAdmin(null);
        }
      } else {
        setIsAdmin(false);
        setAdmin(null);
        // Auto anon sign in
        signInAnonymously();
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    // Implement sign in logic, e.g., with Google or Email
  };

  const signOut = async () => {
    if (auth) {
      await firebaseSignOut(auth);
    }
  };

  const signInAnonymously = async () => {
    if (auth && !auth.currentUser) {
      try {
        await firebaseSignInAnonymously(auth);
      } catch (error) {
        console.error("Anonymous sign-in failed", error);
      }
    }
  };

  const value = {
    user,
    admin,
    isAdmin,
    isAuthenticated: !!user,
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
