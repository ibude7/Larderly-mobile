import { generateStructuredJson, Schema } from './aiCore';

export interface ParsedVoiceCommand {
  productName: string;
  quantity: number;
}

const VOICE_SCHEMA = Schema.object({
  properties: {
    productName: Schema.string(),
    quantity: Schema.number(),
  },
});

export async function parseShoppingVoiceCommand(transcript: string): Promise<ParsedVoiceCommand> {
  return generateStructuredJson<ParsedVoiceCommand>(
    `Parse this shopping voice command: "${transcript}". Return JSON with productName and quantity.`,
    VOICE_SCHEMA,
  );
}

export interface ParsedPantryVoice {
  name: string;
  quantity: number;
  unit: string;
  storageLocation: string;
  category: string;
}

const PANTRY_VOICE_SCHEMA = Schema.object({
  properties: {
    name: Schema.string(),
    quantity: Schema.number(),
    unit: Schema.string(),
    storageLocation: Schema.string(),
    category: Schema.string(),
  },
});

export async function parsePantryVoiceCommand(transcript: string): Promise<ParsedPantryVoice> {
  return generateStructuredJson<ParsedPantryVoice>(
    `Parse this pantry voice command into a grocery item: "${transcript}". Return JSON with name, quantity, unit, storageLocation (Pantry/Fridge/Freezer/Other), and category.`,
    PANTRY_VOICE_SCHEMA,
  );
}
