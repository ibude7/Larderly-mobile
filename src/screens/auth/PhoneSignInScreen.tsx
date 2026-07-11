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

const copy = AUTH_FLOW_COPY.phoneSignIn;

export default function PhoneSignInScreen() {
  const navigation = useNavigation<AuthStackNavigationProp>();
  const { startPhoneSignIn } = useAuth();
  const { showToast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    const e164 = phoneNumber.trim().startsWith('+')
      ? phoneNumber.trim()
      : `+1${phoneNumber.replace(/\D/g, '')}`;
    const { error } = await startPhoneSignIn(e164);
    if (error) showToast(friendlyAuthError(error.message, 'phone'), 'error');
    else {
      showToast('Verification code sent', 'success');
      navigation.navigate('PhoneVerify');
    }
    setLoading(false);
  };

  return (
    <AuthShell
      eyebrow={copy.eyebrow}
      headline={copy.title}
      headlineAccent={copy.titleAccent}
      subhead={copy.subcopy}
      accentColor={copy.accentColor}
      onBack={() => navigation.navigate('SignIn')}
      primaryLabel={copy.primaryLabel}
      onPrimary={submit}
      primaryLoading={loading}
    >
      <TextField
        variant="landing"
        label="Phone number"
        icon="phone"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        placeholder="+1 555 000 0000"
        keyboardType="phone-pad"
        autoComplete="tel"
      />
    </AuthShell>
  );
}
