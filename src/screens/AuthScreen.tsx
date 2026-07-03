import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import AppLogo from '../components/ui/AppLogo';
import TextField from '../components/ui/TextField';
import Button from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { colors } from '../theme';

type AuthMode = 'signin' | 'signup' | 'reset' | 'phone';

function friendlyAuthError(message: string, mode: AuthMode): string {
  const m = message.toLowerCase();
  if (
    m.includes('auth/invalid-credential') ||
    m.includes('auth/wrong-password') ||
    m.includes('auth/user-not-found') ||
    m.includes('invalid login credentials')
  ) {
    return 'That email and password combination did not match our records.';
  }
  if (m.includes('auth/user-disabled')) {
    return 'This account has been disabled. Contact support for help.';
  }
  if (m.includes('auth/email-already-in-use') || m.includes('already registered')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (m.includes('auth/weak-password') || m.includes('password should be at least')) {
    return 'Password must be at least 6 characters long.';
  }
  if (m.includes('auth/invalid-email') || m.includes('invalid email')) {
    return 'That email address does not look valid.';
  }
  if (m.includes('auth/too-many-requests') || m.includes('too many')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (m.includes('auth/operation-not-allowed') || m.includes('auth/admin-restricted-operation')) {
    return 'This sign-in method is not enabled for this project.';
  }
  if (m.includes('auth/network-request-failed') || m.includes('network')) {
    return 'Network error. Check your connection and try again.';
  }
  return mode === 'signin'
    ? 'Sign in failed. Please try again.'
    : message || 'Something went wrong. Please try again.';
}

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);

  const {
    signIn,
    signUp,
    resetPassword,
    signInWithGoogle,
    signInWithApple,
    startPhoneSignIn,
    confirmPhoneSignIn,
    continueAsGuest,
    googleAvailable,
    appleAvailable,
    mfaResolver,
    startMfaChallenge,
    completeMfaChallenge,
    clearMfaResolver,
  } = useAuth();
  const { showToast } = useToast();

  const [mfaCode, setMfaCode] = useState('');
  const [mfaCodeSent, setMfaCodeSent] = useState(false);
  const [mfaSending, setMfaSending] = useState(false);

  useEffect(() => {
    setPassword('');
    setShowPassword(false);
    setVerificationSent(null);
    setResetSent(null);
    setMfaCode('');
    setMfaCodeSent(false);
  }, [mode]);

  useEffect(() => {
    if (mfaResolver && !mfaCodeSent && !mfaSending) {
      setMfaSending(true);
      startMfaChallenge(0)
        .then(() => {
          setMfaCodeSent(true);
          showToast('Verification code sent to your phone', 'success');
        })
        .catch((err) => {
          showToast(err instanceof Error ? err.message : 'Could not send MFA code', 'error');
          clearMfaResolver();
        })
        .finally(() => setMfaSending(false));
    }
  }, [mfaResolver, mfaCodeSent, mfaSending, startMfaChallenge, clearMfaResolver, showToast]);

  const submit = async () => {
    if (loading) return;
    setLoading(true);

    if (mode === 'reset') {
      const trimmed = email.trim();
      if (!trimmed) {
        showToast('Please enter your email to reset your password', 'error');
        setLoading(false);
        return;
      }
      const { error } = await resetPassword(trimmed);
      if (error) showToast(friendlyAuthError(error.message, mode), 'error');
      else {
        setResetSent(trimmed);
        showToast('Password reset link sent. Check your inbox.', 'success');
      }
      setLoading(false);
      return;
    }

    if (mode === 'phone') {
      if (!phoneCodeSent) {
        const e164 = phoneNumber.trim().startsWith('+') ? phoneNumber.trim() : `+1${phoneNumber.replace(/\D/g, '')}`;
        const { error } = await startPhoneSignIn(e164);
        if (error) showToast(friendlyAuthError(error.message, 'signin'), 'error');
        else {
          setPhoneCodeSent(true);
          showToast('Verification code sent', 'success');
        }
      } else {
        const { error } = await confirmPhoneSignIn(phoneCode.trim());
        if (error) showToast(friendlyAuthError(error.message, 'signin'), 'error');
      }
      setLoading(false);
      return;
    }

    if (mode === 'signup') {
      if (!fullName.trim()) {
        showToast('Please enter your name', 'error');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        showToast('Password must be at least 6 characters long', 'error');
        setLoading(false);
        return;
      }
      const { error, needsVerification } = await signUp(email.trim(), password, fullName.trim());
      if (error) showToast(friendlyAuthError(error.message, mode), 'error');
      else if (needsVerification) {
        setVerificationSent(email.trim());
        showToast('Account created — check your email to verify.', 'success');
      } else {
        showToast('Welcome to Larderly!', 'success');
      }
      setLoading(false);
      return;
    }

    const { error, mfaRequired } = await signIn(email.trim(), password);
    if (mfaRequired) {
      showToast('Enter the code sent to your phone', 'info');
    } else if (error) {
      showToast(friendlyAuthError(error.message, mode), 'error');
    }
    setLoading(false);
  };

  const submitMfa = async () => {
    if (loading || mfaCode.length < 6) return;
    setLoading(true);
    try {
      await completeMfaChallenge(mfaCode.trim());
      showToast('Signed in successfully', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message.replace('Firebase: ', '') : 'Verification failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    const { error } = await signInWithGoogle();
    if (error && error.message !== 'Sign-in cancelled.') {
      showToast('Could not sign in with Google. Try again.', 'error');
    }
  };

  const onApple = async () => {
    const { error } = await signInWithApple();
    if (error) showToast('Could not sign in with Apple. Try again.', 'error');
  };

  const onGuest = async () => {
    if (loading) return;
    setLoading(true);
    const { error } = await continueAsGuest();
    setLoading(false);
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

  const heading = mfaResolver
    ? 'Two-factor sign in'
    : mode === 'signin'
      ? 'Welcome back'
      : mode === 'signup'
        ? 'Create your account'
        : mode === 'phone'
          ? 'Phone sign in'
          : 'Reset your password';
  const subheading = mfaResolver
    ? 'Enter the 6-digit code we sent to your enrolled phone.'
    : mode === 'signin'
      ? 'Sign in to access your pantry, scanner, and meal plans.'
      : mode === 'signup'
        ? 'Set up Larderly in under a minute.'
        : mode === 'phone'
          ? phoneCodeSent
            ? 'Enter the SMS verification code.'
            : 'We will text you a one-time code.'
          : 'Enter your email and we’ll send you a link to set a new password.';

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ padding: 20, flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-8 items-center">
            <AppLogo size="lg" showWordmark={false} animated />
            <Text className="mt-4 text-3xl font-bold tracking-tight text-primary">Larderly</Text>
            <Text className="mt-1 text-sm font-semibold text-muted">Your pantry, organized</Text>
          </View>

          <View className="rounded-card border border-line bg-surface p-6">
            {mode !== 'reset' ? (
              <View className="mb-6 flex-row gap-1.5 rounded-2xl border border-line bg-line/60 p-1.5">
                {(['signin', 'signup'] as const).map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => setMode(m)}
                    className={`flex-1 items-center rounded-xl py-2.5 ${
                      mode === m ? 'bg-surface' : ''
                    }`}
                  >
                    <Text
                      className={`text-sm font-bold ${mode === m ? 'text-ink' : 'text-muted'}`}
                    >
                      {m === 'signin' ? 'Sign In' : 'Create Account'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Pressable
                onPress={() => setMode('signin')}
                className="mb-4 flex-row items-center gap-1.5"
              >
                <Icon name="chevron-left" size={16} color={colors.muted} />
                <Text className="text-xs font-semibold text-muted">Back to sign in</Text>
              </Pressable>
            )}

            <View className="mb-6">
              <Text className="text-2xl font-bold text-ink">{heading}</Text>
              <Text className="mt-1 text-sm leading-relaxed text-muted">{subheading}</Text>
            </View>

            {verificationSent && mode === 'signup' ? (
              <View className="mb-5 flex-row gap-3 rounded-2xl border border-success/30 bg-success/10 p-4">
                <Icon name="success" size={22} color={colors.success} />
                <View className="flex-1">
                  <Text className="text-sm font-bold text-ink">Check your email</Text>
                  <Text className="mt-1 text-xs leading-relaxed text-ink/70">
                    We sent a verification link to {verificationSent}. Tap it to activate your
                    account.
                  </Text>
                </View>
              </View>
            ) : null}

            {resetSent && mode === 'reset' ? (
              <View className="mb-5 flex-row gap-3 rounded-2xl border border-success/30 bg-success/10 p-4">
                <Icon name="success" size={22} color={colors.success} />
                <View className="flex-1">
                  <Text className="text-sm font-bold text-ink">Reset link sent</Text>
                  <Text className="mt-1 text-xs leading-relaxed text-ink/70">
                    If an account exists for {resetSent}, you’ll receive an email with instructions
                    shortly.
                  </Text>
                </View>
              </View>
            ) : null}

            {mfaResolver ? (
              <View className="gap-4">
                <TextField
                  label="Verification code"
                  value={mfaCode}
                  onChangeText={(v) => setMfaCode(v.replace(/[^\d]/g, ''))}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="6-digit code"
                />
                <Button
                  label={loading ? 'Verifying…' : 'Verify & sign in'}
                  onPress={submitMfa}
                  loading={loading || mfaSending}
                  disabled={mfaCode.length < 6}
                  full
                />
                <Button
                  label="Cancel"
                  variant="ghost"
                  onPress={() => {
                    clearMfaResolver();
                    setMfaCode('');
                    setMfaCodeSent(false);
                  }}
                />
              </View>
            ) : (
              <>
            {mode !== 'reset' && mode !== 'phone' ? (
              <View className="mb-5 gap-2.5">
                {googleAvailable ? (
                  <Pressable
                    onPress={onGoogle}
                    className="flex-row items-center justify-center gap-2.5 rounded-2xl border border-line bg-surface py-3"
                  >
                    <Icon name="google" size={18} color="#4285F4" />
                    <Text className="text-sm font-bold text-ink">Continue with Google</Text>
                  </Pressable>
                ) : null}
                {appleAvailable ? (
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                    cornerRadius={16}
                    style={{ height: 48, width: '100%' }}
                    onPress={onApple}
                  />
                ) : null}
                {googleAvailable || appleAvailable ? (
                  <View className="my-1 flex-row items-center gap-3">
                    <View className="h-px flex-1 bg-line" />
                    <Text className="text-[10px] font-bold uppercase tracking-widest text-muted">
                      or
                    </Text>
                    <View className="h-px flex-1 bg-line" />
                  </View>
                ) : null}
              </View>
            ) : null}

            <View className="gap-4">
              {mode === 'phone' ? (
                !phoneCodeSent ? (
                  <TextField label="Phone number" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" placeholder="+1 555 000 0000" />
                ) : (
                  <TextField label="Verification code" value={phoneCode} onChangeText={setPhoneCode} keyboardType="number-pad" placeholder="123456" />
                )
              ) : (
              <>
              {mode === 'signup' ? (
                <TextField
                  label="Full Name"
                  icon="user"
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Jane Smith"
                  autoComplete="name"
                  autoCapitalize="words"
                />
              ) : null}

              <TextField
                label="Email Address"
                icon="mail"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                autoComplete="email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              {mode !== 'reset' ? (
                <View>
                  <View className="flex-row items-center justify-between">
                    <Text className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">
                      Password
                    </Text>
                    {mode === 'signin' ? (
                      <Pressable onPress={() => setMode('reset')}>
                        <Text className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                          Forgot?
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                  <TextField
                    icon="lock"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    secureTextEntry={!showPassword}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    autoCapitalize="none"
                    rightIcon={showPassword ? 'eye-off' : 'eye'}
                    onRightIconPress={() => setShowPassword((s) => !s)}
                    hint={mode === 'signup' ? 'At least 6 characters' : undefined}
                  />
                </View>
              ) : null}

              <Button
                label={
                  mode === 'signin'
                    ? 'Sign In'
                    : mode === 'signup'
                      ? 'Create Account'
                      : 'Send Reset Link'
                }
                onPress={submit}
                loading={loading}
                full
              />
              </>
              )}

              {mode === 'phone' ? (
                <Button
                  label={phoneCodeSent ? 'Verify code' : 'Send code'}
                  onPress={submit}
                  loading={loading}
                  full
                />
              ) : null}
            </View>

            {mode === 'signin' ? (
              <Pressable onPress={() => { setMode('phone'); setPhoneCodeSent(false); }} className="mt-3">
                <Text className="text-center text-sm font-semibold text-primary">Sign in with phone</Text>
              </Pressable>
            ) : mode === 'phone' ? (
              <Pressable onPress={() => setMode('signin')} className="mt-3">
                <Text className="text-center text-sm font-semibold text-muted">Back to email sign in</Text>
              </Pressable>
            ) : null}

            {mode !== 'reset' && mode !== 'phone' ? (
              <View className="mt-5">
                <Button label="Continue without account" onPress={onGuest} variant="secondary" full />
                <Text className="mt-2 text-center text-[11px] text-muted">
                  You can create an account later to save your data across devices.
                </Text>
              </View>
            ) : null}

            {mode !== 'reset' && mode !== 'phone' ? (
              <View className="mt-6 flex-row justify-center">
                <Text className="text-xs text-muted">
                  {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                </Text>
                <Pressable onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
                  <Text className="text-xs font-bold text-primary">
                    {mode === 'signin' ? 'Sign up' : 'Sign in'}
                  </Text>
                </Pressable>
              </View>
            ) : null}

              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
