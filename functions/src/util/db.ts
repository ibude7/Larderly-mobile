/**
 * Firestore access for Cloud Functions.
 *
 * The mobile + web clients use the named database `larderly` (not `(default)`).
 * Every server read/write must target the same database or queries silently miss.
 */

import { getFirestore, type Firestore } from 'firebase-admin/firestore';

export const FIRESTORE_DATABASE_ID = 'larderly';

let cached: Firestore | null = null;

export function getDb(): Firestore {
  if (!cached) {
    cached = getFirestore(FIRESTORE_DATABASE_ID);
  }
  return cached;
}
