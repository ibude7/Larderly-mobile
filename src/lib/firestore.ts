/**
 * Firestore mapping helpers.
 *
 * Ported from the web app. The only change for React Native Firebase is that
 * we duck-type the Timestamp check (looking for a `.toDate()` method) instead
 * of relying on `instanceof Timestamp`, since RNFirebase's Timestamp class is
 * not always reference-identical across module boundaries.
 */

/** Minimal shape of a Firestore document snapshot we care about. */
export interface DocLike {
  id: string;
  data(): Record<string, unknown> | undefined;
}

function hasToDate(value: unknown): value is { toDate: () => Date } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate: unknown }).toDate === 'function'
  );
}

/**
 * Converts a Firestore Timestamp / ISO string / Date to a stable ISO string.
 * Used when mapping Firestore documents back to the UI's string-typed
 * `created_at` / `updated_at` fields so the rest of the app doesn't need to
 * know about Timestamp.
 */
export function toISOString(value: unknown, fallback = new Date().toISOString()): string {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (hasToDate(value)) {
    try {
      return value.toDate().toISOString();
    } catch {
      return fallback;
    }
  }
  // Firestore serverTimestamp() occasionally arrives as a pending sentinel
  // before it resolves — fall through to fallback in that case.
  return fallback;
}

/**
 * Map a Firestore snapshot to a typed object with `id` + ISO timestamp fields.
 * Anything not a Timestamp is passed through unchanged.
 */
export function mapDoc<T>(snap: DocLike): T {
  const data = snap.data() ?? {};
  const out: Record<string, unknown> = { ...data, id: snap.id };
  if ('created_at' in data) out.created_at = toISOString(data.created_at);
  if ('updated_at' in data) out.updated_at = toISOString(data.updated_at);
  return out as T;
}
