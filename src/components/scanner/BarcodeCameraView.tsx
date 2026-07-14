import { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Text, Linking, Platform } from 'react-native';
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
  type BarcodeType,
} from 'expo-camera';
import { useScale } from '../../theme/scale';
import { useAppColors } from '../../hooks/useAppColors';
import { settingsType } from '../settings/settingsFonts';

export const BARCODE_TYPES: BarcodeType[] = [
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'code128',
  'code39',
  'qr',
];

interface BarcodeCameraViewProps {
  active?: boolean;
  onScanned: (barcode: string) => void | Promise<void>;
  style?: object;
  enableTorch?: boolean;
}

export function BarcodeCameraView({
  active = true,
  onScanned,
  style,
  enableTorch = false,
}: BarcodeCameraViewProps) {
  const { s, fs } = useScale();
  const c = useAppColors();
  const [permission, requestPermission] = useCameraPermissions();
  const [requesting, setRequesting] = useState(false);
  const processingRef = useRef(false);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  const handleScan = useCallback(
    (result: BarcodeScanningResult) => {
      if (!active || processingRef.current) return;
      const code = result.data?.trim();
      if (!code) return;
      processingRef.current = true;
      Promise.resolve(onScanned(code)).finally(() => {
        setTimeout(() => {
          processingRef.current = false;
        }, 1200);
      });
    },
    [active, onScanned],
  );

  const askPermission = async () => {
    setRequesting(true);
    try {
      const next = await requestPermission();
      if (!next.granted && !next.canAskAgain) {
        await Linking.openSettings().catch(() => {});
      }
    } finally {
      setRequesting(false);
    }
  };

  if (!permission) {
    return <View style={[styles.placeholder, style]} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.placeholder, styles.centered, style]}>
        <Text
          style={[
            settingsType('semibold'),
            {
              fontSize: fs(15),
              color: '#FFFDF6',
              textAlign: 'center',
              paddingHorizontal: s(24),
              marginBottom: s(12),
            },
          ]}
        >
          Camera access is needed to scan barcodes
        </Text>
        <Pressable
          onPress={() => void askPermission()}
          disabled={requesting}
          style={{
            paddingHorizontal: s(18),
            paddingVertical: s(12),
            borderRadius: s(14),
            backgroundColor: c.success,
            opacity: requesting ? 0.7 : 1,
          }}
          accessibilityRole="button"
          accessibilityLabel="Allow camera access"
        >
          <Text style={[settingsType('semibold'), { fontSize: fs(14), color: '#FFFFFF' }]}>
            {permission.canAskAgain ? 'Allow camera' : 'Open Settings'}
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!active) {
    return <View style={[styles.placeholder, style]} />;
  }

  return (
    <CameraView
      style={[StyleSheet.absoluteFill, style]}
      facing="back"
      barcodeScannerSettings={{ barcodeTypes: BARCODE_TYPES }}
      onBarcodeScanned={handleScan}
      enableTorch={enableTorch}
      // Avoid mirror / freeze quirks on some iOS builds when remounting tabs.
      {...(Platform.OS === 'android' ? { ratio: '16:9' as const } : null)}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#101010',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
