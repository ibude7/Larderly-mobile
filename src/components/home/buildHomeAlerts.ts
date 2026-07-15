import type { PantryItem } from '../../types';
import {
  balanceSuggestions,
  buildSuggestions,
  seasonalSuggestions,
  type InventoryItem,
  type SmartSuggestion,
} from '../../lib/insights';
import { getExpiryInfo } from '../pantry/pantryExpiry';

function toInventory(items: PantryItem[]): InventoryItem[] {
  return items.map((item) => {
    const info = getExpiryInfo(item.expiry_date);
    const expirationDate =
      item.expiry_date && !Number.isNaN(Date.parse(item.expiry_date))
        ? Date.parse(item.expiry_date)
        : info.days !== null
          ? Date.now() + info.days * 86_400_000
          : undefined;
    return {
      id: item.id,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      expirationDate,
      createdAt: { toMillis: () => Date.parse(item.created_at) || Date.now() },
    };
  });
}

/** Home-facing smart alerts — engine suggestions + freezeable heuristic. */
export function buildHomeSmartAlerts(items: PantryItem[]): SmartSuggestion[] {
  if (items.length === 0) return [];

  const inventory = toInventory(items);
  const fromEngine = buildSuggestions(inventory, [], []).filter(
    (s) => s.kind !== 'price' && s.kind !== 'bundle',
  );

  const freezable = items.filter((item) =>
    /bread|chicken|beef|pork|berry|berries|soup|stock|broth|tofu|spinach/i.test(item.name),
  );
  const freezeAlert: SmartSuggestion[] =
    freezable.length >= 2
      ? [
          {
            id: 'home-freeze',
            kind: 'prep',
            title: `${freezable.length} items can be frozen`,
            body: `Try freezing ${freezable
              .slice(0, 2)
              .map((i) => i.name)
              .join(' and ')} before they turn.`,
            severity: 'info',
          },
        ]
      : [];

  const forgotten = items.filter((item) => {
    const age = Date.now() - (Date.parse(item.created_at) || Date.now());
    return age > 21 * 86_400_000 && (getExpiryInfo(item.expiry_date).days ?? 99) > 14;
  });
  const forgetAlert: SmartSuggestion[] =
    forgotten.length >= 2
      ? [
          {
            id: 'home-forget',
            kind: 'predictive',
            title: `You have ${forgotten.length} items you often forget`,
            body: `${forgotten
              .slice(0, 2)
              .map((i) => i.name)
              .join(' and ')} have been sitting untouched — plan a meal around them.`,
            severity: 'info',
          },
        ]
      : [];

  const merged = [...forgetAlert, ...freezeAlert, ...fromEngine, ...balanceSuggestions(inventory), ...seasonalSuggestions()];
  const seen = new Set<string>();
  return merged.filter((s) => (seen.has(s.id) ? false : seen.add(s.id))).slice(0, 2);
}

/** Grounded waste-saved proxy from inventory health — not invented kilograms. */
export function homeWasteSavedProxy(items: PantryItem[]): { label: string; detail: string } {
  const dated = items.filter((i) => i.expiry_date);
  if (dated.length === 0) {
    return { label: '—', detail: 'Track expiry to measure' };
  }
  const stillGood = dated.filter((i) => (getExpiryInfo(i.expiry_date).days ?? -1) >= 0).length;
  return {
    label: String(stillGood),
    detail: 'Still fresh',
  };
}
