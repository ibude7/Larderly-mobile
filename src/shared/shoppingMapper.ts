import { ShoppingListItem } from '../types';

export function mapHouseholdItemToShoppingListItem(
  id: string,
  item: Record<string, unknown>,
  userId: string,
): ShoppingListItem {
  return {
    id,
    user_id: userId,
    pantry_item_id: null,
    name: (item.productName as string) ?? '',
    brand: '',
    category: (item.category as string) ?? 'other',
    quantity: (item.quantity as number) ?? 0,
    unit: (item.unit as string) ?? 'pcs',
    is_checked: Boolean(item.purchased),
    is_auto_generated: false,
    notes: (item.notes as string) ?? '',
    created_at: new Date().toISOString(),
    estimatedPrice: (item.estimatedPrice as number) ?? 0,
    barcode: (item.barcode as string) ?? '',
    store: (item.store as string) ?? '',
  };
}
