import { CATEGORIES } from './categories';

const VALID_CATEGORY_IDS = new Set(CATEGORIES.map((category) => category.id));
const TAG_PATTERN = /<\/?[^>]+(>|$)/g;

export interface SanitizedAIProduct {
  name: string;
  brand: string;
  category: string;
  quantity: number;
  unit: string;
}

function readField(raw: unknown, field: string): unknown {
  if (!raw || typeof raw !== 'object') return undefined;
  return (raw as Record<string, unknown>)[field];
}

export function sanitizeString(s: unknown, maxLen = 100): string {
  if (typeof s !== 'string') return '';
  return s.replace(TAG_PATTERN, '').trim().slice(0, maxLen);
}

export function sanitizeNumber(n: unknown, min = 0, max = 9999): number {
  const parsed = typeof n === 'number' ? n : typeof n === 'string' ? parseFloat(n) : NaN;
  if (Number.isNaN(parsed)) return 0;
  return Math.min(max, Math.max(min, parsed));
}

export function sanitizeAIProduct(raw: unknown): SanitizedAIProduct {
  const category = sanitizeString(readField(raw, 'category'), 50).toLowerCase();
  const unit = sanitizeString(readField(raw, 'unit'), 24) || 'pcs';

  return {
    name: sanitizeString(
      readField(raw, 'name') ?? readField(raw, 'productName'),
      100,
    ),
    brand: sanitizeString(readField(raw, 'brand'), 100),
    category: VALID_CATEGORY_IDS.has(category) ? category : 'other',
    quantity: sanitizeNumber(readField(raw, 'quantity'), 0, 9999),
    unit,
  };
}
