import type { ComponentType, ReactNode } from 'react';
import { Text, View, XStack, YStack } from 'tamagui';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';
import { SETTINGS_ICON_STROKE, SettingsIconWell } from './SettingsIconWell';
import { SettingsGlass } from './SettingsGlass';
import { SettingsSurface } from './SettingsSurface';
import { settingsType } from './settingsFonts';

type ChipIcon = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

interface SettingsStatusChipProps {
  label: string;
  color: string;
  icon?: ChipIcon;
}

export function SettingsStatusChip({ label, color, icon: Icon }: SettingsStatusChipProps) {
  const { s, fs } = useScale();

  return (
    <SettingsGlass
      interactive={false}
      elevated={false}
      accent={color}
      radius={s(999)}
      contentStyle={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: s(5),
        paddingHorizontal: s(10),
        paddingVertical: s(5),
      }}
    >
      <XStack accessible accessibilityLabel={label} style={{ alignItems: 'center', gap: s(5) }}>
        {Icon ? <Icon size={fs(13)} color={color} strokeWidth={SETTINGS_ICON_STROKE} /> : null}
        <Text
          style={{
            ...settingsType('semibold'),
            fontSize: fs(11.5),
            lineHeight: fs(15),
            color,
            flexShrink: 0,
          }}
        >
          {label}
        </Text>
      </XStack>
    </SettingsGlass>
  );
}

interface SettingsStatusCardProps {
  title: string;
  detail: string;
  color: string;
  icon: ChipIcon;
  badge?: boolean;
}

/** Short horizontal status pill — [icon] title/detail — compact like reference. */
export function SettingsStatusCard({
  title,
  detail,
  color,
  icon: Icon,
  badge,
}: SettingsStatusCardProps) {
  const { s, fs, fsLayout } = useScale();
  const c = useSettingsTheme();

  return (
    <View style={{ flex: 1, minWidth: 0, position: 'relative' }}>
      <SettingsSurface
        elevated
        interactive={false}
        radius={s(16)}
        contentStyle={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: s(8),
          paddingHorizontal: s(10),
          paddingVertical: s(10),
          minHeight: fsLayout(52),
        }}
      >
        <SettingsIconWell icon={Icon} color={color} size={30} iconSize={15} shape="circle" />
        <YStack style={{ flex: 1, minWidth: 0, gap: 0 }}>
          <Text
            numberOfLines={1}
            style={{
              ...settingsType('semibold'),
              fontSize: fs(12.5),
              lineHeight: fs(16),
              color,
              flexShrink: 0,
            }}
          >
            {title}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              ...settingsType('regular'),
              fontSize: fs(10.5),
              lineHeight: fs(13),
              color: c.muted,
              flexShrink: 0,
            }}
          >
            {detail}
          </Text>
        </YStack>
      </SettingsSurface>
      {badge ? (
        <View
          style={{
            position: 'absolute',
            top: s(8),
            right: s(8),
            width: s(7),
            height: s(7),
            borderRadius: s(4),
            backgroundColor: color,
            zIndex: 2,
          }}
        />
      ) : null}
    </View>
  );
}

export function SettingsStatusRail({
  children,
  accessible,
  accessibilityLabel,
}: {
  children: ReactNode;
  accessible?: boolean;
  accessibilityLabel?: string;
}) {
  const { s } = useScale();

  return (
    <View accessible={accessible} accessibilityLabel={accessibilityLabel}>
      <XStack style={{ gap: s(8), alignItems: 'stretch' }}>{children}</XStack>
    </View>
  );
}
