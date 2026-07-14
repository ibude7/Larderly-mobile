import { useState } from 'react';
import { Text, Pressable, Platform, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { AuthShell } from '../../components/auth/AuthShell';
import { SocialSignInButtons } from '../../components/auth/SocialSignInButtons';
import { AuthNotice } from '../../components/auth/AuthNotice';
import TextField from '../../components/ui/TextField';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthFlow } from '../../contexts/AuthFlowContext';
import { useToast } from '../../contexts/ToastContext';
import { friendlyAuthError } from '../../lib/authErrors';
import { AUTH_ENTRY_COPY } from '../../navigation/authContent';
import { useLandingColors } from '../../hooks/useLandingColors';
import { useScale } from '../../theme/scale';
import { landingFonts as SF } from '../../theme/landing';
import type { AuthStackNavigationProp } from '../../navigation/types';

const copy = AUTH_ENTRY_COPY.signup;

export default function SignUpScreen() {
  const navigation = useNavigation<AuthStackNavigationProp>();
  const { fs } = useScale();
  const lc = useLandingColors();
  const { signUp } = useAuth();
  const { email, setEmail, fullName, setFullName } = useAuthFlow();
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState<string | null>(null);

  const submit = async () => {
    if (loading) return;
    if (!fullName.trim()) {
      showToast('Please enter your name', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    const { error, needsVerification } = await signUp(email.trim(), password, fullName.trim());
    if (error) showToast(friendlyAuthError(error.message, 'signup'), 'error');
    else if (needsVerification) {
      setVerificationSent(email.trim());
      showToast('Account created — check your email to verify.', 'success');
    } else {
      showToast('Welcome to Larderly!', 'success');
    }
    setLoading(false);
  };

  return (
    <AuthShell
      headline={copy.title}
      headlineAccent={copy.titleAccent}
      subhead={copy.subcopy}
      accentColor={copy.accentColor}
      onBack={() => navigation.navigate('Landing')}
      primaryLabel={copy.primaryLabel}
      onPrimary={submit}
      primaryLoading={loading}
      footerLinks={
        <Text style={[styles.footerPrompt, { fontSize: fs(14), color: lc.body }]}>
          Already have an account?{' '}
          <Text
            style={[styles.footerLink, { color: lc.accent }]}
            onPress={() => navigation.navigate('SignIn')}
          >
            Sign in
          </Text>
        </Text>
      }
    >
      <SocialSignInButtons onError={(msg) => showToast(msg, 'error')} />

      {verificationSent ? (
        <AuthNotice
          title="Check your email"
          body={`We sent a verification link to ${verificationSent}. Tap it to activate your account.`}
        />
      ) : null}

      <TextField
        variant="landing"
        label="Full name"
        icon="user"
        value={fullName}
        onChangeText={setFullName}
        placeholder="Jane Smith"
        autoComplete="name"
        autoCapitalize="words"
      />
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
      <TextField
        variant="landing"
        label="Password"
        icon="lock"
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        secureTextEntry={!showPassword}
        autoComplete="new-password"
        autoCapitalize="none"
        rightIcon={showPassword ? 'eye-off' : 'eye'}
        onRightIconPress={() => setShowPassword((v) => !v)}
        hint="At least 6 characters"
      />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  footerPrompt: {
    fontFamily: SF.regular,
    fontWeight: Platform.OS === 'ios' ? '400' : undefined,
    textAlign: 'center',
  },
  footerLink: {
    fontFamily: SF.semibold,
    fontWeight: Platform.OS === 'ios' ? '600' : undefined,
  },
});
