import { useEffect, useState } from 'react';
import { YStack } from 'tamagui';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useReauth, withReauth } from '../auth/ReauthDialog';
import { toE164 } from '../../lib/phone';
import { useScale } from '../../theme/scale';
import { SettingsActionButton } from './SettingsActionButton';
import { SettingsBodyText } from './SettingsBodyText';
import { SettingsFieldLabel } from './SettingsFieldLabel';
import { SettingsSurface } from './SettingsSurface';
import { SettingsTextField } from './SettingsTextField';
import { SettingsSheet } from './SettingsSheet';

type EnrollStep = 'enter-phone' | 'enter-code';

export function SecuritySection() {
  const { s } = useScale();
  const {
    user,
    isAnonymous,
    getEnrolledMfaFactors,
    startMfaEnrollment,
    completeMfaEnrollment,
    unenrollMfaFactor,
  } = useAuth();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const reauth = useReauth();
  const [factors, setFactors] = useState<ReturnType<typeof getEnrolledMfaFactors>>([]);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<EnrollStep>('enter-phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [displayName, setDisplayName] = useState('My phone');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setFactors(getEnrolledMfaFactors?.() ?? []);
  }, [user, getEnrolledMfaFactors]);

  useEffect(() => {
    if (!open) {
      setStep('enter-phone');
      setPhoneNumber('');
      setCode('');
    }
  }, [open]);

  if (isAnonymous) {
    return (
      <SettingsSurface contentStyle={{ padding: s(14), gap: s(8) }}>
        <SettingsBodyText accent>Two-factor authentication</SettingsBodyText>
        <SettingsBodyText>
          Two-factor authentication requires a full account. Create an account from Account settings
          to enable SMS 2FA.
        </SettingsBodyText>
      </SettingsSurface>
    );
  }

  const sendCode = async () => {
    setSubmitting(true);
    try {
      await withReauth(
        () => startMfaEnrollment(toE164(phoneNumber)),
        reauth,
        'Confirm your sign-in to enable two-factor authentication.',
      );
      setStep('enter-code');
      showToast(`Code sent to ${toE164(phoneNumber)}`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not send code';
      if (msg !== 'Re-authentication cancelled.') {
        showToast(msg.replace('Firebase: ', ''), 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const verifyCode = async () => {
    setSubmitting(true);
    try {
      await completeMfaEnrollment(code, displayName.trim() || 'My phone');
      showToast('Two-factor authentication enabled', 'success');
      setFactors(getEnrolledMfaFactors?.() ?? []);
      setOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      showToast(msg.replace('Firebase: ', ''), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const removeFactor = async (uid: string, name: string) => {
    const ok = await confirm({
      title: 'Remove 2FA method?',
      message: `${name} will no longer work for sign-in.`,
      destructive: true,
      confirmLabel: 'Remove',
    });
    if (!ok || !unenrollMfaFactor) return;
    try {
      await withReauth(() => unenrollMfaFactor(uid), reauth, 'Confirm to remove two-factor authentication.');
      showToast('2FA method removed', 'info');
      setFactors(getEnrolledMfaFactors?.() ?? []);
    } catch (err) {
      if ((err as Error).message !== 'Re-authentication cancelled.') {
        showToast('Could not remove factor', 'error');
      }
    }
  };

  return (
    <YStack style={{ gap: s(12) }}>
      <SettingsBodyText>
        Add your phone as a second factor. You&apos;ll receive an SMS code on new sign-ins.
      </SettingsBodyText>
      <SettingsFieldLabel>{factors.length > 0 ? '2FA on' : '2FA off'}</SettingsFieldLabel>

      {factors.length === 0 ? (
        <SettingsBodyText>No second factor enrolled.</SettingsBodyText>
      ) : (
        factors.map((f) => (
          <SettingsSurface
            key={f.uid}
            contentStyle={{
              paddingHorizontal: s(12),
              paddingVertical: s(10),
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: s(8),
            }}
          >
            <YStack style={{ flex: 1, minWidth: 0 }}>
              <SettingsBodyText accent>{f.displayName ?? 'Phone'}</SettingsBodyText>
              <SettingsBodyText>{f.phoneNumber ?? 'SMS factor'}</SettingsBodyText>
            </YStack>
            <SettingsActionButton
              label="Remove"
              tone="danger"
              onPress={() => void removeFactor(f.uid, f.displayName ?? 'factor')}
              style={{ paddingHorizontal: s(10), paddingVertical: s(6), minHeight: undefined }}
            />
          </SettingsSurface>
        ))
      )}

      <SettingsActionButton label="Add 2FA via SMS" onPress={() => setOpen(true)} />

      <SettingsSheet isOpen={open} onClose={() => setOpen(false)} title="Add SMS two-factor">
        {step === 'enter-phone' ? (
          <YStack style={{ gap: s(12) }}>
            <SettingsTextField
              label="Phone number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="+1 (555) 555-5555"
              keyboardType="phone-pad"
            />
            <SettingsTextField
              label="Display name"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="e.g. iPhone"
            />
            <SettingsBodyText>
              By enrolling you agree to receive an SMS verification code. Standard rates apply.
            </SettingsBodyText>
            <SettingsActionButton
              label={submitting ? 'Sending…' : 'Send code'}
              tone="primary"
              loading={submitting}
              onPress={() => void sendCode()}
            />
          </YStack>
        ) : (
          <YStack style={{ gap: s(12) }}>
            <SettingsBodyText>Enter the 6-digit code sent to {toE164(phoneNumber)}.</SettingsBodyText>
            <SettingsTextField
              label="Verification code"
              value={code}
              onChangeText={(v) => setCode(v.replace(/[^\d]/g, ''))}
              keyboardType="number-pad"
            />
            <SettingsActionButton
              label={submitting ? 'Verifying…' : 'Verify & enable'}
              tone="primary"
              loading={submitting}
              disabled={code.length < 6}
              onPress={() => void verifyCode()}
            />
            <SettingsActionButton label="Use a different number" onPress={() => setStep('enter-phone')} />
          </YStack>
        )}
      </SettingsSheet>
    </YStack>
  );
}
