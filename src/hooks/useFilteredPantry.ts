import { useMemo } from 'react';
import { PantryItem, StorageLocation } from '../types';
import { locationNameFromId } from '../lib/inventoryMapper';
import { getDaysUntilDate } from '../lib/date';

export type ExpirationFilter = 'All' | 'Fresh' | 'Expiring Soon' | 'Expired';
export type StockFilter = 'All' | 'In Stock' | 'Low Stock' | 'Out of Stock';
export type SortKey = 'expiration' | 'name' | 'quantity' | 'price';

export interface FilterState {
  search: string;
  activeLocation: string;
  activeCategory: string;
  filterExpiration: ExpirationFilter;
  filterStock: StockFilter;
  filterPriceMin: string;
  filterPriceMax: string;
  sortKey: SortKey;
}

function expirationStatus(expiry: string | null): 'fresh' | 'soon' | 'urgent' | 'expired' | 'none' {
  const days = getDaysUntilDate(expiry);
  if (days === null) return 'none';
  if (days < 0) return 'expired';
  if (days <= 2) return 'urgent';
  if (days <= 7) return 'soon';
  return 'fresh';
}

export function useFilteredPantry(
  items: PantryItem[],
  locations: StorageLocation[],
  filterState: FilterState,
): PantryItem[] {
  const {
    search,
    activeLocation,
    activeCategory,
    filterExpiration,
    filterStock,
    filterPriceMin,
    filterPriceMax,
    sortKey,
  } = filterState;

  return useMemo(() => {
    let arr = [...items];
    if (activeLocation !== 'All') {
      arr = arr.filter((i) => locationNameFromId(i.location_id, locations) === activeLocation);
    }
    if (activeCategory !== 'All') {
      arr = arr.filter((i) => (i.category ?? 'other') === activeCategory);
    }
    if (filterExpiration !== 'All') {
      arr = arr.filter((i) => {
        const stat = expirationStatus(i.expiry_date);
        if (filterExpiration === 'Expired') return stat === 'expired';
        if (filterExpiration === 'Expiring Soon') return stat === 'urgent' || stat === 'soon';
        if (filterExpiration === 'Fresh') return stat === 'fresh' || stat === 'none';
        return true;
      });
    }
    if (filterStock !== 'All') {
      arr = arr.filter((i) => {
        if (filterStock === 'Out of Stock') return i.quantity === 0;
        if (filterStock === 'Low Stock') return i.quantity > 0 && i.quantity <= i.low_stock_threshold;
        if (filterStock === 'In Stock') return i.quantity > i.low_stock_threshold;
        return true;
      });
    }
    if (filterPriceMin) {
      arr = arr.filter((i) => (i.purchase_price ?? 0) >= Number(filterPriceMin));
    }
    if (filterPriceMax) {
      arr = arr.filter((i) => (i.purchase_price ?? 0) <= Number(filterPriceMax));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(
        (i) => i.name.toLowerCase().includes(q) || (i.brand ?? '').toLowerCase().includes(q),
      );
    }
    arr.sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name);
      if (sortKey === 'quantity') return b.quantity - a.quantity;
      if (sortKey === 'price') return (b.purchase_price ?? 0) - (a.purchase_price ?? 0);
      const da = getDaysUntilDate(a.expiry_date) ?? 9999;
      const db = getDaysUntilDate(b.expiry_date) ?? 9999;
      return da - db;
    });
    return arr;
  }, [
    items,
    locations,
    activeLocation,
    activeCategory,
    search,
    sortKey,
    filterExpiration,
    filterStock,
    filterPriceMin,
    filterPriceMax,
  ]);
}
