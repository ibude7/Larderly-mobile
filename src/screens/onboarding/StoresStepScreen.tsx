import { useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { OptionChip, SecondaryButton } from '../../components/onboarding/OnboardingPrimitives';
import TextField from '../../components/ui/TextField';
import { useProfile } from '../../contexts/ProfileContext';
import { useToast } from '../../contexts/ToastContext';
import { STORE_OPTION_ICONS, STORE_OPTIONS } from '../../navigation/onboardingSteps';
import { useScale } from '../../theme/scale';
import type { OnboardingStackNavigationProp } from '../../navigation/types';

export default function StoresStepScreen() {
  const navigation = useNavigation<OnboardingStackNavigationProp>();
  const { s } = useScale();
  const { userProfile, updateUserPreferences } = useProfile();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [stores, setStores] = useState<string[]>(userProfile?.preferredStores ?? []);
  const [customStore, setCustomStore] = useState('');

  const toggleStore = (store: string) =>
    setStores((prev) =>
      prev.includes(store) ? prev.filter((x) => x !== store) : [...prev, store],
    );

  const onContinue = async () => {
    setSaving(true);
    const { error } = await updateUserPreferences({ preferredStores: stores });
    setSaving(false);
    if (error) {
      showToast('Could not save', 'error');
      return;
    }
    navigation.navigate('Notifications');
  };

  return (
    <OnboardingShell saving={saving} onContinue={onContinue}>
      <View style={{ gap: s(10) }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s(6), justifyContent: 'center' }}>
          {STORE_OPTIONS.map((store) => (
            <OptionChip
              key={store}
              label={store}
              selected={stores.includes(store)}
              onPress={() => toggleStore(store)}
              icon={STORE_OPTION_ICONS[store]}
            />
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: s(8), alignItems: 'flex-end' }}>
          <View style={{ flexGrow: 1, flexShrink: 1, minWidth: 0 }}>
            <TextField
              variant="landing"
              value={customStore}
              onChangeText={setCustomStore}
              placeholder="Add another store…"
            />
          </View>
          <SecondaryButton
            compact
            label="Add"
            onPress={() => {
              const trimmed = customStore.trim();
              if (trimmed) {
                setStores((prev) => [...prev, trimmed]);
                setCustomStore('');
              }
            }}
          />
        </View>
      </View>
    </OnboardingShell>
  );
}
