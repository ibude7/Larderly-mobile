import { interpolateTranslation, translate } from '../../i18n/core';

describe('translations', () => {
  it('uses the English catalog when a localized key is missing', () => {
    expect(
      translate('fr', 'greeting', undefined, {
        en: { greeting: 'Hello' },
        fr: {},
      }),
    ).toBe('Hello');
  });

  it('returns the key when no catalog contains it', () => {
    expect(translate('es', 'missing.key', undefined, { en: {}, es: {} })).toBe(
      'missing.key',
    );
  });

  it('interpolates known values and safely preserves missing placeholders', () => {
    expect(
      interpolateTranslation('Hello {{ name }}, {{count}} item(s), {{missing}}', {
        name: 'Sam',
        count: 2,
      }),
    ).toBe('Hello Sam, 2 item(s), {{missing}}');
  });
});
