/**
 * Server-side Gemini AI helper for Larderly Cloud Functions.
 *
 * Uses the official `@google-cloud/vertexai` Node SDK instead of the
 * React-Native Firebase AI module. In Cloud Functions the SDK authenticates
 * automatically via Application Default Credentials — no API key is bundled
 * into the app.
 *
 * Model selection mirrors the client-side `aiCore.ts` logic:
 *   - FLASH models → structured JSON, food-identify, receipts, voice.
 *   - NOTE  models → short plain-text (product notes).
 *
 * Both use the same fallback loop so the function keeps working if a preview
 * model ID becomes unavailable.
 */

import { VertexAI, type GenerateContentRequest, type Part } from '@google-cloud/vertexai';

// ─── Config ──────────────────────────────────────────────────────────────────

const PROJECT = process.env.VERTEX_AI_PROJECT ?? 'larderly1';
const LOCATION = process.env.VERTEX_AI_LOCATION ?? 'us-central1';

const MODEL_FLASH = process.env.GEMINI_MODEL_FLASH ?? 'gemini-2.5-flash';
const MODEL_NOTE  = process.env.GEMINI_MODEL_NOTE  ?? 'gemini-2.5-flash';

const MODEL_FLASH_IDS: string[] = [MODEL_FLASH, 'gemini-2.0-flash-001'];
const MODEL_NOTE_IDS:  string[] = [MODEL_NOTE,  'gemini-2.0-flash-001'];

const MODEL_MISSING =
  /not found|not supported|unknown model|does not exist|invalid model|NOT_FOUND|404/i;

// ─── Vertex AI client (singleton per function instance) ───────────────────────

let _vertex: VertexAI | null = null;
function getVertex(): VertexAI {
  if (!_vertex) {
    _vertex = new VertexAI({ project: PROJECT, location: LOCATION });
  }
  return _vertex;
}

// ─── Model-fallback loop ─────────────────────────────────────────────────────

async function withModel<T>(
  modelIds: string[],
  attempt: (modelId: string) => Promise<T>,
): Promise<T> {
  let lastErr: unknown;
  for (const modelId of modelIds) {
    try {
      return await attempt(modelId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!MODEL_MISSING.test(msg)) throw err;
      lastErr = err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('AI model unavailable');
}

// ─── Public helpers ──────────────────────────────────────────────────────────

export interface ImagePart {
  base64: string;
  mimeType: string;
}

/**
 * Generate plain text from a prompt.
 * Mirrors `generateText` in the client's `aiCore.ts`.
 */
export async function generateText(
  prompt: string,
  options?: { temperature?: number; maxOutputTokens?: number },
): Promise<string> {
  return withModel(MODEL_NOTE_IDS, async (modelId) => {
    const model = getVertex().preview.getGenerativeModel({
      model: modelId,
      generationConfig: {
        temperature: options?.temperature ?? 0.4,
        maxOutputTokens: options?.maxOutputTokens ?? 120,
      },
    });
    const request: GenerateContentRequest = { contents: [{ role: 'user', parts: [{ text: prompt }] }] };
    const result = await model.generateContent(request);
    const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return text.trim();
  });
}

/**
 * JSON schema type that mirrors the Gemini response schema object.
 * We accept a plain object here so callers don't need to import Vertex SDK types.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SchemaObject = Record<string, any>;

/**
 * Generate structured JSON matching `responseSchema`.
 * Mirrors `generateStructuredJson` in the client's `aiCore.ts`.
 */
export async function generateStructuredJson<T>(
  prompt: string,
  responseSchema: SchemaObject,
  image?: ImagePart,
): Promise<T> {
  return withModel(MODEL_FLASH_IDS, async (modelId) => {
    const model = getVertex().preview.getGenerativeModel({
      model: modelId,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema,
        temperature: 0.4,
      },
    });

    const parts: Part[] = [{ text: prompt }];
    if (image) {
      parts.push({
        inlineData: { data: image.base64, mimeType: image.mimeType },
      });
    }

    const request: GenerateContentRequest = {
      contents: [{ role: 'user', parts }],
    };

    const result = await model.generateContent(request);
    const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return JSON.parse(text.trim()) as T;
  });
}
