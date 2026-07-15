import { Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text, XStack } from 'tamagui';
import { HomeArtIcon } from './HomeArtIcon';
import { SettingsGlass } from '../settings/SettingsGlass';
import { settingsType } from '../settings/settingsFonts';
import { useAppColors } from '../../hooks/useAppColors';
import { useScale } from '../../theme/scale';

export function HomeScanDock({ onScan }: { onScan: () => void }) {
  const { s, fs, fsLayout } = useScale();
  const c = useAppColors();

  return (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onScan();
      }}
      accessibilityRole="button"
      accessibilityLabel="Scan an item"
    >
      <SettingsGlass
        elevated
        interactive
        radius={s(22)}
        contentStyle={{
          minHeight: fsLayout(56),
          flexDirection: 'row',
          alignItems: 'center',
          gap: s(12),
          paddingHorizontal: s(14),
        }}
      >
        <View
          style={{
            width: s(40),
            height: s(40),
            borderRadius: s(12),
            overflow: 'hidden',
            backgroundColor: c.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <HomeArtIcon name="scan" size={40} />
        </View>
        <XStack style={{ flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={[settingsType('semibold'), { fontSize: fs(16), color: c.ink }]}>Scan an item</Text>
          <View
            style={{
              paddingHorizontal: s(12),
              paddingVertical: s(6),
              borderRadius: s(99),
              backgroundColor: `${c.primary}18`,
            }}
          >
            <Text style={[settingsType('semibold'), { fontSize: fs(12), color: c.primary }]}>Open</Text>
          </View>
        </XStack>
      </SettingsGlass>
    </Pressable>
  );
}
