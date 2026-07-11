import type { Preferences } from '../contexts/preferencesSchema';

/** Shape mirrored to `users/{uid}.notificationPrefs` for Cloud Functions. */
export type FirestoreNotificationPrefs = Preferences['notifications'];

export function toFirestoreNotificationPrefs(
  notifications: Preferences['notifications'],
): FirestoreNotificationPrefs {
  return {
    expiration: notifications.expiration,
    lowStock: notifications.lowStock,
    activity: notifications.activity,
    deals: notifications.deals,
    recipes: notifications.recipes,
    budget: notifications.budget,
    achievements: notifications.achievements,
    quietHoursStart: notifications.quietHoursStart,
    quietHoursEnd: notifications.quietHoursEnd,
    frequency: notifications.frequency,
    sound: notifications.sound,
    vibrate: notifications.vibrate,
  };
}

/**
 * Quiet hours wrap overnight (e.g. 21 → 8). Returns true when `hour` falls
 * inside the quiet window and delivery should be deferred by the server.
 */
export function isInQuietHours(
  hour: number,
  start: number,
  end: number,
): boolean {
  if (start === end) return false;
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}
