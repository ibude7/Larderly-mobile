/**
 * Voice command parsing — client proxy for shopping + pantry Cloud Functions.
 */

import { callFunction, callable } from './callable';
import { sanitizeAIProduct, sanitizeString } from './sanitize';

export interface ParsedVoiceCommand {
  productName: string;
  quantity: number;
}

export interface ParsedPantryVoice {
  name: string;
  quantity: number;
  unit: string;
  storageLocation: string;
  category: string;
}

const _parseShoppingVoice = callable<{ transcript: string }, ParsedVoiceCommand>('ai_parseShoppingVoice');
const _parsePantryVoice = callable<{ transcript: string }, ParsedPantryVoice>('ai_parsePantryVoice');

export async function parseShoppingVoiceCommand(transcript: string): Promise<ParsedVoiceCommand> {
  const data = await callFunction(_parseShoppingVoice, { transcript });
  const sanitized = sanitizeAIProduct(data);
  return {
    productName: sanitized.name,
    quantity: sanitized.quantity || 1,
  };
}

export async function parsePantryVoiceCommand(transcript: string): Promise<ParsedPantryVoice> {
  const data = await callFunction(_parsePantryVoice, { transcript });
  const sanitized = sanitizeAIProduct(data);
  return {
    ...sanitized,
    quantity: sanitized.quantity || 1,
    storageLocation: sanitizeString((data as { storageLocation?: unknown })?.storageLocation, 50) || 'Pantry',
  };
}
