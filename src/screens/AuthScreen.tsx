import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import AppLogo from '../components/ui/AppLogo';
import TextField from '../components/ui/TextField';
import Button from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { GoogleLogo } from '../components/ui/GoogleLogo';
import { useAppColors } from '../hooks/useAppColors';

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
  const c = useAppColors();
  const insets = useSafeAreaInsets();
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
    <View style={{ flex: 1, backgroundColor: c.canvas }}>
      {/* Decorative full-screen background elements */}
      <View
        style={{
          width: 400,
          height: 400,
          borderRadius: 200,
          backgroundColor: c.primaryGlow,
          position: 'absolute',
          top: -80,
          alignSelf: 'center',
        }}
      />
      <View
        style={{
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: c.violetGlow,
          position: 'absolute',
          top: 60,
          right: -40,
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            padding: 24,
            flexGrow: 1,
            justifyContent: 'center',
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <Animated.View
            entering={FadeInDown.duration(600).withInitialValues({
              transform: [{ translateY: 30 }],
            })}
            style={{ marginBottom: 40, alignItems: 'center' }}
          >
            <AppLogo size="lg" showWordmark={false} animated />
            <Text
              style={{
                fontSize: 42,
                fontFamily: 'Fraunces_700Bold',
                letterSpacing: -1,
                color: c.ink,
                marginTop: 16,
              }}
            >
              Larderly
            </Text>
            <Text style={{ fontSize: 15, color: c.muted, marginTop: 4, fontFamily: 'Outfit_500Medium' }}>
              Your pantry, organized
            </Text>
          </Animated.View>

          {/* Form Card (BlurView) */}
          <BlurView
            intensity={c.blurIntensity as number}
            tint={c.blurTint as any}
            style={{
              borderRadius: 28,
              borderWidth: 1,
              borderColor: c.lineStrong,
              overflow: 'hidden',
              padding: 24,
            }}
          >
            {mode !== 'reset' ? (
              <View className="mb-6 flex-row gap-1.5 rounded-2xl border border-line dark:border-line-dark bg-line/60 p-1.5">
                {(['signin', 'signup'] as const).map((m) => {
                  const isActive = mode === m;
                  return (
                    <Pressable
                      key={m}
                      onPress={() => setMode(m)}
                      className={`flex-1 items-center rounded-xl py-2.5`}
                      style={isActive ? { backgroundColor: c.primaryGlow } : undefined}
                    >
                      <Text
                        className={`text-sm font-bold`}
                        style={{ color: isActive ? c.primary : c.muted }}
                      >
                        {m === 'signin' ? 'Sign In' : 'Create Account'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <Pressable
                onPress={() => setMode('signin')}
                className="mb-4 flex-row items-center gap-1.5"
              >
                <Icon name="chevron-left" size={16} color={c.muted} />
                <Text className="text-xs font-semibold text-muted dark:text-muted-dark">Back to sign in</Text>
              </Pressable>
            )}

            <View className="mb-6">
              <Text className="font-display text-3xl text-ink dark:text-ink-dark">{heading}</Text>
              <Text className="mt-1 text-sm leading-relaxed text-muted dark:text-muted-dark">{subheading}</Text>
            </View>

            {verificationSent && mode === 'signup' ? (
              <View className="mb-5 flex-row gap-3 rounded-2xl border border-success/30 bg-success/10 p-4">
                <Icon name="success" size={22} color={c.success} />
                <View className="flex-1">
                  <Text className="text-sm font-bold text-ink dark:text-ink-dark">Check your email</Text>
                  <Text className="mt-1 text-xs leading-relaxed text-ink/70 dark:text-ink-dark">
                    We sent a verification link to {verificationSent}. Tap it to activate your
                    account.
                  </Text>
                </View>
              </View>
            ) : null}

            {resetSent && mode === 'reset' ? (
              <View className="mb-5 flex-row gap-3 rounded-2xl border border-success/30 bg-success/10 p-4">
                <Icon name="success" size={22} color={c.success} />
                <View className="flex-1">
                  <Text className="text-sm font-bold text-ink dark:text-ink-dark">Reset link sent</Text>
                  <Text className="mt-1 text-xs leading-relaxed text-ink/70 dark:text-ink-dark">
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
                  <View className="mb-5 gap-3">
                    {googleAvailable ? (
                      <Pressable
                        onPress={onGoogle}
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderWidth: 1,
                          borderColor: '#DADCE0',
                          borderRadius: 16,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: 48,
                          gap: 12,
                        }}
                      >
                        <GoogleLogo size={18} />
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#3C4043' }}>
                          Continue with Google
                        </Text>
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
                      <View className="my-2 flex-row items-center gap-3">
                        <View style={{ height: 1, flex: 1, backgroundColor: c.subtle }} />
                        <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, color: c.muted }}>
                          or
                        </Text>
                        <View style={{ height: 1, flex: 1, backgroundColor: c.subtle }} />
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
                            <Text className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted dark:text-muted-dark">
                              Password
                            </Text>
                            {mode === 'signin' ? (
                              <Pressable onPress={() => setMode('reset')}>
                                <Text className="text-xs font-semibold uppercase tracking-wide text-primary">
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

                      {/* PRIMARY CTA BUTTON */}
                      <Pressable
                        onPress={submit}
                        disabled={loading}
                        style={{
                          height: 52,
                          borderRadius: 16,
                          backgroundColor: c.primary,
                          alignItems: 'center',
                          justifyContent: 'center',
                          shadowColor: c.primary,
                          shadowOpacity: 0.45,
                          shadowRadius: 20,
                          elevation: 10,
                          shadowOffset: { width: 0, height: 8 },
                          opacity: loading ? 0.6 : 1,
                          marginTop: 8,
                        }}
                      >
                        <Text style={{ fontSize: 16, fontFamily: 'Outfit_700Bold', color: '#FFFFFF' }}>
                          {loading
                            ? 'Please wait...'
                            : mode === 'signin'
                              ? 'Sign In'
                              : mode === 'signup'
                                ? 'Create Account'
                                : 'Send Reset Link'}
                        </Text>
                      </Pressable>
                    </>
                  )}

                  {mode === 'phone' ? (
                    <Pressable
                      onPress={submit}
                      disabled={loading}
                      style={{
                        height: 52,
                        borderRadius: 16,
                        backgroundColor: c.primary,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: c.primary,
                        shadowOpacity: 0.45,
                        shadowRadius: 20,
                        elevation: 10,
                        shadowOffset: { width: 0, height: 8 },
                        opacity: loading ? 0.6 : 1,
                        marginTop: 8,
                      }}
                    >
                      <Text style={{ fontSize: 16, fontFamily: 'Outfit_700Bold', color: '#FFFFFF' }}>
                        {loading ? 'Please wait...' : phoneCodeSent ? 'Verify code' : 'Send code'}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>

                {mode === 'signin' ? (
                  <Pressable onPress={() => { setMode('phone'); setPhoneCodeSent(false); }} className="mt-4">
                    <Text className="text-center text-sm font-semibold text-primary">Sign in with phone</Text>
                  </Pressable>
                ) : mode === 'phone' ? (
                  <Pressable onPress={() => setMode('signin')} className="mt-4">
                    <Text className="text-center text-sm font-semibold text-muted dark:text-muted-dark">Back to email sign in</Text>
                  </Pressable>
                ) : null}

                {/* GUEST BUTTON */}
                {mode !== 'reset' && mode !== 'phone' ? (
                  <Pressable onPress={onGuest} style={{ marginTop: 24, alignItems: 'center' }} disabled={loading}>
                    <Text style={{ color: c.muted, fontSize: 13, fontFamily: 'Outfit_500Medium' }}>
                      Explore without account →
                    </Text>
                  </Pressable>
                ) : null}

              </>
            )}
          </BlurView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
