import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Home, UserPlus } from '../../components/ui/Glyph';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { ChoiceCard, SecondaryButton } from '../../components/onboarding/OnboardingPrimitives';
import TextField from '../../components/ui/TextField';
import { useHousehold } from '../../contexts/HouseholdContext';
import { useToast } from '../../contexts/ToastContext';
import { useScale } from '../../theme/scale';
import { accentPalette } from '../../theme/landing';
import type { OnboardingStackNavigationProp } from '../../navigation/types';

type Mode = 'choice' | 'create' | 'join';

export default function HouseholdStepScreen() {
  const navigation = useNavigation<OnboardingStackNavigationProp>();
  const { s } = useScale();
  const { householdId, createHousehold, joinHousehold } = useHousehold();
  const { showToast } = useToast();
  const [mode, setMode] = useState<Mode>('choice');
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (householdId) {
      navigation.navigate('Invite');
    }
  }, [householdId, navigation]);

  const onContinue = async () => {
    if (mode === 'choice') {
      navigation.navigate('Invite');
      return;
    }
    if (mode === 'create') {
      if (!name.trim()) return;
      setLoading(true);
      try {
        const code = await createHousehold(name.trim());
        showToast(code ? `Household ready — invite code: ${code}` : 'Household ready', 'success');
        navigation.navigate('Invite');
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Could not create household', 'error');
      } finally {
        setLoading(false);
      }
      return;
    }
    if (inviteCode.length !== 8) return;
    setLoading(true);
    try {
      await joinHousehold(inviteCode);
      showToast('Joined household', 'success');
      navigation.navigate('Invite');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not join household', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingShell
      saving={loading}
      onContinue={onContinue}
      continueLabel={
        mode === 'choice' ? 'Skip for now' : mode === 'create' ? 'Create household' : 'Join household'
      }
    >
      {mode === 'choice' ? (
        <View style={{ gap: s(12) }}>
          <ChoiceCard
            title="Create household"
            subtitle="Start fresh and invite family"
            icon={Home}
            accentColor={accentPalette.sage}
            highlighted
            onPress={() => setMode('create')}
          />
          <ChoiceCard
            title="Join household"
            subtitle="8-character invite code"
            icon={UserPlus}
            accentColor={accentPalette.plum}
            onPress={() => setMode('join')}
          />
        </View>
      ) : null}

      {mode === 'create' ? (
        <View style={{ gap: s(14) }}>
          <TextField
            variant="landing"
            label="Household name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. The Smith Family"
          />
          <SecondaryButton label="Back" onPress={() => setMode('choice')} />
        </View>
      ) : null}

      {mode === 'join' ? (
        <View style={{ gap: s(14) }}>
          <TextField
            variant="landing"
            label="Invite code"
            value={inviteCode}
            onChangeText={(t) => setInviteCode(t.toUpperCase())}
            placeholder="ABC12345"
            autoCapitalize="characters"
            maxLength={8}
          />
          <SecondaryButton label="Back" onPress={() => setMode('choice')} />
        </View>
      ) : null}
    </OnboardingShell>
  );
}
