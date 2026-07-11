export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'INR';
export type UnitSystem = 'metric' | 'imperial';
export type AppLocale = 'en' | 'es' | 'fr';
export type MeasurementKind = 'mass' | 'volume' | 'temperature';

export const APP_LOCALES: Readonly<Record<AppLocale, string>> = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
};

const CURRENCY_LOCALES: Record<Currency, string> = {
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  CAD: 'en-CA',
  AUD: 'en-AU',
  JPY: 'ja-JP',
  INR: 'en-IN',
};

export function formatCurrency(
  amount: number | null | undefined,
  currency: Currency = 'USD',
  locale?: string,
): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return '—';
  try {
    return new Intl.NumberFormat(locale ?? CURRENCY_LOCALES[currency], {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatNumber(
  value: number | null | undefined,
  locale = 'en-US',
  options?: Intl.NumberFormatOptions,
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  try {
    return new Intl.NumberFormat(locale, options).format(value);
  } catch {
    return String(value);
  }
}

type DateInput =
  | Date
  | number
  | string
  | { toDate?: () => Date; toMillis?: () => number }
  | null
  | undefined;

function asDate(value: DateInput): Date | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') return value.toDate();
    if (typeof value.toMillis === 'function') return new Date(value.toMillis());
  }
  const date = new Date(value as string | number);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(
  value: DateInput,
  locale = 'en-US',
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
): string {
  const date = asDate(value);
  if (!date) return '—';
  try {
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/**
 * Formats a metric base value (kg, L, or °C), converting it when the app is
 * configured for imperial units.
 */
export function formatMeasurement(
  value: number | null | undefined,
  kind: MeasurementKind,
  units: UnitSystem = 'metric',
  locale = 'en-US',
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const converted =
    units === 'imperial'
      ? kind === 'mass'
        ? { value: value * 2.2046226218, unit: 'pound', suffix: 'lb' }
        : kind === 'volume'
          ? { value: value * 0.2641720524, unit: 'gallon', suffix: 'gal' }
          : { value: (value * 9) / 5 + 32, unit: 'fahrenheit', suffix: '°F' }
      : kind === 'mass'
        ? { value, unit: 'kilogram', suffix: 'kg' }
        : kind === 'volume'
          ? { value, unit: 'liter', suffix: 'L' }
          : { value, unit: 'celsius', suffix: '°C' };
  try {
    return new Intl.NumberFormat(locale, {
      style: 'unit',
      unit: converted.unit,
      unitDisplay: 'short',
      maximumFractionDigits: 1,
    }).format(converted.value);
  } catch {
    return `${formatNumber(converted.value, locale, { maximumFractionDigits: 1 })} ${converted.suffix}`;
  }
}

export function relativeTime(timestamp: number | { toMillis?: () => number } | string | null | undefined): string {
  if (!timestamp) return '';
  let ms = 0;
  if (typeof timestamp === 'number') ms = timestamp;
  else if (typeof timestamp === 'string') ms = new Date(timestamp).getTime();
  else ms = timestamp.toMillis?.() ?? 0;
  if (!ms) return '';
  const diff = Date.now() - ms;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function daysUntil(timestamp: number | null | undefined): number | null {
  if (!timestamp) return null;
  return Math.ceil((timestamp - Date.now()) / (1000 * 60 * 60 * 24));
}

export function expirationStatus(timestamp: number | null | undefined): 'fresh' | 'soon' | 'urgent' | 'expired' | 'unknown' {
  const days = daysUntil(timestamp);
  if (days === null) return 'unknown';
  if (days < 0) return 'expired';
  if (days <= 2) return 'urgent';
  if (days <= 6) return 'soon';
  return 'fresh';
}
