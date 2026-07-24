import { View } from 'react-native';
import { Text, YStack } from 'tamagui';
import { SettingsGlass } from '../settings/SettingsGlass';
import { settingsType } from '../settings/settingsFonts';
import { useAppColors } from '../../hooks/useAppColors';
import { useScale } from '../../theme/scale';

export function HomeGlassHero({
  greeting,
  name,
}: {
  greeting: string;
  name: string;
}) {
  const { s, fs, fsLayout } = useScale();
  const c = useAppColors();

  return (
    <View
      style={{
        paddingHorizontal: s(16),
        paddingBottom: s(12),
      }}
      testID="home-glass-hero"
    >
      <SettingsGlass
        elevated
        interactive={false}
        radius={s(28)}
        style={{ width: '100%' }}
        contentStyle={{
          minHeight: fsLayout(220),
          paddingHorizontal: s(20),
          paddingVertical: s(22),
          justifyContent: 'flex-start',
        }}
      >
        <YStack style={{ gap: s(6) }}>
          <Text style={[settingsType('medium'), { fontSize: fs(14), color: c.muted }]}>{greeting}</Text>
          <Text
            numberOfLines={2}
            style={[settingsType('bold'), { fontSize: fs(32), color: c.ink, letterSpacing: fs(-0.8), lineHeight: fs(36) }]}
          >
            {name}
          </Text>
        </YStack>
      </SettingsGlass>
    </View>
  );
}
