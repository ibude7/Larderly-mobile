/**
 * Voice command parsing — client proxy.
 *
 * Delegates to the `ai_parseShoppingVoice` and `ai_parsePantryVoice` Cloud
 * Functions instead of calling the Vertex AI Gemini API directly. All exported
 * types and function signatures are unchanged.
 */

import { httpsCallable } from '@react-native-firebase/functions';
import { functions } from './firebase';

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

const _parseShoppingVoice = httpsCallable<
  { transcript: string },
  ParsedVoiceCommand
>(functions, 'ai_parseShoppingVoice');

const _parsePantryVoice = httpsCallable<
  { transcript: string },
  ParsedPantryVoice
>(functions, 'ai_parsePantryVoice');

export async function parseShoppingVoiceCommand(transcript: string): Promise<ParsedVoiceCommand> {
  const result = await _parseShoppingVoice({ transcript });
  return result.data;
}

export async function parsePantryVoiceCommand(transcript: string): Promise<ParsedPantryVoice> {
  const result = await _parsePantryVoice({ transcript });
  return result.data;
}
