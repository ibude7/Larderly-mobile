import { doc, getDoc, setDoc } from '@react-native-firebase/firestore';
import { db } from './firebase';
import { PantryItem, StorageLocation } from '../types';

/**
 * Barcode → product lookup and inference helpers.
 *
 * Ported verbatim from the web BarcodeScanner's business logic. Only the
 * Firestore import changed (@react-native-firebase/firestore). The camera
 * pipeline lives in the screen; this module is pure data/network logic.
 */

export interface ScannedProduct {
  barcode: string;
  name: string;
  brand: string;
  image_url: string;
  category: string;
  nutrition_data: Record<string, unknown>;
  unit: string;
  quantity_text: string;
  labels_text: string;
  description: string;
  allergens?: string[];
  traces?: string[];
  nutri_score?: string;
  dietary?: string[];
}

export function inferUnit(
  category: string,
  packaging?: string,
  quantity?: string,
  productName?: string,
): string {
  if (packaging) {
    const pkg = packaging.toLowerCase();
    if (pkg.includes('bottle')) return 'bottle';
    if (pkg.includes('can') || pkg.includes('tin')) return 'can';
    if (pkg.includes('jar')) return 'jar';
    if (pkg.includes('bag') || pkg.includes('pouch') || pkg.includes('sachet')) return 'bag';
    if (pkg.includes('box') || pkg.includes('carton')) return 'box';
    if (pkg.includes('tube')) return 'tube';
    if (pkg.includes('pack') || pkg.includes('blister') || pkg.includes('tray')) return 'pack';
  }
  if (quantity) {
    const q = quantity.toLowerCase();
    if (/\d+\s*ml\b/.test(q)) return 'mL';
    if (/\d+\s*(l|litre|liter)\b/.test(q)) return 'L';
    if (/\d+\s*kg\b/.test(q)) return 'kg';
    if (/\d+\s*g\b/.test(q)) return 'g';
    if (/\d+\s*oz\b/.test(q)) return 'oz';
    if (/\d+\s*lb\b/.test(q)) return 'lb';
    if (/\d+\s*(tablet|capsule|lozenge|piece|count|pod|sheet|wipe|bar|sachet|softgel)s?\b/.test(q))
      return 'box';
  }
  if (productName) {
    const n = productName.toLowerCase();
    if (/\bbottle\b/.test(n)) return 'bottle';
    if (/\bcan\b/.test(n)) return 'can';
    if (/\bjar\b/.test(n)) return 'jar';
    if (/\bbox\b/.test(n)) return 'box';
    if (/\btube\b/.test(n)) return 'tube';
    if (/\bpack\b|\bpkt\b|\bpacket\b|\bmultipack\b/.test(n)) return 'pack';
    if (/\bbag\b|\bpouch\b/.test(n)) return 'bag';
    if (/tablet|capsule|lozenge|softgel|caplet|chewable|gummies|gummy|pod|sachet|wipe/.test(n))
      return 'box';
  }
  const cat = category.toLowerCase();
  if (cat.includes('beverage') || cat.includes('spirit') || cat.includes('winery')) return 'bottle';
  if (cat.includes('canned') || cat.includes('jarred')) return 'can';
  if (cat.includes('condiment') || cat.includes('sauce')) return 'bottle';
  if (cat.includes('spice') || cat.includes('season')) return 'jar';
  if (cat.includes('cereal') || cat.includes('breakfast')) return 'box';
  if (cat.includes('bread') || cat.includes('bakery')) return 'pack';
  if (cat.includes('grain') || cat.includes('pasta')) return 'pack';
  if (cat.includes('frozen')) return 'pack';
  if (cat.includes('snack') || cat.includes('nut')) return 'bag';
  if (cat.includes('sweet') || cat.includes('candy')) return 'pack';
  if (cat.includes('personal care')) return 'box';
  if (cat.includes('household')) return 'bottle';
  if (cat.includes('meat') || cat.includes('seafood')) return 'pack';
  if (cat.includes('dairy')) return 'item';
  return 'item';
}

export function inferStorageLocation(category: string, locations: StorageLocation[]): string | null {
  if (!locations.length) return null;
  const cat = category.toLowerCase();
  const score = (loc: StorageLocation) => {
    const name = loc.name.toLowerCase();
    if (cat.includes('frozen') && /freez/i.test(name)) return 10;
    if (
      ['dairy', 'egg', 'meat', 'seafood', 'deli', 'charcuterie', 'beverage', 'produce', 'fruit', 'vegetable'].some(
        (k) => cat.includes(k),
      ) &&
      /fridge|refrigerator|chiller|cold/i.test(name)
    )
      return 10;
    if (/pantry|shelf|cabinet|cupboard|larder|storage/i.test(name)) return 5;
    return 0;
  };
  const best = locations.map((l) => ({ l, s: score(l) })).sort((a, b) => b.s - a.s)[0];
  return best.s > 0 ? best.l.id : locations[0].id;
}

export function mapOffCategory(categories: string, pnns1 = '', pnns2 = ''): string {
  const p1 = pnns1.toLowerCase();
  const p2 = pnns2.toLowerCase();

  if (
    p1 === 'beverages' ||
    p1.includes('beverage') ||
    p2.includes('beverage') ||
    p2.includes('juice') ||
    p2.includes('soda') ||
    p2.includes('drink')
  )
    return 'Beverages';
  if (
    p1.includes('dairy') ||
    p2.includes('dairy') ||
    p2.includes('milk') ||
    p2.includes('cheese') ||
    p2.includes('yogurt')
  )
    return 'Dairy & Eggs';
  if (
    p1 === 'sugary snacks' ||
    p2.includes('chocolate') ||
    p2.includes('candy') ||
    p2.includes('sweet') ||
    p2.includes('biscuit') ||
    p2.includes('cookie')
  )
    return 'Sweets & Candy';
  if (p1 === 'salty snacks' || p2.includes('chip') || p2.includes('cracker') || p2.includes('popcorn'))
    return 'Nuts & Snacks';
  if (p1 === 'cereals and potatoes') {
    if (p2.includes('bread') || p2.includes('bakery') || p2.includes('pastry')) return 'Bread & Bakery';
    if (p2.includes('breakfast') || p2.includes('cereal') || p2.includes('muesli') || p2.includes('oat'))
      return 'Breakfast & Cereal';
    if (p2.includes('pasta') || p2.includes('noodle')) return 'Grains & Pasta';
    return 'Grains & Pasta';
  }
  if (
    p1.includes('meat') ||
    p1.includes('egg') ||
    p1.includes('legume') ||
    p2.includes('fish') ||
    p2.includes('seafood') ||
    p2.includes('poultry') ||
    p2.includes('beef') ||
    p2.includes('pork')
  ) {
    if (p2.includes('egg')) return 'Dairy & Eggs';
    return 'Meat & Seafood';
  }
  if (p1 === 'fruits and vegetables') {
    if (p2.includes('vegetable') || p2.includes('veggie')) return 'Vegetables';
    return 'Fruits';
  }
  if (
    p1 === 'fat and sauces' ||
    p2.includes('sauce') ||
    p2.includes('condiment') ||
    p2.includes('dressing') ||
    p2.includes('oil')
  )
    return 'Condiments & Sauces';

  const lower = categories.toLowerCase();
  if (
    lower.includes('beverage') ||
    lower.includes('drink') ||
    lower.includes('juice') ||
    lower.includes('water') ||
    lower.includes('soda') ||
    lower.includes('cola')
  )
    return 'Beverages';
  if (lower.includes('bread') || lower.includes('bakery') || lower.includes('pastry') || lower.includes('loaf'))
    return 'Bread & Bakery';
  if (
    lower.includes('cereal') ||
    lower.includes('breakfast') ||
    lower.includes('muesli') ||
    lower.includes('granola') ||
    lower.includes('porridge')
  )
    return 'Breakfast & Cereal';
  if (lower.includes('canned') || lower.includes('tinned') || lower.includes('preserve') || lower.includes('conserv'))
    return 'Canned & Jarred';
  if (
    lower.includes('sauce') ||
    lower.includes('condiment') ||
    lower.includes('dressing') ||
    lower.includes('ketchup') ||
    lower.includes('mustard') ||
    lower.includes('vinegar')
  )
    return 'Condiments & Sauces';
  if (
    lower.includes('dairy') ||
    lower.includes('milk') ||
    lower.includes('cheese') ||
    lower.includes('yogurt') ||
    lower.includes('yoghurt') ||
    lower.includes('butter') ||
    lower.includes('cream') ||
    lower.includes('egg')
  )
    return 'Dairy & Eggs';
  if (lower.includes('frozen')) return 'Frozen';
  if (lower.includes('fruit') && !lower.includes('vegetable')) return 'Fruits';
  if (
    lower.includes('pasta') ||
    lower.includes('noodle') ||
    lower.includes('grain') ||
    lower.includes('rice') ||
    lower.includes('flour') ||
    lower.includes('wheat')
  )
    return 'Grains & Pasta';
  if (
    lower.includes('meat') ||
    lower.includes('seafood') ||
    lower.includes('fish') ||
    lower.includes('chicken') ||
    lower.includes('beef') ||
    lower.includes('pork') ||
    lower.includes('lamb') ||
    lower.includes('turkey')
  )
    return 'Meat & Seafood';
  if (
    lower.includes('snack') ||
    lower.includes('chip') ||
    lower.includes('nut') ||
    lower.includes('popcorn') ||
    lower.includes('cracker') ||
    lower.includes('pretzel')
  )
    return 'Nuts & Snacks';
  if (
    lower.includes('spice') ||
    lower.includes('seasoning') ||
    lower.includes('herb') ||
    lower.includes('pepper') ||
    lower.includes('cumin') ||
    lower.includes('paprika')
  )
    return 'Spices & Seasonings';
  if (
    lower.includes('sweet') ||
    lower.includes('candy') ||
    lower.includes('chocolate') ||
    lower.includes('biscuit') ||
    lower.includes('cookie') ||
    lower.includes('confection') ||
    lower.includes('dessert')
  )
    return 'Sweets & Candy';
  if (lower.includes('vegetable') || lower.includes('veggie')) return 'Vegetables';
  if (
    lower.includes('wine') ||
    lower.includes('beer') ||
    lower.includes('spirit') ||
    lower.includes('alcohol') ||
    lower.includes('whisky') ||
    lower.includes('vodka') ||
    lower.includes('rum') ||
    lower.includes('liquor')
  )
    return 'Winery & Spirits';
  if (
    lower.includes('supplement') ||
    lower.includes('vitamin') ||
    lower.includes('medicine') ||
    lower.includes('health') ||
    lower.includes('pharma') ||
    lower.includes('remedy') ||
    lower.includes('lozenge') ||
    lower.includes('tablet') ||
    lower.includes('capsule') ||
    lower.includes('cosmetic') ||
    lower.includes('hygiene') ||
    lower.includes('soap') ||
    lower.includes('shampoo') ||
    lower.includes('toothpaste') ||
    lower.includes('skincare') ||
    lower.includes('body care')
  )
    return 'Personal Care';
  if (
    lower.includes('cleaning') ||
    lower.includes('detergent') ||
    lower.includes('household') ||
    lower.includes('laundry') ||
    lower.includes('dish')
  )
    return 'Household';
  return 'Other';
}

export function findMatchingPantryItem(
  items: PantryItem[],
  barcode: string,
  product?: ScannedProduct | null,
): PantryItem | undefined {
  const directBarcodeMatch = items.find((item) => item.barcode && item.barcode === barcode);
  if (directBarcodeMatch) return directBarcodeMatch;

  if (!product) return undefined;

  const normalizedName = product.name.trim().toLowerCase();
  const normalizedBrand = product.brand.trim().toLowerCase();

  return items.find((item) => {
    if (product.barcode && item.barcode === product.barcode) return true;
    const nameMatches = item.name.trim().toLowerCase() === normalizedName;
    if (!nameMatches) return false;
    if (!normalizedBrand) return true;
    return !item.brand || item.brand.trim().toLowerCase() === normalizedBrand;
  });
}

export function inferCategoryFromName(name: string): string | null {
  const lower = name.toLowerCase();
  if (/lozenge|cough drop|throat|cold\s*&?\s*flu|antacid|pain relief|aspirin|ibuprofen|supplement|vitamin|probiotic|medicin|remedy|bandage|first aid/.test(lower))
    return 'Personal Care';
  if (/soap|shampoo|conditioner|body wash|toothpaste|deodorant|lotion|sunscreen|moisturiz|cosmetic|lipstick|mascara/.test(lower))
    return 'Personal Care';
  if (/detergent|bleach|disinfect|sponge|trash bag|paper towel|cleaner|wipe/.test(lower)) return 'Household';
  if (/juice|soda|cola|water|tea\b|coffee|drink|kombucha|smoothie|lemonade/.test(lower)) return 'Beverages';
  if (/milk|cheese|yogurt|yoghurt|butter|cream cheese|sour cream|egg/.test(lower)) return 'Dairy & Eggs';
  if (/bread|bagel|baguette|croissant|muffin|roll|bun|tortilla|pita/.test(lower)) return 'Bread & Bakery';
  if (/chip|pretzel|popcorn|cracker|nut|almond|cashew|pistachio|peanut|trail mix/.test(lower)) return 'Nuts & Snacks';
  if (/chocolate|candy|gummy|cookie|biscuit|cake|pastry|ice cream|brownie/.test(lower)) return 'Sweets & Candy';
  if (/pasta|spaghetti|noodle|rice|quinoa|couscous|flour|oat/.test(lower)) return 'Grains & Pasta';
  if (/chicken|beef|pork|lamb|turkey|salmon|tuna|shrimp|steak|sausage|bacon|ham/.test(lower)) return 'Meat & Seafood';
  if (/ketchup|mustard|mayo|sauce|dressing|vinegar|salsa|relish/.test(lower)) return 'Condiments & Sauces';
  if (/cereal|granola|muesli|oatmeal|porridge/.test(lower)) return 'Breakfast & Cereal';
  if (/wine|beer|vodka|whisky|rum|gin|tequila|champagne|cider/.test(lower)) return 'Winery & Spirits';
  return null;
}

export async function lookupBarcode(barcode: string): Promise<ScannedProduct | null> {
  // Firestore cache first (shared products/{barcode} collection).
  try {
    const cachedSnap = await getDoc(doc(db, 'products', barcode));
    if (cachedSnap.exists()) {
      const cached = cachedSnap.data() as {
        barcode: string;
        name: string;
        brand: string;
        image_url: string;
        category: string;
        nutrition_data: Record<string, unknown>;
        quantity_text?: string;
        description?: string;
        labels_text?: string;
        allergens?: string[] | null;
        traces?: string[] | null;
        nutri_score?: string | null;
        dietary?: string[] | null;
      };
      if (cached.brand && cached.category !== 'Other') {
        return {
          barcode: cached.barcode,
          name: cached.name,
          brand: cached.brand,
          image_url: cached.image_url,
          category: cached.category,
          nutrition_data: cached.nutrition_data,
          unit: inferUnit(cached.category, undefined, cached.quantity_text, cached.name),
          quantity_text: cached.quantity_text ?? '',
          labels_text: cached.labels_text ?? '',
          description: cached.description ?? '',
          allergens: cached.allergens ?? undefined,
          traces: cached.traces ?? undefined,
          nutri_score: cached.nutri_score ?? undefined,
          dietary: cached.dietary ?? undefined,
        };
      }
    }
  } catch {
    // Cache miss or transient error — fall through to OFF.
  }

  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const json = await res.json();
    if (json.status !== 1 || !json.product) return null;

    const p = json.product;
    const productName = p.product_name || p.product_name_en || '';
    let category = mapOffCategory(p.categories || '', p.pnns_groups_1 || '', p.pnns_groups_2 || '');
    if (category === 'Other') {
      category = inferCategoryFromName(productName) ?? 'Other';
    }
    let brand = (p.brands || '').split(',')[0].trim();
    if (!brand) brand = (p.brand_owner || '').split(',')[0].trim();
    if (!brand && productName) {
      const firstWord = productName.split(/\s+/)[0];
      if (
        firstWord &&
        firstWord.length > 1 &&
        firstWord[0] === firstWord[0].toUpperCase() &&
        firstWord !== firstWord.toUpperCase()
      ) {
        brand = firstWord;
      }
    }
    const rawLabels: string = p.labels || '';
    const labels_text = rawLabels
      .split(',')
      .map((l: string) => l.trim())
      .filter(Boolean)
      .join(', ');

    const rawAllergens: string = p.allergens || '';
    const allergens = rawAllergens
      .split(',')
      .map((a: string) => a.replace(/^en:/, '').replace(/-/g, ' ').trim())
      .filter(Boolean)
      .slice(0, 6);

    const rawTraces: string = p.traces || '';
    const traces = rawTraces
      .split(',')
      .map((t: string) => t.replace(/^en:/, '').replace(/-/g, ' ').trim())
      .filter(Boolean)
      .slice(0, 6);

    const ns = typeof p.nutriscore_grade === 'string' ? p.nutriscore_grade.toLowerCase() : '';
    const nutri_score = /^[a-e]$/.test(ns) ? ns : undefined;

    const analysisTags: string[] = Array.isArray(p.ingredients_analysis_tags)
      ? p.ingredients_analysis_tags
      : [];
    const dietary: string[] = [];
    for (const tag of analysisTags) {
      const t = tag.replace(/^en:/, '');
      if (t === 'vegan') dietary.push('vegan');
      else if (t === 'vegetarian') dietary.push('vegetarian');
      else if (t === 'palm-oil-free') dietary.push('palm oil free');
    }

    const product: ScannedProduct = {
      barcode,
      name: productName,
      brand,
      image_url: p.image_front_url || p.image_url || '',
      category,
      nutrition_data: p.nutriments || {},
      unit: inferUnit(category, p.packaging || '', p.quantity || '', productName),
      quantity_text: p.quantity || '',
      labels_text,
      description: p.generic_name_en || p.generic_name || '',
      allergens: allergens.length > 0 ? allergens : undefined,
      traces: traces.length > 0 ? traces : undefined,
      nutri_score,
      dietary: dietary.length > 0 ? dietary : undefined,
    };

    if (!product.name) return null;

    try {
      await setDoc(
        doc(db, 'products', product.barcode),
        {
          barcode: product.barcode,
          name: product.name,
          brand: product.brand,
          image_url: product.image_url,
          category: product.category,
          nutrition_data: product.nutrition_data,
          quantity_text: product.quantity_text || '',
          description: product.description || '',
          labels_text: product.labels_text || '',
          allergens: product.allergens ?? null,
          traces: product.traces ?? null,
          nutri_score: product.nutri_score ?? null,
          dietary: product.dietary ?? null,
        },
        { merge: true },
      );
    } catch {
      // Cache write failure is non-fatal.
    }

    return product;
  } catch {
    return null;
  }
}
