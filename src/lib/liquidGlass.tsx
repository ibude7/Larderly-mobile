import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import {
  GlassView as NativeGlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
  type GlassEffectStyleConfig,
  type GlassStyle,
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

/** True when we can render real frosted material (native glass or BlurView). */
export function canUseRealGlass(): boolean {
  return canUseLiquidGlass() || Platform.OS === 'ios' || Platform.OS === 'android';
}

function resolveGlassStyle(
  glassEffectStyle: GlassStyle | GlassEffectStyleConfig | undefined,
): GlassStyle {
  if (!glassEffectStyle) return 'regular';
  return typeof glassEffectStyle === 'string' ? glassEffectStyle : glassEffectStyle.style;
}

function blurIntensityForStyle(
  glassEffectStyle: GlassStyle | GlassEffectStyleConfig | undefined,
): number {
  const style = resolveGlassStyle(glassEffectStyle);
  if (style === 'clear') {
    return Platform.OS === 'android' ? 55 : 40;
  }
  return Platform.OS === 'android' ? 85 : 58;
}

/**
 * Native liquid glass when available; otherwise real BlurView frost.
 * Never paints a flat cream overlay in place of blur.
 */
export function GlassView({
  glassEffectStyle = 'regular',
  isInteractive: _isInteractive,
  tintColor,
  colorScheme = 'light',
  style,
  children,
  ...rest
}: GlassViewProps) {
  if (canUseLiquidGlass()) {
    return (
      <NativeGlassView
        glassEffectStyle={glassEffectStyle}
        isInteractive={_isInteractive}
        tintColor={tintColor}
        colorScheme={colorScheme}
        style={style}
        {...rest}
      >
        {children}
      </NativeGlassView>
    );
  }

  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    const flatStyle = StyleSheet.flatten(style as StyleProp<ViewStyle>) ?? {};

    return (
      <View
        style={[
          style,
          {
            overflow: 'hidden',
            backgroundColor: 'transparent',
          },
        ]}
        {...rest}
      >
        <BlurView
          intensity={blurIntensityForStyle(glassEffectStyle)}
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
          blurMethod={Platform.OS === 'android' ? 'dimezisBlurViewSdk31Plus' : undefined}
        />
        {tintColor ? (
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { backgroundColor: tintColor }]}
          />
        ) : null}
        {children}
      </View>
    );
  }

  return (
    <View
      style={[
        style,
        {
          backgroundColor: tintColor ?? 'rgba(255, 255, 255, 0.72)',
        },
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
