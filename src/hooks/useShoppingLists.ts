import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
  getDocs,
} from '@react-native-firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useHousehold } from '../contexts/HouseholdContext';
import { useProfile } from '../contexts/ProfileContext';
import { recordActivity } from '../lib/activity';
import { bumpCounter } from '../lib/achievements';
import { categoryFromName } from '../lib/categories';
import { ShoppingListMeta, HouseholdShoppingItem } from '../types/household';
import { householdShoppingToLegacy } from '../lib/inventoryMapper';
import { ShoppingListItem } from '../types';
import { useListTemplates, type CreateListFn } from './useListTemplates';
import { useRecurringLists } from './useRecurringLists';
import { useCheckout } from './useCheckout';

const DEFAULT_LIST_NAME = 'Main list';

function readTimestamp(raw: unknown): number | null {
  if (typeof raw === 'object' && raw !== null && 'toMillis' in raw) {
    return (raw as { toMillis: () => number }).toMillis();
  }
  return null;
}

function mapListDoc(id: string, data: Record<string, unknown>): ShoppingListMeta {
  return {
    id,
    name: (data.name as string) ?? 'List',
    budget: data.budget as number | undefined,
    totalSpent: data.totalSpent as number | undefined,
    isRecurring: Boolean(data.isRecurring),
    isTemplate: Boolean(data.isTemplate),
    recurringFrequency: data.recurringFrequency as ShoppingListMeta['recurringFrequency'],
    store: data.store as string | undefined,
    archivedAt: readTimestamp(data.archivedAt),
    createdAt: readTimestamp(data.createdAt),
    lastRunAt: readTimestamp(data.lastRunAt),
    lastGeneratedAt: readTimestamp(data.lastGeneratedAt),
  };
}

export function useShoppingLists() {
  const { user } = useAuth();
  const { profile, userProfile } = useProfile();
  const { householdId, role } = useHousehold();
  const [lists, setLists] = useState<ShoppingListMeta[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [items, setItems] = useState<HouseholdShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const canEdit = role !== 'viewer';

  const actorName =
    profile?.full_name?.trim() ||
    [userProfile?.firstName, userProfile?.lastName].filter(Boolean).join(' ') ||
    user?.displayName ||
    'You';

  // ── Firestore subscriptions ────────────────────────────────────────────────

  useEffect(() => {
    if (!householdId) {
      setLists([]);
      setActiveListId(null);
      setItems([]);
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(collection(db, 'households', householdId, 'shoppingLists'), async (snap) => {
      const all = snap.docs.map((d) => mapListDoc(d.id, d.data() ?? {}));
      const active = all.filter((l) => !l.archivedAt);
      setLists(all);

      let listId = activeListId;
      if (!listId || !active.find((l) => l.id === listId)) {
        listId = active[0]?.id ?? null;
        if (!listId && canEdit && user) {
          try {
            const ref = await addDoc(collection(db, 'households', householdId, 'shoppingLists'), {
              name: DEFAULT_LIST_NAME,
              totalSpent: 0,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            listId = ref.id;
            recordActivity(householdId, {
              verb: 'list.created',
              target: DEFAULT_LIST_NAME,
              actorId: user.uid,
              actorName,
            });
            bumpCounter(user.uid, householdId, actorName, 'listsCreated').catch(() => {});
          } catch {
            // ignore
          }
        }
        setActiveListId(listId);
      }
      setLoading(false);
    });
    return unsub;
  }, [householdId, canEdit, user]);

  useEffect(() => {
    if (!householdId || !activeListId) {
      setItems([]);
      return;
    }
    const unsub = onSnapshot(
      collection(db, 'households', householdId, 'shoppingLists', activeListId, 'items'),
      (snap) => {
        setItems(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              productName: (data.productName as string) ?? '',
              quantity: (data.quantity as number) ?? 1,
              purchased: Boolean(data.purchased),
              estimatedPrice: (data.estimatedPrice as number) ?? 0,
              unit: data.unit as string | undefined,
              category: data.category as string | undefined,
              notes: data.notes as string | undefined,
              barcode: data.barcode as string | undefined,
            };
          }),
        );
      },
    );
    return unsub;
  }, [householdId, activeListId]);

  // ── Derived state ─────────────────────────────────────────────────────────

  const activeList = useMemo(() => lists.find((l) => l.id === activeListId) ?? null, [lists, activeListId]);

  const shoppingList: ShoppingListItem[] = useMemo(() => {
    if (!user) return [];
    return items.map((i) => householdShoppingToLegacy(i, user.uid));
  }, [items, user]);

  // ── List CRUD ─────────────────────────────────────────────────────────────

  const createList: CreateListFn = useCallback(
    async (name, opts) => {
      if (!householdId || !user || !canEdit) return { error: new Error('Not allowed'), id: null };
      try {
        const ref = await addDoc(collection(db, 'households', householdId, 'shoppingLists'), {
          name: name.trim(),
          totalSpent: 0,
          budget: opts?.budget ?? null,
          isTemplate: opts?.isTemplate ?? false,
          isRecurring: opts?.isRecurring ?? false,
          recurringFrequency: opts?.isRecurring ? (opts?.recurringFrequency ?? 'weekly') : '',
          store: opts?.store ?? '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        if (!opts?.isTemplate) setActiveListId(ref.id);
        recordActivity(householdId, { verb: 'list.created', target: name.trim(), actorId: user.uid, actorName });
        bumpCounter(user.uid, householdId, actorName, 'listsCreated').catch(() => {});
        return { id: ref.id, error: null };
      } catch (err) {
        return { id: null, error: err as Error };
      }
    },
    [householdId, user, canEdit, actorName],
  );

  const bulkAddItems = useCallback(
    async (rows: Array<{ name: string; quantity: number; price: number; unit?: string; category?: string }>) => {
      if (!householdId || !activeListId || !user || !canEdit) return { error: new Error('Not allowed') };
      try {
        const batch = writeBatch(db);
        const col = collection(db, 'households', householdId, 'shoppingLists', activeListId, 'items');
        rows.forEach((row) => {
          const ref = doc(col);
          batch.set(ref, {
            productName: row.name,
            quantity: row.quantity || 1,
            unit: row.unit ?? 'pcs',
            purchased: false,
            estimatedPrice: row.price || 0,
            category: row.category ?? categoryFromName(row.name).id,
            addedBy: user.uid,
            addedAt: serverTimestamp(),
          });
        });
        await batch.commit();
        return { error: null };
      } catch (err) {
        return { error: err as Error };
      }
    },
    [householdId, activeListId, user, canEdit],
  );

  const deleteList = useCallback(
    async (listId: string) => {
      if (!householdId || !canEdit) return { error: new Error('Not allowed') };
      try {
        await deleteDoc(doc(db, 'households', householdId, 'shoppingLists', listId));
        recordActivity(householdId, { verb: 'list.deleted', target: listId, actorId: user!.uid, actorName });
        if (activeListId === listId) setActiveListId(null);
        return { error: null };
      } catch (err) {
        return { error: err as Error };
      }
    },
    [householdId, canEdit, activeListId, user, actorName],
  );

  const archiveList = useCallback(
    async (listId: string) => {
      if (!householdId || !canEdit) return { error: new Error('Not allowed') };
      try {
        await updateDoc(doc(db, 'households', householdId, 'shoppingLists', listId), {
          archivedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return { error: null };
      } catch (err) {
        return { error: err as Error };
      }
    },
    [householdId, canEdit],
  );

  const updateListMeta = useCallback(
    async (listId: string, patch: Partial<ShoppingListMeta>) => {
      if (!householdId || !canEdit) return { error: new Error('Not allowed') };
      try {
        await updateDoc(doc(db, 'households', householdId, 'shoppingLists', listId), {
          ...patch,
          updatedAt: serverTimestamp(),
        });
        return { error: null };
      } catch (err) {
        return { error: err as Error };
      }
    },
    [householdId, canEdit],
  );

  // ── Item CRUD ─────────────────────────────────────────────────────────────

  const addShoppingItem = useCallback(
    async (item: Omit<ShoppingListItem, 'id' | 'user_id' | 'created_at'>) => {
      if (!householdId || !activeListId || !user) return { data: null, error: new Error('Not authenticated') };
      if (!canEdit) return { data: null, error: new Error('View-only access') };
      try {
        const ref = await addDoc(
          collection(db, 'households', householdId, 'shoppingLists', activeListId, 'items'),
          {
            productName: item.name,
            quantity: item.quantity,
            unit: item.unit,
            purchased: false,
            estimatedPrice: item.estimatedPrice ?? 0,
            category: item.category || categoryFromName(item.name).id,
            notes: item.notes ?? '',
            isAutoGenerated: item.is_auto_generated ?? false,
            addedBy: user.uid,
            addedAt: serverTimestamp(),
          },
        );
        recordActivity(householdId, { verb: 'list.item.added', target: item.name, actorId: user.uid, actorName });
        return {
          data: { ...item, id: ref.id, user_id: user.uid, created_at: new Date().toISOString() } as ShoppingListItem,
          error: null,
        };
      } catch (err) {
        return { data: null, error: err as Error };
      }
    },
    [householdId, activeListId, user, canEdit, actorName],
  );

  const toggleShoppingItem = useCallback(
    async (id: string) => {
      if (!householdId || !activeListId || !user) return { data: null, error: new Error('Not authenticated') };
      const item = items.find((i) => i.id === id);
      if (!item) return { data: null, error: new Error('Not found') };
      try {
        const next = !item.purchased;
        await updateDoc(
          doc(db, 'households', householdId, 'shoppingLists', activeListId, 'items', id),
          { purchased: next },
        );
        if (next) {
          recordActivity(householdId, { verb: 'list.item.purchased', target: item.productName, actorId: user.uid, actorName });
        }
        return { data: householdShoppingToLegacy({ ...item, purchased: next }, user.uid), error: null };
      } catch (err) {
        return { data: null, error: err as Error };
      }
    },
    [householdId, activeListId, user, items, actorName],
  );

  const deleteShoppingItem = useCallback(
    async (id: string) => {
      if (!householdId || !activeListId || !canEdit) return { error: new Error('Not allowed') };
      try {
        await deleteDoc(doc(db, 'households', householdId, 'shoppingLists', activeListId, 'items', id));
        return { error: null };
      } catch (err) {
        return { error: err as Error };
      }
    },
    [householdId, activeListId, canEdit],
  );

  const clearCheckedItems = useCallback(async () => {
    if (!householdId || !activeListId || !user) return { error: new Error('Not authenticated') };
    try {
      const q = query(
        collection(db, 'households', householdId, 'shoppingLists', activeListId, 'items'),
        where('purchased', '==', true),
      );
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      if (snap.size > 0) {
        const spent = items.filter((i) => i.purchased).reduce((s, i) => s + (i.estimatedPrice ?? 0) * i.quantity, 0);
        await updateDoc(doc(db, 'households', householdId, 'shoppingLists', activeListId), {
          totalSpent: (activeList?.totalSpent ?? 0) + spent,
          updatedAt: serverTimestamp(),
        });
        recordActivity(householdId, {
          verb: 'list.checkout',
          target: `${snap.size} items`,
          actorId: user.uid,
          actorName,
        });
        bumpCounter(user.uid, householdId, actorName, 'checkouts').catch(() => {});
      }
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }, [householdId, activeListId, user, items, activeList?.totalSpent, actorName]);

  // ── Composed sub-hooks ────────────────────────────────────────────────────

  const { templates, createFromTemplate, saveAsTemplate, deleteTemplate } = useListTemplates({
    householdId,
    user,
    canEdit,
    actorName,
    lists,
    createList,
    setActiveListId,
  });

  const { recurringLists } = useRecurringLists({
    householdId,
    user,
    canEdit,
    actorName,
    lists,
    createFromTemplate,
  });

  const { checkoutToPantry } = useCheckout({
    householdId,
    activeListId,
    user,
    items,
    clearCheckedItems,
  });

  // ── Derived counts ────────────────────────────────────────────────────────

  const uncheckedItems = items.filter((i) => !i.purchased);
  const checkedItems = items.filter((i) => i.purchased);
  const listTotal = uncheckedItems.reduce((s, i) => s + (i.estimatedPrice ?? 0) * i.quantity, 0);

  return {
    lists,
    activeList,
    activeListId,
    setActiveListId,
    items,
    shoppingList,
    loading,
    canEdit,
    listTotal,
    uncheckedItems,
    checkedItems,
    createList,
    createFromTemplate,
    bulkAddItems,
    deleteList,
    archiveList,
    updateListMeta,
    addShoppingItem,
    toggleShoppingItem,
    deleteShoppingItem,
    clearCheckedItems,
    checkoutToPantry,
    // New exports from sub-hooks:
    templates,
    saveAsTemplate,
    deleteTemplate,
    recurringLists,
  };
}
