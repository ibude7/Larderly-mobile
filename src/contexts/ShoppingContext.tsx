import React, { createContext, useContext, ReactNode } from 'react';
import { useShoppingLists } from '../hooks/useShoppingLists';

type ShoppingStore = ReturnType<typeof useShoppingLists>;
const ShoppingContext = createContext<ShoppingStore | undefined>(undefined);

export function ShoppingProvider({ children }: { children: ReactNode }) {
  const store = useShoppingLists();
  return (
    <ShoppingContext.Provider value={store}>
      {children}
    </ShoppingContext.Provider>
  );
}

export function useShopping() {
  const ctx = useContext(ShoppingContext);
  if (!ctx) throw new Error('useShopping must be used within ShoppingProvider');
  return ctx;
}
