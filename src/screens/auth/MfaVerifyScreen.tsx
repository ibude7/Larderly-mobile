import { useEffect, useState } from 'react';
import { Text, Pressable, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthShell } from '../../components/auth/AuthShell';
import TextField from '../../components/ui/TextField';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { AUTH_FLOW_COPY } from '../../navigation/authContent';
import { useScale } from '../../theme/scale';
import { landing, landingFonts as SF } from '../../theme/landing';
import type { AuthStackNavigationProp } from '../../navigation/types';

const copy = AUTH_FLOW_COPY.mfaVerify;

export default function MfaVerifyScreen() {
  const navigation = useNavigation<AuthStackNavigationProp>();
  const { fs } = useScale();
  const {
    mfaResolver,
    startMfaChallenge,
    completeMfaChallenge,
    clearMfaResolver,
  } = useAuth();
  const { showToast } = useToast();
  const [mfaCode, setMfaCode] = useState('');
  const [mfaCodeSent, setMfaCodeSent] = useState(false);
  const [mfaSending, setMfaSending] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!mfaResolver) {
      navigation.navigate('SignIn');
      return;
    }
    if (!mfaCodeSent && !mfaSending) {
      setMfaSending(true);
      startMfaChallenge(0)
        .then(() => {
          setMfaCodeSent(true);
          showToast('Verification code sent to your phone', 'success');
        })
        .catch((err) => {
          showToast(err instanceof Error ? err.message : 'Could not send MFA code', 'error');
          clearMfaResolver();
          navigation.navigate('SignIn');
        })
        .finally(() => setMfaSending(false));
    }
  }, [
    mfaResolver,
    mfaCodeSent,
    mfaSending,
    startMfaChallenge,
    clearMfaResolver,
    showToast,
    navigation,
  ]);

  const submitMfa = async () => {
    if (loading || mfaCode.length < 6) return;
    setLoading(true);
    try {
      await completeMfaChallenge(mfaCode.trim());
      showToast('Signed in successfully', 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message.replace('Firebase: ', '') : 'Verification failed',
        'error',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow={copy.eyebrow}
      headline={copy.title}
      headlineAccent={copy.titleAccent}
      subhead={copy.subcopy}
      accentColor={copy.accentColor}
      onBack={() => {
        clearMfaResolver();
        navigation.navigate('SignIn');
      }}
      primaryLabel={copy.primaryLabel}
      onPrimary={submitMfa}
      primaryLoading={loading || mfaSending}
      footerLinks={
        <Pressable
          onPress={() => {
            clearMfaResolver();
            setMfaCode('');
            setMfaCodeSent(false);
            navigation.navigate('SignIn');
          }}
          hitSlop={8}
        >
          <Text
            style={{
              fontSize: fs(13),
              fontFamily: SF.regular,
              fontWeight: Platform.OS === 'ios' ? '400' : undefined,
              color: landing.muted,
            }}
          >
            Cancel
          </Text>
        </Pressable>
      }
    >
      <TextField
        variant="landing"
        label="Verification code"
        icon="lock"
        value={mfaCode}
        onChangeText={(v) => setMfaCode(v.replace(/[^\d]/g, ''))}
        keyboardType="number-pad"
        maxLength={6}
        placeholder="6-digit code"
      />
    </AuthShell>
  );
}
