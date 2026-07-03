import { addDoc, collection, serverTimestamp } from '@react-native-firebase/firestore';
import { db } from './firebase';

export type NotificationKind =
  | 'expiration'
  | 'low_stock'
  | 'deal'
  | 'recipe_suggestion'
  | 'household_activity'
  | 'budget'
  | 'achievement'
  | 'system';

export interface NotificationPayload {
  kind: NotificationKind;
  title: string;
  body: string;
  link?: string;
  meta?: Record<string, string | number | boolean>;
}

export async function pushNotification(userId: string, payload: NotificationPayload): Promise<void> {
  try {
    await addDoc(collection(db, 'users', userId, 'notifications'), {
      ...payload,
      meta: payload.meta ?? {},
      link: payload.link ?? '',
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[Larderly] Notification write failed', err);
  }
}
