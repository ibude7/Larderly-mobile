// Canonical food categories with emoji glyphs (ported from larde).

export interface FoodCategory {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export const FOOD_CATEGORIES: FoodCategory[] = [
  { id: 'produce', name: 'Produce', emoji: '🥦', color: '#22c55e' },
  { id: 'dairy', name: 'Dairy', emoji: '🥛', color: '#60a5fa' },
  { id: 'meat', name: 'Meat & Seafood', emoji: '🥩', color: '#ef4444' },
  { id: 'bakery', name: 'Bakery', emoji: '🥖', color: '#f59e0b' },
  { id: 'beverages', name: 'Beverages', emoji: '🥤', color: '#06b6d4' },
  { id: 'snacks', name: 'Snacks', emoji: '🥨', color: '#f97316' },
  { id: 'pantry', name: 'Pantry', emoji: '🥫', color: '#a855f7' },
  { id: 'frozen', name: 'Frozen', emoji: '❄️', color: '#0ea5e9' },
  { id: 'condiments', name: 'Condiments', emoji: '🧂', color: '#eab308' },
  { id: 'breakfast', name: 'Breakfast', emoji: '🥞', color: '#fb923c' },
  { id: 'spices', name: 'Spices', emoji: '🌶️', color: '#dc2626' },
  { id: 'household', name: 'Household', emoji: '🧴', color: '#64748b' },
  { id: 'other', name: 'Other', emoji: '📦', color: '#9ca3af' },
];

export function categoryFromName(name: string | undefined): FoodCategory {
  if (!name) return FOOD_CATEGORIES[FOOD_CATEGORIES.length - 1];
  const lower = name.toLowerCase();
  const exact = FOOD_CATEGORIES.find((c) => c.id === lower || c.name.toLowerCase() === lower);
  if (exact) return exact;
  if (/(milk|cheese|yogurt|butter|cream)/i.test(lower)) return FOOD_CATEGORIES.find((c) => c.id === 'dairy')!;
  if (/(beef|chicken|pork|fish|salmon|shrimp|turkey|sausage)/i.test(lower)) return FOOD_CATEGORIES.find((c) => c.id === 'meat')!;
  if (/(bread|loaf|bagel|baguette|roll|croissant|muffin)/i.test(lower)) return FOOD_CATEGORIES.find((c) => c.id === 'bakery')!;
  if (/(juice|soda|water|tea|coffee|cola|beer|wine)/i.test(lower)) return FOOD_CATEGORIES.find((c) => c.id === 'beverages')!;
  if (/(chip|cookie|cracker|crisp|nut|popcorn|candy|chocolate|bar)/i.test(lower)) return FOOD_CATEGORIES.find((c) => c.id === 'snacks')!;
  if (/(apple|banana|tomato|lettuce|onion|pepper|carrot|potato|fruit|veg)/i.test(lower)) return FOOD_CATEGORIES.find((c) => c.id === 'produce')!;
  if (/(rice|pasta|flour|sugar|oil|sauce|bean|can)/i.test(lower)) return FOOD_CATEGORIES.find((c) => c.id === 'pantry')!;
  if (/(frozen|ice cream|pizza)/i.test(lower)) return FOOD_CATEGORIES.find((c) => c.id === 'frozen')!;
  if (/(salt|pepper|cumin|paprika|herb|spice|cinnamon)/i.test(lower)) return FOOD_CATEGORIES.find((c) => c.id === 'spices')!;
  if (/(cereal|oat|granola|pancake)/i.test(lower)) return FOOD_CATEGORIES.find((c) => c.id === 'breakfast')!;
  if (/(ketchup|mustard|mayo|hot sauce|dressing|honey)/i.test(lower)) return FOOD_CATEGORIES.find((c) => c.id === 'condiments')!;
  return FOOD_CATEGORIES.find((c) => c.id === 'other')!;
}
