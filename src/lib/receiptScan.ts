import { generateStructuredJson, Schema } from './aiCore';

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

const RECEIPT_SCHEMA = Schema.object({
  properties: {
    items: Schema.array({
      items: Schema.object({
        properties: {
          name: Schema.string(),
          quantity: Schema.number(),
          price: Schema.number(),
        },
      }),
    }),
  },
});

export async function parseReceiptImage(base64: string, mimeType: string): Promise<ReceiptItem[]> {
  const result = await generateStructuredJson<{ items: ReceiptItem[] }>(
    'Extract grocery items, quantities, and prices from this receipt image. Return JSON with an items array.',
    RECEIPT_SCHEMA,
    { base64, mimeType },
  );
  return result.items ?? [];
}
