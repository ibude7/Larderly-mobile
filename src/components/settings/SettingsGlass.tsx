import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { GlassView, canUseRealGlass } from '../../lib/liquidGlass';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';

export { canUseRealGlass as canUseSettingsNativeGlass };

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
  const useRealGlass = canUseRealGlass();
  const borderRadius = radius ?? s(28);
  const isClear = glassStyle === 'clear';

  const glassTint = isClear
    ? undefined
    : accent
      ? c.tint(accent, c.isDark ? 0.24 : 0.14)
      : c.glassUnderlay;

  const fallbackFill = isClear
    ? 'transparent'
    : accent
      ? c.tint(accent, c.isDark ? 0.18 : 0.1)
      : c.glassFill;

  const borderColor = isClear
    ? 'transparent'
    : accent
      ? c.tint(accent, c.isDark ? 0.35 : 0.28)
      : c.glassBorder;
  const rimColor = isClear
    ? 'transparent'
    : accent
      ? c.tint(accent, c.isDark ? 0.18 : 0.16)
      : c.isDark
        ? 'rgba(255, 253, 246, 0.12)'
        : 'rgba(255, 255, 255, 0.72)';

  return (
    <View
      style={[
        styles.shell,
        {
          borderRadius,
          backgroundColor: useRealGlass ? 'transparent' : fallbackFill,
          shadowColor: c.isDark ? '#000000' : accent ?? c.ink,
          shadowRadius: elevated ? s(16) : 0,
          shadowOffset: { width: 0, height: elevated ? s(6) : 0 },
          shadowOpacity: elevated ? (c.isDark ? 0.45 : accent ? 0.16 : 0.12) : 0,
          elevation: elevated ? 8 : 0,
        },
        style,
      ]}
    >
      <GlassView
        glassEffectStyle={glassStyle}
        colorScheme={c.isDark ? 'dark' : 'light'}
        isInteractive={interactive}
        tintColor={useRealGlass ? glassTint : undefined}
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius,
            borderWidth: isClear ? 0 : StyleSheet.hairlineWidth * 1.5,
            borderColor,
            backgroundColor: useRealGlass ? 'transparent' : fallbackFill,
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
