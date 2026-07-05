/**
 * AI core — client-side proxy for Larderly's AI Cloud Functions.
 *
 * Previously this module called the Vertex AI Gemini API directly via Firebase
 * AI Logic (`@react-native-firebase/ai`). It now delegates every call to a
 * Firebase Cloud Function so:
 *
 *  • No Vertex AI credentials are bundled in the app binary.
 *  • Quota, rate-limiting, and model selection are controlled server-side.
 *  • The public API surface (`generateText`, `generateStructuredJson`) is
 *    unchanged — callers such as `productNoteAI.ts` and `mealAI.ts` continue
 *    to work without modification.
 *
 * Internal callers in this repo (recipeGen, foodIdentify, voiceCommands,
 * receiptScan) have been refactored to call their dedicated callables
 * directly, so they no longer depend on this module at all.
 */

import { httpsCallable } from '@react-native-firebase/functions';
import { functions } from './firebase';

// ─── Internal callable wrappers ───────────────────────────────────────────────

/**
 * Callable: ai_generateText
 *
 * Dispatches to the server-side `generateText` handler.
 * Used by `productNoteAI.ts` (and potentially others) to generate short
 * plain-text strings without coupling them to a specific Cloud Function.
 */
const _generateText = httpsCallable<
  { prompt: string; options?: { temperature?: number; maxOutputTokens?: number } },
  { text: string }
>(functions, 'ai_generateText');

/**
 * Callable: ai_generateStructuredJson
 *
 * General-purpose structured-JSON callable — used by `mealAI.ts` and any
 * other code that still calls `aiCore` directly rather than a feature-specific
 * callable.
 */
const _generateStructuredJson = httpsCallable<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { prompt: string; responseSchema: Record<string, any>; image?: { base64: string; mimeType: string } },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
>(functions, 'ai_generateStructuredJson');

// ─── Public API (unchanged signatures) ───────────────────────────────────────

export interface ImagePart {
  base64: string;
  mimeType: string;
}

/** Generate plain text from a prompt (product notes, short copy). */
export async function generateText(
  prompt: string,
  options?: { temperature?: number; maxOutputTokens?: number },
): Promise<string> {
  const result = await _generateText({ prompt, options });
  return result.data.text ?? '';
}

/**
 * Generate JSON matching a Gemini response schema from text and/or image.
 *
 * NOTE: `responseSchema` here accepts a plain JSON Schema object rather than
 * the Firebase AI SDK's `Schema.*` builder objects — the server uses the
 * Vertex AI Node SDK which takes plain schemas directly. For new callables
 * added after this refactor, prefer the dedicated feature callables instead.
 */
export async function generateStructuredJson<T>(
  prompt: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  responseSchema: Record<string, any>,
  image?: ImagePart,
): Promise<T> {
  const result = await _generateStructuredJson({ prompt, responseSchema, image });
  return result.data as T;
}

/**
 * Re-export a Schema-like namespace for backward compatibility with callers
 * that still do `import { Schema } from './aiCore'`.
 *
 * These are plain-object builders that produce JSON Schema fragments
 * compatible with the server-side Vertex AI SDK.
 */
export const Schema = {
  object: (opts: { properties: Record<string, unknown>; required?: string[]; description?: string }) => ({
    type: 'object' as const,
    properties: opts.properties,
    ...(opts.required ? { required: opts.required } : {}),
    ...(opts.description ? { description: opts.description } : {}),
  }),
  array: (opts: { items: unknown }) => ({
    type: 'array' as const,
    items: opts.items,
  }),
  string: (opts?: { description?: string }) =>
    ({ type: 'string' as const, ...(opts?.description ? { description: opts.description } : {}) }),
  number: (opts?: { description?: string }) =>
    ({ type: 'number' as const, ...(opts?.description ? { description: opts.description } : {}) }),
  integer: (opts?: { description?: string }) =>
    ({ type: 'integer' as const, ...(opts?.description ? { description: opts.description } : {}) }),
  boolean: (opts?: { description?: string }) =>
    ({ type: 'boolean' as const, ...(opts?.description ? { description: opts.description } : {}) }),
  enumString: (opts: { enum: string[]; description?: string }) =>
    ({ type: 'string' as const, enum: opts.enum, ...(opts.description ? { description: opts.description } : {}) }),
};
