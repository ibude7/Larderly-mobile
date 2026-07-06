import { analytics } from './firebase';

export type AppEvent =
  | 'item_added'
  | 'item_scanned'
  | 'receipt_scanned'
  | 'voice_command_used'
  | 'list_created'
  | 'checkout_completed'
  | 'smart_restock_used'
  | 'recipe_generated'
  | 'achievement_unlocked';

export async function trackEvent(
  name: AppEvent,
  params?: Record<string, string | number>,
) {
  try {
    await analytics().logEvent(name, params);
  } catch {
    // Analytics should never block user workflows.
  }
}
