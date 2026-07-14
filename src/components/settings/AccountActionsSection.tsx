import { useState } from 'react';
import { YStack } from 'tamagui';
import { LogOut, Trash2 } from '../ui/Glyph';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useReauth, withReauth } from '../auth/ReauthDialog';
import { useScale } from '../../theme/scale';
import { SettingsActionButton } from './SettingsActionButton';
import { SettingsFieldLabel } from './SettingsFieldLabel';
import { SettingsSurface } from './SettingsSurface';
export function AccountActionsSection() {
  const { s } = useScale();
  const { signOut, deleteAccount, isAnonymous } = useAuth();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const reauth = useReauth();
  const [signingOut, setSigningOut] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const busy = signingOut || deleting;

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      showToast('Could not sign out — try again', 'error');
    } finally {
      setSigningOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    const ok = await confirm({
      title: 'Delete account?',
      message:
        'This permanently removes your account and private account data. Shared household data is not deleted. This cannot be undone.',
      destructive: true,
      confirmLabel: 'Delete account',
    });
    if (!ok) return;
    setDeleting(true);
    try {
      const result = await withReauth(
        () => deleteAccount(),
        reauth,
        'Confirm to delete your account.',
      );
      if (result && typeof result === 'object' && 'error' in result && result.error) {
        showToast(result.error.message || 'Could not delete account', 'error');
        return;
      }
      showToast('Account deleted', 'info');
    } catch (err) {
      if ((err as Error).message !== 'Re-authentication cancelled.') {
        showToast('Could not delete account', 'error');
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SettingsSurface contentStyle={{ padding: s(16), gap: s(12) }}>
      <SettingsFieldLabel>Session</SettingsFieldLabel>
      <SettingsActionButton
        label={signingOut ? 'Signing out…' : 'Sign out'}
        icon={LogOut}
        loading={signingOut}
        disabled={busy}
        onPress={() => void handleSignOut()}
        accessibilityLabel={signingOut ? 'Signing out' : 'Sign out'}
      />
      {!isAnonymous ? (
        <YStack style={{ gap: s(8) }}>
          <SettingsActionButton
            label={deleting ? 'Deleting…' : 'Delete account'}
            icon={Trash2}
            tone="danger"
            loading={deleting}
            disabled={busy}
            onPress={() => void handleDeleteAccount()}
            accessibilityLabel="Delete account"
          />
        </YStack>
      ) : null}
    </SettingsSurface>
  );
}
