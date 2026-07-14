import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc } from '@react-native-firebase/firestore';
import { db } from './firebase';
import { sanitizeString } from './sanitize';

export interface ProductData {
  source?: 'cache' | 'external';
  name: string;
  brand: string;
  category: string;
  imageUrl: string | null;
  pricePerUnit: number | null;
  unit: string;
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
  ingredients: string;
  barcode?: string;
}

const CACHE_KEY = 'larderly:productCache';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
const CACHE_MAX = 500;

interface CacheEntry {
  data: ProductData;
  at: number;
}

async function readCache(): Promise<Record<string, CacheEntry>> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function writeCache(barcode: string, data: ProductData) {
  try {
    const cache = await readCache();
    cache[barcode] = { data, at: Date.now() };
    const entries = Object.entries(cache).sort((a, b) => a[1].at - b[1].at);
    const trimmed = Object.fromEntries(entries.slice(-CACHE_MAX));
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
  } catch {
    // storage full
  }
}

function parseUnit(qty: string): string {
  if (!qty) return 'ea';
  const m = qty.match(/[a-zA-Z]+/);
  return m ? m[0].toLowerCase() : 'ea';
}

export async function searchProductByBarcode(barcode: string): Promise<ProductData> {
  // Demo barcodes resolve immediately without waiting on network.
  const MOCKS: Record<string, ProductData> = {
    '5901234123457': {
      name: 'Organic Whole Milk',
      brand: 'Farm Fresh',
      category: 'dairy',
      imageUrl: null,
      pricePerUnit: 1.49,
      unit: 'L',
      calories: 61,
      protein: 3.2,
      fat: 3.5,
      carbs: 4.8,
      ingredients: 'Whole milk',
      barcode,
    },
    '1234567890128': {
      name: 'Choco Crunch Cereal',
      brand: 'Morning Starts',
      category: 'breakfast',
      imageUrl: null,
      pricePerUnit: 4.99,
      unit: 'g',
      calories: 385,
      protein: 7.5,
      fat: 4.2,
      carbs: 76,
      ingredients: 'Whole grain wheat, sugar, cocoa powder, salt',
      barcode,
    },
  };
  if (MOCKS[barcode]) return MOCKS[barcode];

  try {
    const productSnap = await getDoc(doc(db, 'products', barcode));
    if (productSnap.exists()) {
      const data = productSnap.data() ?? {};
      const name = sanitizeString(data.name, 200);
      if (name) {
        return {
          source: 'cache',
          name,
          brand: sanitizeString(data.brand, 200),
          category: sanitizeString(data.category, 200) || 'other',
          imageUrl: sanitizeString(data.image_url ?? data.imageUrl, 500) || null,
          pricePerUnit: typeof data.pricePerUnit === 'number' ? data.pricePerUnit : null,
          unit: sanitizeString(data.unit, 24) || 'ea',
          calories: null,
          protein: null,
          fat: null,
          carbs: null,
          ingredients: sanitizeString(data.description, 500),
          barcode,
        };
      }
    }
  } catch {
    // Firestore cache errors should not block external lookup.
  }

  const cache = await readCache();
  const hit = cache[barcode];
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.data;

  const OFF_FIELDS =
    'product_name,product_name_en,brands,categories_tags,image_url,image_front_url,nutriments,ingredients_text,ingredients_text_en,quantity';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}?fields=${OFF_FIELDS}`,
      { signal: controller.signal },
    );
    clearTimeout(timeout);
    if (res.ok) {
      const json = await res.json();
      if (json.status === 1) {
        const p = json.product;
        const n = p.nutriments ?? {};
        const result: ProductData = {
          source: 'external',
          name: p.product_name_en || p.product_name || 'Unknown Product',
          brand: p.brands?.split(',')[0]?.trim() ?? '',
          category: p.categories_tags?.[0]?.replace('en:', '').replace(/-/g, ' ') ?? 'other',
          imageUrl: p.image_url || p.image_front_url || null,
          pricePerUnit: null,
          unit: parseUnit(p.quantity ?? ''),
          calories: n['energy-kcal_100g'] ?? n['energy-kcal'] ?? null,
          protein: n['proteins_100g'] ?? null,
          fat: n['fat_100g'] ?? null,
          carbs: n['carbohydrates_100g'] ?? null,
          ingredients: p.ingredients_text_en || p.ingredients_text || '',
          barcode,
        };
        await writeCache(barcode, result);
        await setDoc(
          doc(db, 'products', barcode),
          {
            barcode,
            name: result.name,
            brand: result.brand,
            category: result.category,
            image_url: result.imageUrl ?? '',
            unit: result.unit,
            description: result.ingredients,
          },
          { merge: true },
        ).catch(() => {});
        return result;
      }
    }
  } catch (err) {
    console.warn('[Larderly] OFF lookup failed', err);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const json = await res.json();
      if (json.code === 'OK' && json.items?.length) {
        const item = json.items[0];
        const result: ProductData = {
          source: 'external',
          name: item.title || 'Unknown Product',
          brand: item.brand || '',
          category: item.category || 'other',
          imageUrl: item.images?.[0] ?? null,
          pricePerUnit: item.lowest_recorded_price ?? null,
          unit: 'ea',
          calories: null,
          protein: null,
          fat: null,
          carbs: null,
          ingredients: '',
          barcode,
        };
        await writeCache(barcode, result);
        await setDoc(
          doc(db, 'products', barcode),
          {
            barcode,
            name: result.name,
            brand: result.brand,
            category: result.category,
            image_url: result.imageUrl ?? '',
            unit: result.unit,
            description: result.ingredients,
          },
          { merge: true },
        ).catch(() => {});
        return result;
      }
    }
  } catch {
    // ignore
  }

  return {
    name: 'Unknown Product',
    brand: '',
    category: 'other',
    imageUrl: null,
    pricePerUnit: null,
    unit: 'ea',
    calories: null,
    protein: null,
    fat: null,
    carbs: null,
    ingredients: '',
    barcode,
  };
}
