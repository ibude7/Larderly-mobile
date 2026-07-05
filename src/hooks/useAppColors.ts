import { useColorScheme } from 'nativewind';
import { lightColors, darkColors, ColorTokens } from '../theme';

/**
 * Theme tokens from NativeWind's resolved color scheme (synced via ThemeBridge).
 *
 * @example
 * const c = useAppColors();
 * // c.primary, c.ink, c.muted — dark-aware
 */
export function useAppColors(): ColorTokens {
  const { colorScheme } = useColorScheme();
  return colorScheme === 'dark' ? darkColors : lightColors;
}
