import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { GlassView, canUseLiquidGlass } from '../../lib/liquidGlass';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';
import { landing } from '../../theme/landing';

export { canUseLiquidGlass as canUseSettingsNativeGlass };

interface SettingsGlassProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  radius?: number;
  interactive?: boolean;
  glassStyle?: 'clear' | 'regular';
  elevated?: boolean;
  /** Soft accent wash for icon wells — same glass stack, tinted. */
  accent?: string;
}

/**
 * Single frosted-glass material for all Settings surfaces
 * (cards, chrome, icon wells, sheets) — floating tab-bar stack.
 */
export function SettingsGlass({
  children,
  style,
  contentStyle,
  radius,
  interactive = true,
  glassStyle = 'regular',
  elevated = true,
  accent,
}: SettingsGlassProps) {
  const { s } = useScale();
  const c = useSettingsTheme();
  const useNativeGlass = canUseLiquidGlass();
  const borderRadius = radius ?? s(28);
  const isClear = glassStyle === 'clear';

  const glassCanvas = c.isDark ? c.canvas : landing.canvas;

  const canvasTint = isClear
    ? undefined
    : accent
      ? c.tint(accent, c.isDark ? 0.3 : 0.2)
      : `${glassCanvas}94`;
  const canvasUnderlay = isClear
    ? 'transparent'
    : accent
      ? c.tint(accent, c.isDark ? 0.18 : 0.1)
      : `${glassCanvas}47`;
  // Light theme → light edge; dark theme → dark edge.
  const borderColor = isClear
    ? 'transparent'
    : accent
      ? c.tint(accent, c.isDark ? 0.35 : 0.28)
      : c.isDark
        ? 'rgba(0,0,0,0.45)'
        : 'rgba(255,255,255,0.72)';
  const rimColor = isClear
    ? 'transparent'
    : accent
      ? c.tint(accent, c.isDark ? 0.18 : 0.16)
      : c.isDark
        ? 'rgba(0,0,0,0.28)'
        : 'rgba(255,255,255,0.55)';

  return (
    <View
      style={[
        styles.shell,
        {
          borderRadius,
          backgroundColor: canvasUnderlay,
          shadowColor: c.isDark ? '#000000' : accent ?? landing.ink,
          shadowRadius: elevated ? s(20) : 0,
          shadowOffset: { width: 0, height: elevated ? s(8) : 0 },
          shadowOpacity: elevated ? (c.isDark ? 0.55 : accent ? 0.2 : 0.8) : 0,
          elevation: elevated ? 12 : 0,
        },
        style,
      ]}
    >
      <GlassView
        glassEffectStyle={glassStyle}
        colorScheme={c.isDark ? 'dark' : 'light'}
        isInteractive={interactive}
        tintColor={canvasTint}
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius,
            borderWidth: isClear ? 0 : StyleSheet.hairlineWidth * 1.5,
            borderColor,
            backgroundColor: useNativeGlass
              ? 'transparent'
              : isClear
                ? 'transparent'
                : canvasTint,
          },
        ]}
      />

      {!isClear ? (
        <View
          pointerEvents="none"
          style={[
            styles.rim,
            {
              borderRadius: Math.max(0, borderRadius - 1),
              margin: s(1),
              borderColor: rimColor,
            },
          ]}
        />
      ) : null}

      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    overflow: 'hidden',
  },
  rim: {
    ...StyleSheet.absoluteFill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  content: {
    zIndex: 1,
  },
});
