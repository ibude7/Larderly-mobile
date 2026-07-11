import { useState } from 'react';
import { View, Text, Platform } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { DepthCard } from '../../components/onboarding/OnboardingPrimitives';
import { useOnboardingSession } from '../../contexts/OnboardingSessionContext';
import { useProfile } from '../../contexts/ProfileContext';
import { useToast } from '../../contexts/ToastContext';
import { useScale } from '../../theme/scale';
import { landing, landingFonts as SF } from '../../theme/landing';
import { ONBOARDING_STEP_ACCENT_COLORS } from '../../navigation/onboardingSteps';

export default function FinishStepScreen() {
  const { s, fs } = useScale();
  const { scanSkipped, addedToSync, scannedItem } = useOnboardingSession();
  const { updateUserPreferences } = useProfile();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const accent = ONBOARDING_STEP_ACCENT_COLORS.Finish;

  const finish = async () => {
    setSaving(true);
    const { error } = await updateUserPreferences({ onboardingCompleted: true });
    setSaving(false);
    if (error) showToast('Could not finish onboarding', 'error');
  };

  return (
    <OnboardingShell
      showFooterCta
      continueLabel="Go to my dashboard"
      onContinue={finish}
      saving={saving}
    >
      <DepthCard accentColor={accent} style={{ gap: s(8) }}>
        <View
          style={{
            width: s(40),
            height: s(40),
            borderRadius: s(12),
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: accent,
          }}
        >
          <Sparkles size={fs(20)} color={landing.white} strokeWidth={2.1} />
        </View>
        <Text
          style={{
            textAlign: 'center',
            fontSize: fs(18),
            lineHeight: fs(24),
            fontFamily: SF.serif,
            color: landing.ink,
          }}
        >
          {scanSkipped ? "You're all set!" : 'Your pantry is ready'}
        </Text>
        <Text
          style={{
            textAlign: 'center',
            fontSize: fs(13),
            lineHeight: fs(18),
            fontFamily: SF.regular,
            fontWeight: Platform.OS === 'ios' ? '400' : undefined,
            color:
              !scanSkipped && addedToSync && scannedItem ? landing.success : landing.body,
          }}
        >
          {!scanSkipped && addedToSync && scannedItem
            ? `${scannedItem.name} has been added and synced.`
            : scanSkipped
              ? 'Add items anytime from Pantry or Scanner.'
              : 'Head to your dashboard to manage inventory.'}
        </Text>
      </DepthCard>
    </OnboardingShell>
  );
}
