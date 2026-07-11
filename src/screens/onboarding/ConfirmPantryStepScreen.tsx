import { useEffect, useState } from 'react';
import { View, Text, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collection, addDoc, serverTimestamp } from '@react-native-firebase/firestore';
import { Package } from 'lucide-react-native';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { DepthCard, GhostLink } from '../../components/onboarding/OnboardingPrimitives';
import TextField from '../../components/ui/TextField';
import SelectField from '../../components/ui/SelectField';
import { useAuth } from '../../contexts/AuthContext';
import { useHousehold } from '../../contexts/HouseholdContext';
import { useOnboardingSession } from '../../contexts/OnboardingSessionContext';
import { useToast } from '../../contexts/ToastContext';
import { STORAGE_LOCATIONS } from '../../lib/categories';
import { db } from '../../lib/firebase';
import { useScale } from '../../theme/scale';
import { landing, landingFonts as SF } from '../../theme/landing';
import { ONBOARDING_STEP_ACCENT_COLORS } from '../../navigation/onboardingSteps';
import type { OnboardingStackNavigationProp } from '../../navigation/types';

export default function ConfirmPantryStepScreen() {
  const navigation = useNavigation<OnboardingStackNavigationProp>();
  const { s, fs } = useScale();
  const { user } = useAuth();
  const { householdId } = useHousehold();
  const { scannedItem, setAddedToSync } = useOnboardingSession();
  const { showToast } = useToast();
  const [editQty, setEditQty] = useState('1');
  const [editLoc, setEditLoc] = useState('Pantry');
  const [saving, setSaving] = useState(false);
  const accent = ONBOARDING_STEP_ACCENT_COLORS.ConfirmPantry;

  useEffect(() => {
    if (!scannedItem) {
      navigation.navigate('Scan');
    }
  }, [scannedItem, navigation]);

  if (!scannedItem) return null;

  const handleAddToPantry = async () => {
    if (!householdId || !user) {
      showToast('Set up a household first', 'error');
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, 'households', householdId, 'inventory'), {
        name: scannedItem.name,
        quantity: parseFloat(editQty) || 1,
        unit: scannedItem.unit,
        storageLocation: editLoc,
        category: scannedItem.category,
        barcode: scannedItem.barcode,
        pricePerUnit: 0,
        addedBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setAddedToSync(true);
      navigation.navigate('Finish');
    } catch {
      showToast('Could not add item', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingShell
      continueLabel="Add to pantry"
      onContinue={handleAddToPantry}
      saving={saving}
    >
      <View style={{ gap: s(10) }}>
        <DepthCard accentColor={accent} style={{ gap: s(6), alignItems: 'center' }}>
          <View
            style={{
              width: s(36),
              height: s(36),
              borderRadius: s(10),
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: `${accent}18`,
            }}
          >
            <Package size={fs(18)} color={accent} strokeWidth={2.1} />
          </View>
          <Text
            style={{
              fontSize: fs(18),
              fontFamily: SF.serif,
              color: landing.ink,
              textAlign: 'center',
            }}
            numberOfLines={2}
          >
            {scannedItem.name}
          </Text>
          <Text
            style={{
              fontSize: fs(11),
              fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
              color: landing.muted,
              letterSpacing: fs(0.5),
            }}
          >
            {scannedItem.barcode}
          </Text>
        </DepthCard>
        <TextField
          variant="landing"
          label="Quantity"
          value={editQty}
          onChangeText={setEditQty}
          keyboardType="numeric"
        />
        <SelectField
          label="Storage"
          value={editLoc}
          onChange={setEditLoc}
          options={STORAGE_LOCATIONS.map((l) => ({ label: l, value: l }))}
        />
        <GhostLink label="Scan a different item" onPress={() => navigation.navigate('Scan')} />
      </View>
    </OnboardingShell>
  );
}
