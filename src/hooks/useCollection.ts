import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  collectionGroup,
  doc,
  onSnapshot,
  query,
  QueryConstraint,
  Unsubscribe,
  where,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/config/firebase';

/* ============================================================================
 *  Generic realtime Firestore hooks.
 *
 *  Deliberately **not** order-by on the server: combining `where` with
 *  `orderBy` forces a composite index to exist, and a missing index fails the
 *  whole read. Sorting happens client-side instead, so the admin panel can
 *  never be bricked by an index we forgot to deploy.
 * ==========================================================================*/

export interface CollectionOptions {
  /** Firestore `where` constraints. Serialised for the effect dependency. */
  constraints?: QueryConstraint[];
  /** Client-side sort. Defaults to document id. */
  sortBy?: string;
  direction?: 'asc' | 'desc';
  /** Keep at most N rows after sorting. */
  max?: number;
  /** Pause the subscription (e.g. while unauthenticated). */
  enabled?: boolean;
}

export interface QueryState<T> {
  data: T[];
  isLoading: boolean;
  /** Human-readable Firestore error, or `null`. */
  error: string | null;
  /** True once the first snapshot — even an empty one — has arrived. */
  isReady: boolean;
}

/** Single-document counterpart of {@link QueryState}: `data` is one row or `null`. */
export interface DocState<T> {
  data: T | null;
  isLoading: boolean;
  /** Human-readable Firestore error, or `null`. */
  error: string | null;
  /** True once the first snapshot — even an empty one — has arrived. */
  isReady: boolean;
}

const describeError = (error: unknown): string => {
  const code = (error as { code?: string } | null)?.code;
  const message = error instanceof Error ? error.message : String(error);
  if (code === 'permission-denied') {
    return 'Permission denied — your account is not authorised to read this collection.';
  }
  if (code === 'failed-precondition') {
    return 'Firestore needs a composite index for this query. Check the browser console for the creation link.';
  }
  if (code === 'unavailable') {
    return 'Firestore is unreachable. Check your connection.';
  }
  return message;
};

export function useCollection<T extends { id: string }>(
  name: string,
  options: CollectionOptions = {},
): QueryState<T> {
  const {
    constraints = [],
    sortBy,
    direction = 'asc',
    max,
    enabled = true,
  } = options;

  const [rows, setRows] = useState<T[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Constraints arrive as fresh array literals on every render — serialise so
  // the subscription is only torn down when the query actually changes.
  const signature = useMemo(
    () => JSON.stringify(constraints.map((c) => String(c))),
    [constraints],
  );

  useEffect(() => {
    if (!enabled) return undefined;

    if (!isFirebaseConfigured || !db) {
      setError(
        'Firebase is not configured. Set VITE_FIREBASE_* in .env and restart the dev server.',
      );
      setIsReady(true);
      return undefined;
    }

    let unsubscribe: Unsubscribe | undefined;
    try {
      unsubscribe = onSnapshot(
        query(collection(db, name), ...constraints),
        (snapshot) => {
          let next = snapshot.docs.map(
            (d) => ({ id: d.id, ...d.data() }) as T,
          );
          if (sortBy) {
            next = [...next].sort((a, b) => {
              const left = (a as Record<string, unknown>)[sortBy];
              const right = (b as Record<string, unknown>)[sortBy];
              if (left === right) return 0;
              if (left === undefined || left === null) return 1;
              if (right === undefined || right === null) return -1;
              const result =
                typeof left === 'number' && typeof right === 'number'
                  ? left - right
                  : String(left).localeCompare(String(right));
              return direction === 'desc' ? -result : result;
            });
          }
          setRows(max ? next.slice(0, max) : next);
          setError(null);
          setIsReady(true);
        },
        (err) => {
          console.error(`[firestore] ${name}:`, err);
          setError(describeError(err));
          setIsReady(true);
        },
      );
    } catch (err) {
      setError(describeError(err));
      setIsReady(true);
    }

    return () => unsubscribe?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, signature, enabled, sortBy, direction, max]);

  return { data: rows, isLoading: !isReady && enabled, error, isReady };
}

export function useCollectionGroup<T extends { id: string }>(
  name: string,
  options: CollectionOptions = {},
): QueryState<T> {
  const {
    constraints = [],
    sortBy,
    direction = 'asc',
    max,
    enabled = true,
  } = options;

  const [rows, setRows] = useState<T[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const signature = useMemo(
    () => JSON.stringify(constraints.map((c) => String(c))),
    [constraints],
  );

  useEffect(() => {
    if (!enabled) return undefined;

    if (!isFirebaseConfigured || !db) {
      setError(
        'Firebase is not configured. Set VITE_FIREBASE_* in .env and restart the dev server.',
      );
      setIsReady(true);
      return undefined;
    }

    let unsubscribe: Unsubscribe | undefined;
    try {
      unsubscribe = onSnapshot(
        query(collectionGroup(db, name), ...constraints),
        (snapshot) => {
          let next = snapshot.docs.map(
            (d) =>
              ({
                id: d.id,
                matchId: d.data().matchId || d.ref.parent?.parent?.id,
                ...d.data(),
              } as unknown as T),
          );
          if (sortBy) {
            next = [...next].sort((a, b) => {
              const left = (a as Record<string, unknown>)[sortBy];
              const right = (b as Record<string, unknown>)[sortBy];
              if (left === right) return 0;
              if (left === undefined || left === null) return 1;
              if (right === undefined || right === null) return -1;
              const result =
                typeof left === 'number' && typeof right === 'number'
                  ? left - right
                  : String(left).localeCompare(String(right));
              return direction === 'desc' ? -result : result;
            });
          }
          setRows(max ? next.slice(0, max) : next);
          setError(null);
          setIsReady(true);
        },
        (err) => {
          console.error(`[firestore collectionGroup] ${name}:`, err);
          setError(describeError(err));
          setIsReady(true);
        },
      );
    } catch (err) {
      setError(describeError(err));
      setIsReady(true);
    }

    return () => unsubscribe?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, signature, enabled, sortBy, direction, max]);

  return { data: rows, isLoading: !isReady && enabled, error, isReady };
}

export function useDoc<T extends { id: string }>(
  name: string,
  id: string | undefined,
): DocState<T> {
  const [value, setValue] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!id) {
      setValue(null);
      setError(null);
      setIsReady(true);
      return undefined;
    }
    if (!isFirebaseConfigured || !db) {
      setError(
        'Firebase is not configured. Set VITE_FIREBASE_* in .env and restart the dev server.',
      );
      setIsReady(true);
      return undefined;
    }

    let unsubscribe: Unsubscribe | undefined;
    try {
      unsubscribe = onSnapshot(
        doc(db, name, id),
        (snapshot) => {
          setValue(
            snapshot.exists()
              ? ({ id: snapshot.id, ...snapshot.data() } as T)
              : null,
          );
          setError(null);
          setIsReady(true);
        },
        (err) => {
          console.error(`[firestore] ${name}/${id}:`, err);
          setError(describeError(err));
          setIsReady(true);
        },
      );
    } catch (err) {
      setError(describeError(err));
      setIsReady(true);
    }

    return () => unsubscribe?.();
  }, [name, id]);

  return { data: value, isLoading: !isReady, error, isReady };
}

/** Convenience: `where(field, '==', value)` builder that skips empty values. */
export const eq = (field: string, value: unknown): QueryConstraint[] =>
  value === undefined || value === null || value === ''
    ? []
    : [where(field, '==', value)];
