import React, { createContext, useContext, useState, useEffect } from 'react';
import app from '@/config/firebase';

interface FirebaseContextType {
  isConfigured: boolean;
  isLoading: boolean;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsConfigured(!!app);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <div>Loading Firebase...</div>;
  }

  return (
    <FirebaseContext.Provider value={{ isConfigured, isLoading }}>
      {!isConfigured ? (
        <div className="p-4 text-red-500">Firebase is not configured. Check your environment variables.</div>
      ) : (
        children
      )}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
