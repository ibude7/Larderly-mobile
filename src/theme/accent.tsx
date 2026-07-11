import { createContext, useContext, type ReactNode } from 'react';
import { landing } from './landing';

/**
 * Per-screen accent color for auth/onboarding. Lets a single step's color
 * (icon medallion, focused field, progress) flow through nested primitives
 * without threading a prop through every TextField call site.
 */
const AccentContext = createContext<string>(landing.accent);

export function AccentProvider({ color, children }: { color?: string; children: ReactNode }) {
  return (
    <AccentContext.Provider value={color ?? landing.accent}>{children}</AccentContext.Provider>
  );
}

export function useAccent(): string {
  return useContext(AccentContext);
}
