import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { logger } from 'firebase-functions';

export const expiryAlert = onSchedule(
  {
    schedule: '0 8 * * *',
    timeZone: 'UTC',
  },
  async (event) => {
    logger.info('Starting expiry alert notification scheduler task...');

    const db = getFirestore();
    const messaging = getMessaging();

    // 1. Calculate time range (today start to 3 days from now, inclusive of the 3rd day)
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).getTime();
    const threeDaysEnd = todayStart + 4 * 24 * 60 * 60 * 1000;

    logger.info(`Querying inventory for expiration dates between ${new Date(todayStart).toISOString()} and ${new Date(threeDaysEnd).toISOString()}`);

    // 2. Query ALL households' inventory subcollections
    const snap = await db.collectionGroup('inventory')
      .where('expirationDate', '>=', todayStart)
      .where('expirationDate', '<', threeDaysEnd)
      .get();

    if (snap.empty) {
      logger.info('No expiring items found.');
      return;
    }

    logger.info(`Found ${snap.size} expiring items. Grouping by household...`);

    // 3. Group expiring items by household
    const expiringByHousehold: Record<string, string[]> = {};
    snap.docs.forEach((doc) => {
      const data = doc.data();
      const itemName = data.name || 'Unnamed item';

      const householdId = doc.ref.parent.parent?.id;
      if (householdId) {
        if (!expiringByHousehold[householdId]) {
          expiringByHousehold[householdId] = [];
        }
        expiringByHousehold[householdId].push(itemName);
      }
    });

    // 4. Process each household
    for (const [householdId, itemNames] of Object.entries(expiringByHousehold)) {
      try {
        logger.info(`Processing household ${householdId} with expiring items: ${itemNames.join(', ')}`);

        // Fetch household members
        const householdDoc = await db.collection('households').doc(householdId).get();
        if (!householdDoc.exists) {
          logger.warn(`Household ${householdId} not found, skipping.`);
          continue;
        }

        const members: any[] = householdDoc.data()?.members || [];
        const uids: string[] = members.map(m => (typeof m === 'string' ? m : m.uid)).filter(Boolean);

        if (uids.length === 0) {
          logger.info(`No members in household ${householdId}, skipping.`);
          continue;
        }

        for (const uid of uids) {
          try {
            // Check user preferences
            const userDoc = await db.collection('users').doc(uid).get();
            if (!userDoc.exists) continue;

            const userData = userDoc.data() ?? {};
            const expiryPref = userData.prefs?.notifications?.expiry;
            if (expiryPref === false) {
              logger.info(`User ${uid} has disabled expiry notifications, skipping.`);
              continue;
            }

            // Fetch FCM tokens
            const tokensSnap = await db.collection('users').doc(uid).collection('fcmTokens').get();
            const tokens = tokensSnap.docs
              .map((d) => d.data().token || d.id)
              .filter((t) => typeof t === 'string' && t.trim().length > 0);

            if (tokens.length === 0) {
              logger.info(`No FCM tokens registered for user ${uid}, skipping.`);
              continue;
            }

            // Send FCM push notifications
            const body = `Expiring soon: ${itemNames.join(', ')}`;

            logger.info(`Sending notification to user ${uid} (${tokens.length} devices)...`);

            const messages = tokens.map((token) => ({
              token,
              notification: {
                title: '⏰ Items expiring soon',
                body,
              },
            }));

            // Send messages in batch
            const response = await messaging.sendEach(messages);
            logger.info(`Successfully sent ${response.successCount} of ${messages.length} notifications to user ${uid}`);
          } catch (err) {
            logger.error(`Error processing notifications for user ${uid}:`, err);
          }
        }
      } catch (err) {
        logger.error(`Error processing household ${householdId}:`, err);
      }
    }

    logger.info('Expiry alert notification scheduler task finished.');
  }
);
