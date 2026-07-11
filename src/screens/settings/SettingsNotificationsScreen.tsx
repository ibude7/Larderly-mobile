import { useCallback, useEffect, useState } from 'react';
import { AppState, View } from 'react-native';
import {
  Bell,
  CalendarClock,
  ChefHat,
  Clock3,
  Moon,
  PackageMinus,
  Trophy,
  Users,
  Volume2,
  Vibrate,
  Wallet,
} from 'lucide-react-native';
import { useGoBack } from '../../navigation/useGoBack';
import { SettingsPageShell } from '../../components/settings/SettingsPageShell';
import { SettingsRow } from '../../components/settings/SettingsRow';
import { SettingsRowGroup } from '../../components/settings/SettingsRowGroup';
import { SettingsSwitch } from '../../components/settings/SettingsSwitch';
import { SettingsActionButton } from '../../components/settings/SettingsActionButton';
import { SettingsFieldLabel } from '../../components/settings/SettingsFieldLabel';
import { SettingsPickerRow } from '../../components/settings/SettingsPickerRow';
import { SettingsStatusChip } from '../../components/settings/SettingsStatusChip';
import { SettingsSurface } from '../../components/settings/SettingsSurface';
import { SettingsBodyText } from '../../components/settings/SettingsBodyText';
import { SETTINGS_SECTION_COLORS } from '../../components/settings/settingsHelpers';
import { usePrefs, type NotifFrequency } from '../../contexts/PreferencesContext';
import { useToast } from '../../contexts/ToastContext';
import {
  canRequestPermission,
  getNotificationPermission,
  openAppPermissionSettings,
  requestNotificationPermission,
  type SettingsPermissionSnapshot,
} from '../../lib/settingsPermissions';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';

const ACCENT = SETTINGS_SECTION_COLORS.notifications;

const TOGGLES = [
  { key: 'expiration', label: 'Expiration alerts', icon: CalendarClock } as const,
  { key: 'lowStock', label: 'Low stock', icon: PackageMinus } as const,
  { key: 'activity', label: 'Household activity', icon: Users } as const,
  { key: 'recipes', label: 'Recipe ideas', icon: ChefHat } as const,
  { key: 'budget', label: 'Budget alerts', icon: Wallet } as const,
  { key: 'achievements', label: 'Achievements', icon: Trophy } as const,
];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => ({
  id: String(hour),
  label: formatHour(hour),
}));

const FREQUENCY_OPTIONS: { id: NotifFrequency; label: string }[] = [
  { id: 'realtime', label: 'Realtime' },
  { id: 'daily', label: 'Daily digest' },
  { id: 'weekly', label: 'Weekly digest' },
];

function formatHour(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:00 ${period}`;
}

export default function SettingsNotificationsScreen() {
  const goBack = useGoBack();
  const { s } = useScale();
  const c = useSettingsTheme();
  const { prefs, setNotificationPref } = usePrefs();
  const { showToast } = useToast();
  const [permission, setPermission] = useState<SettingsPermissionSnapshot | null>(null);
  const [busy, setBusy] = useState(false);

  const refreshPermission = useCallback(async () => {
    const next = await getNotificationPermission();
    setPermission(next);
  }, []);

  useEffect(() => {
    void refreshPermission();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshPermission();
    });
    return () => sub.remove();
  }, [refreshPermission]);

  const enablePush = async () => {
    setBusy(true);
    try {
      if (permission && !canRequestPermission(permission)) {
        const opened = await openAppPermissionSettings();
        if (!opened) showToast('Could not open system settings', 'error');
        return;
      }
      const next = await requestNotificationPermission();
      setPermission(next);
      if (next.state === 'granted' || next.state === 'limited') {
        showToast('Notifications enabled', 'success');
      } else {
        showToast('Enable notifications in system settings', 'warning');
      }
    } finally {
      setBusy(false);
    }
  };

  const permissionLabel =
    permission?.state === 'granted'
      ? 'Allowed'
      : permission?.state === 'limited'
        ? 'Limited'
        : permission?.state === 'denied'
          ? 'Denied'
          : permission?.state === 'unavailable'
            ? 'Unavailable'
            : 'Ask';

  const permissionColor =
    permission?.state === 'granted'
      ? c.success
      : permission?.state === 'limited'
        ? c.warning
        : permission?.state === 'denied'
          ? c.danger
          : c.muted;

  const needsSettings =
    permission != null &&
    permission.state !== 'granted' &&
    permission.state !== 'limited' &&
    !canRequestPermission(permission);

  return (
    <SettingsPageShell title="Notifications" subtitle="Alerts and delivery" onBack={goBack}>
      <SettingsSurface accent={ACCENT} contentStyle={{ padding: s(14), gap: s(12) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: s(8) }}>
          <SettingsBodyText accent>System permission</SettingsBodyText>
          <SettingsStatusChip label={permission ? permissionLabel : 'Checking'} color={permissionColor} />
        </View>
        <SettingsBodyText>
          Larderly needs notification access to deliver expiration, low-stock, and household alerts.
        </SettingsBodyText>
        {permission?.state !== 'granted' ? (
          <SettingsActionButton
            label={
              busy
                ? 'Working…'
                : needsSettings
                  ? 'Open system settings'
                  : 'Enable push notifications'
            }
            tone="primary"
            loading={busy}
            disabled={busy || permission?.state === 'unavailable'}
            onPress={() => void enablePush()}
          />
        ) : null}
      </SettingsSurface>

      <View style={{ gap: s(8) }}>
        <SettingsFieldLabel color={ACCENT}>Alert types</SettingsFieldLabel>
        <SettingsRowGroup accent={ACCENT}>
          {TOGGLES.map(({ key, label, icon }) => (
            <SettingsRow
              key={key}
              icon={icon}
              iconColor={ACCENT}
              label={label}
              trailing={
                <SettingsSwitch
                  value={prefs.notifications[key]}
                  onValueChange={(v) => setNotificationPref(key, v)}
                  accessibilityLabel={label}
                />
              }
            />
          ))}
        </SettingsRowGroup>
      </View>

      <View style={{ gap: s(8) }}>
        <SettingsFieldLabel color={ACCENT}>Marketing</SettingsFieldLabel>
        <SettingsRowGroup accent={ACCENT}>
          <SettingsRow
            icon={Bell}
            iconColor={ACCENT}
            label="Deals & promotions"
            trailing={
              <SettingsSwitch
                value={prefs.notifications.deals}
                onValueChange={(v) => setNotificationPref('deals', v)}
                accessibilityLabel="Deals & promotions"
              />
            }
          />
        </SettingsRowGroup>
      </View>

      <View style={{ gap: s(8) }}>
        <SettingsFieldLabel color={ACCENT}>Delivery</SettingsFieldLabel>
        <SettingsRowGroup accent={ACCENT}>
          <SettingsPickerRow
            icon={Moon}
            iconColor={ACCENT}
            label="Quiet hours start"
            value={String(prefs.notifications.quietHoursStart)}
            valueLabel={formatHour(prefs.notifications.quietHoursStart)}
            options={HOUR_OPTIONS}
            onChange={(value) => setNotificationPref('quietHoursStart', Number(value))}
          />
          <SettingsPickerRow
            icon={Clock3}
            iconColor={ACCENT}
            label="Quiet hours end"
            value={String(prefs.notifications.quietHoursEnd)}
            valueLabel={formatHour(prefs.notifications.quietHoursEnd)}
            options={HOUR_OPTIONS}
            onChange={(value) => setNotificationPref('quietHoursEnd', Number(value))}
          />
          <SettingsPickerRow
            icon={Bell}
            iconColor={ACCENT}
            label="Frequency"
            value={prefs.notifications.frequency}
            valueLabel={
              FREQUENCY_OPTIONS.find((option) => option.id === prefs.notifications.frequency)?.label ??
              'Realtime'
            }
            options={FREQUENCY_OPTIONS}
            onChange={(frequency) => setNotificationPref('frequency', frequency)}
          />
          <SettingsRow
            icon={Volume2}
            iconColor={ACCENT}
            label="Sound"
            trailing={
              <SettingsSwitch
                value={prefs.notifications.sound}
                onValueChange={(v) => setNotificationPref('sound', v)}
                accessibilityLabel="Notification sound"
              />
            }
          />
          <SettingsRow
            icon={Vibrate}
            iconColor={ACCENT}
            label="Vibrate"
            trailing={
              <SettingsSwitch
                value={prefs.notifications.vibrate}
                onValueChange={(v) => setNotificationPref('vibrate', v)}
                accessibilityLabel="Notification vibration"
              />
            }
          />
        </SettingsRowGroup>
      </View>
    </SettingsPageShell>
  );
}
