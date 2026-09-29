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
  return { id: doc.id, ...doc.data() } as T;
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
