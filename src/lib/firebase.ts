/**
 * Firebase entry point for React Native.
 *
 * Unlike the web app (which called initializeApp() with a JS config object),
 * @react-native-firebase auto-initializes the default app natively at launch
 * from the platform config files:
 *   - iOS:     GoogleService-Info.plist
 *   - Android: google-services.json
 *
 * Those files are downloaded from the Firebase console after you register an
 * iOS and Android app on the project (see SETUP.md). The app cannot build or
 * run without them, so there's no JS-level config here to keep in sync.
 *
 * ─── Firestore offline persistence ───────────────────────────────────────────
 * We call `initializeFirestore` at module load time to apply:
 *   • `persistence: true`        — writes survive app restarts.
 *   • `cacheSizeBytes: UNLIMITED` — no size-based garbage collection.
 *
 * `initializeFirestore` is async in the RNFirebase modular API. We fire it
 * eagerly so settings are applied as early as possible, and re-export `db`
 * via the synchronous `getFirestore` call which returns the same singleton.
 * Export `dbReady` if you need to await full initialisation before reading.
 *
 * ─── Network management ──────────────────────────────────────────────────────
 * `initFirestoreNetworkListener` wires a NetInfo listener that calls
 * `disableNetwork` / `enableNetwork` on the Firestore instance whenever
 * connectivity changes. Mount it from a component inside `ToastProvider`
 * (see App.tsx) so it can show/dismiss the "You're offline" banner.
 */

import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  CACHE_SIZE_UNLIMITED,
  enableNetwork,
  disableNetwork,
  type Firestore,
} from '@react-native-firebase/firestore';
import { getFunctions } from '@react-native-firebase/functions';
import { getStorage } from '@react-native-firebase/storage';
import firebaseCrashlytics from '@react-native-firebase/crashlytics';
import firebaseAnalytics from '@react-native-firebase/analytics';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

export const app = getApp();
export const auth = getAuth(app);

// ─── Firestore: offline persistence + unlimited cache ─────────────────────────

/**
 * Fire `initializeFirestore` eagerly at module load time to register the
 * persistence + cache settings before any collection/doc helpers are called.
 * The returned Promise is exposed as `dbReady` for code that needs to wait.
 */
export const dbReady: Promise<Firestore> = initializeFirestore(
  app,
  {
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
    persistence: true,
  },
  'larderly',
);

/**
 * The Firestore client for the `larderly` named database.
 *
 * The singleton was configured with offline persistence + unlimited cache by
 * the `initializeFirestore` call above. `getFirestore` returns the same
 * registered instance synchronously, so callers can import `db` without
 * awaiting anything.
 */
export const db: Firestore = getFirestore(app, 'larderly');

export const storage = getStorage(app);
export const crashlytics = () => firebaseCrashlytics();
export const analytics = () => firebaseAnalytics();

/**
 * Firebase Cloud Functions client, routed to the us-central1 region where
 * all Larderly AI proxy callables are deployed.
 */
export const functions = getFunctions(app, 'us-central1');

// ─── Network listener ─────────────────────────────────────────────────────────

/**
 * Subscribe to device connectivity changes and synchronise the Firestore
 * client's network state accordingly.
 *
 * - Going offline  → `disableNetwork` so Firestore stops retrying and all
 *                    reads come from the local cache. Shows a persistent
 *                    "You're offline" warning toast.
 * - Coming online  → `enableNetwork` so pending writes flush and live
 *                    listeners resume. Dismisses the warning and briefly
 *                    confirms "Back online".
 *
 * @param showToast   `showToast` from `useToast()`.
 * @param removeToast `removeToast` from `useToast()`.
 * @returns Cleanup function — return it from `useEffect`.
 */
export function initFirestoreNetworkListener(
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning', duration?: number, id?: string) => void,
  removeToast: (id: string) => void,
): () => void {
  /** Stable ID so we can dismiss exactly the offline toast and no other. */
  const OFFLINE_TOAST_ID = '__larderly_offline__';

  /**
   * Track the last known transition to avoid redundant Firestore calls when
   * NetInfo fires multiple events in quick succession (can happen on Android
   * during a Wi-Fi ↔ cellular handoff).
   */
  let wasOffline = false;

  const handleChange = async (state: NetInfoState) => {
    // `isInternetReachable` can be null while NetInfo is still probing;
    // treat null as "reachable" to avoid spurious offline flips.
    const isConnected = Boolean(
      state.isConnected && state.isInternetReachable !== false,
    );

    if (!isConnected && !wasOffline) {
      // ── Transition: online → offline ──────────────────────────────────────
      wasOffline = true;
      try {
        await disableNetwork(db);
      } catch {
        // Firestore may already be offline; safe to ignore.
      }
      // duration=0 → persistent banner that stays until explicitly removed.
      // Stable id lets us target this exact toast on reconnect.
      showToast(
        "You're offline — changes will sync when you reconnect.",
        'warning',
        0,
        OFFLINE_TOAST_ID,
      );
    } else if (isConnected && wasOffline) {
      // ── Transition: offline → online ──────────────────────────────────────
      wasOffline = false;
      try {
        await enableNetwork(db);
      } catch {
        // Safe to ignore.
      }
      removeToast(OFFLINE_TOAST_ID);
      showToast('Back online — syncing your changes.', 'success', 3000);
    }
  };

  // NetInfo fires immediately with the current state on subscribe, so we
  // get an initial reading without a separate fetch call.
  const unsubscribe = NetInfo.addEventListener(handleChange);
  return unsubscribe;
}
