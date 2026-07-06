import { useMemo, useEffect, useRef } from 'react';
import {
  doc,
  updateDoc,
  serverTimestamp,
} from '@react-native-firebase/firestore';
import { db } from '../lib/firebase';
import { useToast } from '../contexts/ToastContext';
import type { ShoppingListMeta } from '../types/household';

/**
 * Minimal structural user shape so this hook stays decoupled from AuthContext.
 */
interface RecurringUser {
  uid: string;
}

type CreateFromTemplateFn = (
  templateId: string,
  listName: string,
) => Promise<{ id?: string | null; error: Error | null }>;

export interface UseRecurringListsArgs {
  householdId: string | null;
  user: RecurringUser | null;
  canEdit: boolean;
  actorName: string;
  lists: ShoppingListMeta[];
  createFromTemplate: CreateFromTemplateFn;
}

/** Milliseconds for each supported frequency. */
const FREQUENCY_MS: Record<string, number> = {
  weekly: 7 * 24 * 60 * 60 * 1000,
  biweekly: 14 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
};

/**
 * Format a Date as a short label like "Jul 5" for the regenerated list name.
 */
function shortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Computes the next due date for a recurring list based on the last run (or
 * creation time as the baseline) and the configured frequency.
 */
function nextDueDate(list: ShoppingListMeta): Date | null {
  const baseline = list.lastGeneratedAt ?? list.lastRunAt ?? list.archivedAt;
  if (!baseline) return null;
  const ms = FREQUENCY_MS[list.recurringFrequency ?? ''];
  if (!ms) return null; // unknown frequency — skip
  return new Date(baseline + ms);
}

/**
 * Recurring shopping list detection and auto-regeneration scheduler.
 *
 * On mount and whenever `lists` changes, the hook checks each active recurring
 * archived list for due-ness. A list is due when `Date.now() >= nextDueDate`.
 * When due:
 *
 *  1. A new non-recurring, non-template list is created via `createFromTemplate`,
 *     using the archived recurring list as the source.
 *  2. The recurring list's `lastGeneratedAt` field is written with `serverTimestamp()`
 *     so it won't fire again until the next cycle.
 *
 * A `useRef<Set<string>>` guards against duplicate regeneration across
 * React strict-mode double-mounts and rapid `lists` updates.
 */
export function useRecurringLists({
  householdId,
  user,
  canEdit,
  actorName,
  lists,
  createFromTemplate,
}: UseRecurringListsArgs) {
  const { showToast } = useToast();
  const recurringLists = useMemo(
    () => lists.filter((l) => l.isRecurring && !l.isTemplate && Boolean(l.archivedAt)),
    [lists],
  );

  // Guard set: IDs that have already been processed in this session.
  const processedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!householdId || !user || !canEdit) return;

    const now = Date.now();
    const dueLists = recurringLists.filter((list) => {
      if (processedRef.current.has(list.id)) return false;
      const due = nextDueDate(list);
      return due !== null && now >= due.getTime();
    });

    if (dueLists.length === 0) return;

    let cancelled = false;

    (async () => {
      for (const list of dueLists) {
        if (cancelled) break;
        processedRef.current.add(list.id);

        try {
          const instanceName = `${list.name} · ${shortDate(new Date())}`;
          const { error } = await createFromTemplate(list.id, instanceName);
          if (error) continue;

          await updateDoc(
            doc(db, 'households', householdId, 'shoppingLists', list.id),
            { lastGeneratedAt: serverTimestamp(), updatedAt: serverTimestamp() },
          );
          showToast(`Your ${list.recurringFrequency || 'recurring'} shopping list has been refreshed`, 'success');
        } catch {
          // Regeneration failed — remove from processed so it can retry next pass
          processedRef.current.delete(list.id);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [householdId, user?.uid, canEdit, actorName, recurringLists, createFromTemplate, showToast]);

  return { recurringLists };
}
