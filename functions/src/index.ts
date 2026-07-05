/**
 * Larderly Cloud Functions — entry point.
 *
 * Re-exports all callable AI proxy functions so Firebase CLI can discover and
 * deploy them. Add new features here as needed.
 */

import { initializeApp } from 'firebase-admin/app';
initializeApp();

// ─── AI proxy callables ───────────────────────────────────────────────────────

// General-purpose core (backs mealAI.ts / productNoteAI.ts transparently)
export { ai_generateText, ai_generateStructuredJson } from './ai/aiCore';

// Feature-specific callables
export { ai_generatePantryRecipes, ai_generatePersonalizedRecipes, ai_generateDashboardTip } from './ai/recipeGen';
export { ai_identifyFood } from './ai/foodIdentify';
export { ai_parseShoppingVoice, ai_parsePantryVoice } from './ai/voiceCommands';
export { ai_parseReceipt } from './ai/receiptScan';

// ─── Notification Schedulers ──────────────────────────────────────────────────
export { expiryAlert } from './notifications/expiryAlert';
