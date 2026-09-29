import { doc, getDoc, onSnapshot, setDoc, serverTimestamp, Unsubscribe } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/config/firebase';
import { DEFAULT_SETTINGS, SystemSettings } from '@/types';

const SETTINGS_COLLECTION = 'settings';
const SETTINGS_ID = 'default';

const configured = () => isFirebaseConfigured && db !== null && db !== undefined;

/**
 * Read the singleton settings document.
 * Returns `DEFAULT_SETTINGS` when nothing has been saved yet, so the screen is
 * never blank on a fresh install.
 */
export const getSettings = async (): Promise<SystemSettings> => {
  if (!configured()) return DEFAULT_SETTINGS;
  try {
    const snapshot = await getDoc(doc(db!, SETTINGS_COLLECTION, SETTINGS_ID));
    if (!snapshot.exists()) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...snapshot.data(), id: SETTINGS_ID } as SystemSettings;
  } catch (error) {
    console.error('[settings] read failed', error);
    return DEFAULT_SETTINGS;
  }
};

/**
 * Persist every settings field. Uses `merge: true` so a field added in a later
 * release doesn't wipe existing values.
 */
export const saveSettings = async (
  values: Omit<SystemSettings, 'id' | 'updatedAt'> & { updatedBy?: string },
): Promise<void> => {
  if (!configured()) {
    throw new Error('Firebase is not configured — settings cannot be saved.');
  }
  await setDoc(
    doc(db!, SETTINGS_COLLECTION, SETTINGS_ID),
    {
      ...values,
      id: SETTINGS_ID,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
};

/** Live subscription to the settings document. */
export const subscribeToSettings = (
  callback: (settings: SystemSettings) => void,
  onError?: (message: string) => void,
): Unsubscribe => {
  if (!configured()) {
    callback(DEFAULT_SETTINGS);
    onError?.('Firebase is not configured — showing defaults.');
    return () => {};
  }
  return onSnapshot(
    doc(db!, SETTINGS_COLLECTION, SETTINGS_ID),
    (snapshot) => {
      callback(
        snapshot.exists()
          ? ({ ...DEFAULT_SETTINGS, ...snapshot.data(), id: SETTINGS_ID } as SystemSettings)
          : DEFAULT_SETTINGS,
      );
    },
    (error) => {
      console.error('[settings] subscription failed', error);
      callback(DEFAULT_SETTINGS);
      onError?.(error.message);
    },
  );
};
