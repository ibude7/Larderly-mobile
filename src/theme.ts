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

// "MarketOps" palette: crisp paper, ink rails, and categorical utility accents.
export const lightColors: ColorTokens = {
  primary: '#145CFF',
  primaryDark: '#0B2A6F',
  canvas: '#F4F1E8',
  canvasRaised: '#FBF8EF',
  surface: '#FFFDF6',
  surfaceMuted: '#E7E0D1',
  surfaceGlass: 'rgba(255, 253, 246, 0.94)',
  surfaceElevated: '#FFFFFF',
  ink: '#101010',
  inkSoft: '#38342D',
  line: '#1B1B1B',
  glassLine: 'rgba(16, 16, 16, 0.16)',
  muted: '#6D665B',
  success: '#0E8F58',
  warning: '#D88A00',
  danger: '#E13636',
  info: '#145CFF',
  teal: '#00A991',
  amber: '#F0B429',
  primaryGlow: 'rgba(20, 92, 255, 0.12)',
  tealGlow: 'rgba(0, 169, 145, 0.1)',
  dangerGlow: 'rgba(225, 54, 54, 0.12)',
  violetGlow: 'rgba(240, 180, 41, 0.12)',
  shadow: 'rgba(16, 16, 16, 0.18)',
  scrim: 'rgba(16, 16, 16, 0.62)',
  blurIntensity: 30,
  blurTint: 'light',
  lineStrong: '#101010',
  subtle: '#8C8375',
};

export const darkColors: ColorTokens = {
  primary: '#6EA1FF',
  primaryDark: '#145CFF',
  canvas: '#101010',
  canvasRaised: '#171713',
  surface: '#1E1D19',
  surfaceMuted: '#2A2822',
  surfaceGlass: 'rgba(30, 29, 25, 0.94)',
  surfaceElevated: '#26241F',
  ink: '#FFFDF6',
  inkSoft: '#E6DFD0',
  line: '#3B382F',
  glassLine: 'rgba(255, 253, 246, 0.14)',
  muted: '#B6AC9A',
  success: '#45D18F',
  warning: '#FFC247',
  danger: '#FF6E6E',
  info: '#6EA1FF',
  teal: '#4DDBC7',
  amber: '#FFD15C',
  primaryGlow: 'rgba(110, 161, 255, 0.18)',
  tealGlow: 'rgba(77, 219, 199, 0.14)',
  dangerGlow: 'rgba(255, 110, 110, 0.16)',
  violetGlow: 'rgba(255, 209, 92, 0.12)',
  shadow: 'rgba(0, 0, 0, 0.54)',
  scrim: 'rgba(0, 0, 0, 0.72)',
  blurIntensity: 28,
  blurTint: 'dark',
  lineStrong: '#FFFDF6',
  subtle: '#918778',
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
