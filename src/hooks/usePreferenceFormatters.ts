import { useMemo } from 'react';
import { usePrefs } from '../contexts/PreferencesContext';
import {
  APP_LOCALES,
  formatCurrency,
  formatDate,
  formatMeasurement,
  formatNumber,
  type AppLocale,
  type MeasurementKind,
} from '../lib/format';

export function usePreferenceFormatters() {
  const { prefs } = usePrefs();
  const locale = APP_LOCALES[prefs.language as AppLocale] ?? APP_LOCALES.en;

  return useMemo(
    () => ({
      locale,
      currency: prefs.currency,
      units: prefs.units,
      language: prefs.language,
      currencyValue: (value: number | null | undefined) =>
        formatCurrency(value, prefs.currency, locale),
      number: (
        value: number | null | undefined,
        options?: Intl.NumberFormatOptions,
      ) => formatNumber(value, locale, options),
      date: (
        value: Parameters<typeof formatDate>[0],
        options?: Intl.DateTimeFormatOptions,
      ) => formatDate(value, locale, options),
      measurement: (
        value: number | null | undefined,
        kind: MeasurementKind,
      ) => formatMeasurement(value, kind, prefs.units, locale),
    }),
    [locale, prefs.currency, prefs.language, prefs.units],
  );
}
