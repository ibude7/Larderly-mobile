import { useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
  BarcodeType,
} from 'expo-camera';

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
  const [permission, requestPermission] = useCameraPermissions();
  const processingRef = useRef(false);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleScan = useCallback(
    async (result: BarcodeScanningResult) => {
      if (!active || processingRef.current) return;
      const code = result.data?.trim();
      if (!code) return;
      processingRef.current = true;
      try {
        await onScanned(code);
      } finally {
        setTimeout(() => {
          processingRef.current = false;
        }, 900);
      }
    },
    [active, onScanned],
  );

  if (!permission?.granted) {
    if (permission && !permission.granted && !permission.canAskAgain) {
      Linking.openSettings().catch(() => {});
    }
    return <View style={[styles.placeholder, style]} />;
  }

  if (!active) return <View style={[styles.placeholder, style]} />;

  return (
    <CameraView
      style={[StyleSheet.absoluteFill, style]}
      facing="back"
      barcodeScannerSettings={{ barcodeTypes: BARCODE_TYPES }}
      onBarcodeScanned={handleScan}
      enableTorch={enableTorch}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#101010',
  },
});
