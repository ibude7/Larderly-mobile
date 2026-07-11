import type { ComponentType, ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';
import { SettingsSurface } from './SettingsSurface';

type EmptyIcon = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

interface SettingsEmptyStateProps {
  title: string;
  body: string;
  icon?: EmptyIcon;
  accent?: string;
  children?: ReactNode;
}

/** Centered empty/placeholder surface for settings destinations with no active data. */
export function SettingsEmptyState({
  title,
  body,
  icon: Icon,
  accent,
  children,
}: SettingsEmptyStateProps) {
  const { s, fs } = useScale();
  const c = useSettingsTheme();

  return (
    <SettingsSurface accent={accent} contentStyle={{ padding: s(20), gap: s(12), alignItems: 'center' }}>
      {Icon ? (
        <View
          style={{
            width: s(48),
            height: s(48),
            borderRadius: s(24),
            backgroundColor: accent ? c.tint(accent, 0.14) : c.surfaceMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={fs(22)} color={accent ?? c.muted} strokeWidth={2} />
        </View>
      ) : null}
      <Text
        style={{
          fontSize: fs(16),
          lineHeight: fs(21),
          fontWeight: '600',
          color: c.ink,
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: fs(13.5),
          lineHeight: fs(19),
          color: c.inkSoft,
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        {body}
      </Text>
      {children ? <View style={{ width: '100%', gap: s(12), marginTop: s(4) }}>{children}</View> : null}
    </SettingsSurface>
  );
}
