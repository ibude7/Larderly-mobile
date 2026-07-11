import { createContext, useContext, type ReactNode } from 'react';
import {
  createDefaultPreferences,
  type Preferences,
} from './preferencesSchema';

const PreferenceValueContext = createContext<Preferences>(createDefaultPreferences());

export function PreferenceValueProvider({
  value,
  children,
}: {
  value: Preferences;
  children: ReactNode;
}) {
  return (
    <PreferenceValueContext.Provider value={value}>
      {children}
    </PreferenceValueContext.Provider>
  );
}

/**
 * Lightweight read-only access for foundational theme/scale hooks. The
 * default keeps isolated components usable in tests and previews.
 */
export function usePreferenceValues(): Preferences {
  return useContext(PreferenceValueContext);
}
