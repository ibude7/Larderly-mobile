import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import Button from '../ui/Button';
import TextField from '../ui/TextField';
import Modal from '../ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useReauth, withReauth } from '../auth/ReauthDialog';
import { toE164 } from '../../lib/phone';

type EnrollStep = 'enter-phone' | 'enter-code';

export default function SecuritySection() {
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
      <View className="rounded-2xl border border-warning/30 bg-warning/10 p-4">
        <Text className="font-semibold text-ink">Security</Text>
        <Text className="mt-2 text-sm text-muted">
          Two-factor authentication requires a full account. Upgrade from guest mode in Settings.
        </Text>
      </View>
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
    <View className="rounded-2xl border border-line bg-surface p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="font-semibold text-ink">Security</Text>
        <Text className="text-xs font-bold uppercase text-muted">{factors.length > 0 ? '2FA on' : '2FA off'}</Text>
      </View>
      <Text className="mb-3 text-sm text-muted">
        Add your phone as a second factor. You&apos;ll receive an SMS code on new sign-ins.
      </Text>
      {factors.length === 0 ? (
        <Text className="mb-3 text-sm text-muted">No second factor enrolled.</Text>
      ) : (
        factors.map((f) => (
          <View key={f.uid} className="mb-2 flex-row items-center justify-between rounded-xl bg-canvas px-3 py-2">
            <View>
              <Text className="font-medium text-ink">{f.displayName ?? 'Phone'}</Text>
              <Text className="text-xs text-muted">{f.phoneNumber ?? 'SMS factor'}</Text>
            </View>
            <Button label="Remove" size="sm" variant="danger" onPress={() => removeFactor(f.uid, f.displayName ?? 'factor')} />
          </View>
        ))
      )}
      <Button label="Add 2FA via SMS" onPress={() => setOpen(true)} />

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Add SMS two-factor">
        {step === 'enter-phone' ? (
          <View className="gap-3">
            <TextField
              label="Phone number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="+1 (555) 555-5555"
              keyboardType="phone-pad"
            />
            <TextField
              label="Display name"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="e.g. iPhone"
            />
            <Text className="text-xs text-muted">
              By enrolling you agree to receive an SMS verification code. Standard rates apply.
            </Text>
            <Button label={submitting ? 'Sending…' : 'Send code'} onPress={sendCode} loading={submitting} />
          </View>
        ) : (
          <View className="gap-3">
            <Text className="text-sm text-muted">Enter the 6-digit code sent to {toE164(phoneNumber)}.</Text>
            <TextField
              label="Verification code"
              value={code}
              onChangeText={(v) => setCode(v.replace(/[^\d]/g, ''))}
              keyboardType="number-pad"
              maxLength={6}
            />
            <Button
              label={submitting ? 'Verifying…' : 'Verify & enable'}
              onPress={verifyCode}
              loading={submitting}
              disabled={code.length < 6}
            />
            <Button label="Use a different number" variant="ghost" onPress={() => setStep('enter-phone')} />
          </View>
        )}
      </Modal>
    </View>
  );
}
