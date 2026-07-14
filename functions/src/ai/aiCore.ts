/**
 * Callable Cloud Functions: general-purpose AI core.
 *
 * These are low-level callables that back the rewritten `src/lib/aiCore.ts`.
 * They exist so that `productNoteAI.ts` — which calls
 * `aiCore.generateText` / `aiCore.generateStructuredJson` — continues to work
 * without changes to those files.
 *
 * Feature-specific callables (recipeGen, foodIdentify, etc.) call the
 * server-side gemini helpers directly and do NOT route through these.
 * Note: `mealAI.ts` still uses client-side Firebase AI Logic for streaming
 * meal planning; it is not backed by these callables yet.
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
