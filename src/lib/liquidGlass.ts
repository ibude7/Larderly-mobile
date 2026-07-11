import { isLiquidGlassSupported } from '@callstack/liquid-glass';

export function canUseLiquidGlass() {
  return isLiquidGlassSupported;
}
