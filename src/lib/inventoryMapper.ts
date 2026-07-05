import {
  DEFAULT_STORAGE_LOCATIONS,
  mapHouseholdItemToShoppingListItem,
  mapInventoryToPantryItem,
  mapPantryToInventory,
  mapHouseholdLocationToStorageLocation,
} from '../shared';
import { InventoryItem } from '../types/household';
import { PantryItem, ShoppingListItem, StorageLocation } from '../types';
import { categoryFromName, STORAGE_LOCATIONS } from './categories';

function hasToMillis(value: unknown): value is { toMillis: () => number } {
  return typeof value === 'object' && value !== null && 'toMillis' in value;
}

function toExpiryIso(expirationDate?: number): string | null {
  if (!expirationDate) return null;
  return new Date(expirationDate).toISOString().slice(0, 10);
}

function toExpirationMs(expiryDate: string | null): number | undefined {
  if (!expiryDate) return undefined;
  const ms = new Date(expiryDate).getTime();
  return Number.isNaN(ms) ? undefined : ms;
}

/** Fallback virtual locations when household storageLocations haven't loaded yet. */
export function defaultStorageLocations(userId: string): StorageLocation[] {
  const colors: Record<string, string> = {
    Pantry: '#f59e0b',
    Fridge: '#3b82f6',
    Freezer: '#06b6d4',
    Cabinet: '#8b5cf6',
    Other: '#8b5cf6',
  };
  const icons: Record<string, string> = {
    Pantry: 'warehouse',
    Fridge: 'thermometer',
    Freezer: 'snowflake',
    Cabinet: 'layout-grid',
    Other: 'layout-grid',
  };
  return DEFAULT_STORAGE_LOCATIONS.map((loc) => ({
    id: `loc-${loc.name.toLowerCase()}`,
    user_id: userId,
    name: loc.name,
    icon: icons[loc.name] ?? loc.icon,
    color: colors[loc.name] ?? loc.color,
    created_at: new Date(0).toISOString(),
  }));
}

export function mapFirestoreStorageLocation(
  id: string,
  data: Record<string, unknown>,
  userId: string,
): StorageLocation {
  return mapHouseholdLocationToStorageLocation(id, data, userId);
}

export function locationIdFromName(name: string | undefined, locations: StorageLocation[]): string | null {
  if (!name) return null;
  const match = locations.find((l) => l.name.toLowerCase() === name.toLowerCase());
  if (match) return match.id;
  const legacy = STORAGE_LOCATIONS.find((l) => l.toLowerCase() === name.toLowerCase());
  return legacy ? `loc-${legacy.toLowerCase()}` : null;
}

export function locationNameFromId(locationId: string | null, locations: StorageLocation[]): string {
  if (!locationId) return 'Pantry';
  return locations.find((l) => l.id === locationId)?.name ?? 'Pantry';
}

function resolveLocationId(data: Record<string, unknown>, locations: StorageLocation[]): string | null {
  if (data.locationId) return String(data.locationId);
  const legacyName = data.storageLocation as string | undefined;
  if (legacyName) return locationIdFromName(legacyName, locations);
  return null;
}

export function inventoryToPantryItem(
  item: InventoryItem,
  userId: string,
  locations: StorageLocation[],
): PantryItem {
  const mapped = mapInventoryToPantryItem(item.id, item as unknown as Record<string, unknown>, userId);
  const locationId = resolveLocationId(item as unknown as Record<string, unknown>, locations);
  const cat = item.category ?? categoryFromName(item.name).id;
  return {
    ...mapped,
    location_id: locationId ?? mapped.location_id,
    category: cat,
    unit: item.unit ?? mapped.unit ?? 'pcs',
    purchase_price: item.pricePerUnit ?? mapped.purchase_price,
    expiry_date: toExpiryIso(item.expirationDate) ?? mapped.expiry_date,
  };
}

export function pantryToInventoryPayload(
  item: Omit<PantryItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
  locations: StorageLocation[],
  userId: string,
): Omit<InventoryItem, 'id'> & Record<string, unknown> {
  const shared = mapPantryToInventory(item, userId);
  const payload: Omit<InventoryItem, 'id'> & Record<string, unknown> = {
    name: shared.name,
    quantity: shared.quantity ?? 0,
    storageLocation: locationNameFromId(item.location_id, locations),
    category: shared.category ?? item.category,
    pricePerUnit: shared.purchasePrice ?? item.purchase_price ?? 0,
    unit: shared.unit ?? item.unit,
    lowStockThreshold: shared.lowStockThreshold ?? item.low_stock_threshold,
    addedBy: userId,
    locationId: item.location_id ?? undefined,
    imageUrl: shared.imageUrl,
    barcode: shared.barcode,
    brand: shared.brand,
    notes: shared.notes,
  };

  const expirationDate = shared.expirationDate ?? toExpirationMs(item.expiry_date);
  if (expirationDate !== undefined && expirationDate !== null) {
    payload.expirationDate = expirationDate;
  }

  return payload;
}

export function mapInventoryDoc(id: string, data: Record<string, unknown>): InventoryItem {
  let expirationDate: number | undefined;
  if (typeof data.expirationDate === 'number') expirationDate = data.expirationDate;
  else if (hasToMillis(data.expirationDate)) expirationDate = data.expirationDate.toMillis();

  return {
    id,
    name: (data.name as string) ?? '',
    quantity: (data.quantity as number) ?? 0,
    storageLocation: (data.storageLocation as string) ?? 'Pantry',
    expirationDate,
    barcode: data.barcode as string | undefined,
    brand: data.brand as string | undefined,
    category: data.category as string | undefined,
    pricePerUnit: (data.pricePerUnit as number | undefined) ?? (data.purchasePrice as number | undefined),
    unit: data.unit as string | undefined,
    notes: data.notes as string | undefined,
    imageUrl: (data.imageUrl as string) ?? (data.customImage as string | undefined),
    lowStockThreshold: (data.lowStockThreshold as number | undefined) ?? (data.low_stock_threshold as number | undefined),
    calories: data.calories as number | undefined,
    protein: data.protein as number | undefined,
    fat: data.fat as number | undefined,
    carbs: data.carbs as number | undefined,
    addedBy: data.addedBy as string | undefined,
    ...(data.locationId ? { locationId: String(data.locationId) } : {}),
  } as InventoryItem;
}

export function householdShoppingToLegacy(
  item: {
    id: string;
    productName: string;
    quantity: number;
    purchased: boolean;
    estimatedPrice?: number;
    unit?: string;
    category?: string;
    notes?: string;
  },
  userId: string,
): ShoppingListItem {
  return mapHouseholdItemToShoppingListItem(item.id, item as Record<string, unknown>, userId);
}
