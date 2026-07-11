import { useEffect, useState } from 'react';
import { View, Text, Share, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { doc, onSnapshot } from '@react-native-firebase/firestore';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { DepthCard, SecondaryButton } from '../../components/onboarding/OnboardingPrimitives';
import { useHousehold } from '../../contexts/HouseholdContext';
import { useScale } from '../../theme/scale';
import { landing, landingFonts as SF } from '../../theme/landing';
import { ONBOARDING_STEP_ACCENT_COLORS } from '../../navigation/onboardingSteps';
import { db } from '../../lib/firebase';
import type { OnboardingStackNavigationProp } from '../../navigation/types';

export default function InviteStepScreen() {
  const navigation = useNavigation<OnboardingStackNavigationProp>();
  const { s, fs } = useScale();
  const { householdId } = useHousehold();
  const [inviteCode, setInviteCode] = useState('');
  const accent = ONBOARDING_STEP_ACCENT_COLORS.Invite;

  useEffect(() => {
    if (!householdId) return;
    const unsub = onSnapshot(doc(db, 'households', householdId), (snap) => {
      if (snap.exists()) setInviteCode((snap.data()?.inviteCode as string) ?? '');
    });
    return unsub;
  }, [householdId]);

  return (
    <OnboardingShell onContinue={() => navigation.navigate('Dietary')}>
      <View style={{ gap: s(10) }}>
        <DepthCard accentColor={accent} style={{ gap: s(8) }}>
          <Text
            style={{
              fontSize: fs(10),
              fontFamily: SF.bold,
              fontWeight: Platform.OS === 'ios' ? '700' : undefined,
              letterSpacing: fs(1),
              textTransform: 'uppercase',
              color: landing.muted,
            }}
          >
            Invite code
          </Text>
          <Text
            style={{
              fontSize: fs(28),
              fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
              fontWeight: '700',
              letterSpacing: fs(4),
              color: accent,
            }}
          >
            {inviteCode || '——'}
          </Text>
          <View style={{ width: '100%' }}>
            <SecondaryButton
              label="Share code"
              onPress={() =>
                inviteCode &&
                Share.share({ message: `Join my Larderly household: ${inviteCode}` })
              }
            />
          </View>
        </DepthCard>
        <Text
          style={{
            textAlign: 'center',
            fontSize: fs(12),
            lineHeight: fs(17),
            fontFamily: SF.regular,
            fontWeight: Platform.OS === 'ios' ? '400' : undefined,
            color: landing.muted,
          }}
        >
          Share now or invite later from Settings.
        </Text>
      </View>
    </OnboardingShell>
  );
}
