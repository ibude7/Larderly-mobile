import { useNavigation } from '@react-navigation/native';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { CalendarClock, ShoppingBasket, Users } from 'lucide-react-native';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { BenefitRow, GhostLink } from '../../components/onboarding/OnboardingPrimitives';
import { useToast } from '../../contexts/ToastContext';
import { requestNotificationPermission } from '../../lib/push';
import { useScale } from '../../theme/scale';
import { ONBOARDING_STEP_ACCENT_COLORS } from '../../navigation/onboardingSteps';
import type { OnboardingStackNavigationProp } from '../../navigation/types';

export default function NotificationsStepScreen() {
  const navigation = useNavigation<OnboardingStackNavigationProp>();
  const { showToast } = useToast();
  const { s } = useScale();
  const accent = ONBOARDING_STEP_ACCENT_COLORS.Notifications;

  return (
    <OnboardingShell
      continueLabel="Enable notifications"
      onContinue={async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const ok = await requestNotificationPermission();
        showToast(
          ok ? 'Notifications enabled' : 'Skipped — enable later in Settings',
          ok ? 'success' : 'info',
        );
        navigation.navigate('Scan');
      }}
    >
      <View style={{ gap: s(10) }}>
        <BenefitRow
          icon={CalendarClock}
          title="Expiry alerts"
          body="Know when food is about to go bad."
          accentColor={accent}
        />
        <BenefitRow
          icon={ShoppingBasket}
          title="Low stock"
          body="Never run out of household essentials."
          accentColor={accent}
        />
        <BenefitRow
          icon={Users}
          title="Household activity"
          body="See when family updates the pantry."
          accentColor={accent}
        />
        <GhostLink label="Skip for now" onPress={() => navigation.navigate('Scan')} />
      </View>
    </OnboardingShell>
  );
}
