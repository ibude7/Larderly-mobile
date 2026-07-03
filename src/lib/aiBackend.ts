import { getAI, VertexAIBackend } from '@react-native-firebase/ai';
import { app } from './firebase';

/** Matches Cloud Functions `functions/src/vertex.ts`. */
export const VERTEX_AI_LOCATION = 'us-central1';

let _ai: ReturnType<typeof getAI> | null = null;

/** Firebase AI Logic client routed through the Vertex AI Gemini API. */
export function getAIInstance() {
  if (!_ai) {
    _ai = getAI(app, { backend: new VertexAIBackend(VERTEX_AI_LOCATION) });
  }
  return _ai;
}
