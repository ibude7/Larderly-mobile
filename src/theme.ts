/**
 * Larderly design tokens.
 *
 * These mirror the Tailwind theme in tailwind.config.js. Use the NativeWind
 * `className` API for styling components; use these constants where a raw
 * color value is needed (navigation options, StatusBar, SVG icon fills,
 * ActivityIndicator, etc.).
 */
export const colors = {
  primary: '#E87A3D',
  primaryDark: '#D96B2E',
  canvas: '#F4F2EE',
  surface: '#FFFFFF',
  surfaceMuted: '#FDFCFB',
  ink: '#2C2C2C',
  line: '#EAE8E3',
  muted: '#A09C96',
  // Semantic
  success: '#3B9E6E',
  warning: '#E0A63B',
  danger: '#D9524A',
  info: '#3B82F6',
} as const;

export const toastColors: Record<'success' | 'error' | 'info' | 'warning', string> = {
  success: colors.success,
  error: colors.danger,
  info: colors.info,
  warning: colors.warning,
};

export type AppColor = keyof typeof colors;
