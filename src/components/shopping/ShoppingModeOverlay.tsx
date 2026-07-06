import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Modal as RNModal, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, BarcodeScanningResult, BarcodeType } from 'expo-camera';
import Button from '../ui/Button';
import { Icon } from '../ui/Icon';
import VoiceInputButton from '../ui/VoiceInputButton';
import { useToast } from '../../contexts/ToastContext';
import { usePrefs } from '../../contexts/PreferencesContext';
import { formatCurrency } from '../../lib/format';
import { searchProductByBarcode } from '../../lib/productDb';
import { categoryFromName } from '../../lib/categories';
import { parseShoppingVoiceCommand } from '../../lib/voiceCommands';
import { useAppColors } from '../../hooks/useAppColors';

interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  is_checked: boolean;
  estimatedPrice?: number;
  barcode?: string;
}

interface ShoppingListMeta {
  name: string;
  budget?: number;
}

interface Props {
  visible: boolean;
  list: ShoppingListMeta | null;
  items: ShoppingItem[];
  onTogglePurchased: (id: string) => void;
  onCheckout: () => void;
  onClose: () => void;
  onAddToInventory?: (name: string, qty: number, unit: string, barcode?: string, price?: number, category?: string) => Promise<void>;
}

const BARCODE_TYPES: BarcodeType[] = ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'];

export default function ShoppingModeOverlay({
  visible,
  list,
  items,
  onTogglePurchased,
  onCheckout,
  onClose,
  onAddToInventory,
}: Props) {
  const c = useAppColors();
  const { showToast } = useToast();
  const { prefs } = usePrefs();
  const [isScanning, setIsScanning] = useState(false);
  const scanLock = useRef(false);

  const sorted = useMemo(
    () => [...items].sort((a, b) => Number(a.is_checked) - Number(b.is_checked)),
    [items],
  );
  const spent = items
    .filter((i) => i.is_checked)
    .reduce((s, i) => s + (i.estimatedPrice ?? 0) * i.quantity, 0);
  const budget = list?.budget ?? 0;
  const remaining = budget > 0 ? budget - spent : null;
  const uncheckedCount = items.filter((i) => !i.is_checked).length;

  useEffect(() => {
    if (!visible) {
      setIsScanning(false);
      scanLock.current = false;
    }
  }, [visible]);

  const handleBarcode = async (result: BarcodeScanningResult) => {
    if (scanLock.current) return;
    scanLock.current = true;
    const barcode = result.data;
    setIsScanning(false);

    const match = items.find((i) => i.barcode && i.barcode === barcode);
    if (match) {
      if (!match.is_checked) onTogglePurchased(match.id);
      showToast(`Marked: ${match.name}`, 'success');
      scanLock.current = false;
      return;
    }

    try {
      const product = await searchProductByBarcode(barcode);
      if (product && onAddToInventory) {
        const cat = categoryFromName(product.name).id;
        await onAddToInventory(
          product.name,
          1,
          product.unit ?? 'pcs',
          barcode,
          product.pricePerUnit ?? 0,
          cat,
        );
        showToast(`Added ${product.name} to pantry`, 'success');
      } else {
        showToast(`Barcode ${barcode} not on list`, 'warning');
      }
    } catch {
      showToast('Barcode lookup failed', 'error');
    } finally {
      scanLock.current = false;
    }
  };

  const handleVoice = async (transcript: string) => {
    try {
      const parsed = await parseShoppingVoiceCommand(transcript);
      const match = items.find(
        (i) =>
          i.name.toLowerCase().includes(parsed.productName.toLowerCase()) ||
          parsed.productName.toLowerCase().includes(i.name.toLowerCase()),
      );
      if (match) {
        if (!match.is_checked) onTogglePurchased(match.id);
        showToast(`Marked: ${match.name}`, 'success');
      } else {
        showToast(`Heard: ${parsed.quantity}× ${parsed.productName}`, 'info');
      }
    } catch {
      showToast('Could not parse voice command', 'error');
    }
  };

  if (!visible || !list) return null;

  return (
    <RNModal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-canvas dark:bg-canvas-dark">
        <View className="flex-row items-center justify-between border-b border-line dark:border-line-dark px-4 py-3">
          <View>
            <Text className="text-xs font-bold uppercase text-primary">Shopping mode</Text>
            <Text className="font-display text-2xl text-ink dark:text-ink-dark">{list.name}</Text>
          </View>
          <Pressable onPress={onClose} className="h-10 w-10 items-center justify-center rounded-full border border-line dark:border-line-dark bg-surface dark:bg-surface-dark">
            <Icon name="close" size={18} color={c.ink} />
          </Pressable>
        </View>

        <View className="flex-row flex-wrap gap-2 border-b border-line dark:border-line-dark px-4 py-3">
          <View className="rounded-xl bg-surface dark:bg-surface-dark px-3 py-2">
            <Text className="text-xs text-muted dark:text-muted-dark">Spent</Text>
            <Text className="font-bold text-ink dark:text-ink-dark">{formatCurrency(spent, prefs.currency)}</Text>
          </View>
          {remaining !== null && (
            <View className="rounded-xl bg-surface dark:bg-surface-dark px-3 py-2">
              <Text className="text-xs text-muted dark:text-muted-dark">Remaining</Text>
              <Text className={`font-bold ${remaining < 0 ? 'text-danger' : 'text-ink dark:text-ink-dark'}`}>
                {formatCurrency(remaining, prefs.currency)}
              </Text>
            </View>
          )}
          <View className="rounded-xl bg-surface dark:bg-surface-dark px-3 py-2">
            <Text className="text-xs text-muted dark:text-muted-dark">Left to buy</Text>
            <Text className="font-bold text-ink dark:text-ink-dark">{uncheckedCount}</Text>
          </View>
        </View>

        <View className="flex-row gap-2 px-4 py-3">
          <Button
            label={isScanning ? 'Stop scan' : 'Scan barcode'}
            icon="camera"
            variant="secondary"
            size="sm"
            onPress={() => setIsScanning((v) => !v)}
            className="flex-1"
          />
          <View className="flex-1">
            <VoiceInputButton label="Voice" onTranscript={handleVoice} />
          </View>
        </View>

        {isScanning && (
          <View className="mx-4 mb-3 h-48 overflow-hidden rounded-2xl border border-line dark:border-line-dark">
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: BARCODE_TYPES }}
              onBarcodeScanned={handleBarcode}
            />
          </View>
        )}

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          {sorted.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => onTogglePurchased(item.id)}
              className={`mb-2 flex-row items-center gap-3 rounded-2xl border px-4 py-4 ${
                item.is_checked ? 'border-success/30 bg-success/5' : 'border-line dark:border-line-dark bg-surface dark:bg-surface-dark'
              }`}
            >
              <Icon
                name={item.is_checked ? 'success' : 'cart'}
                size={22}
                color={item.is_checked ? c.success : c.primary}
              />
              <View className="flex-1">
                <Text className={`text-base font-semibold ${item.is_checked ? 'text-muted dark:text-muted-dark line-through' : 'text-ink dark:text-ink-dark'}`}>
                  {item.name}
                </Text>
                <Text className="text-sm text-muted dark:text-muted-dark">
                  {item.quantity} {item.unit}
                  {item.estimatedPrice ? ` · ${formatCurrency(item.estimatedPrice * item.quantity, prefs.currency)}` : ''}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        <View className="border-t border-line dark:border-line-dark px-4 py-3">
          <Button label="Checkout to pantry" icon="pantry" onPress={onCheckout} />
        </View>
      </SafeAreaView>
    </RNModal>
  );
}
