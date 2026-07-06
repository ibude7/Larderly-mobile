export type View = 'dashboard' | 'pantry' | 'scanner' | 'shopping' | 'meals' | 'settings';

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

export interface StorageLocation {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  created_at: string;
}

export interface Product {
  id: string;
  barcode: string | null;
  name: string;
  brand: string;
  image_url: string;
  category: string;
  nutrition_data: Record<string, unknown>;
  created_at: string;
}

export interface PantryItem {
  id: string;
  user_id: string;
  product_id: string | null;
  location_id: string | null;
  name: string;
  brand: string;
  image_url: string;
  category: string;
  barcode: string;
  quantity: number;
  unit: string;
  expiry_date: string | null;
  low_stock_threshold: number;
  purchase_price: number | null;
  priceHistory?: Array<{ price: number; recordedAt: string }>;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ShoppingListItem {
  id: string;
  user_id: string;
  pantry_item_id: string | null;
  name: string;
  brand: string;
  category: string;
  quantity: number;
  unit: string;
  is_checked: boolean;
  is_auto_generated: boolean;
  notes: string;
  created_at: string;
  estimatedPrice?: number;
  barcode?: string;
  store?: string;
}

export interface MealPlan {
  id: string;
  user_id: string;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  ingredients: MealIngredient[];
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface MealIngredient {
  name: string;
  pantry_item_id?: string;
  quantity: number;
  unit: string;
}

export interface OpenFoodFactsProduct {
  product_name: string;
  brands: string;
  image_url: string;
  image_front_url: string;
  categories: string;
  nutriments: Record<string, unknown>;
}

export const CATEGORIES = [
  'All',
  'Beverages',
  'Bread & Bakery',
  'Breakfast & Cereal',
  'Canned & Jarred',
  'Condiments & Sauces',
  'Dairy & Eggs',
  'Deli & Charcuterie',
  'Frozen',
  'Fruits',
  'Grains & Pasta',
  'Household',
  'Meat & Seafood',
  'Nuts & Snacks',
  'Personal Care',
  'Produce',
  'Spices & Seasonings',
  'Sweets & Candy',
  'Vegetables',
  'Winery & Spirits',
  'Other',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const UNITS = [
  'item',
  'pack',
  'box',
  'bag',
  'can',
  'bottle',
  'jar',
  'tube',
  'piece',
  'kg',
  'g',
  'lb',
  'oz',
  'L',
  'mL',
  'cup',
  'tbsp',
  'tsp',
] as const;

export type Unit = (typeof UNITS)[number];
