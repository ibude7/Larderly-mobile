import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Linking,
  ScrollView,
} from 'react-native';
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
  BarcodeType,
} from 'expo-camera';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { TabNavigationProp, TabParamList } from '../navigation/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import TextField from '../components/ui/TextField';
import Button from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import AddItemModal from '../components/pantry/AddItemModal';
import ScannedProductModal, { ScannedItem } from '../components/pantry/ScannedProductModal';
import { usePantryStore } from '../contexts/PantryContext';
import { useToast } from '../contexts/ToastContext';
import { useAppColors } from '../hooks/useAppColors';
import { useTheme } from '../hooks/useTheme';
import { generateProductNote } from '../lib/productNoteAI';
import {
  lookupBarcode,
  findMatchingPantryItem,
  inferStorageLocation,
  ScannedProduct,
} from '../lib/barcode';
import { searchProductByBarcode } from '../lib/productDb';
import type { ProductData } from '../lib/productDb';
import { locationIdFromName } from '../lib/inventoryMapper';
import { PantryItem } from '../types';

type ScanMode = 'add' | 'consume';

interface ScanHistoryEntry {
  id: string;
  name: string;
  unit: string;
  mode: ScanMode;
}

const RECENT_SCANS_KEY = 'larderly:recentScans';

const BARCODE_TYPES: BarcodeType[] = [
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'code128',
  'code39',
  'qr',
];

function productToPrefillBase(
  p: ScannedProduct,
  locations: ReturnType<typeof usePantryStore>['locations'],
): Partial<PantryItem> {
  return {
    name: p.name,
    brand: p.brand,
    image_url: p.image_url,
    category: p.category,
    barcode: p.barcode,
    unit: p.unit,
    quantity: 1,
    location_id: inferStorageLocation(p.category, locations),
  };
}

async function productToPrefillWithAI(
  p: ScannedProduct,
  locations: ReturnType<typeof usePantryStore>['locations'],
): Promise<Partial<PantryItem>> {
  const notes = await generateProductNote({
    name: p.name,
    brand: p.brand,
    category: p.category,
    barcode: p.barcode,
    unit: p.unit,
    description: p.description,
    quantity_text: p.quantity_text,
    labels_text: p.labels_text,
    allergens: p.allergens,
    traces: p.traces,
    nutri_score: p.nutri_score,
    dietary: p.dietary,
    nutrition_data: p.nutrition_data,
  });
  return { ...productToPrefillBase(p, locations), notes };
}

export default function ScannerScreen() {
  const navigation = useNavigation<TabNavigationProp>();
  const route = useRoute<RouteProp<TabParamList, 'Scanner'>>();
  const insets = useSafeAreaInsets();
  const c = useAppColors();
  const theme = useTheme();
  const { items, locations, addItem, updateItem, consumeItem } = usePantryStore();
  const { showToast } = useToast();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanMode, setScanMode] = useState<ScanMode>(route.params?.mode ?? 'add');
  const [cameraActive, setCameraActive] = useState(false);
  const [looking, setLooking] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [recentScans, setRecentScans] = useState<ScanHistoryEntry[]>([]);
  const [addPrefill, setAddPrefill] = useState<Partial<PantryItem> | null>(null);
  const [scannedProduct, setScannedProduct] = useState<ProductData | null>(null);
  const [productLoading, setProductLoading] = useState(false);

  const processingRef = useRef(false);
  const recentHydratedRef = useRef(false);

  const scanY = useSharedValue(0);

  useEffect(() => {
    scanY.value = withRepeat(withTiming(104, { duration: 1600 }), -1, true);
  }, [scanY]);

  const beamStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanY.value }],
  }));

  useEffect(() => {
    AsyncStorage.getItem(RECENT_SCANS_KEY).then((raw) => {
      if (raw) {
        try {
          setRecentScans(JSON.parse(raw) as ScanHistoryEntry[]);
        } catch {
          // ignore corrupt cache
        }
      }
      recentHydratedRef.current = true;
    });
  }, []);

  useEffect(() => {
    if (!recentHydratedRef.current) return;
    AsyncStorage.setItem(RECENT_SCANS_KEY, JSON.stringify(recentScans)).catch(() => {});
  }, [recentScans]);

  useEffect(() => {
    if (route.params?.mode) {
      setScanMode(route.params.mode);
      navigation.setParams({ mode: undefined });
    }
  }, [route.params?.mode, navigation]);

  useEffect(() => {
    if (permission?.granted) {
      processingRef.current = false;
      setCameraActive(true);
    }
  }, [permission?.granted]);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const pushRecent = useCallback((item: PantryItem, mode: ScanMode) => {
    setRecentScans((prev) =>
      [{ id: `${item.id}-${Date.now()}`, name: item.name, unit: item.unit, mode }, ...prev].slice(
        0,
        8,
      ),
    );
  }, []);

  const applyInventoryChange = useCallback(
    async (item: PantryItem, mode: ScanMode) => {
      if (mode === 'add') {
        const { error } = await updateItem(item.id, { quantity: item.quantity + 1 });
        if (error) {
          showToast(error.message || `Failed to add more ${item.name}`, 'error');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          return false;
        }
        pushRecent(item, mode);
        showToast(`Added 1 ${item.unit} to ${item.name}`, 'success');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return true;
      }
      const result = (await consumeItem(item.id, 1)) as { error?: Error | null };
      if (result?.error) {
        showToast(result.error.message || `Failed to remove ${item.name}`, 'error');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return false;
      }
      pushRecent(item, mode);
      showToast(`Removed 1 ${item.unit} from ${item.name}`, 'success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    },
    [updateItem, consumeItem, showToast, pushRecent],
  );

  const handleBarcode = useCallback(
    async (barcode: string) => {
      setLooking(true);

      const directMatch = findMatchingPantryItem(items, barcode);
      if (directMatch) {
        setLooking(false);
        await applyInventoryChange(directMatch, scanMode);
        return { resume: true };
      }

      setProductLoading(true);
      setScannedProduct(null);
      try {
        const rich = await searchProductByBarcode(barcode);
        setProductLoading(false);
        setLooking(false);
        const matched = findMatchingPantryItem(items, barcode, {
          name: rich.name,
          brand: rich.brand,
          barcode,
          category: rich.category,
          unit: rich.unit,
          image_url: rich.imageUrl ?? '',
        } as ScannedProduct);
        if (matched) {
          await applyInventoryChange(matched, scanMode);
          return { resume: true };
        }
        if (scanMode === 'consume') {
          showToast(`${rich.name} is not currently in your pantry`, 'warning');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          setManualBarcode(barcode);
          return { resume: false };
        }
        setScannedProduct({ ...rich, barcode });
        return { resume: false };
      } catch {
        setProductLoading(false);
      }

      const product = await lookupBarcode(barcode);
      setLooking(false);

      if (!product) {
        setManualBarcode(barcode);
        if (scanMode === 'consume') {
          showToast('This barcode does not match an item in your pantry', 'warning');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          return { resume: false };
        }
        setAddPrefill({ barcode });
        return { resume: false };
      }

      const matched = findMatchingPantryItem(items, barcode, product);
      if (matched) {
        await applyInventoryChange(matched, scanMode);
        return { resume: true };
      }

      if (scanMode === 'consume') {
        showToast(`${product.name} is not currently in your pantry`, 'warning');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setManualBarcode(barcode);
        return { resume: false };
      }

      setAddPrefill(await productToPrefillWithAI(product, locations));
      return { resume: false };
    },
    [items, locations, scanMode, applyInventoryChange, showToast],
  );

  const handleScannedConfirm = async (item: ScannedItem) => {
    const locId = locationIdFromName(item.storageLocation, locations) ?? locations[0]?.id ?? null;
    const expiryIso = item.expirationDate
      ? new Date(item.expirationDate).toISOString().slice(0, 10)
      : null;
    const res = await addItem({
      name: item.name,
      brand: item.brand,
      image_url: item.imageUrl ?? '',
      category: item.category,
      barcode: item.barcode ?? '',
      unit: item.unit,
      quantity: item.quantity,
      location_id: locId,
      expiry_date: expiryIso,
      low_stock_threshold: 1,
      purchase_price: item.priceOverride ?? item.pricePerUnit ?? null,
      notes: item.notes || (item.ingredients ? `Ingredients: ${item.ingredients}` : ''),
      product_id: null,
    });
    if (!res.error) {
      showToast(`${item.name} added to your pantry!`, 'success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setManualBarcode('');
      setScannedProduct(null);
      setCameraActive(true);
    } else {
      showToast(res.error.message || 'Failed to add item', 'error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const onBarcodeScanned = useCallback(
    async (result: BarcodeScanningResult) => {
      if (processingRef.current) return;
      const code = result.data?.trim();
      if (!code) return;
      processingRef.current = true;
      setCameraActive(false);
      const { resume } = await handleBarcode(code);
      setTimeout(() => {
        processingRef.current = false;
        if (resume) setCameraActive(true);
      }, 900);
    },
    [handleBarcode],
  );

  const handleManualLookup = async () => {
    const code = manualBarcode.trim();
    if (!code || processingRef.current) return;
    processingRef.current = true;
    setCameraActive(false);
    const { resume } = await handleBarcode(code);
    processingRef.current = false;
    if (resume) setCameraActive(true);
  };

  const topBarHeight = 100 + insets.top;
  const bottomSheetHeight = 280 + insets.bottom;
  const permissionDenied = permission && !permission.granted && !permission.canAskAgain;

  return (
    <View className="flex-1 bg-black">
      {permission?.granted && cameraActive ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: BARCODE_TYPES }}
          onBarcodeScanned={onBarcodeScanned}
        />
      ) : null}

      {looking ? (
        <View
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          className="items-center justify-center bg-black/40"
        >
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text className="mt-3 text-sm font-semibold text-white">Looking up…</Text>
        </View>
      ) : null}

      {permissionDenied ? (
        <View style={StyleSheet.absoluteFill} className="items-center justify-center px-8">
          <BlurView
            intensity={theme === 'dark' ? 75 : 80}
            tint={theme}
            style={{
              borderRadius: 24,
              borderWidth: 1,
              borderColor: c.line,
              overflow: 'hidden',
              padding: 24,
              width: '100%',
              maxWidth: 340,
            }}
          >
            <View className="items-center">
              <Icon name="camera" size={40} color={c.muted} />
              <Text className="mt-4 text-center text-lg font-bold text-ink dark:text-[#F0EEE9]">Camera access needed</Text>
              <Text className="mt-2 text-center text-sm text-muted dark:text-[#6B6878]">
                Larderly needs your camera to scan barcodes. Enable it in Settings to continue.
              </Text>
              <Button
                label="Open Settings"
                onPress={() => Linking.openSettings()}
                className="mt-5 w-full"
              />
            </View>
          </BlurView>
        </View>
      ) : null}

      <BlurView
        intensity={theme === 'dark' ? 75 : 80}
        tint={theme}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: topBarHeight,
          paddingTop: insets.top + 12,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: c.line,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1 flex-row gap-1.5 rounded-2xl border border-line dark:border-[#2A2A35] bg-surface dark:bg-[#1A1A22]/60 p-1">
            {(['add', 'consume'] as const).map((m) => (
              <Pressable
                key={m}
                onPress={() => setScanMode(m)}
                className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2 ${
                  scanMode === m ? 'bg-surface dark:bg-[#1A1A22]' : ''
                }`}
              >
                <Icon
                  name={m === 'add' ? 'plus' : 'minus'}
                  size={16}
                  color={scanMode === m ? c.primary : c.muted}
                />
                <Text
                  className={`text-sm font-bold ${scanMode === m ? 'text-primary' : 'text-muted dark:text-[#6B6878]'}`}
                >
                  {m === 'add' ? 'Add' : 'Consume'}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            onPress={() => navigation.navigate('Dashboard')}
            hitSlop={8}
            className="ml-3 h-10 w-10 items-center justify-center rounded-full border border-line dark:border-[#2A2A35] bg-surface dark:bg-[#1A1A22]/80"
          >
            <Icon name="close" size={18} color={c.ink} />
          </Pressable>
        </View>
      </BlurView>

      {!permissionDenied ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { top: topBarHeight, bottom: bottomSheetHeight },
          ]}
          className="items-center justify-center"
        >
          <View
            style={{
              width: 256,
              height: 128,
              borderRadius: 16,
              borderWidth: 2,
              borderColor: 'rgba(255,255,255,0.85)',
              overflow: 'hidden',
            }}
          >
            <Animated.View
              style={[
                beamStyle,
                {
                  height: 2,
                  backgroundColor: c.primary,
                  borderRadius: 1,
                  shadowColor: c.primary,
                  shadowOpacity: 1,
                  shadowRadius: 8,
                },
              ]}
            />
          </View>
          <Text className="mt-4 text-xs font-semibold text-white/90">Point at a barcode</Text>
        </View>
      ) : null}

      <BlurView
        intensity={theme === 'dark' ? 75 : 80}
        tint={theme}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: bottomSheetHeight,
          paddingBottom: insets.bottom + 90,
          paddingHorizontal: 16,
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: c.line,
        }}
      >
        <Text className="mb-2 text-[12px] font-bold uppercase tracking-wider text-muted dark:text-[#6B6878]">
          Enter barcode manually
        </Text>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <TextField
              value={manualBarcode}
              onChangeText={setManualBarcode}
              placeholder="e.g. 0123456789012"
              keyboardType="number-pad"
              icon="search"
            />
          </View>
          <Button
            label="Look up"
            onPress={handleManualLookup}
            disabled={!manualBarcode.trim() || looking}
          />
        </View>

        {recentScans.length > 0 ? (
          <>
            <Text className="mb-2 mt-4 text-[12px] font-bold uppercase tracking-wider text-muted dark:text-[#6B6878]">
              Recent
            </Text>
            <ScrollView
              showsVerticalScrollIndicator={false}
              className="flex-1"
              contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
            >
              <View className="gap-2">
                {recentScans.map((s) => (
                  <View
                    key={s.id}
                    className="flex-row items-center gap-3 rounded-xl border border-line dark:border-[#2A2A35] bg-surface dark:bg-[#1A1A22]/70 px-3 py-2.5"
                  >
                    <Icon
                      name={s.mode === 'add' ? 'plus' : 'minus'}
                      size={16}
                      color={s.mode === 'add' ? c.success : c.primary}
                    />
                    <Text className="flex-1 text-sm font-semibold text-ink dark:text-[#F0EEE9]">{s.name}</Text>
                    <Text className="text-xs text-muted dark:text-[#6B6878]">
                      {s.mode === 'add' ? '+1' : '-1'} {s.unit}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </>
        ) : null}
      </BlurView>

      <ScannedProductModal
        isOpen={!!scannedProduct || productLoading}
        product={scannedProduct}
        loading={productLoading}
        onClose={() => {
          setScannedProduct(null);
          setProductLoading(false);
          setCameraActive(true);
        }}
        onScanAgain={() => {
          setScannedProduct(null);
          setCameraActive(true);
        }}
        onConfirm={handleScannedConfirm}
      />

      <AddItemModal
        isOpen={!!addPrefill}
        onClose={() => {
          setAddPrefill(null);
          setCameraActive(true);
        }}
        locations={locations}
        prefill={addPrefill ?? undefined}
        onAdd={async (item) => {
          const res = await addItem(item);
          if (!res.error) {
            showToast(`${item.name} added to your pantry!`, 'success');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setManualBarcode('');
            setCameraActive(true);
          } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
          return res;
        }}
      />
    </View>
  );
}
