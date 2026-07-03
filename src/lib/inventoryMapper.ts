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

/** Virtual storage locations used by the mobile pantry UI. */
export function defaultStorageLocations(userId: string): StorageLocation[] {
  const colors: Record<string, string> = {
    Pantry: '#f59e0b',
    Fridge: '#3b82f6',
    Freezer: '#06b6d4',
    Other: '#8b5cf6',
  };
  const icons: Record<string, string> = {
    Pantry: 'warehouse',
    Fridge: 'thermometer',
    Freezer: 'snowflake',
    Other: 'layout-grid',
  };
  return STORAGE_LOCATIONS.map((name, i) => ({
    id: `loc-${name.toLowerCase()}`,
    user_id: userId,
    name,
    icon: icons[name] ?? 'package',
    color: colors[name] ?? '#64748b',
    created_at: new Date(0).toISOString(),
  }));
}

export function locationIdFromName(name: string | undefined): string | null {
  if (!name) return null;
  const match = STORAGE_LOCATIONS.find((l) => l.toLowerCase() === name.toLowerCase());
  return match ? `loc-${match.toLowerCase()}` : null;
}

export function locationNameFromId(locationId: string | null, locations: StorageLocation[]): string {
  if (!locationId) return 'Pantry';
  return locations.find((l) => l.id === locationId)?.name ?? 'Pantry';
}

export function inventoryToPantryItem(
  item: InventoryItem,
  userId: string,
  locations: StorageLocation[],
): PantryItem {
  const cat = item.category ?? categoryFromName(item.name).id;
  return {
    id: item.id,
    user_id: userId,
    product_id: null,
    location_id: locationIdFromName(item.storageLocation) ?? locations[0]?.id ?? null,
    name: item.name,
    brand: item.brand ?? '',
    image_url: item.imageUrl ?? '',
    category: cat,
    barcode: item.barcode ?? '',
    quantity: item.quantity ?? 0,
    unit: item.unit ?? 'pcs',
    expiry_date: toExpiryIso(item.expirationDate),
    low_stock_threshold: item.lowStockThreshold ?? 1,
    purchase_price: item.pricePerUnit ?? null,
    notes: item.notes ?? '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function pantryToInventoryPayload(
  item: Omit<PantryItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
  locations: StorageLocation[],
  userId: string,
): Omit<InventoryItem, 'id'> {
  // Firestore rejects `undefined` — omit optional fields instead of writing them.
  const payload: Omit<InventoryItem, 'id'> = {
    name: item.name,
    quantity: item.quantity,
    storageLocation: locationNameFromId(item.location_id, locations),
    category: item.category,
    pricePerUnit: item.purchase_price ?? 0,
    unit: item.unit,
    lowStockThreshold: item.low_stock_threshold,
    addedBy: userId,
  };

  const expirationDate = toExpirationMs(item.expiry_date);
  if (expirationDate !== undefined) payload.expirationDate = expirationDate;
  if (item.barcode) payload.barcode = item.barcode;
  if (item.brand) payload.brand = item.brand;
  if (item.notes) payload.notes = item.notes;
  if (item.image_url) payload.imageUrl = item.image_url;

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
    pricePerUnit: data.pricePerUnit as number | undefined,
    unit: data.unit as string | undefined,
    notes: data.notes as string | undefined,
    imageUrl: (data.imageUrl as string) ?? (data.customImage as string | undefined),
    lowStockThreshold: data.lowStockThreshold as number | undefined,
    calories: data.calories as number | undefined,
    protein: data.protein as number | undefined,
    fat: data.fat as number | undefined,
    carbs: data.carbs as number | undefined,
    addedBy: data.addedBy as string | undefined,
  };
}

export function householdShoppingToLegacy(
  item: { id: string; productName: string; quantity: number; purchased: boolean; estimatedPrice?: number; unit?: string; category?: string; notes?: string },
  userId: string,
): ShoppingListItem {
  return {
    id: item.id,
    user_id: userId,
    pantry_item_id: null,
    name: item.productName,
    brand: '',
    category: item.category ?? 'other',
    quantity: item.quantity,
    unit: item.unit ?? 'pcs',
    is_checked: item.purchased,
    is_auto_generated: false,
    notes: item.notes ?? '',
    created_at: new Date().toISOString(),
  };
}
