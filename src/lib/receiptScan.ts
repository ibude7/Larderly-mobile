/**
 * Receipt scanning — client proxy.
 *
 * Delegates to the `ai_parseReceipt` Cloud Function instead of calling the
 * Vertex AI Gemini API directly. The exported `ReceiptItem` type and
 * `parseReceiptImage` signature are unchanged.
 */

import { httpsCallable } from '@react-native-firebase/functions';
import { functions } from './firebase';
import { sanitizeAIProduct, sanitizeNumber } from './sanitize';

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

const _parseReceipt = httpsCallable<
  { base64: string; mimeType: string },
  { items: ReceiptItem[] }
>(functions, 'ai_parseReceipt');

export async function parseReceiptImage(base64: string, mimeType: string): Promise<ReceiptItem[]> {
  const result = await _parseReceipt({ base64, mimeType });
  return (result.data.items ?? []).map((item) => {
    const sanitized = sanitizeAIProduct(item);
    return {
      name: sanitized.name,
      quantity: sanitized.quantity || 1,
      price: sanitizeNumber((item as { price?: unknown }).price, 0, 9999),
    };
  });
}
