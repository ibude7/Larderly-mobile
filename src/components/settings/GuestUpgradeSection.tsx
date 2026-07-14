import { useState } from 'react';
import { View, XStack, YStack } from 'tamagui';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useScale } from '../../theme/scale';
import { SettingsActionButton } from './SettingsActionButton';
import { SettingsBodyText } from './SettingsBodyText';
import { SettingsFieldLabel } from './SettingsFieldLabel';
import { SettingsSurface } from './SettingsSurface';
import { SettingsTextField } from './SettingsTextField';
interface GuestUpgradeSectionProps {
  fullName: string;
}

export function GuestUpgradeSection({ fullName }: GuestUpgradeSectionProps) {
  const { s } = useScale();
  const { upgradeAnonymous, upgradeAnonymousWithGoogle, googleAvailable } = useAuth();
  const { showToast } = useToast();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeEmail, setUpgradeEmail] = useState('');
  const [upgradePassword, setUpgradePassword] = useState('');
  const [upgradeBusy, setUpgradeBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const handleUpgrade = async () => {
    if (!upgradeEmail.trim() || upgradePassword.length < 6) {
      showToast('Enter a valid email and a password with at least 6 characters', 'warning');
      return;
    }
    setUpgradeBusy(true);
    const { error } = await upgradeAnonymous(upgradeEmail.trim(), upgradePassword, fullName.trim());
    setUpgradeBusy(false);
    if (error) {
      showToast(error.message || 'Could not create your account', 'error');
      return;
    }
    showToast(`Account created. A verification email was sent to ${upgradeEmail}.`, 'success');
    setUpgradeOpen(false);
    setUpgradeEmail('');
    setUpgradePassword('');
  };

  const handleGoogleUpgrade = async () => {
    setGoogleBusy(true);
    const { error } = await upgradeAnonymousWithGoogle();
    setGoogleBusy(false);
    if (error) {
      showToast(error.message || 'Could not link your Google account', 'error');
      return;
    }
    showToast('Google account linked. Your pantry is now saved.', 'success');
    setUpgradeOpen(false);
  };

  return (
    <SettingsSurface contentStyle={{ padding: s(16), gap: s(12) }}>
      <SettingsFieldLabel>Create an account</SettingsFieldLabel>
      <SettingsBodyText>
        Create an account to keep your items, meals, and shopping list backed up.
      </SettingsBodyText>

      {googleAvailable ? (
        <SettingsActionButton
          label={googleBusy ? 'Linking…' : 'Continue with Google'}
          tone="primary"
          loading={googleBusy}
          disabled={upgradeBusy}
          onPress={() => void handleGoogleUpgrade()}
        />
      ) : null}

      {!upgradeOpen ? (
        <SettingsActionButton
          label="Create with email"
          disabled={googleBusy}
          onPress={() => setUpgradeOpen(true)}
        />
      ) : (
        <YStack style={{ gap: s(12) }}>
          <SettingsTextField
            label="Email"
            value={upgradeEmail}
            onChangeText={setUpgradeEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="you@example.com"
          />
          <SettingsTextField
            label="Password"
            value={upgradePassword}
            onChangeText={setUpgradePassword}
            secureTextEntry
            allowPasswordReveal
            placeholder="At least 6 characters"
          />
          <XStack style={{ gap: s(10) }}>
            <View style={{ flex: 1 }}>
              <SettingsActionButton
                label={upgradeBusy ? 'Creating…' : 'Create account'}
                tone="primary"
                loading={upgradeBusy}
                disabled={googleBusy}
                onPress={() => void handleUpgrade()}
              />
            </View>
            <View style={{ flex: 1 }}>
              <SettingsActionButton
                label="Cancel"
                disabled={upgradeBusy || googleBusy}
                onPress={() => {
                  setUpgradeOpen(false);
                  setUpgradePassword('');
                }}
              />
            </View>
          </XStack>
        </YStack>
      )}
    </SettingsSurface>
  );
}
