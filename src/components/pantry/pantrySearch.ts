import { locationNameFromId } from '../../lib/inventoryMapper';
import type { PantryItem, StorageLocation } from '../../types';

/** Normalize for case/diacritic-insensitive matching. */
export function normalizeSearch(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** True when every query token appears somewhere in the haystack. */
export function matchesSearchTokens(haystack: string, query: string): boolean {
  const q = normalizeSearch(query);
  if (!q) return true;
  const hay = normalizeSearch(haystack);
  const tokens = q.split(/\s+/).filter(Boolean);
  return tokens.every((token) => hay.includes(token));
}

export function pantryItemSearchBlob(
  item: PantryItem,
  locations: StorageLocation[],
): string {
  const loc = locationNameFromId(item.location_id, locations);
  return [
    item.name,
    item.brand,
    item.category,
    item.unit,
    item.notes,
    item.barcode,
    loc,
  ]
    .filter(Boolean)
    .join(' ');
}

export function filterPantryByQuery(
  items: PantryItem[],
  locations: StorageLocation[],
  query: string,
): PantryItem[] {
  const q = query.trim();
  if (!q) return items;
  return items.filter((item) => matchesSearchTokens(pantryItemSearchBlob(item, locations), q));
}
