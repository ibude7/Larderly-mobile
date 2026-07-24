/**
 * Shared warm-editorial palette — source of truth for Settings + global app theme.
 * Keep this file free of React hooks to avoid circular imports.
 */

import {
  brandBlue,
  brandBlueDark,
  brandGreen,
  brandGreenDark,
  brandOrange,
  brandOrangeDark,
  brandPurple,
  brandPurpleDark,
  brandRose,
  brandRoseDark,
  brandTeal,
  brandTealDark,
} from './brand';

export const settingsLight = {
  canvas: '#F4F1E8',
  canvasSoft: '#FBF8EF',
  surface: '#FFFDF6',
  surfaceMuted: '#E7E0D1',
  surfaceGlass: 'rgba(255, 253, 246, 0.94)',
  surfaceElevated: '#FFFFFF',
  ink: '#101010',
  inkSoft: '#38342D',
  muted: '#6D665B',
  line: '#1B1B1B',
  lineStrong: '#101010',
  glassLine: 'rgba(16, 16, 16, 0.16)',
  glassFill: 'rgba(255, 255, 255, 0.78)',
  glassBorder: 'rgba(255,255,255,0.72)',
  glassUnderlay: 'rgba(255, 255, 255, 0.32)',
  success: brandGreen.DEFAULT,
  warning: '#C79A3D',
  danger: '#B54A3A',
  info: brandBlue.DEFAULT,
  purple: brandPurple.DEFAULT,
  orange: brandOrange.DEFAULT,
  blue: brandBlue.DEFAULT,
  green: brandGreen.DEFAULT,
  indigo: brandPurple.dark,
  teal: brandTeal.DEFAULT,
  clay: brandRose.DEFAULT,
  terracotta: brandOrange.DEFAULT,
  ochre: brandOrange.light,
  mauve: '#9B6B8A',
  shadow: 'rgba(20, 20, 30, 0.1)',
  blurTint: 'light' as const,
  blurIntensity: 55,
};

export const settingsDark = {
  canvas: '#101010',
  canvasSoft: '#171713',
  surface: '#1E1D19',
  surfaceMuted: '#2A2822',
  surfaceGlass: 'rgba(30, 29, 25, 0.94)',
  surfaceElevated: '#26241F',
  ink: '#FFFDF6',
  inkSoft: '#E6DFD0',
  muted: '#B6AC9A',
  line: 'rgba(255, 253, 246, 0.14)',
  lineStrong: 'rgba(255, 253, 246, 0.28)',
  glassLine: 'rgba(255, 253, 246, 0.14)',
  glassFill: 'rgba(30, 29, 25, 0.72)',
  glassBorder: 'rgba(0,0,0,0.45)',
  glassUnderlay: 'rgba(16, 16, 16, 0.47)',
  success: brandGreenDark.primary,
  warning: '#E0B85C',
  danger: '#E07A6A',
  info: brandBlueDark.primary,
  purple: brandPurpleDark.primary,
  orange: brandOrangeDark.primary,
  blue: brandBlueDark.primary,
  green: brandGreenDark.primary,
  indigo: brandPurpleDark.primaryDark,
  teal: brandTealDark.primary,
  clay: brandRoseDark.primary,
  terracotta: brandOrangeDark.primary,
  ochre: brandOrange.light,
  mauve: '#C49BB0',
  shadow: 'rgba(0, 0, 0, 0.54)',
  blurTint: 'dark' as const,
  blurIntensity: 28,
};

export type SettingsPalette = {
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
  shadow: string;
  blurTint: 'light' | 'dark';
  blurIntensity: number;
};
