import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { doc, setDoc, serverTimestamp } from '@react-native-firebase/firestore';
import { db } from './firebase';
import { createDefaultPreferences } from '../contexts/preferencesSchema';

let foregroundSound = true;

/** Apply sound preference to the foreground notification handler. */
export function setNotificationPresentationPrefs(prefs: {
  sound?: boolean;
  vibrate?: boolean;
}): void {
  if (typeof prefs.sound === 'boolean') foregroundSound = prefs.sound;
  // Vibration is delivered via server/OS prefs; tracked on the user profile.
  void prefs.vibrate;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: foregroundSound,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Seed defaults so the handler has a defined preference before prefs hydrate.
setNotificationPresentationPrefs(createDefaultPreferences().notifications);

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/** Register Expo push token to Firestore for Cloud Functions delivery. */
export async function initPush(uid: string): Promise<void> {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return;

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    if (!token) return;

    const tokenKey = token.slice(-32);
    await setDoc(
      doc(db, 'users', uid, 'fcmTokens', tokenKey),
      {
        token,
        platform: Platform.OS,
        provider: 'expo',
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch (err) {
    console.warn('[Larderly] Push registration failed', err);
  }
}

export async function unregisterPush(uid: string): Promise<void> {
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync().catch(() => null);
    if (!tokenData?.data) return;
    const tokenKey = tokenData.data.slice(-32);
    await setDoc(
      doc(db, 'users', uid, 'fcmTokens', tokenKey),
      { revokedAt: serverTimestamp() },
      { merge: true },
    );
  } catch (err) {
    console.warn('[Larderly] Push unregister failed', err);
  }
}
