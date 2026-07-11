import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
import { Image } from 'expo-image';
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
import BottomSheet from '../components/ui/BottomSheet';
import { Icon } from '../components/ui/Icon';
import AddItemModal from '../components/pantry/AddItemModal';
import ItemDetailModal from '../components/pantry/ItemDetailModal';
import ScannedProductModal, { ScannedItem } from '../components/pantry/ScannedProductModal';
import { useInventory } from '../contexts/InventoryContext';
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
import { trackEvent } from '../lib/analytics';

type ScanMode = 'add' | 'consume';

interface ScanHistoryEntry {
  id: string;
  pantryItemId: string;
  name: string;
  unit: string;
  mode: ScanMode;
}

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
  locations: ReturnType<typeof useInventory>['locations'],
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
  locations: ReturnType<typeof useInventory>['locations'],
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
  const { items, locations, addItem, updateItem, deleteItem, consumeItem } = useInventory();
  const { showToast } = useToast();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanMode, setScanMode] = useState<ScanMode>(route.params?.mode ?? 'add');
  const [cameraActive, setCameraActive] = useState(false);
  const [looking, setLooking] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [recentScans, setRecentScans] = useState<ScanHistoryEntry[]>([]);
  const [historyItemId, setHistoryItemId] = useState<string | null>(null);
  const [addPrefill, setAddPrefill] = useState<Partial<PantryItem> | null>(null);
  const [scannedProduct, setScannedProduct] = useState<ProductData | null>(null);
  const [productLoading, setProductLoading] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const processingRef = useRef(false);
  const recentScansRef = useRef<ScanHistoryEntry[]>([]);

  const scanY = useSharedValue(0);
  const cornerOpacity = useSharedValue(1);
  const successOpacity = useSharedValue(0);

  useEffect(() => {
    scanY.value = withRepeat(withTiming(160, { duration: 1700 }), -1, true);
    cornerOpacity.value = withRepeat(withTiming(0.5, { duration: 900 }), -1, true);
  }, [cornerOpacity, scanY]);

  const beamStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanY.value }],
  }));

  const cornerStyle = useAnimatedStyle(() => ({
    opacity: cornerOpacity.value,
  }));

  const successFlashStyle = useAnimatedStyle(() => ({
    opacity: successOpacity.value,
  }));

  const flashSuccess = useCallback(() => {
    successOpacity.value = 0.3;
    successOpacity.value = withTiming(0, { duration: 400 });
  }, [successOpacity]);

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
    const next = [
      { id: `${item.id}-${mode}-${Date.now()}`, pantryItemId: item.id, name: item.name, unit: item.unit, mode },
      ...recentScansRef.current.filter((entry) => entry.pantryItemId !== item.id),
    ].slice(0, 3);
    recentScansRef.current = next;
    setRecentScans(next);
  }, []);

  const historyItem = useMemo(
    () => (historyItemId ? items.find((item) => item.id === historyItemId) ?? null : null),
    [historyItemId, items],
  );

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
        flashSuccess();
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
      flashSuccess();
      showToast(`Removed 1 ${item.unit} from ${item.name}`, 'success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    },
    [updateItem, consumeItem, showToast, pushRecent, flashSuccess],
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
        if (rich.imageUrl) Image.prefetch(rich.imageUrl).catch(() => {});
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
        flashSuccess();
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
      if (product.image_url) Image.prefetch(product.image_url).catch(() => {});

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

      flashSuccess();
      setAddPrefill(await productToPrefillWithAI(product, locations));
      return { resume: false };
    },
    [items, locations, scanMode, applyInventoryChange, showToast, flashSuccess],
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
      trackEvent('item_scanned', { mode: scanMode }).catch(() => {});
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
    setManualOpen(false);
    processingRef.current = true;
    setCameraActive(false);
    const { resume } = await handleBarcode(code);
    processingRef.current = false;
    if (resume) setCameraActive(true);
  };

  const topBarHeight = 100 + insets.top;
  const bottomSheetHeight = 156 + insets.bottom;
  const permissionDenied = permission && !permission.granted && !permission.canAskAgain;

  return (
    <View className="flex-1 bg-black">
      {permission?.granted && cameraActive ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: BARCODE_TYPES }}
          onBarcodeScanned={onBarcodeScanned}
          enableTorch={torchOn}
        />
      ) : null}

      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: c.success },
          successFlashStyle,
        ]}
      />

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
              <Text className="mt-4 text-center font-display text-xl text-ink dark:text-ink-dark">Camera access needed</Text>
              <Text className="mt-2 text-center text-sm text-muted dark:text-muted-dark">
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
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/25">
            <Icon name="sparkles" size={18} color={c.primary} />
          </View>
          <View className="flex-1 flex-row gap-1.5 rounded-2xl border border-white/15 bg-black/20 p-1">
            {(['add', 'consume'] as const).map((m) => (
              <Pressable
                key={m}
                onPress={() => setScanMode(m)}
                className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2 ${
                  scanMode === m ? 'bg-white/15' : ''
                }`}
              >
                <Icon
                  name={m === 'add' ? 'plus' : 'minus'}
                  size={16}
                  color={scanMode === m ? c.primary : 'rgba(255,255,255,0.6)'}
                />
                <Text
                  className={`text-sm font-bold ${scanMode === m ? 'text-primary' : 'text-white/60'}`}
                >
                  {m === 'add' ? 'Add' : 'Consume'}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            onPress={() => navigation.navigate('Dashboard')}
            hitSlop={8}
            className="ml-3 h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/25"
          >
            <Icon name="close" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
        <Text className="mt-3 text-center text-sm font-bold text-white/90">Liquid Light Scanner</Text>
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
              width: 286,
              height: 188,
              borderRadius: 28,
              borderWidth: 1,
              borderColor: `${c.primary}88`,
              backgroundColor: 'rgba(255,255,255,0.03)',
              shadowColor: c.primary,
              shadowOpacity: 0.8,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 0 },
              overflow: 'hidden',
            }}
          >
            {(['topLeft', 'topRight', 'bottomLeft', 'bottomRight'] as const).map((corner) => (
              <Animated.View
                key={corner}
                style={[
                  styles.corner,
                  styles[corner],
                  { borderColor: c.primary },
                  cornerStyle,
                ]}
              />
            ))}
            <Animated.View
              style={[
                beamStyle,
                {
                  height: 3,
                  backgroundColor: c.primary,
                  borderRadius: 2,
                  shadowColor: c.primary,
                  shadowOpacity: 1,
                  shadowRadius: 14,
                },
              ]}
            />
          </View>
          <Text className="mt-4 text-xs font-semibold text-white/90">Point at a barcode</Text>
        </View>
      ) : null}

      {!permissionDenied ? (
        <Pressable
          onPress={() => setTorchOn((value) => !value)}
          accessibilityRole="button"
          accessibilityLabel={torchOn ? 'Turn torch off' : 'Turn torch on'}
          style={{
            position: 'absolute',
            left: 18,
            bottom: bottomSheetHeight + 18,
            width: 48,
            height: 48,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: torchOn ? 'rgba(255,51,102,0.4)' : 'rgba(255,255,255,0.18)',
            backgroundColor: torchOn ? c.primary : 'rgba(0,0,0,0.4)',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: torchOn ? c.primary : 'transparent',
            shadowOpacity: torchOn ? 0.5 : 0,
            shadowRadius: torchOn ? 12 : 0,
            elevation: torchOn ? 8 : 0,
          }}
        >
          <Icon name="flash" size={20} color="#FFFFFF" />
        </Pressable>
      ) : null}

      {!permissionDenied ? (
        <Pressable
          onPress={() => setManualOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Enter barcode manually"
          style={{
            position: 'absolute',
            alignSelf: 'center',
            bottom: bottomSheetHeight + 24,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: `${c.primary}44`,
            backgroundColor: 'rgba(0,0,0,0.46)',
            paddingHorizontal: 16,
            paddingVertical: 11,
            shadowColor: c.primary,
            shadowOpacity: 0.25,
            shadowRadius: 14,
          }}
        >
          <Text className="text-xs font-bold text-white">Enter barcode manually</Text>
        </Pressable>
      ) : null}

      {!permissionDenied ? (
        <BlurView
          intensity={theme === 'dark' ? 75 : 80}
          tint={theme}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: bottomSheetHeight,
            paddingBottom: insets.bottom + 18,
            paddingHorizontal: 16,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: c.glassLine,
            backgroundColor: c.surfaceGlass,
          }}
        >
          <View className="mb-3 self-center rounded-full bg-white/30" style={{ width: 42, height: 4 }} />
          <View className="flex-row items-center justify-between">
            <Text className="text-[12px] font-bold uppercase tracking-wider text-muted dark:text-muted-dark">
              Recent scans
            </Text>
            <Text className="text-xs text-muted dark:text-muted-dark">Session only</Text>
          </View>

          {recentScans.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-3"
              contentContainerStyle={{ gap: 10, paddingRight: 16 }}
            >
              {recentScans.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => setHistoryItemId(s.pantryItemId)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${s.name}`}
                  className="min-w-[148px] flex-row items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-3 py-3"
                >
                  <View
                    className="h-8 w-8 items-center justify-center rounded-full"
                    style={{ backgroundColor: s.mode === 'add' ? c.success : c.primary }}
                  >
                    <Icon
                      name={s.mode === 'add' ? 'plus' : 'minus'}
                      size={15}
                      color="#FFFFFF"
                    />
                  </View>
                  <View className="flex-1">
                    <Text numberOfLines={1} className="text-sm font-bold text-white">{s.name}</Text>
                    <Text className="mt-0.5 text-xs text-white/65">
                      {s.mode === 'add' ? '+1' : '-1'} {s.unit}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <View className="mt-3 rounded-2xl border border-dashed border-white/12 bg-white/5 px-4 py-4">
              <Text className="text-sm font-semibold text-white/80">
                Scan a pantry item to pin it here.
              </Text>
            </View>
          )}
        </BlurView>
      ) : null}

      <BottomSheet
        isOpen={manualOpen}
        onClose={() => setManualOpen(false)}
        title="Enter barcode"
        snapPoints={['34%']}
      >
        <View className="gap-3">
          <TextField
            value={manualBarcode}
            onChangeText={setManualBarcode}
            placeholder="e.g. 0123456789012"
            keyboardType="number-pad"
            icon="search"
          />
          <Button
            label="Look up barcode"
            onPress={handleManualLookup}
            disabled={!manualBarcode.trim() || looking}
          />
        </View>
      </BottomSheet>

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

      <ItemDetailModal
        item={historyItem}
        isOpen={!!historyItem}
        onClose={() => setHistoryItemId(null)}
        locations={locations}
        onUpdate={updateItem}
        onDelete={deleteItem}
        onConsume={consumeItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  corner: {
    position: 'absolute',
    height: 28,
    width: 28,
  },
  topLeft: {
    borderLeftWidth: 3,
    borderTopWidth: 3,
    left: 0,
    top: 0,
  },
  topRight: {
    borderRightWidth: 3,
    borderTopWidth: 3,
    right: 0,
    top: 0,
  },
  bottomLeft: {
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    bottom: 0,
    left: 0,
  },
  bottomRight: {
    borderBottomWidth: 3,
    borderRightWidth: 3,
    bottom: 0,
    right: 0,
  },
});
