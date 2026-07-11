import { useMemo } from 'react';
import { useColorScheme } from 'nativewind';
import { darkColors, lightColors } from '../theme';
import { useAccent } from './accent';
import { SETTINGS_SECTION_COLORS, type SettingsSectionKey } from '../components/settings/settingsHelpers';

/** Applies an alpha channel (0–1) to a #RRGGBB hex color. */
function withAlpha(hex: string, alpha: number): string {
  const clamped = Math.max(0, Math.min(1, alpha));
  const value = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${value}`;
}

export interface SettingsTheme {
  isDark: boolean;
  canvas: string;
  surface: string;
  surfaceMuted: string;
  surfaceGlass: string;
  ink: string;
  inkSoft: string;
  muted: string;
  line: string;
  glassLine: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  accent: string;
  accentSoft: string;
  accentLine: string;
  shadow: string;
  blurTint: 'light' | 'dark';
  blurIntensity: number;
  section: Record<SettingsSectionKey, string>;
  /** Applies alpha to any hex token color. */
  tint: (hex: string, alpha: number) => string;
}

/**
 * Theme-aware token layer for the Settings Console. Bridges the dark-aware
 * MarketOps palette with the warm section identity colors, and threads the
 * active accent (theme color preference) through `AccentProvider`.
 */
export function useSettingsTheme(): SettingsTheme {
  const { colorScheme } = useColorScheme();
  const accent = useAccent();
  const isDark = colorScheme === 'dark';
  const base = isDark ? darkColors : lightColors;

  return useMemo(
    () => ({
      isDark,
      canvas: base.canvas,
      surface: base.surface,
      surfaceMuted: base.surfaceMuted,
      surfaceGlass: base.surfaceGlass,
      ink: base.ink,
      inkSoft: base.inkSoft,
      muted: base.muted,
      line: base.line,
      glassLine: base.glassLine,
      success: base.success,
      warning: base.warning,
      danger: base.danger,
      info: base.info,
      accent,
      accentSoft: withAlpha(accent, isDark ? 0.22 : 0.12),
      accentLine: withAlpha(accent, isDark ? 0.5 : 0.4),
      shadow: base.shadow,
      blurTint: base.blurTint,
      blurIntensity: base.blurIntensity,
      section: SETTINGS_SECTION_COLORS,
      tint: withAlpha,
    }),
    [accent, base, isDark],
  );
}
