import { useMemo, useCallback } from 'react';
import {
  collection,
  doc,
  getDocs,
  deleteDoc,
  writeBatch,
  addDoc,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import { db } from '../lib/firebase';
import { categoryFromName } from '../lib/categories';
import type { ShoppingListMeta } from '../types/household';

/**
 * Minimal structural user shape so this hook stays decoupled from AuthContext.
 */
interface TemplateUser {
  uid: string;
}

export type CreateListFn = (
  name: string,
  opts?: {
    isTemplate?: boolean;
    isRecurring?: boolean;
    budget?: number;
    recurringFrequency?: ShoppingListMeta['recurringFrequency'];
    store?: string;
  },
) => Promise<{ id: string | null; error: Error | null }>;

export interface UseListTemplatesArgs {
  householdId: string | null;
  user: TemplateUser | null;
  canEdit: boolean;
  actorName: string;
  lists: ShoppingListMeta[];
  createList: CreateListFn;
  setActiveListId: (id: string | null) => void;
}

/**
 * Template CRUD for shopping lists.
 *
 * - `createFromTemplate` — extracted verbatim from the original hook.
 * - `saveAsTemplate` — NEW: converts an existing active list into a template
 *   by creating a new `isTemplate: true` list doc and batch-copying its items.
 * - `deleteTemplate` — NEW: deletes a template list doc (subcollection items
 *   are orphaned, consistent with the existing `deleteList` pattern).
 * - `templates` — derived filtered list.
 */
export function useListTemplates({
  householdId,
  user,
  canEdit,
  lists,
  createList,
  setActiveListId,
}: UseListTemplatesArgs) {
  const templates = useMemo(() => lists.filter((l) => l.isTemplate), [lists]);

  const createFromTemplate = useCallback(
    async (templateId: string, listName: string) => {
      if (!householdId || !user || !canEdit) return { error: new Error('Not allowed') };
      try {
        const { id, error } = await createList(listName, { isTemplate: false });
        if (error || !id) return { error: error ?? new Error('Failed to create list') };
        const templateItems = await getDocs(
          collection(db, 'households', householdId, 'shoppingLists', templateId, 'items'),
        );
        const batch = writeBatch(db);
        templateItems.forEach((d) => {
          const data = d.data();
          const itemRef = doc(collection(db, 'households', householdId, 'shoppingLists', id, 'items'));
          batch.set(itemRef, {
            productName: data.productName,
            quantity: data.quantity ?? 1,
            unit: data.unit ?? 'pcs',
            purchased: false,
            estimatedPrice: data.estimatedPrice ?? 0,
            category: data.category ?? categoryFromName((data.productName as string) ?? '').id,
            notes: data.notes ?? '',
            addedBy: user.uid,
            addedAt: serverTimestamp(),
          });
        });
        await batch.commit();
        setActiveListId(id);
        return { id, error: null };
      } catch (err) {
        return { error: err as Error };
      }
    },
    [householdId, user, canEdit, createList, setActiveListId],
  );

  const saveAsTemplate = useCallback(
    async (sourceListId: string, templateName: string) => {
      if (!householdId || !user || !canEdit) return { error: new Error('Not allowed') };
      try {
        // Create a new template list doc
        const ref = await addDoc(collection(db, 'households', householdId, 'shoppingLists'), {
          name: templateName.trim(),
          totalSpent: 0,
          isTemplate: true,
          isRecurring: false,
          recurringFrequency: '',
          store: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Copy items from the source list into the template
        const sourceItems = await getDocs(
          collection(db, 'households', householdId, 'shoppingLists', sourceListId, 'items'),
        );
        const batch = writeBatch(db);
        sourceItems.forEach((d) => {
          const data = d.data();
          const itemRef = doc(collection(db, 'households', householdId, 'shoppingLists', ref.id, 'items'));
          batch.set(itemRef, {
            productName: data.productName,
            quantity: data.quantity ?? 1,
            unit: data.unit ?? 'pcs',
            purchased: false,
            estimatedPrice: data.estimatedPrice ?? 0,
            category: data.category ?? categoryFromName((data.productName as string) ?? '').id,
            notes: data.notes ?? '',
            addedBy: user.uid,
            addedAt: serverTimestamp(),
          });
        });
        await batch.commit();

        return { id: ref.id, error: null };
      } catch (err) {
        return { id: null, error: err as Error };
      }
    },
    [householdId, user, canEdit],
  );

  const deleteTemplate = useCallback(
    async (templateId: string) => {
      if (!householdId || !canEdit) return { error: new Error('Not allowed') };
      try {
        await deleteDoc(doc(db, 'households', householdId, 'shoppingLists', templateId));
        return { error: null };
      } catch (err) {
        return { error: err as Error };
      }
    },
    [householdId, canEdit],
  );

  return { templates, createFromTemplate, saveAsTemplate, deleteTemplate };
}
