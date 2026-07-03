import { getGenerativeModel, Schema } from '@react-native-firebase/ai';
import { getAIInstance } from './aiBackend';

const MODEL_FLASH_IDS = ['gemini-3-flash-preview', 'gemini-2.5-flash'] as const;
/** Product notes on scan — prefer stable 3.5 Flash, fall back to 3 Flash preview. */
const MODEL_NOTE_IDS = ['gemini-3.5-flash', 'gemini-3-flash-preview'] as const;
const MODEL_MISSING = /not found|not supported|unknown model|does not exist|invalid model|NOT_FOUND|404/i;

export interface ImagePart {
  base64: string;
  mimeType: string;
}

async function withModel<T>(attempt: (modelId: string) => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (const modelId of MODEL_FLASH_IDS) {
    try {
      return await attempt(modelId);
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (!MODEL_MISSING.test(msg)) throw err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('AI model unavailable');
}

async function withNoteModel<T>(attempt: (modelId: string) => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (const modelId of MODEL_NOTE_IDS) {
    try {
      return await attempt(modelId);
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (!MODEL_MISSING.test(msg)) throw err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('AI model unavailable');
}

/** Generate plain text from a prompt (product notes, short copy). */
export async function generateText(
  prompt: string,
  options?: { temperature?: number; maxOutputTokens?: number },
): Promise<string> {
  return withNoteModel(async (modelId) => {
    const model = getGenerativeModel(getAIInstance(), {
      model: modelId,
      generationConfig: {
        temperature: options?.temperature ?? 0.4,
        maxOutputTokens: options?.maxOutputTokens ?? 120,
      },
    });
    const result = await model.generateContent(prompt);
    const text = (result.response as { text?: () => string }).text?.() ?? '';
    return text.trim();
  });
}

/** Generate JSON matching a Gemini response schema from text and/or image. */
export async function generateStructuredJson<T>(
  prompt: string,
  responseSchema: ReturnType<typeof Schema.object>,
  image?: ImagePart,
): Promise<T> {
  return withModel(async (modelId) => {
    const model = getGenerativeModel(getAIInstance(), {
      model: modelId,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema,
        temperature: 0.4,
      },
    });
    const parts: Array<string | { inlineData: { data: string; mimeType: string } }> = [prompt];
    if (image) parts.push({ inlineData: { data: image.base64, mimeType: image.mimeType } });
    const result = await model.generateContent(parts);
    const text = (result.response as { text?: () => string }).text?.() ?? '';
    return JSON.parse(text.trim()) as T;
  });
}

export { Schema };
