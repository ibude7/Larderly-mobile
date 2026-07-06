import type { PantryItem, StorageLocation } from '../types';
import type { ShoppingListMeta } from '../types/household';

function csvCell(value: unknown): string {
  const text = value == null ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function csvRow(values: unknown[]): string {
  return values.map(csvCell).join(',');
}

export function exportPantryAsCSV(items: PantryItem[], locations: StorageLocation[]): string {
  const locationById = new Map(locations.map((location) => [location.id, location.name]));
  const rows = [
    csvRow(['Name', 'Brand', 'Category', 'Quantity', 'Unit', 'Location', 'Expiry Date', 'Purchase Price', 'Barcode']),
    ...items.map((item) =>
      csvRow([
        item.name,
        item.brand,
        item.category,
        item.quantity,
        item.unit,
        item.location_id ? locationById.get(item.location_id) ?? '' : '',
        item.expiry_date ?? '',
        item.purchase_price ?? '',
        item.barcode,
      ]),
    ),
  ];
  return rows.join('\n');
}

export function exportShoppingHistoryAsCSV(archivedLists: ShoppingListMeta[]): string {
  const rows = [
    csvRow(['List Name', 'Date Archived', 'Item Count', 'Total Spent']),
    ...archivedLists.map((list) =>
      csvRow([
        list.name,
        list.archivedAt ? new Date(list.archivedAt).toISOString() : '',
        (list as ShoppingListMeta & { itemCount?: number }).itemCount ?? '',
        list.totalSpent ?? '',
      ]),
    ),
  ];
  return rows.join('\n');
}
