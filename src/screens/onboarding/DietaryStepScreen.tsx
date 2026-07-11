import { useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { OptionChip } from '../../components/onboarding/OnboardingPrimitives';
import TextField from '../../components/ui/TextField';
import { useProfile } from '../../contexts/ProfileContext';
import { useToast } from '../../contexts/ToastContext';
import { DIET_OPTION_ICONS, DIET_OPTIONS } from '../../navigation/onboardingSteps';
import { useScale } from '../../theme/scale';
import type { OnboardingStackNavigationProp } from '../../navigation/types';

export default function DietaryStepScreen() {
  const navigation = useNavigation<OnboardingStackNavigationProp>();
  const { s } = useScale();
  const { userProfile, updateUserPreferences } = useProfile();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>(
    userProfile?.dietaryPreferences ?? [],
  );
  const [allergies, setAllergies] = useState(userProfile?.personalAllergies ?? '');

  const toggleDiet = (d: string) =>
    setDietaryPrefs((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );

  const onContinue = async () => {
    setSaving(true);
    const { error } = await updateUserPreferences({
      dietaryPreferences: dietaryPrefs,
      personalAllergies: allergies,
    });
    setSaving(false);
    if (error) {
      showToast('Could not save', 'error');
      return;
    }
    navigation.navigate('Stores');
  };

  return (
    <OnboardingShell saving={saving} onContinue={onContinue}>
      <View style={{ gap: s(10) }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s(6), justifyContent: 'center' }}>
          {DIET_OPTIONS.map((d) => (
            <OptionChip
              key={d}
              label={d}
              selected={dietaryPrefs.includes(d)}
              onPress={() => toggleDiet(d)}
              icon={DIET_OPTION_ICONS[d]}
            />
          ))}
        </View>
        <TextField
          variant="landing"
          label="Allergies"
          value={allergies}
          onChangeText={setAllergies}
          placeholder="e.g. peanuts, shellfish"
        />
      </View>
    </OnboardingShell>
  );
}
