/**
 * Callable Cloud Functions: recipe generation.
 *
 * Mirrors the logic in `src/lib/recipeGen.ts` but runs server-side with
 * Application Default Credentials — no Vertex AI key is bundled in the app.
 *
 * Exported callables:
 *   ai_generatePantryRecipes      → Recipe[]
 *   ai_generatePersonalizedRecipes → Recipe[]
 *   ai_generateDashboardTip       → { tip: string }
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { generateStructuredJson } from './gemini';

// ─── Shared schema (plain object form — no Firebase AI SDK on the server) ────

const RECIPE_ITEM_SCHEMA = {
  type: 'object',
  properties: {
    title:            { type: 'string' },
    description:      { type: 'string' },
    cuisine:          { type: 'string' },
    mealType:         { type: 'string' },
    difficulty:       { type: 'string' },
    prepTime:         { type: 'number' },
    cookTime:         { type: 'number' },
    servings:         { type: 'number' },
    ingredients:      { type: 'array', items: { type: 'string' } },
    instructions:     { type: 'array', items: { type: 'string' } },
    caloriesPerServing: { type: 'number' },
  },
};

const RECIPES_SCHEMA = {
  type: 'object',
  properties: {
    recipes: { type: 'array', items: RECIPE_ITEM_SCHEMA },
  },
};

const TIP_SCHEMA = {
  type: 'object',
  properties: { tip: { type: 'string' } },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawRecipe {
  title: string;
  description?: string;
  cuisine?: string;
  mealType?: string;
  difficulty?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  ingredients: string[];
  instructions: string[];
  caloriesPerServing?: number;
}

// ─── Callable: ai_generatePantryRecipes ──────────────────────────────────────

export interface GeneratePantryRecipesPayload {
  pantryNames: string[];
  dietaryPrefs: string[];
  allergies: string;
  count?: number;
}

export const ai_generatePantryRecipes = onCall<GeneratePantryRecipesPayload>(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in to generate recipes.');
    }

    const { pantryNames, dietaryPrefs, allergies, count = 3 } = request.data;

    if (!Array.isArray(pantryNames)) {
      throw new HttpsError('invalid-argument', 'pantryNames must be an array.');
    }

    let constraint = '';
    if (dietaryPrefs?.length) constraint += `Dietary: ${dietaryPrefs.join(', ')}. `;
    if (allergies) constraint += `Avoid allergens: ${allergies}. `;

    const prompt = `Generate ${count} recipe ideas using these pantry ingredients where possible: ${pantryNames.join(', ')}. ${constraint}Return realistic recipes with full ingredient lists and step-by-step instructions.`;

    try {
      const result = await generateStructuredJson<{ recipes: RawRecipe[] }>(prompt, RECIPES_SCHEMA);
      return { recipes: result.recipes ?? [] };
    } catch (err) {
      throw new HttpsError('internal', err instanceof Error ? err.message : 'AI error');
    }
  },
);

// ─── Callable: ai_generatePersonalizedRecipes ────────────────────────────────

export interface GeneratePersonalizedRecipesPayload {
  recentActivity: string;
  dietaryPrefs: string[];
  allergies: string;
  count?: number;
}

export const ai_generatePersonalizedRecipes = onCall<GeneratePersonalizedRecipesPayload>(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in to generate recipes.');
    }

    const { recentActivity, dietaryPrefs, allergies, count = 2 } = request.data;

    let constraint = '';
    if (dietaryPrefs?.length) constraint += `Dietary: ${dietaryPrefs.join(', ')}. `;
    if (allergies) constraint += `Avoid allergens: ${allergies}. `;

    const prompt = `Based on recent kitchen activity: "${recentActivity || 'None yet'}", suggest ${count} personalized recipes. ${constraint}Return full ingredients and instructions.`;

    try {
      const result = await generateStructuredJson<{ recipes: RawRecipe[] }>(prompt, RECIPES_SCHEMA);
      return { recipes: result.recipes ?? [] };
    } catch (err) {
      throw new HttpsError('internal', err instanceof Error ? err.message : 'AI error');
    }
  },
);

// ─── Callable: ai_generateDashboardTip ───────────────────────────────────────

export interface GenerateDashboardTipPayload {
  summary: string;
}

export const ai_generateDashboardTip = onCall<GenerateDashboardTipPayload>(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in.');
    }

    const { summary } = request.data;

    try {
      const result = await generateStructuredJson<{ tip: string }>(
        `Give one short, actionable pantry tip (max 2 sentences) based on: ${summary}`,
        TIP_SCHEMA,
      );
      return { tip: result.tip ?? '' };
    } catch (err) {
      throw new HttpsError('internal', err instanceof Error ? err.message : 'AI error');
    }
  },
);
