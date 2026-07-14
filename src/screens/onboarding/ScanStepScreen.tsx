import { useState } from 'react';
import { View, Text, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Milk, Wheat } from '../../components/ui/Glyph';
import { OnboardingShell } from '../../components/onboarding/OnboardingShell';
import { GhostLink, OptionChip } from '../../components/onboarding/OnboardingPrimitives';
import { BarcodeCameraView } from '../../components/scanner/BarcodeCameraView';
import { useOnboardingSession } from '../../contexts/OnboardingSessionContext';
import { useToast } from '../../contexts/ToastContext';
import { categoryFromName } from '../../lib/categories';
import { searchProductByBarcode } from '../../lib/productDb';
import { useScale } from '../../theme/scale';
import { useAccent } from '../../theme/accent';
import { landingFonts as SF } from '../../theme/landing';
import { ONBOARDING_STEP_ACCENT_COLORS } from '../../navigation/onboardingSteps';
import type { OnboardingStackNavigationProp } from '../../navigation/types';

function ViewfinderCorner({
  top,
  left,
  right,
  bottom,
  flipX,
  flipY,
}: {
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  flipX?: boolean;
  flipY?: boolean;
}) {
  const { s } = useScale();
  const accent = useAccent();
  const len = s(22);
  const thick = s(3);
  const radius = s(4);

  return (
    <View
      style={{
        position: 'absolute',
        top,
        left,
        right,
        bottom,
        width: len,
        height: len,
        borderColor: accent,
        borderTopWidth: flipY ? 0 : thick,
        borderBottomWidth: flipY ? thick : 0,
        borderLeftWidth: flipX ? 0 : thick,
        borderRightWidth: flipX ? thick : 0,
        borderTopLeftRadius: !flipX && !flipY ? radius : 0,
        borderTopRightRadius: flipX && !flipY ? radius : 0,
        borderBottomLeftRadius: !flipX && flipY ? radius : 0,
        borderBottomRightRadius: flipX && flipY ? radius : 0,
      }}
    />
  );
}

export default function ScanStepScreen() {
  const navigation = useNavigation<OnboardingStackNavigationProp>();
  const { s, fs } = useScale();
  const { setScannedItem, setScanSkipped } = useOnboardingSession();
  const { showToast } = useToast();
  const [lookingUp, setLookingUp] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);
  const accent = ONBOARDING_STEP_ACCENT_COLORS.Scan;

  const handleScan = async (barcode: string) => {
    setLookingUp(true);
    setCameraActive(false);
    try {
      const product = await searchProductByBarcode(barcode);
      const name = product?.name ?? 'Unknown Item';
      setScannedItem({
        name,
        quantity: 1,
        unit: product?.unit ?? 'pcs',
        storageLocation: 'Pantry',
        category: categoryFromName(name).id,
        barcode,
      });
      navigation.navigate('ConfirmPantry');
    } catch {
      showToast('Barcode not found — try a demo or skip', 'warning');
      setCameraActive(true);
    } finally {
      setLookingUp(false);
    }
  };

  return (
    <OnboardingShell showFooterCta={false}>
      <View style={{ gap: s(10) }}>
        <View
          style={{
            width: '100%',
            aspectRatio: 4 / 3,
            borderRadius: s(16),
            overflow: 'hidden',
            backgroundColor: '#1A1814',
          }}
        >
          <BarcodeCameraView active={cameraActive && !lookingUp} onScanned={handleScan} />
          <ViewfinderCorner top={s(10)} left={s(10)} />
          <ViewfinderCorner top={s(10)} right={s(10)} flipX />
          <ViewfinderCorner bottom={s(10)} left={s(10)} flipY />
          <ViewfinderCorner bottom={s(10)} right={s(10)} flipX flipY />
        </View>
        {lookingUp ? (
          <Text
            style={{
              textAlign: 'center',
              fontSize: fs(13),
              fontFamily: SF.semibold,
              fontWeight: Platform.OS === 'ios' ? '600' : undefined,
              color: accent,
            }}
          >
            Looking up barcode…
          </Text>
        ) : null}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: s(6),
            justifyContent: 'center',
          }}
        >
          <OptionChip
            label="Demo: Milk"
            selected={false}
            icon={Milk}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              void handleScan('5901234123457');
            }}
          />
          <OptionChip
            label="Demo: Cereal"
            selected={false}
            icon={Wheat}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              void handleScan('1234567890128');
            }}
          />
        </View>
        <GhostLink
          label="Skip this step"
          onPress={() => {
            setScanSkipped(true);
            navigation.navigate('Finish');
          }}
        />
      </View>
    </OnboardingShell>
  );
}
