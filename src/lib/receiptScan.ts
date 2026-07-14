/**
 * Receipt scanning — client proxy for `ai_parseReceipt`.
 */

import { callFunction, callable } from './callable';
import { sanitizeAIProduct, sanitizeNumber } from './sanitize';

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

const _parseReceipt = callable<{ base64: string; mimeType: string }, { items: ReceiptItem[] }>(
  'ai_parseReceipt',
);

export async function parseReceiptImage(base64: string, mimeType: string): Promise<ReceiptItem[]> {
  const data = await callFunction(_parseReceipt, { base64, mimeType });
  return (data.items ?? []).map((item) => {
    const sanitized = sanitizeAIProduct(item);
    return {
      name: sanitized.name,
      quantity: sanitized.quantity || 1,
      price: sanitizeNumber((item as { price?: unknown }).price, 0, 9999),
    };
  });
}
