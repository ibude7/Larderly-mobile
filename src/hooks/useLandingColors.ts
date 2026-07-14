import { useMemo } from 'react';
import { useAppColors } from './useAppColors';
import { useAccent } from '../theme/accent';

export type LandingColors = {
  canvas: string;
  ink: string;
  accent: string;
  muted: string;
  body: string;
  surface: string;
  line: string;
  white: string;
  success: string;
  danger: string;
  isDark: boolean;
};

/**
 * Theme-aware tokens for auth / onboarding (and Landing when not force-light).
 * Landing wraps itself in `ForcedColorScheme scheme="light"` so it stays cream.
 */
export function useLandingColors(): LandingColors {
  const c = useAppColors();
  const accent = useAccent();

  return useMemo(
    () => ({
      canvas: c.canvas,
      ink: c.ink,
      accent,
      muted: c.muted,
      body: c.inkSoft,
      surface: c.surface,
      line: c.glassLine,
      white: '#FFFFFF',
      success: c.success,
      danger: c.danger,
      isDark: c.blurTint === 'dark',
    }),
    [accent, c],
  );
}
