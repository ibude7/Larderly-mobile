import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform, Text, View } from 'react-native';
import {
  Bell,
  Camera,
  CheckCircle2,
  CircleHelp,
  Clock3,
  Images,
  Mic2,
  ShieldX,
  SlidersHorizontal,
} from 'lucide-react-native';
import { SettingsPageShell } from '../../components/settings/SettingsPageShell';
import { SettingsRow } from '../../components/settings/SettingsRow';
import { SettingsRowGroup } from '../../components/settings/SettingsRowGroup';
import { SettingsFieldLabel } from '../../components/settings/SettingsFieldLabel';
import { SettingsStatusChip } from '../../components/settings/SettingsStatusChip';
import { SettingsSurface } from '../../components/settings/SettingsSurface';
import { useToast } from '../../contexts/ToastContext';
import { useGoBack } from '../../navigation/useGoBack';
import {
  SETTINGS_PERMISSION_REQUESTERS,
  canRequestPermission,
  getSettingsPermissions,
  openAppPermissionSettings,
  type SettingsPermissionKind,
  type SettingsPermissionSnapshot,
  type SettingsPermissionState,
} from '../../lib/settingsPermissions';
import { landingFonts as SF } from '../../theme/landing';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';

const PERMISSIONS = [
  {
    kind: 'notifications',
    label: 'Notifications',
    subtitle: 'Expiration reminders, household activity, and other alerts.',
    icon: Bell,
  },
  {
    kind: 'camera',
    label: 'Camera',
    subtitle: 'Scan barcodes and capture receipts or profile photos.',
    icon: Camera,
  },
  {
    kind: 'photos',
    label: 'Photos',
    subtitle: 'Choose receipt images and profile photos from your library.',
    icon: Images,
  },
  {
    kind: 'speech',
    label: 'Microphone & speech',
    subtitle: 'Use voice commands when adding or searching for items.',
    icon: Mic2,
  },
] as const;

const STATE_LABELS: Record<SettingsPermissionState, string> = {
  granted: 'Allowed',
  limited: 'Limited',
  denied: 'Denied',
  undetermined: 'Ask',
  unavailable: 'Unavailable',
};

export default function SettingsPermissionsScreen() {
  const goBack = useGoBack();
  const { s, fs, fsLayout } = useScale();
  const c = useSettingsTheme();
  const { showToast } = useToast();
  const [permissions, setPermissions] = useState<
    Partial<Record<SettingsPermissionKind, SettingsPermissionSnapshot>>
  >({});
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const next = await getSettingsPermissions();
    setPermissions(next);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  const handlePermission = async (kind: SettingsPermissionKind) => {
    const permission = permissions[kind];
    if (!permission) return;
    if (permission.state === 'unavailable') {
      showToast('This permission is not available on this device', 'info');
      return;
    }

    if (canRequestPermission(permission)) {
      const next = await SETTINGS_PERMISSION_REQUESTERS[kind]();
      setPermissions((current) => ({ ...current, [kind]: next }));
      if (next.state === 'granted' || next.state === 'limited') {
        showToast('Permission updated', 'success');
      } else if (!next.canAskAgain) {
        showToast('You can change this permission in system settings', 'warning');
      }
      return;
    }

    const opened = await openAppPermissionSettings();
    if (!opened) showToast('Could not open system settings', 'error');
  };

  const statusChip = (permission?: SettingsPermissionSnapshot) => {
    if (!permission) {
      return <SettingsStatusChip icon={Clock3} label="Checking" color={c.muted} />;
    }
    const presentation = {
      granted: { icon: CheckCircle2, color: c.success },
      limited: { icon: SlidersHorizontal, color: c.warning },
      denied: { icon: ShieldX, color: c.danger },
      undetermined: { icon: CircleHelp, color: c.info },
      unavailable: { icon: ShieldX, color: c.muted },
    }[permission.state];
    return (
      <SettingsStatusChip
        icon={presentation.icon}
        label={STATE_LABELS[permission.state]}
        color={presentation.color}
      />
    );
  };

  return (
    <SettingsPageShell
      title="App permissions"
      subtitle={refreshing ? 'Checking system access…' : 'Live device status'}
      onBack={goBack}
    >
      <SettingsSurface radius={s(18)} contentStyle={{ padding: s(14) }}>
        <View style={{ minHeight: fsLayout(22), justifyContent: 'center' }}>
          <Text
            style={{
              color: c.inkSoft,
              fontFamily: SF.regular,
              fontSize: fs(13),
              lineHeight: fs(19),
              flexShrink: 0,
            }}
          >
            Tap a permission to show the system prompt when available. Otherwise, Larderly will open
            the app’s system settings.
          </Text>
        </View>
      </SettingsSurface>

      <View style={{ gap: s(8) }}>
        <SettingsFieldLabel color={c.section.security}>System access</SettingsFieldLabel>
        <SettingsRowGroup accent={c.section.security}>
          {PERMISSIONS.map(({ kind, label, subtitle, icon }) => {
            const permission = permissions[kind];
            const isUnavailable = permission?.state === 'unavailable';
            return (
              <SettingsRow
                key={kind}
                icon={icon}
                iconColor={c.section.security}
                label={label}
                subtitle={
                  isUnavailable && Platform.OS !== 'ios' && Platform.OS !== 'android'
                    ? `${subtitle} Native mobile only.`
                    : subtitle
                }
                trailing={statusChip(permission)}
                onPress={() => void handlePermission(kind)}
                disabled={!permission}
              />
            );
          })}
        </SettingsRowGroup>
      </View>
    </SettingsPageShell>
  );
}
