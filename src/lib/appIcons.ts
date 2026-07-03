import { IconName } from '../components/ui/Icon';

/**
 * Maps app domain concepts (categories, storage locations, meal types) to
 * semantic Icon names. Ported from the web appIcons helper, which returned
 * bespoke SVG components; here we return stable IconName keys resolved by the
 * Icon component to Ionicons glyphs.
 */

const CATEGORY_ICONS: Record<string, IconName> = {
  Beverages: 'beverages',
  'Bread & Bakery': 'bakery',
  'Breakfast & Cereal': 'cereal',
  'Canned & Jarred': 'canned',
  'Condiments & Sauces': 'condiments',
  'Dairy & Eggs': 'dairy',
  'Deli & Charcuterie': 'deli',
  Frozen: 'frozen',
  Fruits: 'fruits',
  'Grains & Pasta': 'grains',
  Household: 'household',
  'Meat & Seafood': 'seafood',
  'Nuts & Snacks': 'snacks',
  'Personal Care': 'personalcare',
  Produce: 'produce',
  'Spices & Seasonings': 'spices',
  'Sweets & Candy': 'sweets',
  Vegetables: 'vegetables',
  'Winery & Spirits': 'winery',
  Other: 'box',
};

export function getCategoryIcon(category: string): IconName {
  return CATEGORY_ICONS[category] ?? 'box';
}

export function getLocationIcon(name: string): IconName {
  const lower = name.toLowerCase();
  if (lower.includes('freeze')) return 'freezer';
  if (
    lower.includes('fridge') ||
    lower.includes('refriger') ||
    lower.includes('cold') ||
    lower.includes('chiller')
  ) {
    return 'fridge';
  }
  if (
    lower.includes('pantry') ||
    lower.includes('shelf') ||
    lower.includes('cabinet') ||
    lower.includes('cupboard') ||
    lower.includes('larder')
  ) {
    return 'shelf';
  }
  if (lower.includes('cellar') || lower.includes('wine')) return 'wine';
  if (lower.includes('house') || lower.includes('home')) return 'household';
  return 'location';
}

export function getMealTypeIcon(mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'): IconName {
  if (mealType === 'breakfast') return 'sunny';
  if (mealType === 'lunch') return 'sunny';
  if (mealType === 'dinner') return 'moon';
  return 'sparkles';
}
