import { View, type StyleProp, type ViewStyle } from 'react-native';
import {
  GlassView as NativeGlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
  type GlassViewProps,
} from 'expo-glass-effect';

export type { GlassColorScheme, GlassStyle, GlassViewProps } from 'expo-glass-effect';

/** True when Expo can render native iOS liquid glass (UIGlassEffect). */
export function canUseLiquidGlass(): boolean {
  try {
    return isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
  } catch {
    return false;
  }
}

/**
 * Native `GlassView` only when the Expo module + Liquid Glass API are present.
 * Otherwise a plain `View` — never mount the unimplemented native adapter.
 */
export function GlassView({
  glassEffectStyle: _glassEffectStyle,
  isInteractive: _isInteractive,
  tintColor: _tintColor,
  colorScheme: _colorScheme,
  style,
  children,
  ...rest
}: GlassViewProps) {
  if (!canUseLiquidGlass()) {
    return (
      <View style={style as StyleProp<ViewStyle>} {...rest}>
        {children}
      </View>
    );
  }

  return (
    <NativeGlassView
      glassEffectStyle={_glassEffectStyle}
      isInteractive={_isInteractive}
      tintColor={_tintColor}
      colorScheme={_colorScheme}
      style={style}
      {...rest}
    >
      {children}
    </NativeGlassView>
  );
}
