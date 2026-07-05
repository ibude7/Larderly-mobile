/**
 * Callable Cloud Function: food identification from image.
 *
 * Mirrors `src/lib/foodIdentify.ts` — runs server-side so no Vertex AI
 * credentials are bundled in the app.
 *
 * Exported callable:
 *   ai_identifyFood → IdentifiedFood
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { generateStructuredJson } from './gemini';

// ─── Schema ───────────────────────────────────────────────────────────────────

const FOOD_SCHEMA = {
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

export interface IdentifiedFood {
  name: string;
  quantity: number;
  unit: string;
  storageLocation: string;
  category: string;
}

export interface IdentifyFoodPayload {
  /** Base64-encoded image data. */
  base64: string;
  /** MIME type of the image, e.g. "image/jpeg". */
  mimeType: string;
}

// ─── Callable: ai_identifyFood ───────────────────────────────────────────────

export const ai_identifyFood = onCall<IdentifyFoodPayload>(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in to identify food.');
    }

    const { base64, mimeType } = request.data;

    if (!base64 || !mimeType) {
      throw new HttpsError('invalid-argument', 'base64 and mimeType are required.');
    }

    try {
      const result = await generateStructuredJson<IdentifiedFood>(
        'Identify the food or grocery item in this image. Estimate quantity and unit. Suggest storage location (Pantry, Fridge, Freezer, Other) and category. Return JSON only.',
        FOOD_SCHEMA,
        { base64, mimeType },
      );
      return result;
    } catch (err) {
      throw new HttpsError('internal', err instanceof Error ? err.message : 'AI error');
    }
  },
);
