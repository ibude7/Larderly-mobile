import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { collection, limit, onSnapshot, orderBy, query } from '@react-native-firebase/firestore';
import { Laptop, RefreshCw, Smartphone } from 'lucide-react-native';
import { SettingsPageShell } from '../../components/settings/SettingsPageShell';
import { SettingsRow } from '../../components/settings/SettingsRow';
import { SettingsRowGroup } from '../../components/settings/SettingsRowGroup';
import { SecuritySection } from '../../components/settings/SecuritySection';
import { SettingsFieldLabel } from '../../components/settings/SettingsFieldLabel';
import { SettingsActionButton } from '../../components/settings/SettingsActionButton';
import { useAuth } from '../../contexts/AuthContext';
import { useSync } from '../../contexts/SyncContext';
import { useToast } from '../../contexts/ToastContext';
import { useReauth, withReauth } from '../../components/auth/ReauthDialog';
import { useGoBack } from '../../navigation/useGoBack';
import { SETTINGS_SECTION_COLORS } from '../../components/settings/settingsHelpers';
import { db } from '../../lib/firebase';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';

const ACCENT = SETTINGS_SECTION_COLORS.security;

interface LoginEvent {
  id: string;
  device: string;
  platform: string;
  at?: number;
}

export default function SettingsSecurityScreen() {
  const goBack = useGoBack();
  const { s } = useScale();
  const c = useSettingsTheme();
  const { user, isAnonymous, revokeAllSessions } = useAuth();
  const { online, syncing, lastSyncedAt } = useSync();
  const { showToast } = useToast();
  const reauth = useReauth();
  const [loginEvents, setLoginEvents] = useState<LoginEvent[]>([]);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    if (!user || isAnonymous) return;
    const q = query(collection(db, 'users', user.uid, 'loginEvents'), orderBy('at', 'desc'), limit(5));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setLoginEvents(
          snap.docs.map((d) => {
            const data = d.data();
            let at: number | undefined;
            const raw = data.at;
            if (typeof raw === 'object' && raw !== null && 'toMillis' in raw) {
              at = (raw as { toMillis: () => number }).toMillis();
            }
            return {
              id: d.id,
              device: (data.device as string) ?? 'Device',
              platform: (data.platform as string) ?? '',
              at,
            };
          }),
        );
      },
      () => {
        setLoginEvents([]);
      },
    );
    return unsub;
  }, [user, isAnonymous]);

  const handleRevokeSessions = async () => {
    setRevoking(true);
    try {
      await withReauth(() => revokeAllSessions(), reauth, 'Confirm to revoke all sessions.');
      showToast('All sessions revoked', 'success');
    } catch (err) {
      if ((err as Error).message !== 'Re-authentication cancelled.') {
        showToast('Could not revoke sessions', 'error');
      }
    } finally {
      setRevoking(false);
    }
  };

  return (
    <SettingsPageShell title="Security" subtitle="MFA, sessions, and sync" onBack={goBack}>
      <View style={{ gap: s(8) }}>
        <SettingsFieldLabel color={ACCENT}>Two-factor authentication</SettingsFieldLabel>
        <SecuritySection />
      </View>

      <View style={{ gap: s(8) }}>
        <SettingsFieldLabel color={ACCENT}>Sync</SettingsFieldLabel>
        <SettingsRowGroup accent={ACCENT}>
          <SettingsRow
            icon={RefreshCw}
            iconColor={online ? c.success : c.muted}
            label={online ? (syncing ? 'Syncing…' : 'Online') : 'Offline'}
            subtitle={lastSyncedAt ? `Last synced ${new Date(lastSyncedAt).toLocaleString()}` : undefined}
          />
        </SettingsRowGroup>
      </View>

      {loginEvents.length > 0 ? (
        <View style={{ gap: s(8) }}>
          <SettingsFieldLabel color={ACCENT}>Recent sign-ins</SettingsFieldLabel>
          <SettingsRowGroup accent={ACCENT}>
            {loginEvents.map((ev) => (
              <SettingsRow
                key={ev.id}
                icon={
                  ev.platform.toLowerCase().includes('ios') || ev.platform.toLowerCase().includes('android')
                    ? Smartphone
                    : Laptop
                }
                iconColor={ACCENT}
                label={ev.device}
                subtitle={ev.at ? new Date(ev.at).toLocaleString() : ev.platform}
              />
            ))}
          </SettingsRowGroup>
        </View>
      ) : null}

      {!isAnonymous ? (
        <SettingsActionButton
          label={revoking ? 'Revoking…' : 'Revoke all sessions'}
          tone="danger"
          loading={revoking}
          disabled={revoking}
          onPress={() => void handleRevokeSessions()}
        />
      ) : null}
    </SettingsPageShell>
  );
}
