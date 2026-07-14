import type { ReactNode } from 'react';
import { Image } from 'expo-image';
import { ChevronRight, User } from '../ui/Glyph';
import { Button, Text, View, XStack, YStack } from 'tamagui';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';
import { SETTINGS_ICON_STROKE } from './SettingsIconWell';
import { SettingsSurface } from './SettingsSurface';
import { settingsType } from './settingsFonts';

interface SettingsAccountCardProps {
  displayName: string;
  emailLine: string;
  photoUrl?: string;
  initials?: string;
  accessibilityLabel: string;
  onPress: () => void;
  badges?: ReactNode;
}

/**
 * Profile row — reference layout:
 * [avatar]  name / session / badge   [chevron]
 */
export function SettingsAccountCard({
  displayName,
  emailLine,
  photoUrl,
  initials,
  accessibilityLabel,
  onPress,
  badges,
}: SettingsAccountCardProps) {
  const { s, fs, fsLayout } = useScale();
  const c = useSettingsTheme();
  const avatar = s(52);

  return (
    <Button unstyled onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
      <SettingsSurface
        elevated
        radius={s(26)}
        contentStyle={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: s(12),
          paddingLeft: s(12),
          paddingRight: s(14),
          paddingVertical: s(12),
          minHeight: fsLayout(76),
        }}
      >
        {photoUrl ? (
          <View
            style={{
              width: avatar,
              height: avatar,
              borderRadius: avatar / 2,
              overflow: 'hidden',
              backgroundColor: c.surfaceMuted,
              flexShrink: 0,
            }}
          >
            <Image source={{ uri: photoUrl }} style={{ width: '100%', height: '100%' }} />
          </View>
        ) : initials ? (
          <View
            style={{
              width: avatar,
              height: avatar,
              borderRadius: avatar / 2,
              backgroundColor: c.accent,
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Text
              style={{
                ...settingsType('semibold'),
                fontSize: fs(17),
                color: '#FFFFFF',
              }}
              maxFontSizeMultiplier={1.2}
            >
              {initials}
            </Text>
          </View>
        ) : (
          <View
            style={{
              width: avatar,
              height: avatar,
              borderRadius: avatar / 2,
              backgroundColor: c.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(180,176,168,0.28)',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <User size={fs(22)} color={c.muted} strokeWidth={SETTINGS_ICON_STROKE} />
          </View>
        )}

        <YStack flex={1} style={{ minWidth: 0, justifyContent: 'center', gap: s(2) }}>
          <Text
            numberOfLines={1}
            style={{
              ...settingsType('semibold'),
              fontSize: fs(17),
              lineHeight: fs(22),
              color: c.ink,
              flexShrink: 0,
            }}
          >
            {displayName}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              ...settingsType('regular'),
              fontSize: fs(13),
              lineHeight: fs(17),
              color: c.muted,
              flexShrink: 0,
            }}
          >
            {emailLine}
          </Text>
          {badges ? (
            <XStack style={{ flexWrap: 'wrap', gap: s(6), marginTop: s(6) }}>{badges}</XStack>
          ) : null}
        </YStack>

        <ChevronRight size={fs(18)} color={c.muted} strokeWidth={SETTINGS_ICON_STROKE} />
      </SettingsSurface>
    </Button>
  );
}
