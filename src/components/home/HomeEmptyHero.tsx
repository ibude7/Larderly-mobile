import { Platform, Pressable, View } from 'react-native';
import { Text, YStack } from 'tamagui';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ScanBarcode } from '../ui/Glyph';
import { GlassButton } from '../landing/GlassButton';
import { SettingsGlass } from '../settings/SettingsGlass';
import { settingsType } from '../settings/settingsFonts';
import { useAppColors } from '../../hooks/useAppColors';
import { useScale } from '../../theme/scale';

type HomeEmptyHeroProps = {
  onScan: () => void;
  onManual: () => void;
};

/** Empty pantry CTA — scan first, add manually second. */
export function HomeEmptyHero({ onScan, onManual }: HomeEmptyHeroProps) {
  const { s, fs, fsLayout } = useScale();
  const c = useAppColors();

  return (
    <Animated.View entering={FadeInDown.springify().damping(17)} testID="home-empty-hero">
      <SettingsGlass
        elevated
        interactive={false}
        radius={s(28)}
        contentStyle={{
          alignItems: 'center',
          paddingHorizontal: s(20),
          paddingTop: s(24),
          paddingBottom: s(20),
          gap: s(12),
        }}
      >
        <View
          style={{
            width: s(64),
            height: s(64),
            borderRadius: s(22),
            backgroundColor: `${c.primary}18`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ScanBarcode size={fs(28)} color={c.primary} strokeWidth={2.2} />
        </View>

        <Text
          style={{
            fontFamily: 'Fraunces_700Bold',
            fontWeight: Platform.OS === 'ios' ? '700' : undefined,
            fontSize: fs(24),
            lineHeight: fs(30),
            letterSpacing: fs(-0.5),
            color: c.ink,
            textAlign: 'center',
          }}
        >
          Your pantry is empty
        </Text>

        <Text
          style={[
            settingsType('regular'),
            {
              fontSize: fs(14),
              lineHeight: fs(20),
              color: c.muted,
              textAlign: 'center',
              maxWidth: s(280),
            },
          ]}
        >
          Scan a barcode or add an item manually to start tracking what you have.
        </Text>

        <YStack style={{ width: '100%', gap: s(10), marginTop: s(4) }}>
          <GlassButton label="Scan to start" variant="amber" showArrow onPress={onScan} />
          <Pressable
            onPress={onManual}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Add manually"
            style={{
              minHeight: fsLayout(40),
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={[settingsType('semibold'), { fontSize: fs(14), color: c.primary }]}>
              Add manually
            </Text>
          </Pressable>
        </YStack>
      </SettingsGlass>
    </Animated.View>
  );
}
