import { createContext, useContext, ReactNode } from 'react';
import { useMealPlans } from '../hooks/useMealPlans';

type MealPlansStore = ReturnType<typeof useMealPlans>;

const MealPlansContext = createContext<MealPlansStore | undefined>(undefined);

export function MealPlansProvider({ children }: { children: ReactNode }) {
  const store = useMealPlans();
  return <MealPlansContext.Provider value={store}>{children}</MealPlansContext.Provider>;
}

export function useMealPlansStore() {
  const ctx = useContext(MealPlansContext);
  if (!ctx) throw new Error('useMealPlansStore must be used within MealPlansProvider');
  return ctx;
}
