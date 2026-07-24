import { Platform } from 'react-native';
import { brandBlue, brandGreen, brandOrange, brandPurple, brandRose, brandTeal } from './brand';
import { settingsLight } from './palette';

/**
 * Warm editorial palette for Landing (static light) — also a non-React fallback.
 * Landing stays light via `ForcedColorScheme`; auth/onboarding use `useLandingColors()`.
 */
export const landing = {
  canvas: settingsLight.canvas,
  ink: settingsLight.inkSoft,
  accent: settingsLight.terracotta,
  muted: '#8C8375',
  body: settingsLight.muted,
  surface: settingsLight.surface,
  line: settingsLight.glassLine,
  white: '#FFFFFF',
  success: settingsLight.success,
  danger: settingsLight.danger,
} as const;

/** Editorial accent palette — distinct hues for auth/onboarding steps. */
export const accentPalette = {
  terracotta: brandOrange.DEFAULT,
  sage: brandGreen.DEFAULT,
  dustyBlue: brandBlue.DEFAULT,
  plum: brandPurple.DEFAULT,
  ochre: brandOrange.light,
  clay: brandRose.DEFAULT,
  teal: brandTeal.DEFAULT,
} as const;

export type AccentColor = (typeof accentPalette)[keyof typeof accentPalette];

export const landingFonts = Platform.select({
  ios: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
    serif: 'Geist_600SemiBold',
    serifItalic: 'Geist_600SemiBold_Italic',
  },
  default: {
    regular: 'Outfit_400Regular',
    medium: 'Outfit_500Medium',
    semibold: 'Outfit_600SemiBold',
    bold: 'Outfit_700Bold',
    serif: 'Geist_600SemiBold',
    serifItalic: 'Geist_600SemiBold_Italic',
  },
})!;
