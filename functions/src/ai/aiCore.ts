/**
 * Callable Cloud Functions: general-purpose AI core.
 *
 * These are low-level callables that back the rewritten `src/lib/aiCore.ts`.
 * They exist so that `mealAI.ts` and `productNoteAI.ts` — which call
 * `aiCore.generateText` / `aiCore.generateStructuredJson` — continue to work
 * without any changes to those files.
 *
 * Feature-specific callables (recipeGen, foodIdentify, etc.) call the
 * server-side gemini helpers directly and do NOT route through these.
 *
 * Exported callables:
 *   ai_generateText          → { text: string }
 *   ai_generateStructuredJson → <T> (whatever the schema produces)
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { generateText, generateStructuredJson, type SchemaObject } from './gemini';

// ─── Callable: ai_generateText ────────────────────────────────────────────────

interface GenerateTextPayload {
  prompt: string;
  options?: { temperature?: number; maxOutputTokens?: number };
}

export const ai_generateText = onCall<GenerateTextPayload>(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in.');
    }

    const { prompt, options } = request.data;

    if (!prompt || typeof prompt !== 'string') {
      throw new HttpsError('invalid-argument', 'prompt is required.');
    }

    try {
      const text = await generateText(prompt, options);
      return { text };
    } catch (err) {
      throw new HttpsError('internal', err instanceof Error ? err.message : 'AI error');
    }
  },
);

// ─── Callable: ai_generateStructuredJson ─────────────────────────────────────

interface GenerateStructuredJsonPayload {
  prompt: string;
  responseSchema: SchemaObject;
  image?: { base64: string; mimeType: string };
}

export const ai_generateStructuredJson = onCall<GenerateStructuredJsonPayload>(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in.');
    }

    const { prompt, responseSchema, image } = request.data;

    if (!prompt || typeof prompt !== 'string') {
      throw new HttpsError('invalid-argument', 'prompt is required.');
    }
    if (!responseSchema || typeof responseSchema !== 'object') {
      throw new HttpsError('invalid-argument', 'responseSchema is required.');
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await generateStructuredJson<any>(prompt, responseSchema, image);
      return result;
    } catch (err) {
      throw new HttpsError('internal', err instanceof Error ? err.message : 'AI error');
    }
  },
);
