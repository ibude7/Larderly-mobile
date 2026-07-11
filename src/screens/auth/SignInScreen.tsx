import { useState } from 'react';
import { View, Text, Pressable, Platform, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { AuthShell } from '../../components/auth/AuthShell';
import { SocialSignInButtons } from '../../components/auth/SocialSignInButtons';
import { GlassButton } from '../../components/landing/GlassButton';
import TextField from '../../components/ui/TextField';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthFlow } from '../../contexts/AuthFlowContext';
import { useToast } from '../../contexts/ToastContext';
import { friendlyAuthError } from '../../lib/authErrors';
import { AUTH_ENTRY_COPY } from '../../navigation/authContent';
import { useScale } from '../../theme/scale';
import { landing, landingFonts as SF } from '../../theme/landing';
import type { AuthStackNavigationProp } from '../../navigation/types';

const copy = AUTH_ENTRY_COPY.signin;

export default function SignInScreen() {
  const navigation = useNavigation<AuthStackNavigationProp>();
  const { s, fs } = useScale();
  const { signIn, continueAsGuest } = useAuth();
  const { email, setEmail } = useAuthFlow();
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const submit = async () => {
    if (loading || guestLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    const { error, mfaRequired } = await signIn(email.trim(), password);
    if (mfaRequired) {
      showToast('Enter the code sent to your phone', 'info');
      navigation.navigate('MfaVerify');
    } else if (error) {
      showToast(friendlyAuthError(error.message, 'signin'), 'error');
    }
    setLoading(false);
  };

  const onGuest = async () => {
    if (loading || guestLoading) return;
    setGuestLoading(true);
    const { error } = await continueAsGuest();
    setGuestLoading(false);
    if (error) {
      const m = error.message.toLowerCase();
      const friendly =
        m.includes('operation-not-allowed') ||
        m.includes('admin-restricted-operation') ||
        m.includes('not enabled')
          ? 'Guest mode is not enabled. Enable Anonymous sign-in in Firebase Authentication.'
          : 'Could not continue as guest. Please try again.';
      showToast(friendly, 'error');
    }
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
      primaryDisabled={guestLoading}
      footerLinks={
        <>
          <GlassButton
            label="Explore without an account"
            variant="light"
            frosted
            onPress={onGuest}
            loading={guestLoading}
            disabled={loading}
          />
          <Text style={[styles.footerPrompt, { fontSize: fs(13) }]}>
            New here?{' '}
            <Text style={styles.footerLink} onPress={() => navigation.navigate('SignUp')}>
              Create an account
            </Text>
          </Text>
        </>
      }
    >
      <SocialSignInButtons onError={(msg) => showToast(msg, 'error')} />
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
      <View>
        <View style={[styles.passwordHeader, { marginBottom: s(8) }]}>
          <Text style={[styles.fieldLabel, { fontSize: fs(11), letterSpacing: fs(1.2) }]}>
            Password
          </Text>
          <Pressable onPress={() => navigation.navigate('ForgotPassword')} hitSlop={8}>
            <Text style={[styles.link, { fontSize: fs(13) }]}>Forgot?</Text>
          </Pressable>
        </View>
        <TextField
          variant="landing"
          icon="lock"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry={!showPassword}
          autoComplete="current-password"
          autoCapitalize="none"
          rightIcon={showPassword ? 'eye-off' : 'eye'}
          onRightIconPress={() => setShowPassword((v) => !v)}
        />
      </View>
      <Pressable
        onPress={() => navigation.navigate('PhoneSignIn')}
        style={{ alignItems: 'center', paddingVertical: s(2) }}
      >
        <Text style={[styles.mutedLink, { fontSize: fs(13) }]}>Sign in with phone</Text>
      </Pressable>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontFamily: SF.bold,
    fontWeight: Platform.OS === 'ios' ? '700' : undefined,
    textTransform: 'uppercase',
    color: landing.muted,
  },
  link: {
    fontFamily: SF.semibold,
    fontWeight: Platform.OS === 'ios' ? '600' : undefined,
    color: landing.accent,
  },
  footerPrompt: {
    fontFamily: SF.regular,
    fontWeight: Platform.OS === 'ios' ? '400' : undefined,
    color: landing.body,
    textAlign: 'center',
  },
  footerLink: {
    fontFamily: SF.semibold,
    fontWeight: Platform.OS === 'ios' ? '600' : undefined,
    color: landing.accent,
  },
  mutedLink: {
    fontFamily: SF.regular,
    fontWeight: Platform.OS === 'ios' ? '400' : undefined,
    color: landing.muted,
    textAlign: 'center',
  },
});
