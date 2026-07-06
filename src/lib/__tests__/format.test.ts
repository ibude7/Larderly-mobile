import { daysUntil, expirationStatus, formatCurrency } from '../format';

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
