import { useCallback, useMemo } from "react";
import { useWindowDimensions } from "react-native";

const DESIGN_SHORT_EDGE = 390;
const MIN_UI_SCALE = 0.82;
const MAX_UI_SCALE = 1.28;

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
  const { width, height, fontScale } = useWindowDimensions();
  const shortEdge = Math.min(width, height);
  const scaleFactor = clamp(
    shortEdge / DESIGN_SHORT_EDGE,
    MIN_UI_SCALE,
    MAX_UI_SCALE,
  );

  const s = useCallback((value: number) => value * scaleFactor, [scaleFactor]);

  // React Native applies the user's font scale to Text automatically. fs only
  // adapts the design size to the current viewport, avoiding double scaling.
  const fs = s;

  // Non-Text layout does not receive system font scaling. Use this for space
  // reserved around text-driven chrome such as headers, footers, and controls.
  const fsLayout = useCallback(
    (value: number) => value * scaleFactor * fontScale,
    [fontScale, scaleFactor],
  );

  const wp = useCallback((percent: number) => (width * percent) / 100, [width]);

  return useMemo(
    () => ({
      width,
      height,
      fontScale,
      scaleFactor,
      s,
      fs,
      fsLayout,
      wp,
    }),
    [fontScale, fs, fsLayout, height, s, scaleFactor, width, wp],
  );
}
