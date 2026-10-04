import { Timestamp, FieldValue, serverTimestamp, DocumentSnapshot, Query, query, where, orderBy, CollectionReference, limit } from 'firebase/firestore';

export function convertTimestamp(timestamp: Timestamp | Date | any): Date {
  if (timestamp instanceof Date) return timestamp;
  if (timestamp && typeof timestamp.toDate === 'function') return timestamp.toDate();
  if (timestamp && timestamp.seconds) return new Date(timestamp.seconds * 1000);
  return new Date();
}

export function createTimestamp(): FieldValue {
  return serverTimestamp();
}

export function docToData<T>(doc: DocumentSnapshot): T {
  return { ...doc.data(), id: doc.id } as T;
}

export function buildQuery(collectionRef: CollectionReference, filters?: Record<string, any>, sorting?: { field: string; dir: 'asc' | 'desc' }, queryLimit?: number): Query {
  let q: Query = collectionRef;
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        q = query(q, where(key, '==', value));
      }
    });
  }
  
  if (sorting) {
    q = query(q, orderBy(sorting.field, sorting.dir));
  }
  
  if (queryLimit) {
    q = query(q, limit(queryLimit));
  }
  
  return q;
}

/**
 * Recursively removes all undefined keys from an object or array.
 * Prevents Firestore from throwing: "Unsupported field value: undefined"
 */
export function cleanFirestoreData<T>(data: T): T {
  if (data === null || data === undefined) return null as unknown as T;
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => cleanFirestoreData(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    // Preserve Dates, Firestore Timestamps, and FieldValues (serverTimestamp, deleteField, etc.)
    if (
      data instanceof Date ||
      typeof (data as any)?.toMillis === 'function' ||
      typeof (data as any)?.toDate === 'function' ||
      (data as any)?._methodName !== undefined ||
      (data as any)?._delegate !== undefined ||
      (data as any)?._type !== undefined ||
      ((data as any)?.seconds !== undefined && (data as any)?.nanoseconds !== undefined)
    ) {
      return data;
    }
    const clean: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        clean[key] = cleanFirestoreData(value);
      }
    }
    return clean as unknown as T;
  }
  return data;
}
