import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { ChevronRight, User } from 'lucide-react-native';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';
import { SettingsSurface } from './SettingsSurface';
import { SETTINGS_SECTION_COLORS } from './settingsHelpers';

interface SettingsAccountCardProps {
  displayName: string;
  emailLine: string;
  photoUrl?: string;
  initials?: string;
  accessibilityLabel: string;
  onPress: () => void;
  badges?: ReactNode;
}

/** Compact horizontal identity surface for the Settings Console hub. */
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

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <SettingsSurface
        radius={s(18)}
        contentStyle={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: s(12),
          paddingHorizontal: s(14),
          paddingVertical: s(12),
          minHeight: fsLayout(72),
        }}
      >
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            style={{
              width: s(48),
              height: s(48),
              borderRadius: s(24),
              borderWidth: 1,
              borderColor: c.line,
            }}
          />
        ) : initials ? (
          <View
            style={{
              width: s(48),
              height: s(48),
              borderRadius: s(24),
              backgroundColor: SETTINGS_SECTION_COLORS.account,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: fs(16),
                fontWeight: '600',
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
              width: s(48),
              height: s(48),
              borderRadius: s(24),
              borderWidth: 1,
              borderColor: c.line,
              backgroundColor: c.surfaceMuted,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <User size={fs(20)} color={c.muted} strokeWidth={2} />
          </View>
        )}

        <View style={{ flex: 1, minWidth: 0, gap: s(4) }}>
          <Text
            style={{
              fontSize: fs(15),
              lineHeight: fs(20),
              fontWeight: '600',
              color: c.ink,
              flexShrink: 0,
            }}
            numberOfLines={1}
          >
            {displayName}
          </Text>
          <Text
            style={{
              fontSize: fs(12.5),
              lineHeight: fs(16),
              color: c.muted,
              flexShrink: 0,
            }}
            numberOfLines={1}
          >
            {emailLine}
          </Text>
          {badges ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s(6), marginTop: s(2) }}>
              {badges}
            </View>
          ) : null}
        </View>

        <ChevronRight size={fs(18)} color={c.muted} strokeWidth={2} />
      </SettingsSurface>
    </Pressable>
  );
}
