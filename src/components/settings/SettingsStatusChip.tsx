import type { ComponentType } from 'react';
import { Text, View } from 'react-native';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';

type ChipIcon = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

interface SettingsStatusChipProps {
  label: string;
  color: string;
  icon?: ChipIcon;
}

/** Compact read-only status pill (e.g. permission state, sync health). */
export function SettingsStatusChip({ label, color, icon: Icon }: SettingsStatusChipProps) {
  const { s, fs } = useScale();
  const c = useSettingsTheme();

  return (
    <View
      accessible
      accessibilityLabel={label}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: s(5),
        paddingHorizontal: s(9),
        paddingVertical: s(4),
        borderRadius: s(999),
        borderWidth: 1,
        borderColor: c.tint(color, 0.36),
        backgroundColor: c.tint(color, 0.12),
      }}
    >
      {Icon ? <Icon size={fs(12)} color={color} strokeWidth={2.4} /> : null}
      <Text
        style={{
          fontSize: fs(11.5),
          lineHeight: fs(15),
          fontWeight: '600',
          color,
          flexShrink: 0,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
