import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { AuthShell } from '../../components/auth/AuthShell';
import { AuthNotice } from '../../components/auth/AuthNotice';
import TextField from '../../components/ui/TextField';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { friendlyAuthError } from '../../lib/authErrors';
import { AUTH_FLOW_COPY } from '../../navigation/authContent';
import type { AuthStackNavigationProp } from '../../navigation/types';

const copy = AUTH_FLOW_COPY.forgotPassword;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<AuthStackNavigationProp>();
  const { resetPassword } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState<string | null>(null);

  const submit = async () => {
    if (loading) return;
    const trimmed = email.trim();
    if (!trimmed) {
      showToast('Please enter your email to reset your password', 'error');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    const { error } = await resetPassword(trimmed);
    if (error) showToast(friendlyAuthError(error.message, 'reset'), 'error');
    else {
      setResetSent(trimmed);
      showToast('Password reset link sent. Check your inbox.', 'success');
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
      {resetSent ? (
        <AuthNotice
          title="Reset link sent"
          body={`If an account exists for ${resetSent}, you will receive an email shortly.`}
        />
      ) : null}
      <TextField
        variant="landing"
        label="Email"
        icon="mail"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        autoComplete="email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
    </AuthShell>
  );
}
