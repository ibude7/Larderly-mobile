import { ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useScale } from '../../theme/scale';
import { SettingsGlass } from '../settings/SettingsGlass';

interface FrostedNavbarGlassProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  borderRadius?: number;
}

/**
 * Floating tab-bar / nav glass — same Settings frosted material app-wide.
 */
export function FrostedNavbarGlass({
  children,
  style,
  contentStyle,
  borderRadius: borderRadiusProp,
}: FrostedNavbarGlassProps) {
  const { s } = useScale();

  return (
    <SettingsGlass
      elevated
      interactive
      radius={borderRadiusProp ?? s(28)}
      style={style}
      contentStyle={contentStyle}
    >
      {children}
    </SettingsGlass>
  );
}
