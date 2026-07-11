import { analytics } from './firebase';

let analyticsPreferenceEnabled = false;

/**
 * Mirrors the user's privacy.analytics preference into the local gate and
 * Firebase Analytics collection toggle. Safe to call before Firebase is ready.
 */
export async function setAnalyticsPreferenceEnabled(enabled: boolean): Promise<void> {
  analyticsPreferenceEnabled = enabled;
  try {
    await analytics().setAnalyticsCollectionEnabled(enabled);
  } catch {
    // Analytics should never block user workflows.
  }
}

export function isAnalyticsPreferenceEnabled(): boolean {
  return analyticsPreferenceEnabled;
}

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
  if (!analyticsPreferenceEnabled) return;
  try {
    await analytics().logEvent(name, params);
  } catch {
    // Analytics should never block user workflows.
  }
}
