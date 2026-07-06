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

export const lightColors: ColorTokens = {
  primary: '#EA7A3C',
  primaryDark: '#C85D24',
  canvas: '#F5F2EC',
  canvasRaised: '#FBF8F2',
  surface: '#FFFDF8',
  surfaceMuted: '#ECE7DD',
  surfaceGlass: 'rgba(255, 253, 248, 0.74)',
  surfaceElevated: '#FFFFFF',
  ink: '#27231F',
  inkSoft: '#4A443D',
  line: '#E2DACE',
  glassLine: 'rgba(255, 255, 255, 0.82)',
  muted: '#7D766E',
  success: '#287A55',
  warning: '#B7791F',
  danger: '#C9463D',
  info: '#256D85',
  teal: '#1F9A8A',
  amber: '#F59E0B',
  primaryGlow: 'rgba(234, 122, 60, 0.22)',
  tealGlow: 'rgba(31, 154, 138, 0.18)',
  dangerGlow: 'rgba(201, 70, 61, 0.16)',
  violetGlow: 'rgba(112, 84, 173, 0.12)',
  shadow: 'rgba(62, 45, 30, 0.16)',
  scrim: 'rgba(18, 15, 12, 0.46)',
  blurIntensity: 82,
  blurTint: 'light',
  lineStrong: '#CFC3B5',
  subtle: '#6F6860',
};

export const darkColors: ColorTokens = {
  primary: '#F28A4B',
  primaryDark: '#DB6D2F',
  canvas: '#090A0D',
  canvasRaised: '#101217',
  surface: '#171A21',
  surfaceMuted: '#20242D',
  surfaceGlass: 'rgba(23, 26, 33, 0.72)',
  surfaceElevated: '#222733',
  ink: '#F6F1EA',
  inkSoft: '#D7D0C7',
  line: '#303541',
  glassLine: 'rgba(255, 255, 255, 0.10)',
  muted: '#9A948D',
  success: '#55C28A',
  warning: '#F2B84B',
  danger: '#FF6A61',
  info: '#62B8D3',
  teal: '#44D0BE',
  amber: '#F59E0B',
  primaryGlow: 'rgba(242, 138, 75, 0.28)',
  tealGlow: 'rgba(68, 208, 190, 0.20)',
  dangerGlow: 'rgba(255, 106, 97, 0.20)',
  violetGlow: 'rgba(146, 121, 255, 0.18)',
  shadow: 'rgba(0, 0, 0, 0.46)',
  scrim: 'rgba(0, 0, 0, 0.58)',
  blurIntensity: 76,
  blurTint: 'dark',
  lineStrong: '#474D5D',
  subtle: '#B9B1A8',
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
