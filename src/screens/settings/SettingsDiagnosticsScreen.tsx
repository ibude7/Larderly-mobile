import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import {
  Clipboard,
  Platform,
  Share,
  Text,
  View,
} from 'react-native';
import {
  AlertCircle,
  Box,
  CheckCircle2,
  ClipboardCopy,
  Cloud,
  CloudOff,
  History,
  RefreshCw,
  RotateCcw,
  Share2,
  Smartphone,
  Trash2,
  Wifi,
  WifiOff,
} from 'lucide-react-native';
import { SettingsFieldLabel } from '../../components/settings/SettingsFieldLabel';
import { SettingsPageShell } from '../../components/settings/SettingsPageShell';
import { SettingsRow } from '../../components/settings/SettingsRow';
import { SettingsRowGroup } from '../../components/settings/SettingsRowGroup';
import { SettingsStatusChip } from '../../components/settings/SettingsStatusChip';
import { SettingsSurface } from '../../components/settings/SettingsSurface';
import { useConfirm } from '../../contexts/ConfirmContext';
import { usePrefs } from '../../contexts/PreferencesContext';
import { useSync, type SyncEvent, type SyncStatus } from '../../contexts/SyncContext';
import { useToast } from '../../contexts/ToastContext';
import { useGoBack } from '../../navigation/useGoBack';
import { landingFonts as SF } from '../../theme/landing';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';

// Product lookup cache only. Never add auth, profile, sync, or preference keys here.
const PRODUCT_CACHE_KEYS = ['larderly:productCache'] as const;

function buildNumber(): string {
  if (Platform.OS === 'ios') {
    return (
      Constants.platform?.ios?.buildNumber ??
      Constants.expoConfig?.ios?.buildNumber ??
      'Development'
    );
  }
  if (Platform.OS === 'android') {
    const value =
      Constants.platform?.android?.versionCode ?? Constants.expoConfig?.android?.versionCode;
    return value === undefined || value === null ? 'Development' : String(value);
  }
  return 'Development';
}

function runtimeVersion(): string {
  if (Constants.expoRuntimeVersion) return Constants.expoRuntimeVersion;
  const configured = Constants.expoConfig?.runtimeVersion;
  return typeof configured === 'string' ? configured : 'Development';
}

function eventLabel(event: SyncEvent): string {
  return {
    connected: 'Connection restored',
    disconnected: 'Connection lost',
    synced: 'Sync completed',
    error: 'Sync error',
  }[event.type];
}

function diagnosticsText({
  online,
  status,
  lastSyncedAt,
  syncLog,
}: {
  online: boolean;
  status: SyncStatus;
  lastSyncedAt: number | null;
  syncLog: SyncEvent[];
}): string {
  const recentEvents = syncLog
    .slice(0, 20)
    .map((event) => {
      const detail = event.detail ? ` — ${event.detail.replace(/\s+/g, ' ').trim()}` : '';
      return `${new Date(event.at).toISOString()} | ${event.type}${detail}`;
    })
    .join('\n');

  return [
    'Larderly diagnostics',
    `Generated: ${new Date().toISOString()}`,
    `App version: ${Constants.expoConfig?.version ?? 'Development'}`,
    `Build: ${buildNumber()}`,
    `Runtime: ${runtimeVersion()}`,
    `Platform: ${Platform.OS} ${String(Platform.Version)}`,
    `Device: ${Constants.deviceName ?? 'Unknown'}`,
    `Execution environment: ${Constants.executionEnvironment}`,
    `Online: ${online ? 'yes' : 'no'}`,
    `Sync status: ${status}`,
    `Last synced: ${lastSyncedAt ? new Date(lastSyncedAt).toISOString() : 'never'}`,
    '',
    'Recent sync events:',
    recentEvents || 'None recorded',
  ].join('\n');
}

export default function SettingsDiagnosticsScreen() {
  const goBack = useGoBack();
  const { s, fs, fsLayout } = useScale();
  const c = useSettingsTheme();
  const { online, syncing, status, lastSyncedAt, syncLog } = useSync();
  const { reset } = usePrefs();
  const confirm = useConfirm();
  const { showToast } = useToast();
  const [busyAction, setBusyAction] = useState<'cache' | 'preferences' | null>(null);

  const diagnostics = () =>
    diagnosticsText({ online, status, lastSyncedAt, syncLog });

  const copyDiagnostics = () => {
    try {
      Clipboard.setString(diagnostics());
      showToast('Diagnostics copied', 'success');
    } catch {
      showToast('Could not copy diagnostics', 'error');
    }
  };

  const shareDiagnostics = async () => {
    try {
      await Share.share({
        title: 'Larderly diagnostics',
        message: diagnostics(),
      });
    } catch {
      showToast('Could not share diagnostics', 'error');
    }
  };

  const clearProductCaches = async () => {
    const approved = await confirm({
      title: 'Clear product caches?',
      message:
        'This removes cached barcode lookup results only. Your account, pantry data, sync history, and preferences are not removed.',
      confirmLabel: 'Clear caches',
      destructive: true,
    });
    if (!approved) return;

    setBusyAction('cache');
    try {
      await AsyncStorage.multiRemove([...PRODUCT_CACHE_KEYS]);
      showToast('Product caches cleared', 'success');
    } catch {
      showToast('Could not clear product caches', 'error');
    } finally {
      setBusyAction(null);
    }
  };

  const resetPreferences = async () => {
    const approved = await confirm({
      title: 'Reset preferences?',
      message:
        'This restores appearance, units, notification choices, privacy options, and integrations to their defaults. Account and pantry data are not removed.',
      confirmLabel: 'Reset preferences',
      destructive: true,
    });
    if (!approved) return;

    setBusyAction('preferences');
    try {
      reset();
      showToast('Preferences reset', 'success');
    } catch {
      showToast('Could not reset preferences', 'error');
    } finally {
      setBusyAction(null);
    }
  };

  const syncColor =
    status === 'error'
      ? c.danger
      : status === 'offline'
        ? c.muted
        : status === 'syncing'
          ? c.warning
          : c.success;

  return (
    <SettingsPageShell title="Diagnostics" subtitle="Device and sync details" onBack={goBack}>
      <SettingsSurface radius={s(18)} contentStyle={{ padding: s(14), minHeight: fsLayout(44) }}>
        <Text
          style={{
            color: c.inkSoft,
            fontFamily: SF.regular,
            fontSize: fs(12.5),
            lineHeight: fs(18),
            flexShrink: 0,
          }}
        >
          Diagnostics contain app, device, connection, and recent sync-event details. They do not
          include account credentials or pantry contents.
        </Text>
      </SettingsSurface>

      <View style={{ gap: s(8) }}>
        <SettingsFieldLabel color={c.section.security}>Connection & sync</SettingsFieldLabel>
        <SettingsRowGroup accent={c.section.security}>
          <SettingsRow
            icon={online ? Wifi : WifiOff}
            iconColor={online ? c.success : c.muted}
            label={online ? 'Online' : 'Offline'}
            subtitle="Current network reachability."
            trailing={
              <SettingsStatusChip
                icon={online ? CheckCircle2 : CloudOff}
                label={online ? 'Connected' : 'Offline'}
                color={online ? c.success : c.muted}
              />
            }
          />
          <SettingsRow
            icon={syncing ? RefreshCw : status === 'error' ? AlertCircle : Cloud}
            iconColor={syncColor}
            label={syncing ? 'Syncing…' : `Sync ${status}`}
            subtitle={
              lastSyncedAt
                ? `Last synced ${new Date(lastSyncedAt).toLocaleString()}`
                : 'No completed sync recorded.'
            }
          />
        </SettingsRowGroup>
      </View>

      <View style={{ gap: s(8) }}>
        <SettingsFieldLabel color={c.section.data}>Device & build</SettingsFieldLabel>
        <SettingsRowGroup>
          <SettingsRow
            icon={Box}
            iconColor={c.section.data}
            label={`Larderly ${Constants.expoConfig?.version ?? 'Development'}`}
            subtitle={`Build ${buildNumber()} · Runtime ${runtimeVersion()}`}
          />
          <SettingsRow
            icon={Smartphone}
            iconColor={c.section.data}
            label={Constants.deviceName ?? 'Unknown device'}
            subtitle={`${Platform.OS} ${String(Platform.Version)} · ${Constants.executionEnvironment}`}
          />
        </SettingsRowGroup>
      </View>

      <View style={{ gap: s(8) }}>
        <SettingsFieldLabel color={c.section.notifications}>Recent sync events</SettingsFieldLabel>
        <SettingsRowGroup>
          {syncLog.length > 0 ? (
            syncLog.slice(0, 10).map((event, index) => (
              <SettingsRow
                key={`${event.at}-${event.type}-${index}`}
                icon={event.type === 'error' ? AlertCircle : History}
                iconColor={event.type === 'error' ? c.danger : c.section.notifications}
                label={eventLabel(event)}
                subtitle={`${new Date(event.at).toLocaleString()}${event.detail ? ` · ${event.detail}` : ''}`}
              />
            ))
          ) : (
            <SettingsRow
              icon={History}
              iconColor={c.muted}
              label="No sync events recorded"
              subtitle="Connection and sync activity will appear here."
            />
          )}
        </SettingsRowGroup>
      </View>

      <View style={{ gap: s(8) }}>
        <SettingsFieldLabel color={c.section.support}>Export diagnostics</SettingsFieldLabel>
        <SettingsRowGroup>
          <SettingsRow
            icon={ClipboardCopy}
            iconColor={c.section.support}
            label="Copy diagnostics"
            onPress={copyDiagnostics}
          />
          <SettingsRow
            icon={Share2}
            iconColor={c.section.support}
            label="Share diagnostics"
            onPress={() => void shareDiagnostics()}
          />
        </SettingsRowGroup>
      </View>

      <View style={{ gap: s(8) }}>
        <SettingsFieldLabel color={c.danger}>Maintenance</SettingsFieldLabel>
        <SettingsRowGroup>
          <SettingsRow
            icon={Trash2}
            label="Clear product caches"
            subtitle="Remove cached barcode lookup results."
            danger
            disabled={busyAction !== null}
            onPress={() => void clearProductCaches()}
          />
          <SettingsRow
            icon={RotateCcw}
            label="Reset preferences"
            subtitle="Restore app preferences to their defaults."
            danger
            disabled={busyAction !== null}
            onPress={() => void resetPreferences()}
          />
        </SettingsRowGroup>
      </View>
    </SettingsPageShell>
  );
}
