import type { ComponentType, ReactNode } from 'react';
import { View } from 'react-native';
import { useScale } from '../../theme/scale';
import { SettingsGlass } from './SettingsGlass';

type WellIcon = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

export const SETTINGS_ICON_STROKE = 2.4;

interface SettingsIconWellProps {
  icon: WellIcon;
  color: string;
  /** Design px before scale. */
  size?: number;
  /** Icon size before scale; defaults to ~52% of well. */
  iconSize?: number;
  /** `circle` for status pills; `squircle` for list rows (iOS Settings). */
  shape?: 'circle' | 'squircle';
  children?: ReactNode;
}

/**
 * Icon well — same `SettingsGlass` material as cards/chrome, accent-tinted.
 */
export function SettingsIconWell({
  icon: Icon,
  color,
  size = 36,
  iconSize,
  shape = 'squircle',
}: SettingsIconWellProps) {
  const { s, fs } = useScale();
  const well = s(size);
  const glyph = fs(iconSize ?? Math.round(size * 0.5));
  const radius = shape === 'circle' ? well / 2 : s(Math.max(10, size * 0.28));

  return (
    <SettingsGlass
      interactive={false}
      elevated={false}
      accent={color}
      radius={radius}
      style={{ width: well, height: well, flexShrink: 0 }}
      contentStyle={{
        width: well,
        height: well,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View style={{ width: glyph, height: glyph, alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={glyph} color={color} strokeWidth={SETTINGS_ICON_STROKE} />
      </View>
    </SettingsGlass>
  );
}
