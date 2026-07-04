import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from '@react-native-firebase/firestore';
import { db } from '../lib/firebase';
import { getDaysUntilDate } from '../lib/date';
import { PantryItem, StorageLocation, ShoppingListItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { recordActivity } from '../lib/activity';
import { bumpCounter } from '../lib/achievements';
import {
  defaultStorageLocations,
  inventoryToPantryItem,
  mapFirestoreStorageLocation,
  mapInventoryDoc,
  pantryToInventoryPayload,
} from '../lib/inventoryMapper';
import { mapPantryUpdatesToInventory } from '@larderly/shared';
import { useSync } from '../contexts/SyncContext';

interface ShoppingBridge {
  activeListId: string | null;
  shoppingList: ShoppingListItem[];
  addAutoItem: (name: string, unit: string, category: string) => Promise<void>;
  removeAutoItems: (ids: string[]) => Promise<void>;
}

export function usePantry(shopping?: ShoppingBridge) {
  const { user, profile, userProfile, householdId, role } = useAuth();
  const { recordSync } = useSync();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const canEdit = role !== 'viewer';

  const locationsRef = useRef<StorageLocation[]>([]);
  useEffect(() => {
    locationsRef.current = locations;
  }, [locations]);

  const shoppingListRef = useRef<ShoppingListItem[]>([]);
  useEffect(() => {
    shoppingListRef.current = shopping?.shoppingList ?? [];
  }, [shopping?.shoppingList]);

  useEffect(() => {
    if (!user || !householdId) {
      setItems([]);
      setLocations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let firstLocs = false;
    let firstItems = false;
    const maybeDone = () => {
      if (firstLocs && firstItems) setLoading(false);
    };

    const fallbackLocs = defaultStorageLocations(user.uid);

    const unsubLocs = onSnapshot(
      query(collection(db, 'households', householdId, 'storageLocations'), orderBy('name')),
      (snap) => {
        const mapped = snap.docs.map((d) => mapFirestoreStorageLocation(d.id, d.data() ?? {}, user.uid));
        const next = mapped.length > 0 ? mapped : fallbackLocs;
        locationsRef.current = next;
        setLocations(next);
        firstLocs = true;
        maybeDone();
      },
      () => {
        setLocations(fallbackLocs);
        firstLocs = true;
        maybeDone();
      },
    );

    const unsubItems = onSnapshot(
      collection(db, 'households', householdId, 'inventory'),
      (snap) => {
        const locs = locationsRef.current.length ? locationsRef.current : fallbackLocs;
        setItems(snap.docs.map((d) => inventoryToPantryItem(mapInventoryDoc(d.id, d.data() ?? {}), user.uid, locs)));
        firstItems = true;
        maybeDone();
        recordSync('synced', 'Inventory updated');
      },
      () => {
        firstItems = true;
        maybeDone();
      },
    );

    return () => {
      unsubLocs();
      unsubItems();
    };
  }, [user, householdId, recordSync]);

  useEffect(() => {
    locationsRef.current = locations;
  }, [locations]);

  const refetch = useCallback(async () => {}, []);

  const actorName =
    profile?.full_name?.trim() ||
    [userProfile?.firstName, userProfile?.lastName].filter(Boolean).join(' ') ||
    user?.displayName ||
    'You';

  const syncLowStockShoppingItem = useCallback(
    async (item: PantryItem) => {
      if (!shopping?.activeListId || !canEdit) return;
      const list = shoppingListRef.current;
      const existingAuto = list.filter((s) => s.name === item.name && !s.is_checked && s.is_auto_generated);

      if (item.quantity <= item.low_stock_threshold) {
        if (existingAuto.length > 0) return;
        await shopping.addAutoItem(item.name, item.unit, item.category);
        return;
      }
      if (existingAuto.length > 0) {
        await shopping.removeAutoItems(existingAuto.map((e) => e.id));
      }
    },
    [shopping, canEdit],
  );

  const addItem = async (item: Omit<PantryItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user || !householdId) return { data: null, error: new Error('Not authenticated') };
    if (!canEdit) return { data: null, error: new Error('View-only access') };
    try {
      const locs = locations.length ? locations : defaultStorageLocations(user.uid);
      const ref = await addDoc(collection(db, 'households', householdId, 'inventory'), {
        ...pantryToInventoryPayload(item, locs, user.uid),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      const data: PantryItem = {
        ...(item as PantryItem),
        id: ref.id,
        user_id: user.uid,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await syncLowStockShoppingItem(data);
      recordActivity(householdId, { verb: 'item.added', target: item.name, actorId: user.uid, actorName });
      bumpCounter(user.uid, householdId, actorName, 'itemsAdded').catch(() => {});
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const updateItem = async (id: string, updates: Partial<PantryItem>) => {
    if (!user || !householdId) return { data: null, error: new Error('Not authenticated') };
    if (!canEdit) return { data: null, error: new Error('View-only access') };
    try {
      const locs = locations.length ? locations : defaultStorageLocations(user.uid);
      const patch: Record<string, unknown> = {
        ...mapPantryUpdatesToInventory(updates),
        updatedAt: serverTimestamp(),
      };
      if (updates.location_id !== undefined) {
        patch.storageLocation = locs.find((l) => l.id === updates.location_id)?.name ?? 'Pantry';
      }
      if (updates.purchase_price !== undefined) patch.pricePerUnit = updates.purchase_price ?? 0;

      await updateDoc(doc(db, 'households', householdId, 'inventory', id), patch);
      const existing = items.find((i) => i.id === id);
      const data: PantryItem | null = existing
        ? { ...existing, ...updates, updated_at: new Date().toISOString() }
        : null;
      if (data) await syncLowStockShoppingItem(data);
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const deleteItem = async (id: string) => {
    if (!user || !householdId) return { error: new Error('Not authenticated') };
    if (!canEdit) return { error: new Error('View-only access') };
    try {
      await deleteDoc(doc(db, 'households', householdId, 'inventory', id));
      const removed = items.find((i) => i.id === id);
      if (removed) {
        recordActivity(householdId, { verb: 'item.removed', target: removed.name, actorId: user.uid, actorName });
      }
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const consumeItem = async (id: string, amount = 1) => {
    const item = items.find((i) => i.id === id);
    if (!item || !user || !householdId) return { data: null, error: new Error('Item not found') };
    const days = getDaysUntilDate(item.expiry_date);
    const beforeExpiry = days !== null && days >= 0;
    const result = await updateItem(id, { quantity: Math.max(0, item.quantity - amount) });
    if (!result.error) {
      recordActivity(householdId, { verb: 'item.consumed', target: item.name, actorId: user.uid, actorName });
      if (beforeExpiry) {
        bumpCounter(user.uid, householdId, actorName, 'itemsConsumedBeforeExpiry').catch(() => {});
      }
    }
    return result;
  };

  const lowStockItems = items.filter((i) => i.quantity <= i.low_stock_threshold);
  const expiringSoonItems = items.filter((i) => {
    const days = getDaysUntilDate(i.expiry_date);
    return days !== null && days >= 0 && days <= 7;
  });

  return {
    items,
    locations,
    loading,
    canEdit,
    refetch,
    addItem,
    updateItem,
    deleteItem,
    consumeItem,
    lowStockItems,
    expiringSoonItems,
  };
}
