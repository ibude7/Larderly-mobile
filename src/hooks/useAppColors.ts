import { useMemo } from 'react';
import { useColorScheme } from 'nativewind';
import { lightColors, darkColors, ColorTokens } from '../theme';
import { useAccentTokens } from '../theme/accent';
import { useForcedColorScheme } from '../theme/ForcedColorScheme';

/**
 * Theme tokens from NativeWind's resolved color scheme (synced via ThemeBridge).
 * Honors `ForcedColorScheme` for subtrees that must stay light/dark.
 *
 * @example
 * const c = useAppColors();
 * // c.primary, c.ink, c.muted — dark-aware
 */
export function useAppColors(): ColorTokens {
  const { colorScheme } = useColorScheme();
  const forced = useForcedColorScheme();
  const accent = useAccentTokens();
  const scheme = forced ?? colorScheme;
  const base = scheme === 'dark' ? darkColors : lightColors;

  return useMemo(
    () => ({
      ...base,
      primary: accent.primary,
      primaryDark: accent.primaryDark,
      primaryGlow: accent.primaryGlow,
      info: accent.primary,
    }),
    [accent, base],
  );
}
