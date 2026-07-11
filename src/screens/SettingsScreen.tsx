import { useMemo, type ComponentType, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Apple,
  Bell,
  CheckCircle2,
  ChevronLeft,
  CircleHelp,
  Database,
  Home,
  Info,
  KeyRound,
  Mail,
  Palette,
  ShieldCheck,
  Stethoscope,
  User,
} from 'lucide-react-native';
import { SettingsAccountCard } from '../components/settings/SettingsAccountCard';
import { SettingsRow } from '../components/settings/SettingsRow';
import { SettingsRowGroup } from '../components/settings/SettingsRowGroup';
import { SettingsSectionHeader } from '../components/settings/SettingsSectionHeader';
import { SettingsStatusChip } from '../components/settings/SettingsStatusChip';
import { GoogleLogo } from '../components/ui/GoogleLogo';
import { describeProvider } from '../components/settings/settingsHelpers';
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
  const insets = useSafeAreaInsets();
  const { s, fs, fsLayout } = useScale();
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

  const syncLabel = !online
    ? t('settings.status.offline')
    : syncing
      ? t('settings.status.syncing')
      : t('settings.status.synced');
  const syncColor = !online ? c.muted : syncing ? c.warning : c.success;
  const protectedLabel = mfaOn ? t('settings.status.protected') : t('settings.status.unprotected');
  const protectedColor = mfaOn ? c.success : c.warning;
  const alertsOn = notifOnCount > 0;
  const alertsLabel = alertsOn ? t('settings.status.alertsOn') : t('settings.status.alertsOff');
  const alertsColor = alertsOn ? c.success : c.muted;

  return (
    <View style={{ flex: 1, backgroundColor: c.canvas }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: insets.top + s(10),
          paddingBottom: s(6),
          paddingHorizontal: s(16),
          minHeight: fsLayout(48),
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: c.line,
        }}
      >
        <Pressable
          onPress={goBack}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => ({
            width: s(34),
            height: s(34),
            borderRadius: s(17),
            borderWidth: 1,
            borderColor: c.line,
            backgroundColor: c.surface,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <ChevronLeft size={fs(18)} color={c.ink} strokeWidth={2.2} />
        </Pressable>
        <Text
          style={{
            flex: 1,
            marginLeft: s(10),
            fontSize: fs(17),
            lineHeight: fs(22),
            fontWeight: '600',
            color: c.ink,
            flexShrink: 0,
          }}
        >
          {t('settings.title')}
        </Text>
        <View style={{ width: s(34) }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: s(20),
          paddingTop: s(14),
          paddingBottom: insets.bottom + s(32),
          gap: s(18),
        }}
        showsVerticalScrollIndicator={false}
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

        <View
          accessible
          accessibilityLabel={`${syncLabel}. ${protectedLabel}. ${alertsLabel}`}
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: s(8),
          }}
        >
          <SettingsStatusChip label={syncLabel} color={syncColor} />
          <SettingsStatusChip label={protectedLabel} color={protectedColor} icon={ShieldCheck} />
          <SettingsStatusChip label={alertsLabel} color={alertsColor} icon={Bell} />
        </View>

        <Module title={t('settings.group.personal')} accent={c.section.account}>
          <SettingsRow
            icon={User}
            iconColor={c.section.account}
            label={t('settings.row.account')}
            subtitle={isAnonymous ? 'Upgrade guest session' : 'Profile & email'}
            onPress={() => navigation.navigate('SettingsAccount')}
          />
          <SettingsRow
            icon={Home}
            iconColor={c.section.household}
            label={t('settings.row.household')}
            subtitle={householdId ? 'Members, invite & roles' : 'Create or join a household'}
            onPress={() => navigation.navigate('SettingsHousehold')}
          />
        </Module>

        <Module title={t('settings.group.experience')} accent={c.section.preferences}>
          <SettingsRow
            icon={Palette}
            iconColor={c.section.preferences}
            label={t('settings.row.appearance')}
            subtitle="Theme, language & units"
            onPress={() => navigation.navigate('SettingsPreferences')}
          />
          <SettingsRow
            icon={Bell}
            iconColor={c.section.notifications}
            label={t('settings.row.notifications')}
            subtitle={`${notifOnCount} alerts on`}
            onPress={() => navigation.navigate('SettingsNotifications')}
          />
          <SettingsRow
            icon={KeyRound}
            iconColor={c.section.notifications}
            label={t('settings.row.permissions')}
            subtitle="Camera, photos & more"
            onPress={() => navigation.navigate('SettingsPermissions')}
          />
        </Module>

        <Module title={t('settings.group.privacy')} accent={c.section.security}>
          <SettingsRow
            icon={ShieldCheck}
            iconColor={c.section.security}
            label={t('settings.row.security')}
            subtitle={
              isAnonymous ? 'Upgrade required' : mfaOn ? '2FA on · sessions' : '2FA off · sessions'
            }
            onPress={() => navigation.navigate('SettingsSecurity')}
          />
          <SettingsRow
            icon={Database}
            iconColor={c.section.data}
            label={t('settings.row.data')}
            subtitle="Export & storage locations"
            onPress={() => navigation.navigate('SettingsData')}
          />
          <SettingsRow
            icon={Stethoscope}
            iconColor={c.section.data}
            label={t('settings.row.diagnostics')}
            subtitle="Sync log, cache & reset"
            onPress={() => navigation.navigate('SettingsDiagnostics')}
          />
        </Module>

        <Module title={t('settings.group.support')} accent={c.section.support}>
          <SettingsRow
            icon={CircleHelp}
            iconColor={c.section.support}
            label={t('settings.row.help')}
            subtitle="FAQ & contact"
            onPress={() => navigation.navigate('SettingsSupport')}
          />
          <SettingsRow
            icon={Info}
            iconColor={c.section.support}
            label={t('settings.row.about')}
            subtitle="Version & legal"
            onPress={() => navigation.navigate('SettingsAbout')}
          />
        </Module>
      </ScrollView>
    </View>
  );
}

function Module({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: ReactNode;
}) {
  const { s } = useScale();

  return (
    <View style={{ gap: s(0) }}>
      <View style={{ paddingHorizontal: s(4) }}>
        <SettingsSectionHeader title={title} />
      </View>
      <SettingsRowGroup accent={accent}>{children}</SettingsRowGroup>
    </View>
  );
}

function ProviderChip({ label }: { label: string }) {
  const { s, fs } = useScale();
  const c = useSettingsTheme();
  const Icon = providerLucideIcon(label);

  if (label === 'Google') {
    return (
      <View
        accessible
        accessibilityLabel={label}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: s(5),
          paddingHorizontal: s(9),
          paddingVertical: s(4),
          borderRadius: s(999),
          borderWidth: 1,
          borderColor: c.tint(c.inkSoft, 0.36),
          backgroundColor: c.tint(c.inkSoft, 0.12),
        }}
      >
        <GoogleLogo size={fs(12)} />
        <Text
          style={{
            fontSize: fs(11.5),
            lineHeight: fs(15),
            fontWeight: '600',
            color: c.inkSoft,
            flexShrink: 0,
          }}
        >
          {label}
        </Text>
      </View>
    );
  }

  return <SettingsStatusChip label={label} color={c.inkSoft} icon={Icon} />;
}

function providerLucideIcon(label: string): ChipIcon | undefined {
  if (label === 'Apple') return Apple;
  if (label === 'Email') return Mail;
  if (label === 'Guest') return User;
  return User;
}
