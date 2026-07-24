import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { landing } from './landing';
import {
  brandBlue,
  brandGreen,
  brandOrange,
  brandPurple,
  brandRose,
} from './brand';
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
  orange: {
    primary: brandOrange.DEFAULT,
    primaryDark: brandOrange.dark,
    primaryGlow: brandOrange.glow,
  },
  blue: {
    primary: brandBlue.DEFAULT,
    primaryDark: brandBlue.dark,
    primaryGlow: brandBlue.glow,
  },
  green: {
    primary: brandGreen.DEFAULT,
    primaryDark: brandGreen.dark,
    primaryGlow: brandGreen.glow,
  },
  purple: {
    primary: brandPurple.DEFAULT,
    primaryDark: brandPurple.dark,
    primaryGlow: brandPurple.glow,
  },
  rose: {
    primary: brandRose.DEFAULT,
    primaryDark: brandRose.dark,
    primaryGlow: brandRose.glow,
  },
};

/**
 * Resolves the active accent tokens from the current theme-color preference.
 * Consumed by `useAppColors` so the whole app follows the chosen accent.
 */
export function useAccentTokens(): AccentTokens {
  const prefs = usePreferenceValues();
  return useMemo(() => THEME_COLOR_TOKENS[prefs.themeColor] ?? THEME_COLOR_TOKENS.orange, [prefs.themeColor]);
}
