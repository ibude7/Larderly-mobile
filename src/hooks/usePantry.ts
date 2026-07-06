import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  onSnapshot,
  getDocs,
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
import { useHousehold } from '../contexts/HouseholdContext';
import { useProfile } from '../contexts/ProfileContext';
import { recordActivity } from '../lib/activity';
import { bumpCounter } from '../lib/achievements';
import {
  defaultStorageLocations,
  inventoryToPantryItem,
  mapFirestoreStorageLocation,
  mapInventoryDoc,
  pantryToInventoryPayload,
} from '../lib/inventoryMapper';
import { mapPantryUpdatesToInventory } from '../shared';
import { useSync } from '../contexts/SyncContext';
import { trackEvent } from '../lib/analytics';

interface ShoppingBridge {
  activeListId: string | null;
  shoppingList: ShoppingListItem[];
  addAutoItem: (name: string, unit: string, category: string) => Promise<void>;
  removeAutoItems: (ids: string[]) => Promise<void>;
}

export function usePantry(shopping?: ShoppingBridge) {
  const { user } = useAuth();
  const { profile, userProfile } = useProfile();
  const { householdId, role } = useHousehold();
  const { recordSync } = useSync();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const canEdit = role !== 'viewer';

  const locationsRef = useRef<StorageLocation[]>([]);

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
    const fallbackLocs = defaultStorageLocations(user.uid);
    let active = true;
    let unsubItems: (() => void) | undefined;
    let unsubLocs: (() => void) | undefined;

    const loadData = async () => {
      try {
        const q = query(
          collection(db, 'households', householdId, 'storageLocations'),
          orderBy('name'),
        );
        const snap = await getDocs(q);
        if (!active) return;

        const mapped = snap.docs.map((d) =>
          mapFirestoreStorageLocation(d.id, d.data() ?? {}, user.uid),
        );
        const resolvedLocs = mapped.length > 0 ? mapped : fallbackLocs;
        locationsRef.current = resolvedLocs;
        setLocations(resolvedLocs);

        unsubItems = onSnapshot(
          collection(db, 'households', householdId, 'inventory'),
          (inventorySnap) => {
            const locs = locationsRef.current.length ? locationsRef.current : resolvedLocs;
            setItems(
              inventorySnap.docs.map((d) =>
                inventoryToPantryItem(mapInventoryDoc(d.id, d.data() ?? {}), user.uid, locs),
              ),
            );
            setLoading(false);
            recordSync('synced', 'Inventory updated');
          },
          () => {
            setLoading(false);
            recordSync('error', 'Inventory sync failed');
          },
        );
      } catch (err) {
        console.error('[usePantry] Error loading storage locations:', err);
        if (!active) return;
        locationsRef.current = fallbackLocs;
        setLocations(fallbackLocs);

        unsubItems = onSnapshot(
          collection(db, 'households', householdId, 'inventory'),
          (inventorySnap) => {
            setItems(
              inventorySnap.docs.map((d) =>
                inventoryToPantryItem(mapInventoryDoc(d.id, d.data() ?? {}), user.uid, fallbackLocs),
              ),
            );
            setLoading(false);
            recordSync('synced', 'Inventory updated');
          },
          () => {
            setLoading(false);
            recordSync('error', 'Inventory sync failed');
          },
        );
      }

      unsubLocs = onSnapshot(
        query(collection(db, 'households', householdId, 'storageLocations'), orderBy('name')),
        (snap) => {
          const mapped = snap.docs.map((d) =>
            mapFirestoreStorageLocation(d.id, d.data() ?? {}, user.uid),
          );
          const next = mapped.length > 0 ? mapped : fallbackLocs;
          locationsRef.current = next;
          setLocations(next);
        },
        () => {
          locationsRef.current = fallbackLocs;
          setLocations(fallbackLocs);
        },
      );
    };

    loadData();

    return () => {
      active = false;
      if (unsubItems) unsubItems();
      if (unsubLocs) unsubLocs();
    };
  }, [user, householdId, recordSync]);

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
      trackEvent('item_added', { category: item.category, quantity: item.quantity }).catch(() => {});
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
      const existing = items.find((i) => i.id === id);
      if (updates.purchase_price !== undefined) {
        const nextPrice = updates.purchase_price ?? 0;
        patch.pricePerUnit = nextPrice;
        if (nextPrice !== (existing?.purchase_price ?? 0)) {
          patch.priceHistory = [
            ...(existing?.priceHistory ?? []),
            { price: nextPrice, recordedAt: new Date().toISOString() },
          ].slice(-12);
        }
      }

      await updateDoc(doc(db, 'households', householdId, 'inventory', id), patch);
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
    isLoading: loading,
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
