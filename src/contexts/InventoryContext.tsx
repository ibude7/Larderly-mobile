import React, { createContext, useContext, ReactNode } from 'react';
import { usePantry } from '../hooks/usePantry';

type InventoryStore = ReturnType<typeof usePantry>;
const InventoryContext = createContext<InventoryStore | undefined>(undefined);

interface InventoryProviderProps {
  children: ReactNode;
  shoppingBridge: Parameters<typeof usePantry>[0];
}

export function InventoryProvider({ children, shoppingBridge }: InventoryProviderProps) {
  const store = usePantry(shoppingBridge);
  return (
    <InventoryContext.Provider value={store}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventory must be used within InventoryProvider');
  return ctx;
}
