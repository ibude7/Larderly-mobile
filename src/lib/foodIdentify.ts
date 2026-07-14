/**
 * Food identification from image — client proxy for `ai_identifyFood`.
 */

import { callFunction, callable } from './callable';
import { sanitizeAIProduct, sanitizeString } from './sanitize';

export interface IdentifiedFood {
  name: string;
  quantity: number;
  unit: string;
  storageLocation: string;
  category: string;
}

const _identifyFood = callable<{ base64: string; mimeType: string }, IdentifiedFood>('ai_identifyFood');

export async function identifyFoodFromImage(base64: string, mimeType: string): Promise<IdentifiedFood> {
  const data = await callFunction(_identifyFood, { base64, mimeType });
  const sanitized = sanitizeAIProduct(data);
  return {
    ...sanitized,
    storageLocation: sanitizeString((data as { storageLocation?: unknown })?.storageLocation, 50) || 'Pantry',
  };
}
