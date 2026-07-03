// Smart insights engine (ported from larde, adapted for Larderly pantry data).

import { FOOD_CATEGORIES, categoryFromName } from './foodCategories';

export interface InventoryItem {
  id: string;
  name: string;
  category?: string;
  quantity: number;
  unit?: string;
  pricePerUnit?: number;
  expirationDate?: number;
  createdAt?: { toMillis?: () => number };
}

export interface ActivityEvent {
  verb: string;
  target: string;
  actorId?: string;
  actorName?: string;
  createdAt?: { toMillis?: () => number };
}

export type SmartSuggestionKind =
  | 'predictive'
  | 'bundle'
  | 'price'
  | 'seasonal'
  | 'waste'
  | 'balance'
  | 'eco'
  | 'prep';

export interface SmartSuggestion {
  id: string;
  kind: SmartSuggestionKind;
  title: string;
  body: string;
  severity?: 'info' | 'warn' | 'good';
  itemName?: string;
}

const MS_DAY = 86_400_000;

export function purchaseFrequency(activity: ActivityEvent[], itemName: string): number | null {
  const needle = itemName.toLowerCase();
  const dates = activity
    .filter((a) => a.verb === 'item.added' && a.target?.toLowerCase().includes(needle))
    .map((a) => a.createdAt?.toMillis?.() ?? 0)
    .filter((ts) => ts > 0)
    .sort((a, b) => a - b);
  if (dates.length < 2) return null;
  const gaps: number[] = [];
  for (let i = 1; i < dates.length; i++) gaps.push(dates[i] - dates[i - 1]);
  const avgMs = gaps.reduce((s, g) => s + g, 0) / gaps.length;
  return Math.max(1, Math.round(avgMs / MS_DAY));
}

export function predictiveSuggestions(
  activity: ActivityEvent[],
  inventory: InventoryItem[],
): SmartSuggestion[] {
  const counts = new Map<string, number>();
  activity.filter((a) => a.verb === 'item.added').forEach((a) => {
    const key = a.target?.toLowerCase().trim();
    if (!key) return;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  const out: SmartSuggestion[] = [];
  const now = Date.now();
  for (const [name, n] of top) {
    if (n < 2) continue;
    const cadence = purchaseFrequency(activity, name);
    if (!cadence) continue;
    const lastAddTs = activity
      .filter((a) => a.verb === 'item.added' && a.target?.toLowerCase().includes(name))
      .map((a) => a.createdAt?.toMillis?.() ?? 0)
      .reduce((m, x) => Math.max(m, x), 0);
    if (lastAddTs === 0) continue;
    const due = lastAddTs + cadence * MS_DAY;
    const daysFromNow = Math.round((due - now) / MS_DAY);
    const inStock = inventory.find((i) => i.name.toLowerCase().includes(name));
    if (inStock && (inStock.quantity ?? 0) >= 2) continue;
    if (daysFromNow > 7) continue;
    const pretty = name.replace(/\b\w/g, (c) => c.toUpperCase());
    out.push({
      id: `pred-${name}`,
      kind: 'predictive',
      title: `Time to restock ${pretty}`,
      body:
        daysFromNow <= 0
          ? `You usually buy ${pretty} every ${cadence} days, so you're already overdue.`
          : `You usually buy ${pretty} every ${cadence} days. Next suggested purchase: ${daysFromNow} day${daysFromNow === 1 ? '' : 's'}.`,
      itemName: pretty,
      severity: daysFromNow <= 0 ? 'warn' : 'info',
    });
  }
  return out.slice(0, 3);
}

const BUNDLES: Record<string, string[]> = {
  chicken: ['Garlic', 'Rosemary', 'Lemon', 'Spinach', 'Rice'],
  beef: ['Onion', 'Bell pepper', 'Mushroom', 'Garlic', 'Potato'],
  pork: ['Apple', 'Onion', 'Cabbage', 'Garlic'],
  salmon: ['Lemon', 'Asparagus', 'Garlic', 'Dill'],
  pasta: ['Tomato', 'Garlic', 'Parmesan', 'Olive oil', 'Basil'],
  taco: ['Lime', 'Cilantro', 'Avocado', 'Tomato', 'Sour cream'],
  rice: ['Soy sauce', 'Egg', 'Green onion', 'Sesame oil'],
};

export function bundleSuggestions(items: { productName: string }[]): SmartSuggestion[] {
  if (items.length === 0) return [];
  const out: SmartSuggestion[] = [];
  for (const item of items) {
    const lower = item.productName.toLowerCase();
    for (const [key, pairs] of Object.entries(BUNDLES)) {
      if (lower.includes(key)) {
        const missing = pairs.filter(
          (p) => !items.some((i) => i.productName.toLowerCase().includes(p.toLowerCase())),
        );
        if (missing.length === 0) continue;
        out.push({
          id: `bundle-${key}`,
          kind: 'bundle',
          title: `Pairs well with ${item.productName}`,
          body: `Consider adding: ${missing.slice(0, 4).join(', ')}.`,
          severity: 'info',
        });
        break;
      }
    }
  }
  return out.slice(0, 2);
}

export function wasteSuggestions(activity: ActivityEvent[], inventory: InventoryItem[]): SmartSuggestion[] {
  const expiredCounts = new Map<string, number>();
  const now = Date.now();
  inventory.forEach((i) => {
    if (i.expirationDate && i.expirationDate < now) {
      const key = i.name.toLowerCase();
      expiredCounts.set(key, (expiredCounts.get(key) ?? 0) + 1);
    }
  });
  const out: SmartSuggestion[] = [];
  const top = [...expiredCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2);
  for (const [name, n] of top) {
    if (n < 1) continue;
    const pretty = name.replace(/\b\w/g, (c) => c.toUpperCase());
    out.push({
      id: `waste-${name}`,
      kind: 'waste',
      title: `${pretty} keeps expiring`,
      body: `You've had ${pretty} expire ${n} time${n === 1 ? '' : 's'}. Consider buying smaller portions or freezing what you don't use.`,
      severity: 'warn',
      itemName: pretty,
    });
  }
  return out;
}

export function balanceSuggestions(inventory: InventoryItem[]): SmartSuggestion[] {
  if (inventory.length === 0) return [];
  const counts: Record<string, number> = {};
  inventory.forEach((i) => {
    const cat = i.category ?? categoryFromName(i.name).id;
    counts[cat] = (counts[cat] ?? 0) + (i.quantity ?? 0);
  });
  const total = Object.values(counts).reduce((s, x) => s + x, 0) || 1;
  const out: SmartSuggestion[] = [];
  for (const c of FOOD_CATEGORIES) {
    const n = counts[c.id] ?? 0;
    const ratio = n / total;
    if (ratio > 0.4 && (counts['produce'] ?? 0) < 3 && c.id !== 'produce') {
      out.push({
        id: `balance-${c.id}`,
        kind: 'balance',
        title: 'Add some fresh variety',
        body: `You have ${n} ${c.name.toLowerCase()} items but barely any produce. Round things out with fruits and vegetables.`,
        severity: 'info',
      });
      break;
    }
  }
  if ((counts['produce'] ?? 0) < 2 && inventory.length > 4) {
    out.push({
      id: 'balance-produce',
      kind: 'balance',
      title: 'Low on fresh produce',
      body: 'You have very little produce in stock. Adding fruits or vegetables can balance your meals.',
      severity: 'info',
    });
  }
  return out.slice(0, 1);
}

export function seasonalSuggestions(): SmartSuggestion[] {
  const month = new Date().getMonth();
  const seasons: Record<number, { picks: string[]; label: string }> = {
    0: { picks: ['Citrus', 'Pomegranate', 'Kale'], label: 'Winter' },
    1: { picks: ['Citrus', 'Cabbage', 'Leeks'], label: 'Late winter' },
    2: { picks: ['Asparagus', 'Strawberries', 'Peas'], label: 'Spring' },
    3: { picks: ['Asparagus', 'Strawberries', 'Spring greens'], label: 'Spring' },
    4: { picks: ['Strawberries', 'Rhubarb', 'Spring onion'], label: 'Late spring' },
    5: { picks: ['Berries', 'Stone fruit', 'Tomatoes'], label: 'Early summer' },
    6: { picks: ['Tomatoes', 'Corn', 'Berries'], label: 'Summer' },
    7: { picks: ['Tomatoes', 'Corn', 'Peaches'], label: 'Late summer' },
    8: { picks: ['Apples', 'Pears', 'Grapes'], label: 'Early fall' },
    9: { picks: ['Pumpkin', 'Apples', 'Squash'], label: 'Fall' },
    10: { picks: ['Pumpkin', 'Cranberries', 'Brussels sprouts'], label: 'Late fall' },
    11: { picks: ['Citrus', 'Cranberries', 'Sweet potato'], label: 'Holiday season' },
  };
  const s = seasons[month];
  if (!s) return [];
  return [
    {
      id: `season-${month}`,
      kind: 'seasonal',
      title: `${s.label} is here`,
      body: `${s.picks.join(', ')} are typically on sale right now. Stock up for seasonal recipes.`,
      severity: 'good',
    },
  ];
}

export function ecoSuggestions(inventory: InventoryItem[]): SmartSuggestion[] {
  if (inventory.length === 0) return [];
  const hasLocal = inventory.some((i) => /local|farm/i.test(i.name));
  if (!hasLocal && inventory.length > 10) {
    return [
      {
        id: 'eco-local',
        kind: 'eco',
        title: 'Support local farmers',
        body: 'Consider visiting a farmers market this weekend to reduce your food carbon footprint.',
        severity: 'info',
      },
    ];
  }
  return [];
}

export function priceSuggestions(shoppingItems: { productName: string }[]): SmartSuggestion[] {
  const triggers = ['Avocado', 'Beef', 'Coffee', 'Egg', 'Milk'];
  for (const item of shoppingItems) {
    if (triggers.some((t) => item.productName.toLowerCase().includes(t.toLowerCase()))) {
      return [
        {
          id: `price-${item.productName}`,
          kind: 'price',
          title: `Price drop expected on ${item.productName}`,
          body: `Historical data shows prices for ${item.productName} tend to dip mid-week. Consider waiting until Wednesday to buy.`,
          severity: 'good',
        },
      ];
    }
  }
  return [];
}

export function buildSuggestions(
  inventory: InventoryItem[],
  activity: ActivityEvent[],
  shoppingItems: { productName: string }[] = [],
): SmartSuggestion[] {
  const all = [
    ...predictiveSuggestions(activity, inventory),
    ...bundleSuggestions(shoppingItems),
    ...wasteSuggestions(activity, inventory),
    ...balanceSuggestions(inventory),
    ...seasonalSuggestions(),
    ...ecoSuggestions(inventory),
    ...priceSuggestions(shoppingItems),
  ];
  const seen = new Set<string>();
  return all.filter((s) => (seen.has(s.id) ? false : seen.add(s.id)));
}

export interface ShoppingListSummary {
  id?: string;
  name?: string;
  totalSpent?: number;
  createdAt?: { toMillis?: () => number };
}

export function spendInWindow(lists: ShoppingListSummary[], windowMs: number): number {
  const cutoff = Date.now() - windowMs;
  return lists
    .filter((l) => (l.createdAt?.toMillis?.() ?? 0) >= cutoff)
    .reduce((s, l) => s + (l.totalSpent ?? 0), 0);
}

export function spendingByPerson(
  activity: ActivityEvent[],
  lists: ShoppingListSummary[],
): Map<string, { name: string; spent: number; checkouts: number }> {
  const bucket = new Map<string, { name: string; spent: number; checkouts: number }>();
  activity
    .filter((a) => a.verb === 'list.checkout')
    .forEach((a) => {
      const key = a.actorId ?? 'unknown';
      const cur = bucket.get(key) ?? { name: a.actorName ?? 'Member', spent: 0, checkouts: 0 };
      const list = lists.find((l) => l.name === a.target);
      if (list) cur.spent += list.totalSpent ?? 0;
      cur.checkouts += 1;
      bucket.set(key, cur);
    });
  return bucket;
}

export function mostPurchasedItems(activity: ActivityEvent[], topN = 8): { name: string; count: number }[] {
  const map = new Map<string, number>();
  activity
    .filter((a) => a.verb === 'item.added')
    .forEach((a) => {
      const k = a.target?.trim();
      if (!k) return;
      map.set(k, (map.get(k) ?? 0) + 1);
    });
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([name, count]) => ({ name, count }));
}

export interface SustainabilityMetrics {
  estimatedSavings: number;
  co2SavedKg: number;
  plasticReducedKg: number;
  organicPercent: number;
}

export function sustainabilityMetrics(activity: ActivityEvent[], inventory: InventoryItem[]): SustainabilityMetrics {
  const consumed = activity.filter((a) => a.verb === 'item.consumed').length;
  const added = activity.filter((a) => a.verb === 'item.added').length;
  const organic = inventory.filter((i) => /organic|bio/i.test(i.name)).length;
  return {
    estimatedSavings: consumed * 5,
    co2SavedKg: consumed * 1.5,
    plasticReducedKg: Math.max(0, added * 0.05 * 0.3),
    organicPercent: inventory.length === 0 ? 0 : Math.round((organic / inventory.length) * 100),
  };
}
