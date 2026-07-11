import { View, Text, Platform, StyleSheet } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Haptics from 'expo-haptics';
import { GoogleLogo } from '../ui/GoogleLogo';
import { GlassButton } from '../landing/GlassButton';
import { useAuth } from '../../contexts/AuthContext';
import { useScale } from '../../theme/scale';
import { landing, landingFonts as SF } from '../../theme/landing';

interface SocialSignInButtonsProps {
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export function SocialSignInButtons({ onSuccess, onError }: SocialSignInButtonsProps) {
  const { s, fs } = useScale();
  const { signInWithGoogle, signInWithApple, appleAvailable } = useAuth();
  const btnH = s(40);

  const onGoogle = async () => {
    Haptics.selectionAsync();
    const { error } = await signInWithGoogle();
    if (error && error.message !== 'Sign-in cancelled.') {
      onError?.(
        error.message.includes('not configured')
          ? error.message
          : 'Could not sign in with Google. Try again.',
      );
    } else if (!error) {
      onSuccess?.();
    }
  };

  const onApple = async () => {
    Haptics.selectionAsync();
    const { error } = await signInWithApple();
    if (error) onError?.('Could not sign in with Apple. Try again.');
    else onSuccess?.();
  };

  return (
    <View style={{ gap: s(8), width: '100%', flexShrink: 0 }}>
      <GlassButton variant="light" frosted onPress={onGoogle} style={{ minHeight: btnH }}>
        <GoogleLogo size={s(18)} />
        <Text
          style={{
            fontFamily: SF.semibold,
            fontWeight: Platform.OS === 'ios' ? '600' : undefined,
            fontSize: fs(15),
            lineHeight: fs(20),
            color: landing.ink,
            includeFontPadding: false,
          }}
        >
          Sign in with Google
        </Text>
      </GlassButton>

      {appleAvailable ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={btnH / 2}
          style={{ height: btnH, width: '100%' }}
          onPress={onApple}
        />
      ) : null}

      <View style={[styles.divider, { marginVertical: s(2) }]}>
        <View style={styles.dividerLine} />
        <Text style={[styles.dividerText, { fontSize: fs(12) }]}>or with email</Text>
        <View style={styles.dividerLine} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: landing.line,
  },
  dividerText: {
    fontFamily: SF.regular,
    fontWeight: Platform.OS === 'ios' ? '400' : undefined,
    color: landing.muted,
  },
});
