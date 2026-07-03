import { PantryItem } from '../types';
import { parseStoredDate } from './date';
import type { ActivityEvent, InventoryItem } from './insights';

export function pantryItemToInventory(item: PantryItem): InventoryItem {
  const exp = item.expiry_date ? parseStoredDate(item.expiry_date).getTime() : undefined;
  const createdMs = new Date(item.created_at).getTime();
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    unit: item.unit,
    pricePerUnit: item.purchase_price ?? undefined,
    expirationDate: exp,
    createdAt: { toMillis: () => createdMs },
  };
}

export interface StoredActivityDoc {
  verb: string;
  target: string;
  actorId?: string;
  actorName?: string;
  created_at?: string;
}

export function mapStoredActivity(doc: StoredActivityDoc): ActivityEvent {
  const createdMs = doc.created_at ? new Date(doc.created_at).getTime() : 0;
  return {
    verb: doc.verb,
    target: doc.target,
    actorId: doc.actorId,
    actorName: doc.actorName,
    createdAt: { toMillis: () => createdMs },
  };
}
