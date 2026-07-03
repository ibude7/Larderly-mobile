import { generateStructuredJson, Schema } from './aiCore';

export interface IdentifiedFood {
  name: string;
  quantity: number;
  unit: string;
  storageLocation: string;
  category: string;
}

const FOOD_SCHEMA = Schema.object({
  properties: {
    name: Schema.string(),
    quantity: Schema.number(),
    unit: Schema.string(),
    storageLocation: Schema.string(),
    category: Schema.string(),
  },
});

export async function identifyFoodFromImage(base64: string, mimeType: string): Promise<IdentifiedFood> {
  return generateStructuredJson<IdentifiedFood>(
    'Identify the food or grocery item in this image. Estimate quantity and unit. Suggest storage location (Pantry, Fridge, Freezer, Other) and category. Return JSON only.',
    FOOD_SCHEMA,
    { base64, mimeType },
  );
}
