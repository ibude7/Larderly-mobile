import { PantryItem, StorageLocation } from '../types';
import { hasToMillis, toExpiryIso, toExpirationMs, toIsoString } from './utils';

export function mapInventoryToPantryItem(
  id: string,
  data: Record<string, unknown>,
  userId: string,
): PantryItem {
  let expirationDate: number | undefined;
  if (typeof data.expirationDate === 'number') expirationDate = data.expirationDate;
  else if (hasToMillis(data.expirationDate)) expirationDate = data.expirationDate.toMillis();

  return {
    id,
    user_id: userId,
    product_id: null,
    location_id: data.locationId ? String(data.locationId) : null,
    name: (data.name as string) ?? '',
    brand: (data.brand as string) ?? '',
    image_url: (data.imageUrl as string) ?? (data.customImage as string) ?? '',
    category: (data.category as string) ?? 'other',
    barcode: (data.barcode as string) ?? '',
    quantity: (data.quantity as number) ?? 0,
    unit: (data.unit as string) ?? 'pcs',
    expiry_date: toExpiryIso(expirationDate),
    low_stock_threshold:
      (data.lowStockThreshold as number | undefined) ??
      (data.low_stock_threshold as number | undefined) ??
      1,
    purchase_price:
      (data.pricePerUnit as number | null | undefined) ??
      (data.purchasePrice as number | null | undefined) ??
      null,
    notes: (data.notes as string) ?? '',
    created_at: toIsoString(data.created_at ?? data.createdAt),
    updated_at: toIsoString(data.updated_at ?? data.updatedAt),
  };
}

export function mapPantryToInventory(
  item: Omit<PantryItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
  userId: string,
) {
  return {
    name: item.name,
    quantity: item.quantity,
    category: item.category,
    purchasePrice: item.purchase_price ?? 0,
    unit: item.unit,
    lowStockThreshold: item.low_stock_threshold,
    imageUrl: item.image_url || undefined,
    barcode: item.barcode || undefined,
    brand: item.brand || undefined,
    notes: item.notes || undefined,
    expirationDate: toExpirationMs(item.expiry_date),
    addedBy: userId,
  };
}

export function mapHouseholdLocationToStorageLocation(
  id: string,
  data: Record<string, unknown>,
  userId: string,
): StorageLocation {
  return {
    id,
    user_id: (data.user_id as string) ?? (data.userId as string) ?? userId,
    name: (data.name as string) ?? 'Pantry',
    icon: (data.icon as string) ?? 'warehouse',
    color: (data.color as string) ?? '#64748b',
    created_at: toIsoString(data.created_at ?? data.createdAt),
  };
}

export function mapPantryUpdatesToInventory(updates: Partial<PantryItem>): Record<string, unknown> {
  const patch: Record<string, unknown> = {};

  if (updates.name !== undefined) patch.name = updates.name;
  if (updates.quantity !== undefined) patch.quantity = updates.quantity;
  if (updates.brand !== undefined) patch.brand = updates.brand;
  if (updates.barcode !== undefined) patch.barcode = updates.barcode;
  if (updates.category !== undefined) patch.category = updates.category;
  if (updates.unit !== undefined) patch.unit = updates.unit;
  if (updates.low_stock_threshold !== undefined) patch.lowStockThreshold = updates.low_stock_threshold;
  if (updates.notes !== undefined) patch.notes = updates.notes;
  if (updates.image_url !== undefined) patch.imageUrl = updates.image_url;
  if (updates.location_id !== undefined) patch.locationId = updates.location_id;
  if (updates.expiry_date !== undefined) {
    const ms = toExpirationMs(updates.expiry_date);
    patch.expirationDate = ms ?? null;
  }

  return patch;
}
