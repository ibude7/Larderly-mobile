/**
 * Callable Cloud Function: receipt image parsing.
 *
 * Mirrors `src/lib/receiptScan.ts` — runs server-side so no Vertex AI
 * credentials are bundled in the app.
 *
 * Exported callable:
 *   ai_parseReceipt → { items: ReceiptItem[] }
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { generateStructuredJson } from './gemini';

// ─── Schema ───────────────────────────────────────────────────────────────────

const RECEIPT_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name:     { type: 'string' },
          quantity: { type: 'number' },
          price:    { type: 'number' },
        },
      },
    },
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

export interface ParseReceiptPayload {
  /** Base64-encoded image data. */
  base64: string;
  /** MIME type of the image, e.g. "image/jpeg". */
  mimeType: string;
}

// ─── Callable: ai_parseReceipt ───────────────────────────────────────────────

export const ai_parseReceipt = onCall<ParseReceiptPayload>(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in to scan receipts.');
    }

    const { base64, mimeType } = request.data;

    if (!base64 || !mimeType) {
      throw new HttpsError('invalid-argument', 'base64 and mimeType are required.');
    }

    try {
      const result = await generateStructuredJson<{ items: ReceiptItem[] }>(
        'Extract grocery items, quantities, and prices from this receipt image. Return JSON with an items array.',
        RECEIPT_SCHEMA,
        { base64, mimeType },
      );
      return { items: result.items ?? [] };
    } catch (err) {
      throw new HttpsError('internal', err instanceof Error ? err.message : 'AI error');
    }
  },
);
