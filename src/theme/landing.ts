import { Platform } from 'react-native';

/** Warm editorial palette shared by Landing, Auth, and Onboarding. */
export const landing = {
  canvas: '#F4F1E8',
  ink: '#2E2B26',
  accent: '#C2662D',
  muted: '#8C8375',
  body: '#6D665B',
  surface: '#FFFDF6',
  line: 'rgba(46, 43, 38, 0.14)',
  white: '#FFFFFF',
  success: '#3D7A4A',
  danger: '#B54A3A',
} as const;

/** Editorial accent palette — distinct hues for auth/onboarding steps, layered over the warm cream base. */
export const accentPalette = {
  terracotta: '#C2662D',
  sage: '#6E8B5A',
  dustyBlue: '#5B7B93',
  plum: '#8B6B9E',
  ochre: '#C79A3D',
  clay: '#B5573F',
  teal: '#4F8B85',
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
