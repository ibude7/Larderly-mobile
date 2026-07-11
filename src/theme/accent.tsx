import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { landing } from './landing';
import { usePreferenceValues } from '../contexts/PreferenceValueContext';
import type { ThemeColor } from '../contexts/preferencesSchema';

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

export interface AccentTokens {
  primary: string;
  primaryDark: string;
  primaryGlow: string;
}

/** Maps the user's `themeColor` preference to concrete accent tokens. */
export const THEME_COLOR_TOKENS: Readonly<Record<ThemeColor, AccentTokens>> = {
  orange: { primary: '#C2662D', primaryDark: '#9A4E20', primaryGlow: 'rgba(194, 102, 45, 0.14)' },
  blue: { primary: '#5B7B93', primaryDark: '#3F5A6E', primaryGlow: 'rgba(91, 123, 147, 0.16)' },
  green: { primary: '#6E8B5A', primaryDark: '#516B3F', primaryGlow: 'rgba(110, 139, 90, 0.16)' },
  purple: { primary: '#8B6B9E', primaryDark: '#6B4F7D', primaryGlow: 'rgba(139, 107, 158, 0.16)' },
  rose: { primary: '#B5573F', primaryDark: '#8E402C', primaryGlow: 'rgba(181, 87, 63, 0.16)' },
};

/**
 * Resolves the active accent tokens from the current theme-color preference.
 * Consumed by `useAppColors` so the whole app follows the chosen accent.
 */
export function useAccentTokens(): AccentTokens {
  const prefs = usePreferenceValues();
  return useMemo(() => THEME_COLOR_TOKENS[prefs.themeColor] ?? THEME_COLOR_TOKENS.orange, [prefs.themeColor]);
}
