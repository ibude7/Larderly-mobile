import { ReactNode } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LandingStepProgress } from '../landing/LandingProgress';
import { LandingLogoMark } from '../landing/LandingLogoMark';
import { GlassButton } from '../landing/GlassButton';
import { EditorialHeader } from '../landing/EditorialHeader';
import { SettingsGlass } from '../settings/SettingsGlass';
import { useProfile } from '../../contexts/ProfileContext';
import { useToast } from '../../contexts/ToastContext';
import { useLandingColors } from '../../hooks/useLandingColors';
import { useScale } from '../../theme/scale';
import { landingFonts as SF } from '../../theme/landing';
import { AccentProvider } from '../../theme/accent';
import {
  getOnboardingStepIndex,
  ONBOARDING_STEP_ACCENTS,
  ONBOARDING_STEP_ACCENT_COLORS,
  ONBOARDING_STEP_PHASES,
  ONBOARDING_STEP_SUBCOPY,
  ONBOARDING_STEP_TITLES,
  TOTAL_ONBOARDING_STEPS,
  type OnboardingStepName,
} from '../../navigation/onboardingSteps';
import type { OnboardingStackNavigationProp } from '../../navigation/types';

interface OnboardingShellProps {
  children: ReactNode;
  showFooterCta?: boolean;
  continueLabel?: string;
  onContinue?: () => void | Promise<void>;
  onBack?: () => void;
  saving?: boolean;
  title?: string;
  titleAccent?: string;
  subcopy?: string;
  hideHeadline?: boolean;
}

/**
 * Centered onboarding layout — Settings-style canvas + frosted glass content.
 */
export function OnboardingShell({
  children,
  showFooterCta = true,
  continueLabel = 'Continue',
  onContinue,
  onBack,
  saving = false,
  title,
  titleAccent,
  subcopy,
  hideHeadline = false,
}: OnboardingShellProps) {
  const route = useRoute();
  const navigation = useNavigation<OnboardingStackNavigationProp>();
  const insets = useSafeAreaInsets();
  const { s, fs, fsLayout } = useScale();
  const lc = useLandingColors();
  const { updateUserPreferences } = useProfile();
  const { showToast } = useToast();

  const stepName = route.name as OnboardingStepName;
  const step = getOnboardingStepIndex(stepName);
  const stepColor = ONBOARDING_STEP_ACCENT_COLORS[stepName];
  const baseTitle = title ?? ONBOARDING_STEP_TITLES[stepName];
  const accent = titleAccent ?? ONBOARDING_STEP_ACCENTS[stepName];
  const topChrome = fsLayout(72);
  const footerChrome = showFooterCta ? fsLayout(196) : fsLayout(88);
  const contentWidth = s(340);

  const finish = async () => {
    const { error } = await updateUserPreferences({ onboardingCompleted: true });
    if (error) showToast('Could not finish onboarding', 'error');
  };

  const handleSkip = () => {
    Haptics.selectionAsync();
    void finish();
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    void onContinue?.();
  };

  const handleBack = () => {
    Haptics.selectionAsync();
    if (onBack) onBack();
    else navigation.goBack();
  };

  return (
    <AccentProvider color={stepColor}>
      <View style={[styles.root, { backgroundColor: lc.canvas }]}>
        <View
          style={[
            styles.topBar,
            {
              top: insets.top + s(12),
              paddingHorizontal: s(20),
            },
          ]}
        >
          <View style={{ width: s(64), justifyContent: 'center' }}>
            <Text style={[styles.counterText, { fontSize: fs(12), color: lc.muted }]}>
              {step + 1}/{TOTAL_ONBOARDING_STEPS}
            </Text>
          </View>
          <LandingLogoMark size="lg" color={stepColor} />
          <View style={{ width: s(64), alignItems: 'flex-end' }}>
            <Pressable onPress={handleSkip} hitSlop={10}>
              <Text style={[styles.skipText, { fontSize: fs(13), color: lc.muted }]}>Skip</Text>
            </Pressable>
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: s(20),
              paddingTop: insets.top + topChrome,
              paddingBottom: insets.bottom + footerChrome,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={{ width: '100%', maxWidth: contentWidth, gap: s(16) }}>
              {!hideHeadline ? (
                <View style={styles.copyBlock}>
                  <EditorialHeader
                    eyebrow={ONBOARDING_STEP_PHASES[stepName]}
                    title={baseTitle}
                    titleAccent={accent}
                    subcopy={subcopy ?? ONBOARDING_STEP_SUBCOPY[stepName]}
                    size="onboarding"
                  />
                </View>
              ) : null}

              <SettingsGlass
                elevated
                interactive={false}
                radius={s(26)}
                contentStyle={{
                  paddingHorizontal: s(18),
                  paddingVertical: s(18),
                  gap: s(16),
                }}
              >
                {children}
              </SettingsGlass>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

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
          <View style={{ maxWidth: contentWidth, width: '100%', alignSelf: 'center', gap: s(12) }}>
            <View style={{ alignItems: 'center' }}>
              <LandingStepProgress
                index={step}
                total={TOTAL_ONBOARDING_STEPS}
                color={stepColor}
              />
            </View>

            {showFooterCta ? (
              <View style={{ gap: s(8) }}>
                {saving ? (
                  <View
                    style={[
                      styles.loadingBtn,
                      {
                        height: s(56),
                        borderRadius: s(999),
                        backgroundColor: lc.isDark ? lc.ink : '#101010',
                      },
                    ]}
                  >
                    <ActivityIndicator color={lc.isDark ? '#101010' : '#FFFFFF'} />
                  </View>
                ) : (
                  <GlassButton label={continueLabel} variant="dark" onPress={handleContinue} />
                )}
                {step > 0 ? (
                  <Pressable
                    onPress={handleBack}
                    style={{ alignItems: 'center', paddingVertical: s(4) }}
                  >
                    <Text style={[styles.backLink, { fontSize: fs(13), color: lc.muted }]}>
                      Back
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </AccentProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counterText: {
    fontFamily: SF.semibold,
    fontWeight: Platform.OS === 'ios' ? '600' : undefined,
  },
  skipText: {
    fontFamily: SF.semibold,
    fontWeight: Platform.OS === 'ios' ? '600' : undefined,
  },
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
  },
  backLink: {
    fontFamily: SF.regular,
    fontWeight: Platform.OS === 'ios' ? '400' : undefined,
  },
});
