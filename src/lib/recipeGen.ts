/**
 * Recipe generation — client proxy for Cloud Functions.
 */

import { callFunction, callable } from './callable';
import type { Recipe, Cuisine, MealType, Difficulty } from './recipes';

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

const _generatePantryRecipes = callable<
  { pantryNames: string[]; dietaryPrefs: string[]; allergies: string; count?: number },
  { recipes: RawRecipe[] }
>('ai_generatePantryRecipes');

const _generatePersonalizedRecipes = callable<
  { recentActivity: string; dietaryPrefs: string[]; allergies: string; count?: number },
  { recipes: RawRecipe[] }
>('ai_generatePersonalizedRecipes');

const _generateDashboardTip = callable<{ summary: string }, { tip: string }>('ai_generateDashboardTip');

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

export async function generatePantryRecipes(
  pantryNames: string[],
  dietaryPrefs: string[],
  allergies: string,
  count = 3,
): Promise<Recipe[]> {
  const data = await callFunction(_generatePantryRecipes, {
    pantryNames,
    dietaryPrefs,
    allergies,
    count,
  });
  return (data.recipes ?? []).map(mapRaw);
}

export async function generatePersonalizedRecipes(
  recentActivity: string,
  dietaryPrefs: string[],
  allergies: string,
  count = 2,
): Promise<Recipe[]> {
  const data = await callFunction(_generatePersonalizedRecipes, {
    recentActivity,
    dietaryPrefs,
    allergies,
    count,
  });
  return (data.recipes ?? []).map(mapRaw);
}

export async function generateDashboardTip(summary: string): Promise<string> {
  const data = await callFunction(_generateDashboardTip, { summary });
  return data.tip ?? '';
}
