import { categoryFromName } from '../lib/categories';
import { HouseholdShoppingItem } from '../types/household';

/**
 * Minimal structural user shape so this hook stays decoupled from AuthContext.
 */
interface CheckoutUser {
  uid: string;
}

type ClearCheckedItems = () => Promise<{ error: Error | null }>;

export interface UseCheckoutArgs {
  householdId: string | null;
  activeListId: string | null;
  user: CheckoutUser | null;
  items: HouseholdShoppingItem[];
  /** Provided by the composing hook; clears purchased items + logs activity. */
  clearCheckedItems: ClearCheckedItems;
}

/**
 * Owns the "move purchased items into the pantry" flow.
 * Extracted verbatim from the original useShoppingLists; the inventory-callback
 * pattern is preserved so callers (ShoppingScreen, ShoppingModeOverlay) keep the
 * same `checkoutToPantry(addToInventory)` signature.
 */
export function useCheckout({ householdId, activeListId, user, items, clearCheckedItems }: UseCheckoutArgs) {
  const checkoutToPantry = async (
    addToInventory: (name: string, qty: number, unit: string, category: string, price: number) => Promise<void>,
  ) => {
    if (!householdId || !activeListId || !user) return { error: new Error('Not authenticated') };
    const purchased = items.filter((i) => i.purchased);
    try {
      for (const item of purchased) {
        await addToInventory(
          item.productName,
          item.quantity,
          item.unit ?? 'pcs',
          item.category ?? categoryFromName(item.productName).id,
          item.estimatedPrice ?? 0,
        );
      }
      await clearCheckedItems();
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  return { checkoutToPantry };
}
