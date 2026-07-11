import { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
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
 * back to a solid elevated surface where blur is unavailable.
 */
export function SettingsSurface({ children, radius, contentStyle, style, accent }: SettingsSurfaceProps) {
  const { s } = useScale();
  const c = useSettingsTheme();
  const borderRadius = radius ?? s(18);

  return (
    <View
      style={[
        {
          borderRadius,
          borderWidth: 1,
          borderColor: c.line,
          borderLeftWidth: accent ? s(3) : 1,
          borderLeftColor: accent ?? c.line,
          overflow: 'hidden',
          backgroundColor: Platform.OS === 'android' ? c.surface : 'transparent',
        },
        style,
      ]}
    >
      {Platform.OS === 'android' ? null : (
        <BlurView
          intensity={c.blurIntensity}
          tint={c.blurTint}
          style={[StyleSheet.absoluteFill, { backgroundColor: c.surfaceGlass }]}
        />
      )}
      <View style={contentStyle}>{children}</View>
    </View>
  );
}
