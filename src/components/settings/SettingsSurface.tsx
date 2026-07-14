import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { SettingsGlass } from './SettingsGlass';

interface SettingsSurfaceProps {
  children: ReactNode;
  radius?: number;
  contentStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  interactive?: boolean;
}

/** Settings Console surface — shared frosted glass (`SettingsGlass`). */
export function SettingsSurface({
  children,
  radius,
  contentStyle,
  style,
  elevated = true,
  interactive,
}: SettingsSurfaceProps) {
  return (
    <SettingsGlass
      radius={radius}
      style={style}
      contentStyle={contentStyle}
      interactive={interactive ?? elevated}
      elevated={elevated}
      glassStyle="regular"
    >
      {children}
    </SettingsGlass>
  );
}
