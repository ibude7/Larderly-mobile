import { ReactNode } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthTopBar } from './AuthTopBar';
import { EditorialHeader } from '../landing/EditorialHeader';
import { GlassButton } from '../landing/GlassButton';
import { useScale } from '../../theme/scale';
import { landing } from '../../theme/landing';
import { AccentProvider } from '../../theme/accent';

interface AuthShellProps {
  headline: string;
  headlineAccent?: string;
  subhead?: string;
  eyebrow?: string;
  accentColor?: string;
  onBack?: () => void;
  backLabel?: string;
  rightSlot?: ReactNode;
  primaryLabel?: string;
  onPrimary?: () => void;
  primaryLoading?: boolean;
  primaryDisabled?: boolean;
  footerLinks?: ReactNode;
  children: ReactNode;
}

/**
 * Centered auth layout — logo top bar, editorial headline, scrollable form, fixed footer CTA.
 */
export function AuthShell({
  headline,
  headlineAccent,
  subhead,
  eyebrow,
  accentColor = landing.accent,
  onBack,
  backLabel,
  rightSlot,
  primaryLabel,
  onPrimary,
  primaryLoading = false,
  primaryDisabled = false,
  footerLinks,
  children,
}: AuthShellProps) {
  const insets = useSafeAreaInsets();
  const { s, fsLayout } = useScale();
  const topChrome = fsLayout(72);
  const footerChrome = primaryLabel ? fsLayout(160) : fsLayout(48);
  const contentWidth = s(340);

  return (
    <AccentProvider color={accentColor}>
      <View style={[styles.root, { backgroundColor: landing.canvas }]}>
        <AuthTopBar onBack={onBack} backLabel={backLabel} rightSlot={rightSlot} floating />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: s(28),
              paddingTop: insets.top + topChrome,
              paddingBottom: insets.bottom + footerChrome,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={{ width: '100%', maxWidth: contentWidth, gap: s(24) }}>
              <View style={styles.copyBlock}>
                <EditorialHeader
                  eyebrow={eyebrow}
                  title={headline}
                  titleAccent={headlineAccent}
                  subcopy={subhead}
                  size="auth"
                />
              </View>

              <View style={{ gap: s(16) }}>{children}</View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {primaryLabel ? (
          <View
            style={[
              styles.footer,
              {
                paddingBottom: insets.bottom + s(16),
                paddingHorizontal: s(28),
                paddingTop: s(8),
              },
            ]}
          >
            <View style={{ maxWidth: contentWidth, width: '100%', alignSelf: 'center' }}>
              {primaryLoading ? (
                <View style={[styles.loadingBtn, { height: s(56), borderRadius: s(999) }]}>
                  <ActivityIndicator color={landing.white} />
                </View>
              ) : (
                <GlassButton
                  label={primaryLabel}
                  onPress={() => {
                    if (!primaryDisabled) onPrimary?.();
                  }}
                  variant="dark"
                  disabled={primaryDisabled}
                />
              )}
              {footerLinks ? (
                <View style={{ marginTop: s(16), alignItems: 'center', gap: s(12) }}>
                  {footerLinks}
                </View>
              ) : null}
            </View>
          </View>
        ) : null}
      </View>
    </AccentProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  copyBlock: {
    alignItems: 'center',
    width: '100%',
    alignSelf: 'center',
    flexShrink: 0,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  loadingBtn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
});
