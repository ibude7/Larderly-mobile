import { useMemo, type ComponentType } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  Activity,
  Apple,
  Archive,
  BadgeInfo,
  Bell,
  CheckCircle2,
  CircleHelp,
  Cloud,
  CloudOff,
  Fingerprint,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  User,
  Users,
} from '../components/ui/Glyph';
import { Text, XStack } from 'tamagui';
import { SettingsAccountCard } from '../components/settings/SettingsAccountCard';
import { SettingsModule } from '../components/settings/SettingsModule';
import { SettingsPageShell } from '../components/settings/SettingsPageShell';
import { SettingsRow } from '../components/settings/SettingsRow';
import {
  SettingsStatusCard,
  SettingsStatusChip,
  SettingsStatusRail,
} from '../components/settings/SettingsStatusChip';
import { GoogleLogo } from '../components/ui/GoogleLogo';
import { describeProvider } from '../components/settings/settingsHelpers';
import { settingsType } from '../components/settings/settingsFonts';
import { SettingsGlass } from '../components/settings/SettingsGlass';
import { useAuth } from '../contexts/AuthContext';
import { useHousehold } from '../contexts/HouseholdContext';
import { useProfile } from '../contexts/ProfileContext';
import { usePrefs } from '../contexts/PreferencesContext';
import { useSync } from '../contexts/SyncContext';
import { useI18n } from '../i18n';
import { useGoBack } from '../navigation/useGoBack';
import type { MainStackNavigationProp } from '../navigation/types';
import { useScale } from '../theme/scale';
import { useSettingsTheme } from '../theme/settings';

type ChipIcon = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

export default function SettingsScreen() {
  const navigation = useNavigation<MainStackNavigationProp>();
  const goBack = useGoBack();
  const c = useSettingsTheme();
  const { t } = useI18n();
  const { user, isAnonymous, getEnrolledMfaFactors } = useAuth();
  const { householdId } = useHousehold();
  const { userProfile, profile } = useProfile();
  const { prefs } = usePrefs();
  const { online, syncing } = useSync();

  const photoUrl = userProfile?.profilePictureUrl ?? user?.photoURL ?? '';
  const displayName = isAnonymous
    ? 'Guest'
    : profile?.full_name || user?.displayName || 'Your name';
  const emailLine = isAnonymous ? 'Guest session' : user?.email || 'Signed in';
  const initials = useMemo(() => {
    if (isAnonymous) return '';
    const nameSource = profile?.full_name || user?.displayName || '';
    const parts = nameSource.trim().split(/\s+/).filter(Boolean);
    if (parts.length > 0) {
      const first = parts[0][0] ?? '';
      const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
      return (first + last).toUpperCase();
    }
    if (user?.email) return user.email[0].toUpperCase();
    return '';
  }, [profile?.full_name, user?.displayName, user?.email, isAnonymous]);

  const providerLabel = useMemo(
    () => describeProvider(user?.providerData?.map((p) => p.providerId) ?? [], isAnonymous),
    [user?.providerData, isAnonymous],
  );
  const verified = Boolean(user && !isAnonymous && user.emailVerified);
  const showVerifiedBadge = !isAnonymous && !!user?.email;
  const mfaOn = (getEnrolledMfaFactors?.() ?? []).length > 0;
  const notifOnCount = [
    prefs.notifications.expiration,
    prefs.notifications.lowStock,
    prefs.notifications.activity,
    prefs.notifications.deals,
    prefs.notifications.recipes,
    prefs.notifications.budget,
    prefs.notifications.achievements,
  ].filter(Boolean).length;

  const syncTitle = !online
    ? t('settings.status.offline')
    : syncing
      ? t('settings.status.syncing')
      : t('settings.status.synced');
  const syncDetail = !online
    ? t('settings.status.offlineDetail')
    : syncing
      ? t('settings.status.syncingDetail')
      : t('settings.status.syncDetail');
  const syncColor = !online ? c.muted : syncing ? c.ochre : c.green;
  const SyncIcon = !online ? CloudOff : syncing ? RefreshCw : Cloud;

  const twoFaTitle = t('settings.status.twoFa');
  const twoFaDetail = mfaOn ? t('settings.status.twoFaOn') : t('settings.status.twoFaOff');
  const twoFaColor = mfaOn ? c.green : c.ochre;
  const TwoFaIcon = mfaOn ? ShieldCheck : Lock;

  const alertsOn = notifOnCount > 0;
  const alertsTitle = t('settings.status.alerts');
  const alertsDetail = alertsOn
    ? t('settings.status.alertsOnDetail', { count: notifOnCount })
    : t('settings.status.alertsOffDetail');
  const alertsColor = alertsOn ? c.green : c.muted;

  return (
    <SettingsPageShell
      variant="hub"
      title={t('settings.title')}
      subtitle={t('settings.subtitle')}
      onBack={goBack}
      onSearch={() => {}}
    >
      <SettingsAccountCard
        displayName={displayName}
        emailLine={emailLine}
        photoUrl={photoUrl || undefined}
        initials={initials || undefined}
        accessibilityLabel={`${displayName}. ${emailLine}. View account.`}
        onPress={() => navigation.navigate('SettingsAccount')}
        badges={
          <>
            <ProviderChip label={providerLabel} />
            {showVerifiedBadge ? (
              <SettingsStatusChip
                label={verified ? 'Verified' : 'Unverified'}
                color={verified ? c.success : c.warning}
                icon={verified ? CheckCircle2 : undefined}
              />
            ) : null}
          </>
        }
      />

      <SettingsStatusRail
        accessible
        accessibilityLabel={`${syncTitle}. ${twoFaTitle}. ${alertsTitle}`}
      >
        <SettingsStatusCard
          title={syncTitle}
          detail={syncDetail}
          color={syncColor}
          icon={SyncIcon}
        />
        <SettingsStatusCard
          title={twoFaTitle}
          detail={twoFaDetail}
          color={twoFaColor}
          icon={TwoFaIcon}
        />
        <SettingsStatusCard
          title={alertsTitle}
          detail={alertsDetail}
          color={alertsColor}
          icon={Bell}
          badge={alertsOn}
        />
      </SettingsStatusRail>

      <SettingsModule title={t('settings.group.personal')}>
        <SettingsRow
          icon={User}
          iconColor={c.icons.account}
          label={t('settings.row.account')}
          subtitle={isAnonymous ? 'Upgrade guest session' : 'Profile & email'}
          onPress={() => navigation.navigate('SettingsAccount')}
        />
        <SettingsRow
          icon={Users}
          iconColor={c.icons.household}
          label={t('settings.row.household')}
          subtitle={householdId ? 'Members, invite & roles' : 'Create or join a household'}
          onPress={() => navigation.navigate('SettingsHousehold')}
        />
      </SettingsModule>

      <SettingsModule title={t('settings.group.experience')}>
        <SettingsRow
          icon={SlidersHorizontal}
          iconColor={c.icons.appearance}
          label={t('settings.row.appearance')}
          subtitle="Theme, language & units"
          onPress={() => navigation.navigate('SettingsPreferences')}
        />
        <SettingsRow
          icon={Bell}
          iconColor={c.icons.notifications}
          label={t('settings.row.notifications')}
          subtitle={`${notifOnCount} alerts on`}
          onPress={() => navigation.navigate('SettingsNotifications')}
        />
        <SettingsRow
          icon={Fingerprint}
          iconColor={c.icons.permissions}
          label={t('settings.row.permissions')}
          subtitle="Camera, photos & more"
          onPress={() => navigation.navigate('SettingsPermissions')}
        />
      </SettingsModule>

      <SettingsModule title={t('settings.group.privacy')}>
        <SettingsRow
          icon={ShieldCheck}
          iconColor={c.icons.security}
          label={t('settings.row.security')}
          subtitle={
            isAnonymous ? 'Upgrade required' : mfaOn ? '2FA on · sessions' : '2FA off · sessions'
          }
          onPress={() => navigation.navigate('SettingsSecurity')}
        />
        <SettingsRow
          icon={Archive}
          iconColor={c.icons.data}
          label={t('settings.row.data')}
          subtitle="Export & storage locations"
          onPress={() => navigation.navigate('SettingsData')}
        />
        <SettingsRow
          icon={Activity}
          iconColor={c.icons.diagnostics}
          label={t('settings.row.diagnostics')}
          subtitle="Sync log, cache & reset"
          onPress={() => navigation.navigate('SettingsDiagnostics')}
        />
      </SettingsModule>

      <SettingsModule title={t('settings.group.support')}>
        <SettingsRow
          icon={CircleHelp}
          iconColor={c.icons.help}
          label={t('settings.row.help')}
          subtitle="FAQ & contact"
          onPress={() => navigation.navigate('SettingsSupport')}
        />
        <SettingsRow
          icon={BadgeInfo}
          iconColor={c.icons.about}
          label={t('settings.row.about')}
          subtitle="Version & legal"
          onPress={() => navigation.navigate('SettingsAbout')}
        />
      </SettingsModule>
    </SettingsPageShell>
  );
}

function ProviderChip({ label }: { label: string }) {
  const { s, fs } = useScale();
  const c = useSettingsTheme();
  const Icon = providerGlyphIcon(label);

  if (label === 'Google') {
    return (
      <SettingsGlass
        interactive={false}
        elevated={false}
        accent={c.inkSoft}
        radius={s(999)}
        contentStyle={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: s(5),
          paddingHorizontal: s(10),
          paddingVertical: s(5),
        }}
      >
        <XStack accessible accessibilityLabel={label} style={{ alignItems: 'center', gap: s(5) }}>
          <GoogleLogo size={fs(12)} />
          <Text
            style={{
              ...settingsType('semibold'),
              fontSize: fs(11.5),
              lineHeight: fs(15),
              color: c.inkSoft,
              flexShrink: 0,
            }}
          >
            {label}
          </Text>
        </XStack>
      </SettingsGlass>
    );
  }

  return <SettingsStatusChip label={label} color={c.inkSoft} icon={Icon} />;
}

function providerGlyphIcon(label: string): ChipIcon | undefined {
  if (label === 'Apple') return Apple;
  if (label === 'Email') return Mail;
  if (label === 'Guest') return User;
  return User;
}
