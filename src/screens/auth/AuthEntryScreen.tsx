import { useEffect, useState } from 'react';
import { Text, Pressable, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { AuthCanvas } from '../../components/auth/AuthCanvas';
import { AuthField } from '../../components/auth/AuthField';
import { AuthModeSwitch } from '../../components/auth/AuthModeSwitch';
import { SocialSignInButtons } from '../../components/auth/SocialSignInButtons';
import { AuthNotice } from '../../components/auth/AuthNotice';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthFlow } from '../../contexts/AuthFlowContext';
import { useToast } from '../../contexts/ToastContext';
import { friendlyAuthError } from '../../lib/authErrors';
import { AUTH_ENTRY_COPY, type AuthEntryMode } from '../../navigation/authContent';
import { useScale } from '../../theme/scale';
import { landing, landingFonts as SF } from '../../theme/landing';
import type { AuthStackNavigationProp } from '../../navigation/types';

export default function AuthEntryScreen() {
  const navigation = useNavigation<AuthStackNavigationProp>();
  const route = useRoute();
  const { fs } = useScale();
  const { signIn, signUp, continueAsGuest } = useAuth();
  const { email, setEmail, fullName, setFullName } = useAuthFlow();
  const { showToast } = useToast();

  const [mode, setMode] = useState<AuthEntryMode>(
    route.name === 'SignUp' ? 'signup' : 'signin',
  );
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState<string | null>(null);

  useEffect(() => {
    setMode(route.name === 'SignUp' ? 'signup' : 'signin');
  }, [route.name]);

  const copy = AUTH_ENTRY_COPY[mode];
  const isSignIn = mode === 'signin';

  const submitSignIn = async () => {
    if (loading) return;
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

  const submitSignUp = async () => {
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

  const handleModeChange = (next: AuthEntryMode) => {
    setMode(next);
    setVerificationSent(null);
    setPassword('');
  };

  return (
    <AuthCanvas
      eyebrow={copy.eyebrow}
      headline={copy.title}
      headlineAccent={copy.titleAccent}
      subhead={copy.subcopy}
      accentColor={copy.accentColor}
      onBack={() => navigation.navigate('Landing')}
      headerSlot={
        <AuthModeSwitch mode={mode} onChange={handleModeChange} disabled={loading || guestLoading} />
      }
      primaryLabel={copy.primaryLabel}
      onPrimary={isSignIn ? submitSignIn : submitSignUp}
      primaryLoading={loading}
      primaryDisabled={guestLoading}
      secondaryLabel={isSignIn ? 'Explore without an account' : undefined}
      onSecondary={isSignIn ? onGuest : undefined}
      secondaryLoading={guestLoading}
      secondaryDisabled={loading}
    >
      <SocialSignInButtons onError={(msg) => showToast(msg, 'error')} />

      {verificationSent && !isSignIn ? (
        <AuthNotice
          title="Check your email"
          body={`We sent a verification link to ${verificationSent}. Tap it to activate your account.`}
        />
      ) : null}

      {!isSignIn ? (
        <AuthField
          label="Full name"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Jane Smith"
          autoComplete="name"
          autoCapitalize="words"
        />
      ) : null}

      <AuthField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        autoComplete="email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      {isSignIn ? (
        <AuthField
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Your password"
          secureTextEntry={!showPassword}
          autoComplete="current-password"
          autoCapitalize="none"
          rightIcon={showPassword ? 'eye-off' : 'eye'}
          onRightIconPress={() => setShowPassword((v) => !v)}
          trailing={
            <Pressable onPress={() => navigation.navigate('ForgotPassword')} hitSlop={8}>
              <Text
                style={{
                  fontSize: fs(12),
                  fontFamily: SF.semibold,
                  fontWeight: Platform.OS === 'ios' ? '600' : undefined,
                  color: landing.accent,
                }}
              >
                Forgot?
              </Text>
            </Pressable>
          }
        />
      ) : (
        <AuthField
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Create a password"
          secureTextEntry={!showPassword}
          autoComplete="new-password"
          autoCapitalize="none"
          rightIcon={showPassword ? 'eye-off' : 'eye'}
          onRightIconPress={() => setShowPassword((v) => !v)}
          hint="At least 6 characters"
        />
      )}

      {isSignIn ? (
        <Pressable onPress={() => navigation.navigate('PhoneSignIn')} hitSlop={8}>
          <Text
            style={{
              fontSize: fs(13),
              fontFamily: SF.regular,
              fontWeight: Platform.OS === 'ios' ? '400' : undefined,
              color: landing.muted,
              textAlign: 'center',
            }}
          >
            Sign in with phone
          </Text>
        </Pressable>
      ) : null}
    </AuthCanvas>
  );
}
