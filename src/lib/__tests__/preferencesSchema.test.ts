import {
  PREFERENCES_SCHEMA_VERSION,
  createDefaultPreferences,
  createPreferencesEnvelope,
  migratePreferences,
  normalizePreferences,
} from '../../contexts/preferencesSchema';

describe('preferencesSchema migration', () => {
  it('normalizes incomplete objects with defaults', () => {
    const prefs = normalizePreferences({
      theme: 'dark',
      themeColor: 'not-a-color',
      notifications: { expiration: false, quietHoursStart: 99 },
      privacy: { analytics: false },
    });

    expect(prefs.theme).toBe('dark');
    expect(prefs.themeColor).toBe('orange');
    expect(prefs.notifications.expiration).toBe(false);
    expect(prefs.notifications.quietHoursStart).toBe(21);
    expect(prefs.privacy.analytics).toBe(false);
    expect(prefs.privacy.personalizedAds).toBe(false);
    expect(prefs.language).toBe('en');
  });

  it('wraps legacy flat preferences with updatedAt 0', () => {
    const envelope = migratePreferences({ theme: 'light', language: 'es' });
    expect(envelope.schemaVersion).toBe(PREFERENCES_SCHEMA_VERSION);
    expect(envelope.updatedAt).toBe(0);
    expect(envelope.preferences.theme).toBe('light');
    expect(envelope.preferences.language).toBe('es');
  });

  it('preserves envelope updatedAt and re-normalizes nested prefs', () => {
    const envelope = migratePreferences({
      schemaVersion: 1,
      updatedAt: 1_700_000_000_000,
      preferences: { theme: 'system', fontScale: 'xl', units: 'metric' },
    });
    expect(envelope.updatedAt).toBe(1_700_000_000_000);
    expect(envelope.preferences.fontScale).toBe('md');
    expect(envelope.preferences.units).toBe('metric');
  });

  it('builds a current-schema envelope from defaults', () => {
    const envelope = createPreferencesEnvelope(createDefaultPreferences(), 42);
    expect(envelope).toEqual({
      schemaVersion: PREFERENCES_SCHEMA_VERSION,
      updatedAt: 42,
      preferences: createDefaultPreferences(),
    });
  });
});
