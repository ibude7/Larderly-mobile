import { sanitizeAIProduct, sanitizeNumber, sanitizeString } from '../sanitize';

describe('sanitizeString', () => {
  it('returns an empty string for non-strings', () => {
    expect(sanitizeString(null)).toBe('');
    expect(sanitizeString(12)).toBe('');
  });

  it('strips tags, trims, and truncates', () => {
    expect(sanitizeString('  <script>alert(1)</script>Organic Apples  ', 14)).toBe('alert(1)Organi');
  });
});

describe('sanitizeNumber', () => {
  it('parses and clamps numeric values', () => {
    expect(sanitizeNumber('12.5', 0, 10)).toBe(10);
    expect(sanitizeNumber('-4', 0, 10)).toBe(0);
    expect(sanitizeNumber('nope')).toBe(0);
  });
});

describe('sanitizeAIProduct', () => {
  it('sanitizes known product fields and validates category ids', () => {
    expect(
      sanitizeAIProduct({
        name: '<b>Milk</b>',
        brand: '<img>Farm',
        category: 'dairy',
        quantity: '2',
        unit: 'L',
      }),
    ).toEqual({
      name: 'Milk',
      brand: 'Farm',
      category: 'dairy',
      quantity: 2,
      unit: 'L',
    });
  });

  it('falls back to other for unknown categories', () => {
    expect(sanitizeAIProduct({ name: 'Mystery', category: 'scripts' }).category).toBe('other');
  });
});
