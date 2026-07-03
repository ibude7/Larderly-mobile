// Recipe types and built-in recipe seed data.

export type Difficulty = 'easy' | 'medium' | 'hard';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';
export type Cuisine = 'american' | 'italian' | 'mexican' | 'asian' | 'indian' | 'mediterranean' | 'other';

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  cuisine: Cuisine;
  mealType: MealType;
  difficulty: Difficulty;
  prepTime: number;
  cookTime: number;
  servings: number;
  rating: number;
  tags: string[];
  ingredients: string[];
  instructions: string[];
  caloriesPerServing?: number;
  source?: 'builtin' | 'ai' | 'user';
}

export const BUILTIN_RECIPES: Recipe[] = [
  {
    id: 'b1',
    title: 'Basil Pasta Pesto',
    description: 'Fresh green pasta with basil pesto and parmesan.',
    imageUrl: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=800&q=80',
    cuisine: 'italian',
    mealType: 'lunch',
    difficulty: 'easy',
    prepTime: 5,
    cookTime: 10,
    servings: 4,
    rating: 4.9,
    tags: ['vegetarian', 'quick'],
    caloriesPerServing: 460,
    ingredients: ['Pasta', 'Fresh basil', 'Olive oil', 'Pine nuts', 'Parmesan', 'Garlic', 'Salt'],
    instructions: [
      'Boil a large pot of salted water and cook pasta according to package.',
      'Blend basil, olive oil, pine nuts, garlic, and parmesan until smooth.',
      'Toss drained pasta with pesto and an extra splash of pasta water.',
      'Serve with cracked black pepper and shaved parmesan.',
    ],
    source: 'builtin',
  },
  {
    id: 'b2',
    title: 'Garlic Herb Chicken',
    description: 'Pan-seared chicken in butter, rosemary, and thyme.',
    imageUrl: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8dd?auto=format&fit=crop&w=800&q=80',
    cuisine: 'american',
    mealType: 'dinner',
    difficulty: 'medium',
    prepTime: 10,
    cookTime: 20,
    servings: 4,
    rating: 4.8,
    tags: ['protein', 'gluten-free'],
    caloriesPerServing: 380,
    ingredients: ['Chicken breast', 'Garlic', 'Rosemary', 'Thyme', 'Butter', 'Salt', 'Pepper'],
    instructions: [
      'Season chicken breasts with salt and pepper.',
      'Sear in butter on medium-high until golden, about 4 minutes per side.',
      'Add garlic, rosemary, and thyme; baste for 2 minutes.',
      'Rest 5 minutes before slicing.',
    ],
    source: 'builtin',
  },
  {
    id: 'b3',
    title: 'Avocado Toast',
    description: 'Sourdough toast topped with smashed avocado and lemon.',
    imageUrl: 'https://images.unsplash.com/photo-1588167331160-2fc16e5349f9?auto=format&fit=crop&w=800&q=80',
    cuisine: 'american',
    mealType: 'breakfast',
    difficulty: 'easy',
    prepTime: 5,
    cookTime: 3,
    servings: 1,
    rating: 4.5,
    tags: ['vegetarian', 'quick'],
    caloriesPerServing: 290,
    ingredients: ['Bread', 'Avocado', 'Salt', 'Black pepper', 'Lemon juice', 'Chili flakes'],
    instructions: [
      'Toast a slice of sourdough until crisp.',
      'Smash avocado with lemon juice, salt, and pepper.',
      'Spread on toast and top with chili flakes.',
    ],
    source: 'builtin',
  },
  {
    id: 'b4',
    title: 'Tomato Basil Soup',
    description: 'Silky tomato soup finished with cream and basil.',
    imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80',
    cuisine: 'italian',
    mealType: 'lunch',
    difficulty: 'easy',
    prepTime: 10,
    cookTime: 25,
    servings: 4,
    rating: 4.7,
    tags: ['vegetarian', 'comfort'],
    caloriesPerServing: 230,
    ingredients: ['Tomatoes', 'Basil', 'Onion', 'Garlic', 'Cream', 'Olive oil', 'Salt'],
    instructions: [
      'Sauté onion and garlic in olive oil.',
      'Add chopped tomatoes and simmer 20 minutes.',
      'Blend smooth, stir in cream and basil.',
    ],
    source: 'builtin',
  },
  {
    id: 'b5',
    title: 'Egg Fried Rice',
    description: 'Quick weeknight fried rice with scrambled egg.',
    imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80',
    cuisine: 'asian',
    mealType: 'dinner',
    difficulty: 'easy',
    prepTime: 10,
    cookTime: 10,
    servings: 2,
    rating: 4.6,
    tags: ['quick', 'budget'],
    caloriesPerServing: 410,
    ingredients: ['Rice', 'Eggs', 'Soy sauce', 'Green onion', 'Garlic', 'Sesame oil', 'Peas'],
    instructions: [
      'Whisk and scramble eggs, set aside.',
      'Sauté garlic, add cold rice, peas, and soy sauce.',
      'Fold in eggs and finish with green onion + sesame oil.',
    ],
    source: 'builtin',
  },
  {
    id: 'b6',
    title: 'Black Bean Tacos',
    description: 'Smoky black bean tacos with lime crema.',
    imageUrl: 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?auto=format&fit=crop&w=800&q=80',
    cuisine: 'mexican',
    mealType: 'dinner',
    difficulty: 'easy',
    prepTime: 10,
    cookTime: 10,
    servings: 3,
    rating: 4.7,
    tags: ['vegetarian', 'quick'],
    caloriesPerServing: 340,
    ingredients: ['Tortillas', 'Black beans', 'Onion', 'Lime', 'Sour cream', 'Cilantro', 'Cumin'],
    instructions: [
      'Sauté onion with cumin and beans for 5 minutes.',
      'Warm tortillas, fill with beans.',
      'Top with lime crema and cilantro.',
    ],
    source: 'builtin',
  },
];
