import {
  addDoc,
  collection,
  limit as fbLimit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/config/firebase';
import type { AuditEntry, AuditEntryInput } from '@/types';

export const AUDIT_COLLECTION = 'auditLogs';

/**
 * Append one entry to the administrative audit log.
 *
 * Never throws — an audit write failing must not block the action it is
 * recording, so failures are reported to the console instead.
 */
export const logAudit = async (entry: AuditEntryInput): Promise<void> => {
  if (!isFirebaseConfigured || !db) {
    console.info('[audit] Firestore unavailable, entry dropped:', entry);
    return;
  }
  try {
    await addDoc(collection(db, AUDIT_COLLECTION), {
      ...entry,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('[audit] failed to write entry', error);
  }
};

/** Live tail of the audit log, newest first. */
export const subscribeToAudit = (
  callback: (entries: AuditEntry[]) => void,
  onError?: (message: string) => void,
  max = 100,
): Unsubscribe => {
  if (!isFirebaseConfigured || !db) {
    onError?.('Firebase is not configured');
    return () => {};
  }
  try {
    const q = query(
      collection(db, AUDIT_COLLECTION),
      orderBy('timestamp', 'desc'),
      fbLimit(max),
    );
    return onSnapshot(
      q,
      (snapshot) => {
        callback(
          snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as AuditEntry),
        );
      },
      (error) => {
        console.error('[audit] subscription failed', error);
        onError?.(error.message);
      },
    );
  } catch (error) {
    onError?.(error instanceof Error ? error.message : String(error));
    return () => {};
  }
};
