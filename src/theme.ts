export interface ColorTokens {
  readonly primary: string;
  readonly primaryDark: string;
  readonly canvas: string;
  readonly surface: string;
  readonly surfaceMuted: string;
  readonly ink: string;
  readonly line: string;
  readonly muted: string;
  readonly success: string;
  readonly warning: string;
  readonly danger: string;
  readonly info: string;
  readonly primaryGlow: string;
  readonly violetGlow: string;
  readonly blurIntensity: number;
  readonly blurTint: 'light' | 'dark';
  readonly lineStrong: string;
  readonly subtle: string;
}

export const lightColors: ColorTokens = {
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
  primaryGlow: 'rgba(232, 122, 61, 0.15)',
  violetGlow: 'rgba(139, 92, 246, 0.12)',
  blurIntensity: 80,
  blurTint: 'light',
  lineStrong: '#D1CFC9',
  subtle: '#8A8680',
};

export const darkColors: ColorTokens = {
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
  primaryGlow: 'rgba(240, 140, 82, 0.18)',
  violetGlow: 'rgba(167, 139, 250, 0.15)',
  blurIntensity: 70,
  blurTint: 'dark',
  lineStrong: '#3E3D4A',
  subtle: '#9E9BA8',
};

export const colors = lightColors;
export type AppColor = keyof ColorTokens;
export type AppColors = ColorTokens;

export const toastColors = (c: ColorTokens) => ({
  success: c.success,
  error: c.danger,
  info: c.info,
  warning: c.warning,
});
