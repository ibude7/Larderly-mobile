export const lightColors = {
  primary: '#E87A3D',
  primaryDark: '#D96B2E',
  canvas: '#F4F2EE',
  surface: '#FFFFFF',
  surfaceMuted: '#FDFCFB',
  ink: '#2C2C2C',
  line: '#EAE8E3',
  muted: '#A09C96',
  success: '#3B9E6E',
  warning: '#E0A63B',
  danger: '#D9524A',
  info: '#3B82F6',
} as const;

export const darkColors = {
  primary: '#F08C52',
  primaryDark: '#E87A3D',
  canvas: '#0F0F13',
  surface: '#1A1A22',
  surfaceMuted: '#14141C',
  ink: '#F0EEE9',
  line: '#2A2A35',
  muted: '#6B6878',
  success: '#4DB87F',
  warning: '#F0B84A',
  danger: '#E8605A',
  info: '#5B9CF8',
} as const;

// Keep `colors` as the light default for any file that imports it unchanged
export const colors = lightColors;
export type AppColor = keyof typeof lightColors;
export type ColorTokens = typeof lightColors;
export type AppColors = ColorTokens;

export const toastColors = (c: ColorTokens) => ({
  success: c.success,
  error: c.danger,
  info: c.info,
  warning: c.warning,
});
