import { useEffect, useState } from 'react';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Text, YStack } from 'tamagui';
import { FeaturePageShell } from '../components/main/FeaturePageShell';
import { SettingsGlass } from '../components/settings/SettingsGlass';
import { SettingsTextField } from '../components/settings/SettingsTextField';
import { settingsType } from '../components/settings/settingsFonts';
import { GlassButton } from '../components/landing/GlassButton';
import { useHousehold } from '../contexts/HouseholdContext';
import { useToast } from '../contexts/ToastContext';
import { useGoBack } from '../navigation/useGoBack';
import { useAppColors } from '../hooks/useAppColors';
import { useScale } from '../theme/scale';
import type { MainStackNavigationProp, MainStackParamList } from '../navigation/types';

export default function JoinScreen() {
  const navigation = useNavigation<MainStackNavigationProp>();
  const route = useRoute<RouteProp<MainStackParamList, 'Join'>>();
  const goBack = useGoBack();
  const { s, fs } = useScale();
  const c = useAppColors();
  const { showToast } = useToast();
  const { householdId, joinHousehold } = useHousehold();
  const [code, setCode] = useState((route.params?.code ?? '').toUpperCase());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (route.params?.code) setCode(route.params.code.toUpperCase());
  }, [route.params?.code]);

  const handleJoin = async () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 6) {
      showToast('Enter a valid invite code', 'warning');
      return;
    }
    setBusy(true);
    try {
      await joinHousehold(trimmed);
      showToast('Joined household', 'success');
      navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not join', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <FeaturePageShell title="Join household" subtitle="Use an invite code" onBack={goBack} variant="stack">
      {householdId ? (
        <SettingsGlass
          elevated
          interactive={false}
          radius={s(18)}
          contentStyle={{ padding: s(16), gap: s(8) }}
        >
          <Text style={[settingsType('semibold'), { fontSize: fs(16), color: c.ink }]}>
            You’re already in a household
          </Text>
          <Text style={[settingsType('regular'), { fontSize: fs(14), color: c.muted, lineHeight: fs(20) }]}>
            Leave your current household from Settings before joining another.
          </Text>
          <GlassButton
            label="Open household settings"
            variant="light"
            frosted
            onPress={() => navigation.navigate('SettingsHousehold')}
          />
        </SettingsGlass>
      ) : (
        <YStack style={{ gap: s(14) }}>
          <SettingsTextField
            label="Invite code"
            value={code}
            onChangeText={(v) => setCode(v.toUpperCase())}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="ABCD1234"
            maxLength={12}
          />
          <GlassButton
            label="Join household"
            variant="amber"
            loading={busy}
            onPress={() => void handleJoin()}
          />
        </YStack>
      )}
    </FeaturePageShell>
  );
}
