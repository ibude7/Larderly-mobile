import { createContext, useContext, type ReactNode } from 'react';

export type ForcedColorSchemeValue = 'light' | 'dark';

const ForcedColorSchemeContext = createContext<ForcedColorSchemeValue | null>(null);

/** Override NativeWind / prefs scheme for a subtree (e.g. Landing always light). */
export function ForcedColorScheme({
  scheme,
  children,
}: {
  scheme: ForcedColorSchemeValue;
  children: ReactNode;
}) {
  return (
    <ForcedColorSchemeContext.Provider value={scheme}>
      {children}
    </ForcedColorSchemeContext.Provider>
  );
}

export function useForcedColorScheme(): ForcedColorSchemeValue | null {
  return useContext(ForcedColorSchemeContext);
}
