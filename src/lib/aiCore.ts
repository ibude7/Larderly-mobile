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
 *    unchanged — callers such as `productNoteAI.ts` continue to work.
 */

import { callFunction, callable } from './callable';

const _generateText = callable<
  { prompt: string; options?: { temperature?: number; maxOutputTokens?: number } },
  { text: string }
>('ai_generateText');

const _generateStructuredJson = callable<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { prompt: string; responseSchema: Record<string, any>; image?: { base64: string; mimeType: string } },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
>('ai_generateStructuredJson');

export interface ImagePart {
  base64: string;
  mimeType: string;
}

/** Generate plain text from a prompt (product notes, short copy). */
export async function generateText(
  prompt: string,
  options?: { temperature?: number; maxOutputTokens?: number },
): Promise<string> {
  const data = await callFunction(_generateText, { prompt, options });
  return data.text ?? '';
}

/**
 * Generate JSON matching a Gemini response schema from text and/or image.
 *
 * NOTE: `responseSchema` accepts a plain JSON Schema object — the server uses
 * the Vertex AI Node SDK which takes plain schemas directly.
 */
export async function generateStructuredJson<T>(
  prompt: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  responseSchema: Record<string, any>,
  image?: ImagePart,
): Promise<T> {
  return callFunction(_generateStructuredJson, { prompt, responseSchema, image }) as Promise<T>;
}

/**
 * Plain-object Schema builders compatible with the server-side Vertex AI SDK.
 * Kept for callers that still `import { Schema } from './aiCore'`.
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
