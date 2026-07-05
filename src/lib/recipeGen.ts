/**
 * Recipe generation — client proxy.
 *
 * Delegates to dedicated Firebase Cloud Functions instead of calling the
 * Vertex AI Gemini API directly. All exported function signatures are
 * unchanged; callers (RecipesScreen, DashboardScreen) require no updates.
 */

import { httpsCallable } from '@react-native-firebase/functions';
import { functions } from './firebase';
import type { Recipe, Cuisine, MealType, Difficulty } from './recipes';

// ─── Raw type (matches server response shape) ─────────────────────────────────

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

// ─── Callable references ──────────────────────────────────────────────────────

const _generatePantryRecipes = httpsCallable<
  { pantryNames: string[]; dietaryPrefs: string[]; allergies: string; count?: number },
  { recipes: RawRecipe[] }
>(functions, 'ai_generatePantryRecipes');

const _generatePersonalizedRecipes = httpsCallable<
  { recentActivity: string; dietaryPrefs: string[]; allergies: string; count?: number },
  { recipes: RawRecipe[] }
>(functions, 'ai_generatePersonalizedRecipes');

const _generateDashboardTip = httpsCallable<
  { summary: string },
  { tip: string }
>(functions, 'ai_generateDashboardTip');

// ─── Mapper (unchanged from original) ────────────────────────────────────────

function mapRaw(r: RawRecipe, idx: number): Recipe {
  return {
    id: `ai-${Date.now()}-${idx}`,
    title: r.title,
    description: r.description ?? '',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    cuisine: (r.cuisine ?? 'other') as Cuisine,
    mealType: (r.mealType ?? 'dinner') as MealType,
    difficulty: (r.difficulty ?? 'easy') as Difficulty,
    prepTime: Number(r.prepTime ?? 5),
    cookTime: Number(r.cookTime ?? 15),
    servings: Number(r.servings ?? 2),
    rating: 5,
    tags: ['ai'],
    ingredients: r.ingredients ?? [],
    instructions: r.instructions ?? [],
    caloriesPerServing: r.caloriesPerServing,
    source: 'ai',
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function generatePantryRecipes(
  pantryNames: string[],
  dietaryPrefs: string[],
  allergies: string,
  count = 3,
): Promise<Recipe[]> {
  const result = await _generatePantryRecipes({ pantryNames, dietaryPrefs, allergies, count });
  return (result.data.recipes ?? []).map(mapRaw);
}

export async function generatePersonalizedRecipes(
  recentActivity: string,
  dietaryPrefs: string[],
  allergies: string,
  count = 2,
): Promise<Recipe[]> {
  const result = await _generatePersonalizedRecipes({ recentActivity, dietaryPrefs, allergies, count });
  return (result.data.recipes ?? []).map(mapRaw);
}

export async function generateDashboardTip(summary: string): Promise<string> {
  const result = await _generateDashboardTip({ summary });
  return result.data.tip ?? '';
}
