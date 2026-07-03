import { addDoc, collection, serverTimestamp } from '@react-native-firebase/firestore';
import { db } from './firebase';

export type ActivityVerb =
  | 'item.added'
  | 'item.removed'
  | 'item.consumed'
  | 'item.updated'
  | 'list.created'
  | 'list.deleted'
  | 'list.item.added'
  | 'list.item.purchased'
  | 'list.checkout'
  | 'recipe.cooked'
  | 'recipe.saved'
  | 'recipe.created'
  | 'member.joined'
  | 'member.removed'
  | 'achievement.unlocked';

export interface ActivityEvent {
  verb: ActivityVerb;
  target: string;
  actorId: string;
  actorName: string;
  meta?: Record<string, string | number | boolean>;
}

export async function recordActivity(householdId: string, event: ActivityEvent): Promise<void> {
  if (!householdId) return;
  try {
    await addDoc(collection(db, 'households', householdId, 'activity'), {
      ...event,
      meta: event.meta ?? {},
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[Larderly] Activity log write failed', err);
  }
}

export function describeActivity(verb: ActivityVerb): string {
  const map: Record<ActivityVerb, string> = {
    'item.added': 'added',
    'item.removed': 'removed',
    'item.consumed': 'consumed',
    'item.updated': 'updated',
    'list.created': 'created list',
    'list.deleted': 'deleted list',
    'list.item.added': 'added to list',
    'list.item.purchased': 'purchased',
    'list.checkout': 'checked out',
    'recipe.cooked': 'cooked',
    'recipe.saved': 'saved recipe',
    'recipe.created': 'created recipe',
    'member.joined': 'joined household',
    'member.removed': 'left household',
    'achievement.unlocked': 'unlocked achievement',
  };
  return map[verb] ?? verb;
}
