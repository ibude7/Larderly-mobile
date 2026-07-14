import type { ComponentType, ReactNode } from 'react';
import { Text, View, YStack } from 'tamagui';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';
import { SettingsSurface } from './SettingsSurface';
import { settingsFonts } from './settingsFonts';

type EmptyIcon = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

interface SettingsEmptyStateProps {
  title: string;
  body: string;
  icon?: EmptyIcon;
  children?: ReactNode;
}

/** Centered empty/placeholder surface for settings destinations with no active data. */
export function SettingsEmptyState({
  title,
  body,
  icon: Icon,
  children,
}: SettingsEmptyStateProps) {
  const { s, fs } = useScale();
  const c = useSettingsTheme();

  return (
    <SettingsSurface
      elevated
      contentStyle={{ padding: s(24), gap: s(12), alignItems: 'center' }}
    >
      {Icon ? (
        <View
          style={{
            width: s(52),
            height: s(52),
            borderRadius: s(26),
            backgroundColor: c.surfaceMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={fs(22)} color={c.ink} strokeWidth={2} />
        </View>
      ) : null}
      <Text
        style={{
          fontFamily: settingsFonts.semibold,
          fontSize: fs(16),
          lineHeight: fs(21),
          color: c.ink,
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontFamily: settingsFonts.regular,
          fontSize: fs(13.5),
          lineHeight: fs(19),
          color: c.inkSoft,
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        {body}
      </Text>
      {children ? (
        <YStack style={{ width: '100%', gap: s(12), marginTop: s(4) }}>{children}</YStack>
      ) : null}
    </SettingsSurface>
  );
}
