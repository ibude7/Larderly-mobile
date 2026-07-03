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
 * Firestore offline persistence is enabled by default on native platforms,
 * which is exactly what Larderly needs for use in stores/basements with poor
 * reception (the web app had to opt into this via persistentLocalCache).
 */
import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';
import { getStorage } from '@react-native-firebase/storage';

export const app = getApp();
export const auth = getAuth(app);

// Named database on project larderly1 — must match firebase.json and web VITE_FIREBASE_DATABASE_ID.
export const db = getFirestore(app, 'larderly');
export const storage = getStorage(app);
