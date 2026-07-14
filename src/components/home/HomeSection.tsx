import type { ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { ChevronRight } from '../ui/Glyph';
import { SettingsGlass } from '../settings/SettingsGlass';
import { settingsType } from '../settings/settingsFonts';
import { useAppColors } from '../../hooks/useAppColors';
import { useScale } from '../../theme/scale';

export function HomeSectionHeader({
  title,
  subtitle,
  actionLabel = 'View all',
  onAction,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { s, fs } = useScale();
  const c = useAppColors();

  return (
    <XStack style={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: s(12) }}>
      <YStack style={{ flex: 1, minWidth: 0, gap: s(2) }}>
        <Text style={[settingsType('bold'), { fontSize: fs(18), color: c.ink, letterSpacing: fs(-0.3) }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[settingsType('regular'), { fontSize: fs(13), color: c.muted, lineHeight: fs(18) }]}>
            {subtitle}
          </Text>
        ) : null}
      </YStack>
      {onAction ? (
        <Pressable
          onPress={onAction}
          hitSlop={8}
          style={{ flexDirection: 'row', alignItems: 'center', gap: s(2), paddingTop: s(2) }}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={[settingsType('semibold'), { fontSize: fs(13), color: c.muted }]}>{actionLabel}</Text>
          <ChevronRight size={fs(14)} color={c.muted} strokeWidth={2.2} />
        </Pressable>
      ) : null}
    </XStack>
  );
}

/** Settings frosted glass panel — same material as Settings cards. */
export function HomePanel({
  children,
  style,
  contentStyle,
  onPress,
  radius,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
  radius?: number;
}) {
  const { s } = useScale();
  const body = (
    <SettingsGlass
      elevated
      interactive={Boolean(onPress)}
      radius={radius ?? s(22)}
      style={style}
      contentStyle={[{ padding: s(14), gap: s(10) }, contentStyle]}
    >
      {children}
    </SettingsGlass>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      {body}
    </Pressable>
  );
}
