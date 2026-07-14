import { Linking, Platform } from 'react-native';
import {
  BookOpen,
  CloudOff,
  Mail,
  ScanLine,
  Sparkles,
  TriangleAlert,
  Users,
} from '../../components/ui/Glyph';
import { Text, YStack } from 'tamagui';
import { SettingsFieldLabel } from '../../components/settings/SettingsFieldLabel';
import { SettingsPageShell } from '../../components/settings/SettingsPageShell';
import { SettingsRow } from '../../components/settings/SettingsRow';
import { SettingsRowGroup } from '../../components/settings/SettingsRowGroup';
import { SettingsSurface } from '../../components/settings/SettingsSurface';
import { settingsFonts } from '../../components/settings/settingsFonts';
import { useToast } from '../../contexts/ToastContext';
import { useGoBack } from '../../navigation/useGoBack';
import {
  SETTINGS_SUPPORT_PLACEHOLDER_NOTICE,
  SUPPORT_EMAIL,
  SUPPORT_EMAIL_SUBJECT,
  SUPPORT_URLS,
} from '../../lib/settingsSupport';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';

const FAQ_ROWS = [
  {
    label: 'Getting started',
    subtitle: 'Learn the basics of setting up your pantry.',
    icon: Sparkles,
    url: SUPPORT_URLS.gettingStarted,
  },
  {
    label: 'Scanning items',
    subtitle: 'Tips for barcode and receipt scanning.',
    icon: ScanLine,
    url: SUPPORT_URLS.scanningItems,
  },
  {
    label: 'Households',
    subtitle: 'Invites, roles, and shared inventory.',
    icon: Users,
    url: SUPPORT_URLS.households,
  },
  {
    label: 'Sync & offline use',
    subtitle: 'How Larderly handles connection changes.',
    icon: CloudOff,
    url: SUPPORT_URLS.syncAndOffline,
  },
] as const;

async function openSafeUrl(url: string): Promise<boolean> {
  try {
    if (!(await Linking.canOpenURL(url))) return false;
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

export default function SettingsSupportScreen() {
  const goBack = useGoBack();
  const { s, fs, fsLayout } = useScale();
  const c = useSettingsTheme();
  const { showToast } = useToast();

  const openUrl = async (url: string, failureMessage: string) => {
    if (!(await openSafeUrl(url))) showToast(failureMessage, 'error');
  };

  const emailSupport = () => {
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(SUPPORT_EMAIL_SUBJECT)}`;
    void openUrl(mailto, 'No email app is available');
  };

  return (
    <SettingsPageShell title="Help & support" onBack={goBack}>
      <SettingsSurface
        radius={s(18)}
        contentStyle={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: s(10),
          padding: s(14),
          minHeight: fsLayout(48),
        }}
      >
        <TriangleAlert size={fs(19)} color={c.warning} strokeWidth={2.2} />
        <YStack style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              color: c.warning,
              fontFamily: settingsFonts.semibold,
              fontWeight: Platform.OS === 'ios' ? '600' : undefined,
              fontSize: fs(13),
              lineHeight: fs(18),
              flexShrink: 0,
            }}
          >
            Placeholder destinations
          </Text>
          <Text
            style={{
              color: c.inkSoft,
              fontFamily: settingsFonts.regular,
              fontSize: fs(12.5),
              lineHeight: fs(18),
              marginTop: s(2),
              flexShrink: 0,
            }}
          >
            {SETTINGS_SUPPORT_PLACEHOLDER_NOTICE}
          </Text>
        </YStack>
      </SettingsSurface>

      <YStack style={{ gap: s(8) }}>
        <SettingsFieldLabel>Frequently asked questions</SettingsFieldLabel>
        <SettingsRowGroup>
          {FAQ_ROWS.map(({ label, subtitle, icon, url }) => (
            <SettingsRow
              key={label}
              icon={icon}
              label={label}
              subtitle={subtitle}
              onPress={() => void openUrl(url, 'Could not open this help article')}
            />
          ))}
          <SettingsRow
            icon={BookOpen}
            label="All help articles"
            subtitle="Open the placeholder help center."
            onPress={() => void openUrl(SUPPORT_URLS.helpCenter, 'Could not open the help center')}
          />
        </SettingsRowGroup>
      </YStack>

      <YStack style={{ gap: s(8) }}>
        <SettingsFieldLabel>Contact</SettingsFieldLabel>
        <SettingsRowGroup>
          <SettingsRow
            icon={Mail}
            label="Email support"
            subtitle={SUPPORT_EMAIL}
            onPress={emailSupport}
          />
        </SettingsRowGroup>
      </YStack>
    </SettingsPageShell>
  );
}
