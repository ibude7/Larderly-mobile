export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'INR';
export type UnitSystem = 'metric' | 'imperial';

const CURRENCY_LOCALES: Record<Currency, string> = {
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  CAD: 'en-CA',
  AUD: 'en-AU',
  JPY: 'ja-JP',
  INR: 'en-IN',
};

export function formatCurrency(amount: number | null | undefined, currency: Currency = 'USD'): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return '—';
  try {
    return new Intl.NumberFormat(CURRENCY_LOCALES[currency], {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
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
