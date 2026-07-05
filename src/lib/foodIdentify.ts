/**
 * Food identification from image — client proxy.
 *
 * Delegates to the `ai_identifyFood` Cloud Function instead of calling the
 * Vertex AI Gemini API directly. The exported `IdentifiedFood` type and
 * `identifyFoodFromImage` signature are unchanged.
 */

import { httpsCallable } from '@react-native-firebase/functions';
import { functions } from './firebase';

export interface IdentifiedFood {
  name: string;
  quantity: number;
  unit: string;
  storageLocation: string;
  category: string;
}

const _identifyFood = httpsCallable<
  { base64: string; mimeType: string },
  IdentifiedFood
>(functions, 'ai_identifyFood');

export async function identifyFoodFromImage(base64: string, mimeType: string): Promise<IdentifiedFood> {
  const result = await _identifyFood({ base64, mimeType });
  return result.data;
}
