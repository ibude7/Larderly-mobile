import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { AuthShell } from '../../components/auth/AuthShell';
import TextField from '../../components/ui/TextField';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { friendlyAuthError } from '../../lib/authErrors';
import { AUTH_FLOW_COPY } from '../../navigation/authContent';
import type { AuthStackNavigationProp } from '../../navigation/types';

const copy = AUTH_FLOW_COPY.phoneVerify;

export default function PhoneVerifyScreen() {
  const navigation = useNavigation<AuthStackNavigationProp>();
  const { confirmPhoneSignIn } = useAuth();
  const { showToast } = useToast();
  const [phoneCode, setPhoneCode] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    const { error } = await confirmPhoneSignIn(phoneCode.trim());
    if (error) showToast(friendlyAuthError(error.message, 'phone'), 'error');
    setLoading(false);
  };

  return (
    <AuthShell
      eyebrow={copy.eyebrow}
      headline={copy.title}
      headlineAccent={copy.titleAccent}
      subhead={copy.subcopy}
      accentColor={copy.accentColor}
      onBack={() => navigation.navigate('PhoneSignIn')}
      primaryLabel={copy.primaryLabel}
      onPrimary={submit}
      primaryLoading={loading}
    >
      <TextField
        variant="landing"
        label="Verification code"
        value={phoneCode}
        onChangeText={setPhoneCode}
        placeholder="6-digit code"
        keyboardType="number-pad"
        maxLength={6}
      />
    </AuthShell>
  );
}
