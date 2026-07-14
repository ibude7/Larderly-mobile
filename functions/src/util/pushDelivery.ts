/**
 * Push + in-app notification delivery.
 *
 * Mobile registers Expo push tokens (`provider: 'expo'`). Those cannot be sent
 * through FCM `messaging.send*` — they must go through Expo's push API.
 */

import { FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { logger } from 'firebase-functions';
import { getDb } from './db';

export interface PushMessage {
  title: string;
  body: string;
  kind?: string;
  link?: string;
  data?: Record<string, string>;
}

interface TokenDoc {
  token?: string;
  provider?: string;
  revokedAt?: unknown;
}

export function isInQuietHours(hour: number, start: number, end: number): boolean {
  if (start === end) return false;
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}

/** Write an inbox row under `users/{uid}/notifications`. */
export async function writeInboxNotification(
  uid: string,
  message: PushMessage,
): Promise<void> {
  const db = getDb();
  await db.collection('users').doc(uid).collection('notifications').add({
    kind: message.kind ?? 'system',
    title: message.title,
    body: message.body,
    link: message.link ?? '',
    meta: message.data ?? {},
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });
}

async function sendExpoPush(
  tokens: string[],
  message: PushMessage,
): Promise<void> {
  if (tokens.length === 0) return;

  const payloads = tokens.map((to) => ({
    to,
    title: message.title,
    body: message.body,
    sound: 'default' as const,
    data: {
      kind: message.kind ?? 'system',
      link: message.link ?? '',
      ...(message.data ?? {}),
    },
  }));

  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payloads),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Expo push failed (${res.status}): ${text.slice(0, 200)}`);
  }
}

async function sendFcmPush(tokens: string[], message: PushMessage): Promise<void> {
  if (tokens.length === 0) return;
  const messaging = getMessaging();
  await messaging.sendEach(
    tokens.map((token) => ({
      token,
      notification: { title: message.title, body: message.body },
      data: {
        kind: message.kind ?? 'system',
        link: message.link ?? '',
        ...(message.data ?? {}),
      },
    })),
  );
}

/**
 * Deliver a notification to one user: always write inbox; push only when
 * tokens exist and quiet hours allow it.
 */
export async function deliverToUser(
  uid: string,
  message: PushMessage,
  opts?: { skipPush?: boolean },
): Promise<void> {
  await writeInboxNotification(uid, message);

  if (opts?.skipPush) return;

  const db = getDb();
  const tokensSnap = await db.collection('users').doc(uid).collection('fcmTokens').get();
  const expoTokens: string[] = [];
  const fcmTokens: string[] = [];

  for (const doc of tokensSnap.docs) {
    const data = doc.data() as TokenDoc;
    if (data.revokedAt) continue;
    const token = (data.token || doc.id || '').trim();
    if (!token) continue;
    if (data.provider === 'expo' || token.startsWith('ExponentPushToken')) {
      expoTokens.push(token);
    } else {
      fcmTokens.push(token);
    }
  }

  if (expoTokens.length === 0 && fcmTokens.length === 0) {
    logger.info(`No push tokens for user ${uid}`);
    return;
  }

  if (expoTokens.length) await sendExpoPush(expoTokens, message);
  if (fcmTokens.length) await sendFcmPush(fcmTokens, message);
}
