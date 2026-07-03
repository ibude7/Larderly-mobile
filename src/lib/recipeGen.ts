import { generateStructuredJson, Schema } from './aiCore';
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

const RECIPES_SCHEMA = Schema.object({
  properties: {
    recipes: Schema.array({
      items: Schema.object({
        properties: {
          title: Schema.string(),
          description: Schema.string(),
          cuisine: Schema.string(),
          mealType: Schema.string(),
          difficulty: Schema.string(),
          prepTime: Schema.number(),
          cookTime: Schema.number(),
          servings: Schema.number(),
          ingredients: Schema.array({ items: Schema.string() }),
          instructions: Schema.array({ items: Schema.string() }),
          caloriesPerServing: Schema.number(),
        },
      }),
    }),
  },
});

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
  let constraint = '';
  if (dietaryPrefs.length) constraint += `Dietary: ${dietaryPrefs.join(', ')}. `;
  if (allergies) constraint += `Avoid allergens: ${allergies}. `;
  const prompt = `Generate ${count} recipe ideas using these pantry ingredients where possible: ${pantryNames.join(', ')}. ${constraint}Return realistic recipes with full ingredient lists and step-by-step instructions.`;
  const result = await generateStructuredJson<{ recipes: RawRecipe[] }>(prompt, RECIPES_SCHEMA);
  return (result.recipes ?? []).map(mapRaw);
}

export async function generatePersonalizedRecipes(
  recentActivity: string,
  dietaryPrefs: string[],
  allergies: string,
  count = 2,
): Promise<Recipe[]> {
  let constraint = '';
  if (dietaryPrefs.length) constraint += `Dietary: ${dietaryPrefs.join(', ')}. `;
  if (allergies) constraint += `Avoid allergens: ${allergies}. `;
  const prompt = `Based on recent kitchen activity: "${recentActivity || 'None yet'}", suggest ${count} personalized recipes. ${constraint}Return full ingredients and instructions.`;
  const result = await generateStructuredJson<{ recipes: RawRecipe[] }>(prompt, RECIPES_SCHEMA);
  return (result.recipes ?? []).map(mapRaw);
}

export async function generateDashboardTip(summary: string): Promise<string> {
  const schema = Schema.object({
    properties: { tip: Schema.string() },
  });
  const result = await generateStructuredJson<{ tip: string }>(
    `Give one short, actionable pantry tip (max 2 sentences) based on: ${summary}`,
    schema,
  );
  return result.tip ?? '';
}
