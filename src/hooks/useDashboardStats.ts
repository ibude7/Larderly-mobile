import { useMemo, useRef } from 'react';
import { useInventory } from '../contexts/InventoryContext';
import { useShopping } from '../contexts/ShoppingContext';
import { PantryItem } from '../types';

export interface DashboardStats {
  itemCount: number;
  lowStockItems: PantryItem[];
  expiringSoonItems: PantryItem[];
  uncheckedCount: number;
  totalValue: number;
  loading: boolean;
}

function stockKey(items: PantryItem[]): string {
  return items.map((i) => `${i.id}:${i.quantity}:${i.purchase_price ?? 0}`).join('|');
}

function shoppingCheckKey(list: { id: string; is_checked: boolean }[]): string {
  return list.map((s) => `${s.id}:${s.is_checked ? 1 : 0}`).join('|');
}

export function useDashboardStats(): DashboardStats {
  const { items, lowStockItems, expiringSoonItems, isLoading: inventoryLoading } = useInventory();
  const { shoppingList, loading: shoppingLoading } = useShopping();

  const quantityPriceKey = stockKey(items);
  const checkKey = shoppingCheckKey(shoppingList);
  const lowStockKey = lowStockItems.map((i) => i.id).join(',');
  const expiringKey = expiringSoonItems.map((i) => i.id).join(',');
  const itemCount = items.length;

  const cacheRef = useRef<DashboardStats | null>(null);
  const prevKeysRef = useRef('');

  return useMemo(() => {
    const loading = inventoryLoading || shoppingLoading;
    const keys = `${itemCount}|${quantityPriceKey}|${checkKey}|${lowStockKey}|${expiringKey}|${loading ? 1 : 0}`;
    if (cacheRef.current && prevKeysRef.current === keys) {
      return cacheRef.current;
    }

    const next: DashboardStats = {
      itemCount,
      lowStockItems,
      expiringSoonItems,
      uncheckedCount: shoppingList.filter((s) => !s.is_checked).length,
      totalValue: items.reduce((sum, i) => sum + (i.purchase_price || 0) * i.quantity, 0),
      loading,
    };
    prevKeysRef.current = keys;
    cacheRef.current = next;
    return next;
  }, [
    itemCount,
    quantityPriceKey,
    checkKey,
    lowStockKey,
    expiringKey,
    inventoryLoading,
    shoppingLoading,
    items,
    shoppingList,
    lowStockItems,
    expiringSoonItems,
  ]);
}
