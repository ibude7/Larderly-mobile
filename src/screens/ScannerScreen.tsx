import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useIsFocused, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Text, XStack, YStack } from 'tamagui';
import { BarcodeCameraView } from '../components/scanner/BarcodeCameraView';
import { SettingsGlass } from '../components/settings/SettingsGlass';
import { SettingsChoiceChip } from '../components/settings/SettingsChoiceChip';
import { SettingsSheet } from '../components/settings/SettingsSheet';
import { settingsType } from '../components/settings/settingsFonts';
import { GlassButton } from '../components/landing/GlassButton';
import { Milk, Wheat } from '../components/ui/Glyph';
import { useInventory } from '../contexts/InventoryContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { categoryFromName } from '../lib/categories';
import { defaultStorageLocations } from '../lib/inventoryMapper';
import { searchProductByBarcode, type ProductData } from '../lib/productDb';
import { useAppColors } from '../hooks/useAppColors';
import { useScale } from '../theme/scale';
import type { TabParamList } from '../navigation/types';
import type { PantryItem } from '../types';

type ScanMode = 'add' | 'consume';

export default function ScannerScreen() {
  const route = useRoute<RouteProp<TabParamList, 'Scanner'>>();
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { s, fs, fsLayout } = useScale();
  const c = useAppColors();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { items, locations: rawLocations, canEdit, addItem, consumeItem } = useInventory();

  const [mode, setMode] = useState<ScanMode>(route.params?.mode ?? 'add');
  const [cameraArmed, setCameraArmed] = useState(true);
  const [lookingUp, setLookingUp] = useState(false);
  const [product, setProduct] = useState<(ProductData & { barcode: string }) | null>(null);
  const [match, setMatch] = useState<PantryItem | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (route.params?.mode) setMode(route.params.mode);
  }, [route.params?.mode]);

  const locations = useMemo(() => {
    if (rawLocations.length) return rawLocations;
    return defaultStorageLocations(user?.uid ?? 'local');
  }, [rawLocations, user?.uid]);

  const resetScan = useCallback(() => {
    setProduct(null);
    setMatch(null);
    setLookingUp(false);
    setCameraArmed(true);
  }, []);

  const handleScan = useCallback(
    async (barcode: string) => {
      const code = barcode.trim();
      if (!code || lookingUp) return;

      setLookingUp(true);
      setCameraArmed(false);
      try {
        if (mode === 'consume') {
          const found =
            items.find((i) => i.barcode && i.barcode === code) ??
            items.find((i) => i.name.toLowerCase().includes(code.toLowerCase()));
          if (!found) {
            showToast('No pantry match for this barcode', 'warning');
            setCameraArmed(true);
            return;
          }
          setMatch(found);
          return;
        }

        const data = await searchProductByBarcode(code);
        if (!data?.name) {
          showToast('Barcode not found — try a demo code', 'warning');
          setCameraArmed(true);
          return;
        }
        setProduct({ ...data, barcode: code });
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Lookup failed — try a demo code', 'warning');
        setCameraArmed(true);
      } finally {
        setLookingUp(false);
      }
    },
    [items, lookingUp, mode, showToast],
  );

  const confirmAdd = async () => {
    if (!product) return;
    if (!canEdit) {
      showToast('View-only — you can’t add items', 'warning');
      return;
    }
    setBusy(true);
    try {
      const cat = categoryFromName(product.name);
      const location = locations[0] ?? null;
      const { error } = await addItem({
        product_id: null,
        location_id: location?.id ?? null,
        name: product.name,
        brand: product.brand || '',
        image_url: product.imageUrl || '',
        category: product.category || cat.id,
        barcode: product.barcode || '',
        quantity: 1,
        unit: product.unit || 'ea',
        expiry_date: null,
        low_stock_threshold: 1,
        purchase_price: product.pricePerUnit ?? null,
        notes: '',
      });
      if (error) throw error;
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(`Added ${product.name}`, 'success');
      resetScan();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not add item', 'error');
    } finally {
      setBusy(false);
    }
  };

  const confirmConsume = async () => {
    if (!match) return;
    if (!canEdit) {
      showToast('View-only — you can’t consume items', 'warning');
      return;
    }
    setBusy(true);
    try {
      const { error } = await consumeItem(match.id, 1);
      if (error) throw error;
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(`Consumed 1 ${match.unit} of ${match.name}`, 'success');
      resetScan();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not consume', 'error');
    } finally {
      setBusy(false);
    }
  };

  const cameraActive = focused && cameraArmed && !lookingUp && !product && !match;
  const tabPad = fsLayout(100);

  return (
    <View style={[styles.root, { backgroundColor: c.canvas }]}>
      <YStack
        style={{
          paddingTop: insets.top + s(8),
          paddingHorizontal: s(16),
          paddingBottom: s(10),
          gap: s(10),
        }}
      >
        <YStack style={{ gap: s(2) }}>
          <Text style={[settingsType('bold'), { fontSize: fs(28), color: c.ink, letterSpacing: fs(-0.6) }]}>
            Scanner
          </Text>
          <Text style={[settingsType('medium'), { fontSize: fs(12), color: c.muted }]}>
            {mode === 'add' ? 'Scan to add to pantry' : 'Scan to mark as used'}
          </Text>
        </YStack>
        <XStack style={{ gap: s(8) }}>
          <SettingsChoiceChip
            label="Add"
            selected={mode === 'add'}
            onPress={() => {
              setMode('add');
              resetScan();
            }}
          />
          <SettingsChoiceChip
            label="Consume"
            selected={mode === 'consume'}
            onPress={() => {
              setMode('consume');
              resetScan();
            }}
          />
        </XStack>
      </YStack>

      {/* Camera must not live inside ScrollView — preview breaks on iOS/Android. */}
      <View style={{ paddingHorizontal: s(16) }}>
        <View
          style={{
            width: '100%',
            height: s(360),
            borderRadius: s(22),
            overflow: 'hidden',
            backgroundColor: '#1A1814',
          }}
        >
          <BarcodeCameraView active={cameraActive} onScanned={handleScan} />
          <View pointerEvents="none" style={styles.viewfinder}>
            <View style={[styles.corner, styles.tl, { borderColor: 'rgba(255,255,255,0.55)' }]} />
            <View style={[styles.corner, styles.tr, { borderColor: 'rgba(255,255,255,0.55)' }]} />
            <View style={[styles.corner, styles.bl, { borderColor: 'rgba(255,255,255,0.55)' }]} />
            <View style={[styles.corner, styles.br, { borderColor: 'rgba(255,255,255,0.55)' }]} />
          </View>
        </View>
      </View>

      <YStack
        style={{
          flex: 1,
          paddingHorizontal: s(16),
          paddingTop: s(14),
          paddingBottom: insets.bottom + tabPad,
          gap: s(14),
        }}
      >
        <Text style={[settingsType('medium'), { fontSize: fs(13), color: c.muted, textAlign: 'center' }]}>
          {lookingUp
            ? 'Looking up barcode…'
            : !focused
              ? 'Open this tab to scan'
              : canEdit
                ? 'Point at a barcode to continue'
                : 'View-only — you can still look up products'}
        </Text>

        <XStack style={{ gap: s(8), justifyContent: 'center', flexWrap: 'wrap' }}>
          <DemoChip
            label="Demo: Milk"
            icon={Milk}
            onPress={() => void handleScan('5901234123457')}
          />
          <DemoChip
            label="Demo: Cereal"
            icon={Wheat}
            onPress={() => void handleScan('1234567890128')}
          />
        </XStack>
      </YStack>

      <SettingsSheet
        isOpen={Boolean(product) || Boolean(match)}
        onClose={resetScan}
        title={mode === 'add' ? 'Add to pantry' : 'Consume item'}
      >
        {product ? (
          <YStack style={{ gap: s(14), paddingBottom: s(8) }}>
            <SettingsGlass
              elevated
              interactive={false}
              radius={s(18)}
              contentStyle={{ padding: s(14), gap: s(4) }}
            >
              <Text style={[settingsType('bold'), { fontSize: fs(18), color: c.ink }]}>
                {product.name}
              </Text>
              {product.brand ? (
                <Text style={[settingsType('regular'), { fontSize: fs(13), color: c.muted }]}>
                  {product.brand}
                </Text>
              ) : null}
              <Text style={[settingsType('medium'), { fontSize: fs(12), color: c.muted }]}>
                {product.unit || 'ea'} · {product.category || 'other'}
              </Text>
            </SettingsGlass>
            <GlassButton
              label="Add 1 to pantry"
              variant="amber"
              loading={busy}
              disabled={!canEdit}
              onPress={() => void confirmAdd()}
            />
            <GlassButton label="Scan again" variant="light" frosted onPress={resetScan} />
          </YStack>
        ) : null}

        {match ? (
          <YStack style={{ gap: s(14), paddingBottom: s(8) }}>
            <SettingsGlass
              elevated
              interactive={false}
              radius={s(18)}
              contentStyle={{ padding: s(14), gap: s(4) }}
            >
              <Text style={[settingsType('bold'), { fontSize: fs(18), color: c.ink }]}>
                {match.name}
              </Text>
              <Text style={[settingsType('medium'), { fontSize: fs(13), color: c.muted }]}>
                On hand: {match.quantity} {match.unit}
              </Text>
            </SettingsGlass>
            <GlassButton
              label="Consume 1"
              variant="amber"
              loading={busy}
              disabled={!canEdit}
              onPress={() => void confirmConsume()}
            />
            <GlassButton label="Scan again" variant="light" frosted onPress={resetScan} />
          </YStack>
        ) : null}
      </SettingsSheet>
    </View>
  );
}

function DemoChip({
  label,
  icon: Icon,
  onPress,
}: {
  label: string;
  icon: typeof Milk;
  onPress: () => void;
}) {
  const { s, fs } = useScale();
  const c = useAppColors();
  return (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: s(6),
        paddingVertical: s(10),
        paddingHorizontal: s(12),
        borderRadius: s(14),
        backgroundColor: c.surfaceMuted,
      }}
    >
      <Icon size={fs(16)} color={c.ink} />
      <Text style={[settingsType('semibold'), { fontSize: fs(12), color: c.ink }]}>{label}</Text>
    </Pressable>
  );
}

const CORNER = 22;
const THICK = 3;

const styles = StyleSheet.create({
  root: { flex: 1 },
  viewfinder: {
    ...StyleSheet.absoluteFill,
    margin: 36,
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: '#fff',
  },
  tl: { top: 0, left: 0, borderTopWidth: THICK, borderLeftWidth: THICK, borderTopLeftRadius: 6 },
  tr: { top: 0, right: 0, borderTopWidth: THICK, borderRightWidth: THICK, borderTopRightRadius: 6 },
  bl: { bottom: 0, left: 0, borderBottomWidth: THICK, borderLeftWidth: THICK, borderBottomLeftRadius: 6 },
  br: { bottom: 0, right: 0, borderBottomWidth: THICK, borderRightWidth: THICK, borderBottomRightRadius: 6 },
});
