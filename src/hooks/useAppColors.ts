import { useMemo } from 'react';
import { useColorScheme } from 'nativewind';
import { lightColors, darkColors, ColorTokens } from '../theme';
import { useAccentTokens } from '../theme/accent';

/**
 * Theme tokens from NativeWind's resolved color scheme (synced via ThemeBridge).
 *
 * @example
 * const c = useAppColors();
 * // c.primary, c.ink, c.muted — dark-aware
 */
export function useAppColors(): ColorTokens {
  const { colorScheme } = useColorScheme();
  const accent = useAccentTokens();
  const base = colorScheme === 'dark' ? darkColors : lightColors;

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
