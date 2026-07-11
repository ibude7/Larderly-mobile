/**
 * RELEASE BLOCKER: Replace every value in this file with production support,
 * privacy, and legal destinations before App Store / Play Store submission.
 *
 * Placeholder inventory (all must be replaced):
 * - SUPPORT_EMAIL → real support inbox that receives user mail
 * - SUPPORT_EMAIL_SUBJECT → keep or localize; not a blocker by itself
 * - SUPPORT_URLS.helpCenter → real help-center landing page
 * - SUPPORT_URLS.gettingStarted / scanningItems / households / syncAndOffline → real FAQ articles
 * - SUPPORT_URLS.privacy → hosted Privacy Policy URL (store requirement)
 * - SUPPORT_URLS.terms → hosted Terms of Service URL (store requirement)
 *
 * SettingsSupportScreen and SettingsAboutScreen show
 * SETTINGS_SUPPORT_PLACEHOLDER_NOTICE while SETTINGS_SUPPORT_IS_PLACEHOLDER is true.
 * Flip that flag only after every URL and the support email are production-ready.
 */
export const SETTINGS_SUPPORT_PLACEHOLDER_NOTICE =
  'These support and legal destinations are placeholders and must be replaced before release.';

/** RELEASE BLOCKER — replace with production support inbox. */
export const SUPPORT_EMAIL = 'support@example.com';
export const SUPPORT_EMAIL_SUBJECT = 'Larderly support request';

/** RELEASE BLOCKER — every URL below is a placeholder (example.com). */
export const SUPPORT_URLS = {
  helpCenter: 'https://example.com/larderly/help',
  gettingStarted: 'https://example.com/larderly/help/getting-started',
  scanningItems: 'https://example.com/larderly/help/scanning-items',
  households: 'https://example.com/larderly/help/households',
  syncAndOffline: 'https://example.com/larderly/help/sync-and-offline',
  privacy: 'https://example.com/larderly/privacy',
  terms: 'https://example.com/larderly/terms',
} as const;

/** Keep true until SUPPORT_EMAIL and all SUPPORT_URLS point at production destinations. */
export const SETTINGS_SUPPORT_IS_PLACEHOLDER = true;
