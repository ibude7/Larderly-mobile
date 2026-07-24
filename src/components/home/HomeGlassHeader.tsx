import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { XStack } from 'tamagui';
import { Bell, User } from '../ui/Glyph';
import AppLogo from '../ui/AppLogo';
import { SettingsChromeButton } from '../settings/SettingsChromeButton';
import { SETTINGS_ICON_STROKE } from '../settings/SettingsIconWell';
import { SettingsGlass } from '../settings/SettingsGlass';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../contexts/ProfileContext';
import { useAppColors } from '../../hooks/useAppColors';
import { useScale } from '../../theme/scale';
import type { TabScreenNavigationProp } from '../../navigation/types';

export function HomeGlassHeader() {
  const navigation = useNavigation<TabScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { s, fs } = useScale();
  const c = useAppColors();
  const { user } = useAuth();
  const { userProfile } = useProfile();

  const photoUrl = userProfile?.profilePictureUrl ?? user?.photoURL ?? '';
  const avatarSize = s(38);

  return (
    <View
      style={{
        paddingTop: insets.top + s(8),
        paddingHorizontal: s(16),
        paddingBottom: s(12),
      }}
      testID="home-glass-header"
    >
      <SettingsGlass
        elevated
        interactive={false}
        radius={s(28)}
        contentStyle={{
          paddingHorizontal: s(14),
          paddingVertical: s(12),
        }}
      >
        <XStack style={{ alignItems: 'center', justifyContent: 'space-between', gap: s(12) }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppLogo size="sm" showWordmark />
          </View>
          <XStack style={{ gap: s(8), flexShrink: 0 }}>
            <SettingsChromeButton
              icon={Bell}
              onPress={() => navigation.navigate('Notifications')}
              accessibilityLabel="Notifications"
            />
            <SettingsChromeButton
              onPress={() => navigation.navigate('Settings')}
              accessibilityLabel="Profile"
            >
              {photoUrl ? (
                <Image
                  source={{ uri: photoUrl }}
                  style={{
                    width: avatarSize,
                    height: avatarSize,
                    borderRadius: avatarSize / 2,
                  }}
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <User size={fs(19)} color={c.ink} strokeWidth={SETTINGS_ICON_STROKE} />
              )}
            </SettingsChromeButton>
          </XStack>
        </XStack>
      </SettingsGlass>
    </View>
  );
}
