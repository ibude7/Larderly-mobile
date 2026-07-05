/**
 * Callable Cloud Functions: voice command parsing.
 *
 * Mirrors `src/lib/voiceCommands.ts` — runs server-side so no Vertex AI
 * credentials are bundled in the app.
 *
 * Exported callables:
 *   ai_parseShoppingVoice → ParsedVoiceCommand
 *   ai_parsePantryVoice   → ParsedPantryVoice
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { generateStructuredJson } from './gemini';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const VOICE_SCHEMA = {
  type: 'object',
  properties: {
    productName: { type: 'string' },
    quantity:    { type: 'number' },
  },
};

const PANTRY_VOICE_SCHEMA = {
  type: 'object',
  properties: {
    name:            { type: 'string' },
    quantity:        { type: 'number' },
    unit:            { type: 'string' },
    storageLocation: { type: 'string' },
    category:        { type: 'string' },
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────

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

export interface VoiceCommandPayload {
  transcript: string;
}

// ─── Callable: ai_parseShoppingVoice ─────────────────────────────────────────

export const ai_parseShoppingVoice = onCall<VoiceCommandPayload>(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in.');
    }

    const { transcript } = request.data;

    if (!transcript || typeof transcript !== 'string') {
      throw new HttpsError('invalid-argument', 'transcript is required.');
    }

    try {
      const result = await generateStructuredJson<ParsedVoiceCommand>(
        `Parse this shopping voice command: "${transcript}". Return JSON with productName and quantity.`,
        VOICE_SCHEMA,
      );
      return result;
    } catch (err) {
      throw new HttpsError('internal', err instanceof Error ? err.message : 'AI error');
    }
  },
);

// ─── Callable: ai_parsePantryVoice ───────────────────────────────────────────

export const ai_parsePantryVoice = onCall<VoiceCommandPayload>(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in.');
    }

    const { transcript } = request.data;

    if (!transcript || typeof transcript !== 'string') {
      throw new HttpsError('invalid-argument', 'transcript is required.');
    }

    try {
      const result = await generateStructuredJson<ParsedPantryVoice>(
        `Parse this pantry voice command into a grocery item: "${transcript}". Return JSON with name, quantity, unit, storageLocation (Pantry/Fridge/Freezer/Other), and category.`,
        PANTRY_VOICE_SCHEMA,
      );
      return result;
    } catch (err) {
      throw new HttpsError('internal', err instanceof Error ? err.message : 'AI error');
    }
  },
);
