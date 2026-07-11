import type { Currency, UnitSystem } from '../lib/format';

export type Theme = 'light' | 'dark' | 'system';
export type ThemeColor = 'orange' | 'blue' | 'green' | 'purple' | 'rose';
export type Language = 'en' | 'es' | 'fr';
export type FontScale = 'sm' | 'md' | 'lg';
export type NotifFrequency = 'realtime' | 'daily' | 'weekly';
export type ColorBlindMode = 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';

export interface Preferences {
  theme: Theme;
  themeColor: ThemeColor;
  language: Language;
  currency: Currency;
  units: UnitSystem;
  fontScale: FontScale;
  colorBlindMode: ColorBlindMode;
  reduceMotion: boolean;
  notifications: {
    expiration: boolean;
    lowStock: boolean;
    activity: boolean;
    deals: boolean;
    recipes: boolean;
    budget: boolean;
    achievements: boolean;
    quietHoursStart: number;
    quietHoursEnd: number;
    frequency: NotifFrequency;
    sound: boolean;
    vibrate: boolean;
  };
  privacy: {
    analytics: boolean;
    personalizedAds: boolean;
  };
}

/** Envelope wraps the preferences payload with sync metadata. */
export interface PreferencesEnvelope {
  schemaVersion: number;
  updatedAt: number;
  preferences: Preferences;
}

export const PREFERENCES_SCHEMA_VERSION = 2;

const THEME_VALUES: Theme[] = ['light', 'dark', 'system'];
const THEME_COLOR_VALUES: ThemeColor[] = ['orange', 'blue', 'green', 'purple', 'rose'];
const LANGUAGE_VALUES: Language[] = ['en', 'es', 'fr'];
const FONT_SCALE_VALUES: FontScale[] = ['sm', 'md', 'lg'];
const FREQUENCY_VALUES: NotifFrequency[] = ['realtime', 'daily', 'weekly'];
const COLOR_BLIND_VALUES: ColorBlindMode[] = ['none', 'deuteranopia', 'protanopia', 'tritanopia'];
const CURRENCY_VALUES: Currency[] = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR'];
const UNIT_VALUES: UnitSystem[] = ['metric', 'imperial'];

export function createDefaultPreferences(): Preferences {
  return {
    theme: 'system',
    themeColor: 'orange',
    language: 'en',
    currency: 'USD',
    units: 'imperial',
    fontScale: 'md',
    colorBlindMode: 'none',
    reduceMotion: false,
    notifications: {
      expiration: true,
      lowStock: true,
      activity: true,
      deals: false,
      recipes: true,
      budget: true,
      achievements: true,
      quietHoursStart: 21,
      quietHoursEnd: 8,
      frequency: 'realtime',
      sound: true,
      vibrate: true,
    },
    privacy: { analytics: true, personalizedAds: false },
  };
}

function pickEnum<T>(value: unknown, allowed: T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function pickBool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function pickHour(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const hour = Math.trunc(value);
    if (hour >= 0 && hour <= 23) return hour;
  }
  return fallback;
}

/**
 * Coerces arbitrary stored/remote data into a valid Preferences object,
 * filling any missing or invalid fields from defaults.
 */
export function normalizePreferences(input: unknown): Preferences {
  const defaults = createDefaultPreferences();
  if (!input || typeof input !== 'object') return defaults;
  const raw = input as Record<string, unknown>;
  const notifications = (raw.notifications ?? {}) as Record<string, unknown>;
  const privacy = (raw.privacy ?? {}) as Record<string, unknown>;

  return {
    theme: pickEnum(raw.theme, THEME_VALUES, defaults.theme),
    themeColor: pickEnum(raw.themeColor, THEME_COLOR_VALUES, defaults.themeColor),
    language: pickEnum(raw.language, LANGUAGE_VALUES, defaults.language),
    currency: pickEnum(raw.currency, CURRENCY_VALUES, defaults.currency),
    units: pickEnum(raw.units, UNIT_VALUES, defaults.units),
    fontScale: pickEnum(raw.fontScale, FONT_SCALE_VALUES, defaults.fontScale),
    colorBlindMode: pickEnum(raw.colorBlindMode, COLOR_BLIND_VALUES, defaults.colorBlindMode),
    reduceMotion: pickBool(raw.reduceMotion, defaults.reduceMotion),
    notifications: {
      expiration: pickBool(notifications.expiration, defaults.notifications.expiration),
      lowStock: pickBool(notifications.lowStock, defaults.notifications.lowStock),
      activity: pickBool(notifications.activity, defaults.notifications.activity),
      deals: pickBool(notifications.deals, defaults.notifications.deals),
      recipes: pickBool(notifications.recipes, defaults.notifications.recipes),
      budget: pickBool(notifications.budget, defaults.notifications.budget),
      achievements: pickBool(notifications.achievements, defaults.notifications.achievements),
      quietHoursStart: pickHour(notifications.quietHoursStart, defaults.notifications.quietHoursStart),
      quietHoursEnd: pickHour(notifications.quietHoursEnd, defaults.notifications.quietHoursEnd),
      frequency: pickEnum(notifications.frequency, FREQUENCY_VALUES, defaults.notifications.frequency),
      sound: pickBool(notifications.sound, defaults.notifications.sound),
      vibrate: pickBool(notifications.vibrate, defaults.notifications.vibrate),
    },
    privacy: {
      analytics: pickBool(privacy.analytics, defaults.privacy.analytics),
      personalizedAds: pickBool(privacy.personalizedAds, defaults.privacy.personalizedAds),
    },
  };
}

export function createPreferencesEnvelope(
  preferences: Preferences,
  updatedAt: number,
): PreferencesEnvelope {
  return {
    schemaVersion: PREFERENCES_SCHEMA_VERSION,
    updatedAt,
    preferences,
  };
}

/**
 * Accepts any historical stored shape and returns a current-schema envelope.
 * Legacy (v1) installs stored a flat Preferences object without an envelope;
 * these are wrapped with `updatedAt: 0` so a server copy always wins the merge.
 */
export function migratePreferences(input: unknown): PreferencesEnvelope {
  if (input && typeof input === 'object') {
    const raw = input as Record<string, unknown>;
    const hasEnvelope =
      typeof raw.schemaVersion === 'number' && 'preferences' in raw;
    if (hasEnvelope) {
      const updatedAt =
        typeof raw.updatedAt === 'number' && Number.isFinite(raw.updatedAt)
          ? raw.updatedAt
          : 0;
      return createPreferencesEnvelope(normalizePreferences(raw.preferences), updatedAt);
    }
  }
  // Legacy flat object (or unknown) — normalize and mark as un-synced.
  return createPreferencesEnvelope(normalizePreferences(input), 0);
}
