import { useCallback, useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { usePreferenceValues } from "../contexts/PreferenceValueContext";
import type { FontScale } from "../contexts/preferencesSchema";

const DESIGN_SHORT_EDGE = 390;
const MIN_UI_SCALE = 0.82;
const MAX_UI_SCALE = 1.28;
const APP_FONT_SCALE: Readonly<Record<FontScale, number>> = {
  sm: 0.9,
  md: 1,
  lg: 1.15,
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * Fits an absolute illustration or mock UI inside its measured container.
 * Unlike normal app copy, the whole composition scales as one decorative unit.
 */
export function fitScale(
  width: number,
  height: number,
  designWidth: number,
  designHeight: number,
): number {
  if (width <= 0 || height <= 0 || designWidth <= 0 || designHeight <= 0) {
    return 0;
  }

  return Math.min(width / designWidth, height / designHeight);
}

export function useScale() {
  const { width, height, fontScale: systemFontScale } = useWindowDimensions();
  const prefs = usePreferenceValues();
  const appFontScale = APP_FONT_SCALE[prefs.fontScale];
  const shortEdge = Math.min(width, height);
  const scaleFactor = clamp(
    shortEdge / DESIGN_SHORT_EDGE,
    MIN_UI_SCALE,
    MAX_UI_SCALE,
  );

  const s = useCallback((value: number) => value * scaleFactor, [scaleFactor]);

  // Text applies the system scale natively. fs adds only viewport and app
  // preference scaling so the system multiplier is never applied twice.
  const fs = useCallback(
    (value: number) => value * scaleFactor * appFontScale,
    [appFontScale, scaleFactor],
  );

  // Non-Text layout does not receive system font scaling. Use this for space
  // reserved around text-driven chrome such as headers, footers, and controls.
  const fsLayout = useCallback(
    (value: number) => value * scaleFactor * appFontScale * systemFontScale,
    [appFontScale, scaleFactor, systemFontScale],
  );

  const wp = useCallback((percent: number) => (width * percent) / 100, [width]);

  return useMemo(
    () => ({
      width,
      height,
      fontScale: systemFontScale,
      appFontScale,
      scaleFactor,
      s,
      fs,
      fsLayout,
      wp,
    }),
    [appFontScale, fs, fsLayout, height, s, scaleFactor, systemFontScale, width, wp],
  );
}
