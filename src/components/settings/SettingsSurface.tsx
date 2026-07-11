import { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LiquidGlassView } from '@callstack/liquid-glass';
import { canUseLiquidGlass } from '../../lib/liquidGlass';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';

interface SettingsSurfaceProps {
  children: ReactNode;
  radius?: number;
  /** Style applied to the inner content wrapper (padding, layout, etc.). */
  contentStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  /** Optional section accent used for a subtle left edge marker. */
  accent?: string;
}

/**
 * Frosted, theme-aware container that rhymes with the floating tab bar. Falls
 * back to a solid elevated surface where liquid glass is unavailable.
 */
export function SettingsSurface({ children, radius, contentStyle, style, accent }: SettingsSurfaceProps) {
  const { s } = useScale();
  const c = useSettingsTheme();
  const useNativeGlass = canUseLiquidGlass();
  const borderRadius = radius ?? s(18);

  const frameStyle = [
    {
      borderRadius,
      borderWidth: 1,
      borderColor: c.line,
      borderLeftWidth: accent ? s(3) : 1,
      borderLeftColor: accent ?? c.line,
      overflow: 'hidden' as const,
      backgroundColor: useNativeGlass ? 'transparent' : c.surface,
    },
    style,
  ];

  if (useNativeGlass) {
    return (
      <View style={frameStyle}>
        <LiquidGlassView
          effect="regular"
          colorScheme={c.blurTint === 'dark' ? 'dark' : 'light'}
          tintColor={c.blurTint === 'dark' ? 'rgba(30, 29, 25, 0.26)' : 'rgba(255, 253, 246, 0.34)'}
          style={[StyleSheet.absoluteFill, { backgroundColor: 'transparent' }]}
        />
        <View style={contentStyle}>{children}</View>
      </View>
    );
  }

  return (
    <View style={frameStyle}>
      <View style={contentStyle}>{children}</View>
    </View>
  );
}
