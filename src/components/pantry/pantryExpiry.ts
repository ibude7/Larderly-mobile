import { getDaysUntilDate } from '../../lib/date';

export type ExpiryTone = 'ok' | 'soon' | 'expired' | 'none';

export type ExpiryInfo = {
  days: number | null;
  tone: ExpiryTone;
  badgeVariant: 'success' | 'warning' | 'danger' | 'neutral';
  labelKey: 'pantry.expiry.none' | 'pantry.expiry.expired' | 'pantry.expiry.today' | 'pantry.expiry.tomorrow' | 'pantry.expiry.days' | 'pantry.expiry.ok';
  daysForLabel: number;
};

/** Map expiry date → badge tone / i18n key. */
export function getExpiryInfo(expiryDate: string | null): ExpiryInfo {
  const days = getDaysUntilDate(expiryDate);
  if (days === null) {
    return {
      days: null,
      tone: 'none',
      badgeVariant: 'neutral',
      labelKey: 'pantry.expiry.none',
      daysForLabel: 0,
    };
  }
  if (days < 0) {
    return {
      days,
      tone: 'expired',
      badgeVariant: 'danger',
      labelKey: 'pantry.expiry.expired',
      daysForLabel: Math.abs(days),
    };
  }
  if (days === 0) {
    return {
      days,
      tone: 'soon',
      badgeVariant: 'warning',
      labelKey: 'pantry.expiry.today',
      daysForLabel: 0,
    };
  }
  if (days === 1) {
    return {
      days,
      tone: 'soon',
      badgeVariant: 'warning',
      labelKey: 'pantry.expiry.tomorrow',
      daysForLabel: 1,
    };
  }
  if (days <= 7) {
    return {
      days,
      tone: 'soon',
      badgeVariant: 'warning',
      labelKey: 'pantry.expiry.days',
      daysForLabel: days,
    };
  }
  return {
    days,
    tone: 'ok',
    badgeVariant: 'success',
    labelKey: 'pantry.expiry.ok',
    daysForLabel: days,
  };
}

/** Sort: expired → soon → name. */
export function comparePantryUrgency(
  a: { name: string; expiry_date: string | null },
  b: { name: string; expiry_date: string | null },
): number {
  const da = getDaysUntilDate(a.expiry_date);
  const db = getDaysUntilDate(b.expiry_date);
  const rank = (d: number | null) => {
    if (d === null) return 3;
    if (d < 0) return 0;
    if (d <= 7) return 1;
    return 2;
  };
  const ra = rank(da);
  const rb = rank(db);
  if (ra !== rb) return ra - rb;
  if (da !== null && db !== null && ra <= 1) return da - db;
  return a.name.localeCompare(b.name);
}
