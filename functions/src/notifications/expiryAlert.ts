/**
 * Daily scheduler: notify household members about inventory expiring within 3 days.
 *
 * Reads the named `larderly` Firestore database (same as the mobile client),
 * respects `users/{uid}.notificationPrefs.expiration` + quiet hours, writes an
 * in-app inbox row, and delivers via Expo Push (or FCM for native tokens).
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { getDb } from '../util/db';
import { deliverToUser, isInQuietHours } from '../util/pushDelivery';

interface NotificationPrefs {
  expiration?: boolean;
  quietHoursStart?: number;
  quietHoursEnd?: number;
}

function householdMemberUids(members: unknown): string[] {
  if (!Array.isArray(members)) return [];
  return members
    .map((m) => (typeof m === 'string' ? m : (m as { uid?: string })?.uid))
    .filter((uid): uid is string => Boolean(uid));
}

export const expiryAlert = onSchedule(
  {
    schedule: '0 8 * * *',
    timeZone: 'UTC',
    region: 'us-central1',
  },
  async () => {
    logger.info('Starting expiry alert notification scheduler…');

    const db = getDb();
    const now = new Date();
    const todayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const threeDaysEnd = todayStart + 4 * 24 * 60 * 60 * 1000;

    const snap = await db
      .collectionGroup('inventory')
      .where('expirationDate', '>=', todayStart)
      .where('expirationDate', '<', threeDaysEnd)
      .get();

    if (snap.empty) {
      logger.info('No expiring items found.');
      return;
    }

    const expiringByHousehold: Record<string, string[]> = {};
    for (const doc of snap.docs) {
      const data = doc.data();
      const itemName = typeof data.name === 'string' && data.name.trim() ? data.name : 'Unnamed item';
      const householdId = doc.ref.parent.parent?.id;
      if (!householdId) continue;
      if (!expiringByHousehold[householdId]) expiringByHousehold[householdId] = [];
      expiringByHousehold[householdId].push(itemName);
    }

    const utcHour = new Date().getUTCHours();

    for (const [householdId, itemNames] of Object.entries(expiringByHousehold)) {
      try {
        const householdDoc = await db.collection('households').doc(householdId).get();
        if (!householdDoc.exists) continue;

        const uids = householdMemberUids(householdDoc.data()?.members);
        if (uids.length === 0) continue;

        const uniqueNames = [...new Set(itemNames)].slice(0, 8);
        const body =
          uniqueNames.length < itemNames.length
            ? `${uniqueNames.join(', ')} (+${itemNames.length - uniqueNames.length} more)`
            : uniqueNames.join(', ');

        for (const uid of uids) {
          try {
            const userDoc = await db.collection('users').doc(uid).get();
            if (!userDoc.exists) continue;

            const userData = userDoc.data() ?? {};
            const prefs = (userData.notificationPrefs ?? {}) as NotificationPrefs;

            // Opt-out: only skip when explicitly false (default is on).
            if (prefs.expiration === false) {
              logger.info(`User ${uid} disabled expiration alerts`);
              continue;
            }

            const quietStart = typeof prefs.quietHoursStart === 'number' ? prefs.quietHoursStart : 21;
            const quietEnd = typeof prefs.quietHoursEnd === 'number' ? prefs.quietHoursEnd : 8;
            const inQuiet = isInQuietHours(utcHour, quietStart, quietEnd);

            await deliverToUser(
              uid,
              {
                kind: 'expiration',
                title: 'Items expiring soon',
                body: `Expiring soon: ${body}`,
                link: 'Pantry',
                data: { householdId },
              },
              { skipPush: inQuiet },
            );

            logger.info(
              `Notified ${uid} for household ${householdId}` +
                (inQuiet ? ' (inbox only — quiet hours)' : ''),
            );
          } catch (err) {
            logger.error(`Error notifying user ${uid}`, err);
          }
        }
      } catch (err) {
        logger.error(`Error processing household ${householdId}`, err);
      }
    }

    logger.info('Expiry alert scheduler finished.');
  },
);
