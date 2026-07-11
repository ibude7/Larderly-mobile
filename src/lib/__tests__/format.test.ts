import {
  daysUntil,
  expirationStatus,
  formatCurrency,
  formatDate,
  formatMeasurement,
  formatNumber,
} from '../format';

describe('formatCurrency', () => {
  it('formats common currencies', () => {
    expect(formatCurrency(12.5, 'USD')).toBe('$12.50');
    expect(formatCurrency(12.5, 'CAD')).toContain('12.50');
    expect(formatCurrency(null, 'USD')).toBe('—');
  });
});

describe('expiration helpers', () => {
  it('returns null/unknown for missing timestamps', () => {
    expect(daysUntil(null)).toBeNull();
    expect(expirationStatus(undefined)).toBe('unknown');
  });

  it('classifies expired timestamps', () => {
    expect(expirationStatus(Date.now() - 86_400_000)).toBe('expired');
  });
});

describe('preference-aware format helpers', () => {
  it('formats currency and numbers with the requested locale', () => {
    expect(formatCurrency(12.5, 'EUR', 'fr-FR')).toContain('12,50');
    expect(formatNumber(1234.5, 'es-ES')).toMatch(/1234|1[.\s]234/);
  });

  it('formats stable dates in the requested locale', () => {
    const value = Date.UTC(2026, 6, 11, 12);
    expect(
      formatDate(value, 'en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'UTC',
      }),
    ).toContain('2026');
  });

  it('converts metric base measurements for imperial preferences', () => {
    expect(formatMeasurement(1, 'mass', 'metric', 'en-US')).toMatch(/kg|kilogram/i);
    expect(formatMeasurement(1, 'mass', 'imperial', 'en-US')).toMatch(/lb|pound/i);
  });
});
