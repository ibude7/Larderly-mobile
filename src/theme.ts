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

// "Orchard OS" palette — vibrant botanical: radish pink, yuzu yellow, fresh green.
export const lightColors: ColorTokens = {
  primary: '#FF3366',
  primaryDark: '#E01F52',
  canvas: '#F5F4F0',
  canvasRaised: '#FBFAF7',
  surface: '#FFFFFF',
  surfaceMuted: '#EFEFE8',
  surfaceGlass: 'rgba(255, 255, 255, 0.78)',
  surfaceElevated: '#FFFFFF',
  ink: '#0A110D',
  inkSoft: '#3D4742',
  line: '#E2E2D9',
  glassLine: 'rgba(255, 255, 255, 0.85)',
  muted: '#5C6661',
  success: '#0A9E76',
  warning: '#B78900',
  danger: '#E02D57',
  info: '#0E7490',
  teal: '#00C896',
  amber: '#FFB800',
  primaryGlow: 'rgba(255, 51, 102, 0.16)',
  tealGlow: 'rgba(0, 200, 150, 0.14)',
  dangerGlow: 'rgba(224, 45, 87, 0.14)',
  violetGlow: 'rgba(255, 184, 0, 0.12)',
  shadow: 'rgba(10, 17, 13, 0.14)',
  scrim: 'rgba(10, 17, 13, 0.46)',
  blurIntensity: 82,
  blurTint: 'light',
  lineStrong: '#C9C9BD',
  subtle: '#6E7871',
};

export const darkColors: ColorTokens = {
  primary: '#FF4D79',
  primaryDark: '#E63866',
  canvas: '#0F1410',
  canvasRaised: '#151C17',
  surface: '#1A221C',
  surfaceMuted: '#253028',
  surfaceGlass: 'rgba(26, 34, 28, 0.74)',
  surfaceElevated: '#2A3630',
  ink: '#F5F4F0',
  inkSoft: '#D6DDD8',
  line: '#2C3930',
  glassLine: 'rgba(255, 255, 255, 0.10)',
  muted: '#A3B3AA',
  success: '#1AE0AD',
  warning: '#FFE033',
  danger: '#FF4D79',
  info: '#6BC7E8',
  teal: '#1AE0AD',
  amber: '#FFD600',
  primaryGlow: 'rgba(255, 77, 121, 0.24)',
  tealGlow: 'rgba(26, 224, 173, 0.16)',
  dangerGlow: 'rgba(255, 77, 121, 0.20)',
  violetGlow: 'rgba(255, 224, 51, 0.12)',
  shadow: 'rgba(0, 0, 0, 0.48)',
  scrim: 'rgba(0, 0, 0, 0.58)',
  blurIntensity: 76,
  blurTint: 'dark',
  lineStrong: '#435247',
  subtle: '#8FA096',
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
