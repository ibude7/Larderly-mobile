/** Fit an illustration inside a measured box while preserving aspect ratio. */
export function fitHeroSize(
  boxW: number,
  boxH: number,
  aspect: number,
  maxW: number,
): { width: number; height: number } {
  if (boxW <= 0 || boxH <= 0 || aspect <= 0) {
    return { width: 0, height: 0 };
  }
  let width = Math.min(boxW, maxW);
  let height = width / aspect;
  if (height > boxH) {
    height = boxH;
    width = height * aspect;
  }
  return { width, height };
}
