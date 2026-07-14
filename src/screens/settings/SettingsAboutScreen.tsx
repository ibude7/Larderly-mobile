import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import { Linking, Platform } from 'react-native';
import {
  Activity,
  BadgeInfo,
  FileText,
  Fingerprint,
  Scale,
  ScrollText,
  TriangleAlert,
} from '../../components/ui/Glyph';
import { Text, View, YStack } from 'tamagui';
import { SettingsFieldLabel } from '../../components/settings/SettingsFieldLabel';
import { SettingsPageShell } from '../../components/settings/SettingsPageShell';
import { SettingsRow } from '../../components/settings/SettingsRow';
import { SettingsRowGroup } from '../../components/settings/SettingsRowGroup';
import { SettingsSurface } from '../../components/settings/SettingsSurface';
import { settingsFonts } from '../../components/settings/settingsFonts';
import { useToast } from '../../contexts/ToastContext';
import type { MainStackNavigationProp } from '../../navigation/types';
import { useGoBack } from '../../navigation/useGoBack';
import {
  SETTINGS_SUPPORT_PLACEHOLDER_NOTICE,
  SUPPORT_URLS,
} from '../../lib/settingsSupport';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';

function getBuildNumber(): string {
  if (Platform.OS === 'ios') {
    return (
      Constants.platform?.ios?.buildNumber ??
      Constants.expoConfig?.ios?.buildNumber ??
      'Development'
    );
  }
  if (Platform.OS === 'android') {
    const build =
      Constants.platform?.android?.versionCode ?? Constants.expoConfig?.android?.versionCode;
    return build === undefined || build === null ? 'Development' : String(build);
  }
  return 'Development';
}

function getRuntimeVersion(): string {
  if (Constants.expoRuntimeVersion) return Constants.expoRuntimeVersion;
  const configured = Constants.expoConfig?.runtimeVersion;
  return typeof configured === 'string' ? configured : 'Development';
}

async function openSafeUrl(url: string): Promise<boolean> {
  try {
    if (!(await Linking.canOpenURL(url))) return false;
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

export default function SettingsAboutScreen() {
  const goBack = useGoBack();
  const navigation = useNavigation<MainStackNavigationProp>();
  const { s, fs, fsLayout } = useScale();
  const c = useSettingsTheme();
  const { showToast } = useToast();
  const version = Constants.expoConfig?.version ?? 'Development';
  const build = getBuildNumber();
  const runtime = getRuntimeVersion();

  const openLegalUrl = async (url: string) => {
    if (!(await openSafeUrl(url))) showToast('Could not open this legal page', 'error');
  };

  const openDiagnostics = () => {
    navigation.navigate('SettingsDiagnostics');
  };

  return (
    <SettingsPageShell title="About Larderly" onBack={goBack}>
      <YStack style={{ gap: s(8) }}>
        <SettingsFieldLabel>Build information</SettingsFieldLabel>
        <SettingsRowGroup>
          <SettingsRow
            icon={BadgeInfo}
            label="App version"
            trailing={
              <Text
                style={{
                  color: c.inkSoft,
                  fontFamily: settingsFonts.regular,
                  fontSize: fs(13),
                  lineHeight: fs(18),
                }}
              >
                {version}
              </Text>
            }
          />
          <SettingsRow
            icon={Fingerprint}
            label="Build"
            trailing={
              <Text
                style={{
                  color: c.inkSoft,
                  fontFamily: settingsFonts.regular,
                  fontSize: fs(13),
                  lineHeight: fs(18),
                }}
              >
                {build}
              </Text>
            }
          />
          <SettingsRow
            icon={Activity}
            label="Runtime"
            subtitle={runtime}
          />
        </SettingsRowGroup>
      </YStack>

      <YStack style={{ gap: s(8) }}>
        <SettingsFieldLabel>Legal</SettingsFieldLabel>
        <SettingsRowGroup>
          <SettingsRow
            icon={FileText}
            label="Privacy policy"
            subtitle="Placeholder link"
            onPress={() => void openLegalUrl(SUPPORT_URLS.privacy)}
          />
          <SettingsRow
            icon={Scale}
            label="Terms of service"
            subtitle="Placeholder link"
            onPress={() => void openLegalUrl(SUPPORT_URLS.terms)}
          />
        </SettingsRowGroup>
      </YStack>

      <SettingsSurface
        radius={s(18)}
        contentStyle={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: s(10),
          padding: s(14),
          minHeight: fsLayout(44),
        }}
      >
        <TriangleAlert size={fs(18)} color={c.warning} strokeWidth={2.2} />
        <Text
          style={{
            flex: 1,
            minWidth: 0,
            color: c.inkSoft,
            fontFamily: settingsFonts.regular,
            fontSize: fs(12.5),
            lineHeight: fs(18),
            flexShrink: 0,
          }}
        >
          {SETTINGS_SUPPORT_PLACEHOLDER_NOTICE}
        </Text>
      </SettingsSurface>

      <SettingsRowGroup>
        <SettingsRow
          icon={ScrollText}
          label="Diagnostics"
          subtitle="Connection, sync, device, and cache tools."
          onPress={openDiagnostics}
        />
      </SettingsRowGroup>
    </SettingsPageShell>
  );
}
