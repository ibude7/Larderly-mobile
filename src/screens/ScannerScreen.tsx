import { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
  BarcodeType,
} from 'expo-camera';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import AppHeader from "../components/layout/AppHeader";
import Button from '../components/ui/Button';
import TextField from '../components/ui/TextField';
import Chip from '../components/ui/Chip';
import { Icon } from '../components/ui/Icon';
import AddItemModal from '../components/pantry/AddItemModal';
import ScannedProductModal, { ScannedItem } from '../components/pantry/ScannedProductModal';
import { usePantryStore } from '../contexts/PantryContext';
import { useToast } from '../contexts/ToastContext';
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
import { TabParamList } from '../navigation/types';
import { colors } from '../theme';

type ScanMode = 'add' | 'consume';

interface ScanHistoryEntry {
  id: string;
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
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<TabParamList, 'Scanner'>>();
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

  // Sync mode when navigated from the dashboard's add/consume shortcuts.
  useEffect(() => {
    if (route.params?.mode) {
      setScanMode(route.params.mode);
      navigation.setParams({ mode: undefined });
    }
  }, [route.params?.mode, navigation]);

  const pushRecent = useCallback((item: PantryItem, mode: ScanMode) => {
    setRecentScans((prev) =>
      [{ id: `${item.id}-${Date.now()}`, name: item.name, unit: item.unit, mode }, ...prev].slice(0, 6),
    );
  }, []);

  const applyInventoryChange = useCallback(
    async (item: PantryItem, mode: ScanMode) => {
      if (mode === 'add') {
        const { error } = await updateItem(item.id, { quantity: item.quantity + 1 });
        if (error) {
          showToast(error.message || `Failed to add more ${item.name}`, 'error');
          return false;
        }
        pushRecent(item, mode);
        showToast(`Added 1 ${item.unit} to ${item.name}`, 'success');
        return true;
      }
      const result = (await consumeItem(item.id, 1)) as { error?: Error | null };
      if (result?.error) {
        showToast(result.error.message || `Failed to remove ${item.name}`, 'error');
        return false;
      }
      pushRecent(item, mode);
      showToast(`Removed 1 ${item.unit} from ${item.name}`, 'success');
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

      // Rich product lookup via productDb (OFF + UPC cache)
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
      setManualBarcode('');
      setScannedProduct(null);
      setCameraActive(true);
    } else {
      showToast(res.error.message || 'Failed to add item', 'error');
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
      // Brief pause so a single physical scan doesn't instantly re-trigger.
      setTimeout(() => {
        processingRef.current = false;
        if (resume) setCameraActive(true);
      }, 900);
    },
    [handleBarcode],
  );

  const startCamera = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        showToast('Camera permission is needed to scan barcodes.', 'error');
        return;
      }
    }
    processingRef.current = false;
    setCameraActive(true);
  };

  const handleManualLookup = async () => {
    const code = manualBarcode.trim();
    if (!code || processingRef.current) return;
    processingRef.current = true;
    await handleBarcode(code);
    processingRef.current = false;
  };

  return (
    <View className="flex-1 bg-canvas">
      <AppHeader onOpenSettings={() => navigation.navigate('Settings')} />

      <View className="flex-1 p-5">
        <Text className="text-3xl font-bold text-ink">Scanner</Text>
        <Text className="mt-1 font-medium text-muted">
          {scanMode === 'add' ? 'Scan to add stock to your pantry.' : 'Scan to use up stock.'}
        </Text>

        {/* Mode toggle */}
        <View className="mt-5 flex-row gap-2">
          {(['add', 'consume'] as const).map((m) => (
            <Chip
              key={m}
              label={m === 'add' ? 'Add stock' : 'Use stock'}
              icon={m === 'add' ? 'plus' : 'minus'}
              active={scanMode === m}
              onPress={() => setScanMode(m)}
            />
          ))}
        </View>

        {/* Camera area */}
        <View className="mt-5 h-72 overflow-hidden rounded-card border border-line bg-ink">
          {cameraActive ? (
            <View className="flex-1">
              <CameraView
                style={{ flex: 1 }}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: BARCODE_TYPES }}
                onBarcodeScanned={onBarcodeScanned}
              />
              {/* Scan frame overlay */}
              <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
                <View className="h-32 w-64 rounded-2xl border-2 border-white/80" />
                <Text className="mt-4 text-xs font-semibold text-white/90">
                  Point at a barcode
                </Text>
              </View>
              <Pressable
                onPress={() => setCameraActive(false)}
                className="absolute right-3 top-3 h-9 w-9 items-center justify-center rounded-full bg-black/50"
              >
                <Icon name="close" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          ) : (
            <View className="flex-1 items-center justify-center p-6">
              {looking ? (
                <>
                  <ActivityIndicator size={32} color="#FFFFFF" />
                  <Text className="mt-3 text-sm font-semibold text-white/90">Looking up…</Text>
                </>
              ) : (
                <>
                  <Icon name="camera" size={40} color="rgba(255,255,255,0.7)" />
                  <Text className="mt-3 text-center text-sm text-white/70">
                    {permission?.granted
                      ? 'Camera is off.'
                      : 'Camera permission is required to scan.'}
                  </Text>
                  <View className="mt-4">
                    <Button label="Start Camera" icon="scanner" onPress={startCamera} />
                  </View>
                </>
              )}
            </View>
          )}
        </View>

        {/* Manual entry */}
        <View className="mt-5">
          <Text className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">
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
        </View>

        {/* Recent scans */}
        {recentScans.length > 0 ? (
          <View className="mt-6">
            <Text className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">
              Recent
            </Text>
            <View className="gap-2">
              {recentScans.map((s) => (
                <View
                  key={s.id}
                  className="flex-row items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5"
                >
                  <Icon
                    name={s.mode === 'add' ? 'plus' : 'minus'}
                    size={16}
                    color={s.mode === 'add' ? colors.success : colors.primary}
                  />
                  <Text className="flex-1 text-sm font-semibold text-ink">{s.name}</Text>
                  <Text className="text-xs text-muted">
                    {s.mode === 'add' ? '+1' : '-1'} {s.unit}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </View>

      <ScannedProductModal
        isOpen={!!scannedProduct || productLoading}
        product={scannedProduct}
        loading={productLoading}
        onClose={() => {
          setScannedProduct(null);
          setProductLoading(false);
        }}
        onScanAgain={() => {
          setScannedProduct(null);
          setCameraActive(true);
        }}
        onConfirm={handleScannedConfirm}
      />

      <AddItemModal
        isOpen={!!addPrefill}
        onClose={() => setAddPrefill(null)}
        locations={locations}
        prefill={addPrefill ?? undefined}
        onAdd={async (item) => {
          const res = await addItem(item);
          if (!res.error) {
            showToast(`${item.name} added to your pantry!`, 'success');
            setManualBarcode('');
          }
          return res;
        }}
      />
    </View>
  );
}
