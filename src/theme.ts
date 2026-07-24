import { settingsDark, settingsLight, type SettingsPalette } from './theme/palette';
import { brandOrange, brandOrangeDark } from './theme/brand';

export interface ColorTokens {
  readonly primary: string;
  readonly primaryDark: string;
  readonly canvas: string;
  readonly canvasRaised: string;
  readonly surface: string;
  readonly surfaceMuted: string;
  readonly surfaceGlass: string;
  readonly surfaceElevated: string;
  readonly ink: string;
  readonly inkSoft: string;
  readonly line: string;
  readonly glassLine: string;
  readonly glassFill: string;
  readonly glassBorder: string;
  readonly glassUnderlay: string;
  readonly muted: string;
  readonly success: string;
  readonly warning: string;
  readonly danger: string;
  readonly info: string;
  readonly teal: string;
  readonly amber: string;
  readonly primaryGlow: string;
  readonly tealGlow: string;
  readonly dangerGlow: string;
  readonly violetGlow: string;
  readonly shadow: string;
  readonly scrim: string;
  readonly blurIntensity: number;
  readonly blurTint: 'light' | 'dark';
  readonly lineStrong: string;
  readonly subtle: string;
}

/** Global app palette — settings light/dark (warm editorial + glass). */
function fromSettings(
  base: SettingsPalette | typeof settingsDark,
  extras: {
    primary: string;
    primaryDark: string;
    primaryGlow: string;
    amber: string;
    tealGlow: string;
    dangerGlow: string;
    violetGlow: string;
    scrim: string;
    subtle: string;
  },
): ColorTokens {
  return {
    primary: extras.primary,
    primaryDark: extras.primaryDark,
    canvas: base.canvas,
    canvasRaised: base.canvasSoft,
    surface: base.surface,
    surfaceMuted: base.surfaceMuted,
    surfaceGlass: base.surfaceGlass,
    surfaceElevated: base.surfaceElevated,
    ink: base.ink,
    inkSoft: base.inkSoft,
    line: base.line,
    glassLine: base.glassLine,
    glassFill: base.glassFill,
    glassBorder: base.glassBorder,
    glassUnderlay: base.glassUnderlay,
    muted: base.muted,
    success: base.success,
    warning: base.warning,
    danger: base.danger,
    info: base.info,
    teal: base.teal,
    amber: extras.amber,
    primaryGlow: extras.primaryGlow,
    tealGlow: extras.tealGlow,
    dangerGlow: extras.dangerGlow,
    violetGlow: extras.violetGlow,
    shadow: base.shadow,
    scrim: extras.scrim,
    blurIntensity: base.blurIntensity,
    blurTint: base.blurTint,
    lineStrong: base.lineStrong,
    subtle: extras.subtle,
  };
}

export const lightColors: ColorTokens = fromSettings(settingsLight, {
  primary: brandOrange.DEFAULT,
  primaryDark: brandOrange.dark,
  primaryGlow: brandOrange.glow,
  amber: brandOrange.light,
  tealGlow: 'rgba(79, 139, 133, 0.12)',
  dangerGlow: 'rgba(181, 74, 58, 0.12)',
  violetGlow: 'rgba(139, 107, 158, 0.12)',
  scrim: 'rgba(16, 16, 16, 0.62)',
  subtle: '#8C8375',
});

export const darkColors: ColorTokens = fromSettings(settingsDark, {
  primary: brandOrangeDark.primary,
  primaryDark: brandOrangeDark.primaryDark,
  primaryGlow: brandOrangeDark.glow,
  amber: brandOrange.light,
  tealGlow: 'rgba(107, 168, 161, 0.14)',
  dangerGlow: 'rgba(224, 122, 106, 0.16)',
  violetGlow: 'rgba(184, 150, 201, 0.14)',
  scrim: 'rgba(0, 0, 0, 0.72)',
  subtle: '#918778',
});

export const colors = lightColors;
export type AppColor = keyof ColorTokens;
export type AppColors = ColorTokens;

export const toastColors = (c: ColorTokens) => ({
  success: c.success,
  error: c.danger,
  info: c.info,
  warning: c.warning,
});
