import { ReactNode } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthTopBar } from './AuthTopBar';
import { AuthHeader } from './AuthHeader';
import { GlassButton } from '../landing/GlassButton';
import { useScale } from '../../theme/scale';
import { landing } from '../../theme/landing';
import { AccentProvider } from '../../theme/accent';

interface AuthCanvasProps {
  eyebrow?: string;
  headline: string;
  headlineAccent?: string;
  subhead?: string;
  accentColor?: string;
  onBack?: () => void;
  backLabel?: string;
  rightSlot?: ReactNode;
  headerSlot?: ReactNode;
  primaryLabel?: string;
  onPrimary?: () => void;
  primaryLoading?: boolean;
  primaryDisabled?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  secondaryLoading?: boolean;
  secondaryDisabled?: boolean;
  footerLinks?: ReactNode;
  children: ReactNode;
}

export function AuthCanvas({
  eyebrow,
  headline,
  headlineAccent,
  subhead,
  accentColor = landing.accent,
  onBack,
  backLabel,
  rightSlot,
  headerSlot,
  primaryLabel,
  onPrimary,
  primaryLoading = false,
  primaryDisabled = false,
  secondaryLabel,
  onSecondary,
  secondaryLoading = false,
  secondaryDisabled = false,
  footerLinks,
  children,
}: AuthCanvasProps) {
  const insets = useSafeAreaInsets();
  const { s } = useScale();

  return (
    <AccentProvider color={accentColor}>
      <View style={[styles.root, { backgroundColor: landing.canvas }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <AuthTopBar onBack={onBack} backLabel={backLabel} rightSlot={rightSlot} floating={false} />

          <View
            style={[
              styles.body,
              {
                paddingHorizontal: s(20),
                paddingBottom: insets.bottom + s(12),
                gap: s(14),
              },
            ]}
          >
            <AuthHeader
              eyebrow={eyebrow}
              title={headline}
              titleAccent={headlineAccent}
              subcopy={subhead}
            />

            {headerSlot ? <View style={styles.headerSlot}>{headerSlot}</View> : null}

            <View style={[styles.formBand, { gap: s(12) }]}>{children}</View>

            {primaryLabel || secondaryLabel || footerLinks ? (
              <View style={[styles.actionDeck, { gap: s(8) }]}>
                {primaryLabel ? (
                  primaryLoading ? (
                    <View style={[styles.loadingBtn, { height: s(40), borderRadius: s(999) }]}>
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
                  )
                ) : null}

                {secondaryLabel ? (
                  <GlassButton
                    label={secondaryLabel}
                    onPress={() => onSecondary?.()}
                    variant="light"
                    loading={secondaryLoading}
                    disabled={secondaryDisabled || primaryLoading}
                  />
                ) : null}

                {footerLinks ? (
                  <View style={{ width: '100%', alignItems: 'center' }}>{footerLinks}</View>
                ) : null}
              </View>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </View>
    </AccentProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  body: {
    flex: 1,
    minHeight: 0,
  },
  headerSlot: {
    width: '100%',
    flexShrink: 0,
  },
  formBand: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    justifyContent: 'center',
  },
  actionDeck: {
    flexShrink: 0,
    width: '100%',
  },
  loadingBtn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
});
