import { useMemo } from 'react';
import { useColorScheme } from 'nativewind';
import { useAccent } from './accent';
import { useForcedColorScheme } from './ForcedColorScheme';
import { settingsDark, settingsLight } from './palette';

export { settingsDark, settingsLight } from './palette';

/** Applies an alpha channel (0–1) to a #RRGGBB hex color. */
function withAlpha(hex: string, alpha: number): string {
  const clamped = Math.max(0, Math.min(1, alpha));
  const value = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${value}`;
}

/** Per-row icon colors — one distinct hue each, cream-friendly. */
function settingsIconColors(base: {
  blue: string;
  terracotta: string;
  purple: string;
  ochre: string;
  teal: string;
  green: string;
  indigo: string;
  clay: string;
  mauve: string;
}) {
  return {
    account: base.blue,
    household: base.terracotta,
    appearance: base.purple,
    notifications: base.ochre,
    permissions: base.teal,
    security: base.green,
    data: base.indigo,
    diagnostics: base.clay,
    help: base.mauve,
    about: base.blue,
  } as const;
}

export type SettingsTamaguiThemeName = 'settings_light' | 'settings_dark';
export type SettingsIconColorKey = keyof ReturnType<typeof settingsIconColors>;

export interface SettingsTheme {
  isDark: boolean;
  tamaguiTheme: SettingsTamaguiThemeName;
  canvas: string;
  canvasSoft: string;
  surface: string;
  surfaceMuted: string;
  surfaceGlass: string;
  surfaceElevated: string;
  ink: string;
  inkSoft: string;
  muted: string;
  line: string;
  lineStrong: string;
  glassLine: string;
  glassFill: string;
  glassBorder: string;
  glassUnderlay: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  purple: string;
  orange: string;
  blue: string;
  green: string;
  indigo: string;
  teal: string;
  clay: string;
  terracotta: string;
  ochre: string;
  mauve: string;
  /** Semantic hub-row icon colors. */
  icons: ReturnType<typeof settingsIconColors>;
  accent: string;
  accentSoft: string;
  accentLine: string;
  shadow: string;
  blurTint: 'light' | 'dark';
  blurIntensity: number;
  tint: (hex: string, alpha: number) => string;
}

export function useSettingsTheme(): SettingsTheme {
  const { colorScheme } = useColorScheme();
  const forced = useForcedColorScheme();
  const accent = useAccent();
  const isDark = (forced ?? colorScheme) === 'dark';
  const base = isDark ? settingsDark : settingsLight;

  return useMemo(
    () => ({
      isDark,
      tamaguiTheme: (isDark ? 'settings_dark' : 'settings_light') as SettingsTamaguiThemeName,
      canvas: base.canvas,
      canvasSoft: base.canvasSoft,
      surface: base.surface,
      surfaceMuted: base.surfaceMuted,
      surfaceGlass: base.surfaceGlass,
      surfaceElevated: base.surfaceElevated,
      ink: base.ink,
      inkSoft: base.inkSoft,
      muted: base.muted,
      line: base.line,
      lineStrong: base.lineStrong,
      glassLine: base.glassLine,
      glassFill: base.glassFill,
      glassBorder: base.glassBorder,
      glassUnderlay: base.glassUnderlay,
      success: base.success,
      warning: base.warning,
      danger: base.danger,
      info: base.info,
      purple: base.purple,
      orange: base.orange,
      blue: base.blue,
      green: base.green,
      indigo: base.indigo,
      teal: base.teal,
      clay: base.clay,
      terracotta: base.terracotta,
      ochre: base.ochre,
      mauve: base.mauve,
      icons: settingsIconColors(base),
      accent,
      accentSoft: withAlpha(accent, isDark ? 0.22 : 0.12),
      accentLine: withAlpha(accent, isDark ? 0.5 : 0.4),
      shadow: base.shadow,
      blurTint: base.blurTint,
      blurIntensity: base.blurIntensity,
      tint: withAlpha,
    }),
    [accent, base, isDark],
  );
}
