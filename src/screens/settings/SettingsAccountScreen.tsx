import { useEffect, useMemo, useRef, useState } from 'react';
import { KeyRound } from '../../components/ui/Glyph';
import { Text, YStack } from 'tamagui';
import { useGoBack } from '../../navigation/useGoBack';
import { SettingsPageShell } from '../../components/settings/SettingsPageShell';
import { ProfileSection } from '../../components/settings/ProfileSection';
import { GuestUpgradeSection } from '../../components/settings/GuestUpgradeSection';
import { AccountActionsSection } from '../../components/settings/AccountActionsSection';
import { SettingsActionButton } from '../../components/settings/SettingsActionButton';
import { SettingsFieldLabel } from '../../components/settings/SettingsFieldLabel';
import { SettingsRow } from '../../components/settings/SettingsRow';
import { SettingsRowGroup } from '../../components/settings/SettingsRowGroup';
import { SettingsSurface } from '../../components/settings/SettingsSurface';
import { settingsFonts } from '../../components/settings/settingsFonts';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../contexts/ProfileContext';
import { useToast } from '../../contexts/ToastContext';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';

const RESEND_COOLDOWN_SECONDS = 60;

export default function SettingsAccountScreen() {
  const goBack = useGoBack();
  const { s, fs } = useScale();
  const c = useSettingsTheme();
  const { user, isAnonymous, sendVerificationEmail, resetPassword } = useAuth();
  const { profile } = useProfile();
  const { showToast } = useToast();
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resettingPassword, setResettingPassword] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const needsVerification = Boolean(user && !isAnonymous && user.email && !user.emailVerified);
  const hasPasswordProvider = useMemo(
    () => (user?.providerData ?? []).some((p) => p.providerId === 'password'),
    [user?.providerData],
  );

  const handleResend = async () => {
    setResending(true);
    const { error } = await sendVerificationEmail();
    setResending(false);
    if (error) {
      showToast(error.message || 'Could not send verification email', 'error');
      return;
    }
    showToast(`Verification email sent to ${user?.email}`, 'success');
    setCooldown(RESEND_COOLDOWN_SECONDS);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handlePasswordReset = async () => {
    if (!user?.email) {
      showToast('No email address on this account', 'warning');
      return;
    }
    setResettingPassword(true);
    const { error } = await resetPassword(user.email);
    setResettingPassword(false);
    if (error) {
      showToast(error.message || 'Could not send password reset email', 'error');
      return;
    }
    showToast(`Password reset email sent to ${user.email}`, 'success');
  };

  return (
    <SettingsPageShell title="Account" subtitle="Profile and session" onBack={goBack}>
      {needsVerification ? (
        <SettingsSurface contentStyle={{ padding: s(14), gap: s(8) }}>
          <Text
            style={{
              fontFamily: settingsFonts.semibold,
              fontSize: fs(14),
              lineHeight: fs(19),
              color: c.ink,
              flexShrink: 0,
            }}
          >
            Verify your email
          </Text>
          <Text
            style={{
              fontFamily: settingsFonts.regular,
              fontSize: fs(13),
              lineHeight: fs(18),
              color: c.inkSoft,
              flexShrink: 0,
            }}
          >
            We sent a link to {user?.email}. Tap it to confirm your address.
          </Text>
          <SettingsActionButton
            label={resending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend link'}
            onPress={() => void handleResend()}
            loading={resending}
            disabled={resending || cooldown > 0}
          />
        </SettingsSurface>
      ) : null}

      <ProfileSection />

      {isAnonymous ? <GuestUpgradeSection fullName={profile?.full_name || ''} /> : null}

      {!isAnonymous && hasPasswordProvider ? (
        <YStack style={{ gap: s(8) }}>
          <SettingsFieldLabel>Password</SettingsFieldLabel>
          <SettingsRowGroup>
            <SettingsRow
              icon={KeyRound}
              label="Reset password"
              subtitle="Email a secure link to choose a new password."
              disabled={resettingPassword}
              onPress={() => void handlePasswordReset()}
            />
          </SettingsRowGroup>
        </YStack>
      ) : null}

      <AccountActionsSection />
    </SettingsPageShell>
  );
}
