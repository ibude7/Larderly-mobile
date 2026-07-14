import { IconName } from '../components/ui/Icon';

/**
 * Maps app domain concepts (categories, storage locations, meal types) to
 * semantic Icon names. Ported from the web appIcons helper, which returned
 * bespoke SVG components; here we return stable IconName keys resolved by the
 * Icon component to Hugeicons glyphs.
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

const LOCATION_ICON_ALIASES: Record<string, IconName> = {
  warehouse: 'warehouse',
  thermometer: 'fridge',
  fridge: 'fridge',
  snowflake: 'freezer',
  freezer: 'freezer',
  'layout-grid': 'grid',
  grid: 'grid',
  shelf: 'shelf',
  package: 'shelf',
  location: 'location',
  more: 'more',
  ellipsis: 'more',
};

export function getLocationIcon(name: string): IconName {
  const lower = name.toLowerCase();
  if (lower === 'other') return 'more';
  if (lower.includes('freeze')) return 'freezer';
  if (
    lower.includes('fridge') ||
    lower.includes('refriger') ||
    lower.includes('cold') ||
    lower.includes('chiller')
  ) {
    return 'fridge';
  }
  if (lower.includes('pantry') || lower.includes('larder')) return 'warehouse';
  if (lower.includes('cabinet') || lower.includes('cupboard')) return 'grid';
  if (lower.includes('shelf')) return 'shelf';
  if (lower.includes('cellar') || lower.includes('wine')) return 'wine';
  if (
    lower.includes('house') ||
    lower.includes('home') ||
    lower.includes('bath') ||
    lower.includes('clean')
  ) {
    return 'household';
  }
  return 'location';
}

export function resolveStorageLocationIcon(location: {
  name: string;
  icon?: string;
}): IconName {
  const key = location.icon?.trim().toLowerCase();
  if (key && key in LOCATION_ICON_ALIASES) return LOCATION_ICON_ALIASES[key];
  return getLocationIcon(location.name);
}

export function getMealTypeIcon(mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'): IconName {
  if (mealType === 'breakfast') return 'sunny';
  if (mealType === 'lunch') return 'sunny';
  if (mealType === 'dinner') return 'moon';
  return 'sparkles';
}
