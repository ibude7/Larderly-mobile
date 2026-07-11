import {
  isInQuietHours,
  toFirestoreNotificationPrefs,
} from '../notificationPrefs';
import { createDefaultPreferences } from '../../contexts/preferencesSchema';
import { exportPantryAsCSV, exportShoppingHistoryAsCSV } from '../export';
import type { PantryItem, StorageLocation } from '../../types';
import type { ShoppingListMeta } from '../../types/household';

describe('notificationPrefs sync helpers', () => {
  it('copies the full notifications payload for Firestore', () => {
    const notifications = {
      ...createDefaultPreferences().notifications,
      expiration: false,
      quietHoursStart: 22,
      frequency: 'daily' as const,
    };
    expect(toFirestoreNotificationPrefs(notifications)).toEqual(notifications);
  });

  it('detects overnight quiet hours', () => {
    expect(isInQuietHours(22, 21, 8)).toBe(true);
    expect(isInQuietHours(7, 21, 8)).toBe(true);
    expect(isInQuietHours(12, 21, 8)).toBe(false);
    expect(isInQuietHours(10, 9, 17)).toBe(true);
    expect(isInQuietHours(8, 9, 17)).toBe(false);
    expect(isInQuietHours(12, 8, 8)).toBe(false);
  });
});

describe('export helpers', () => {
  it('exports pantry CSV with location names and escaped cells', () => {
    const locations: StorageLocation[] = [
      {
        id: 'loc-1',
        name: 'Fridge, top',
        user_id: 'u1',
        icon: 'fridge',
        color: '#000',
        created_at: '',
      },
    ];
    const items: PantryItem[] = [
      {
        id: 'item-1',
        user_id: 'u1',
        product_id: null,
        location_id: 'loc-1',
        name: 'Milk "whole"',
        brand: '',
        image_url: '',
        category: 'Dairy',
        barcode: '123',
        quantity: 1,
        unit: 'gal',
        expiry_date: '2026-08-01',
        low_stock_threshold: 1,
        purchase_price: 3.5,
        notes: '',
        created_at: '',
        updated_at: '',
      },
    ];
    const csv = exportPantryAsCSV(items, locations);
    expect(csv.split('\n')[0]).toContain('Name');
    expect(csv).toContain('"Milk ""whole"""');
    expect(csv).toContain('"Fridge, top"');
  });

  it('exports archived shopping history rows', () => {
    const lists: Array<ShoppingListMeta & { itemCount?: number }> = [
      {
        id: 'list-1',
        name: 'Weekly',
        createdAt: 1,
        archivedAt: 2,
        totalSpent: 12.5,
        itemCount: 4,
      },
    ];
    const csv = exportShoppingHistoryAsCSV(lists);
    expect(csv).toContain('Weekly');
    expect(csv).toContain('12.5');
  });
});
