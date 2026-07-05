import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import TextField from '../ui/TextField';
import SelectField from '../ui/SelectField';
import DateInput from '../ui/DateInput';
import LoadingSpinner from '../ui/LoadingSpinner';
import type { ProductData } from '../../lib/productDb';
import { STORAGE_LOCATIONS } from '../../lib/categories';
import { usePrefs } from '../../contexts/PreferencesContext';
import { formatCurrency } from '../../lib/format';
import { generateProductNote } from '../../lib/productNoteAI';
import type { NoteInput } from '../../lib/notes';
import { useAppColors } from '../../hooks/useAppColors';

export interface ScannedItem extends ProductData {
  quantity: number;
  storageLocation: string;
  expirationDate: number;
  priceOverride?: number;
  notes?: string;
}

interface ScannedProductModalProps {
  isOpen: boolean;
  product: ProductData | null;
  loading?: boolean;
  onConfirm: (item: ScannedItem) => Promise<void> | void;
  onClose: () => void;
  onScanAgain?: () => void;
}

function productDataToNoteInput(product: ProductData): NoteInput {
  return {
    name: product.name,
    brand: product.brand,
    category: product.category,
    barcode: product.barcode,
    unit: product.unit,
    description: product.ingredients?.slice(0, 300) || undefined,
  };
}

export default function ScannedProductModal({
  isOpen,
  product,
  loading,
  onConfirm,
  onClose,
  onScanAgain,
}: ScannedProductModalProps) {
  const c = useAppColors();
  const { prefs } = usePrefs();
  const [qty, setQty] = useState('1');
  const [location, setLocation] = useState('Pantry');
  const [expiry, setExpiry] = useState<string | null>(null);
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);
  const [showNutrition, setShowNutrition] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!product) {
      setNotes('');
      setNoteLoading(false);
      return;
    }
    let cancelled = false;
    setNotes('');
    setNoteLoading(true);
    generateProductNote(productDataToNoteInput(product))
      .then((generated) => {
        if (!cancelled) setNotes(generated);
      })
      .finally(() => {
        if (!cancelled) setNoteLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [product]);

  if (!isOpen) return null;

  if (loading) {
    return (
      <Modal isOpen onClose={onClose} title="Looking up product" scroll={false}>
        <View className="items-center py-8">
          <LoadingSpinner />
          <Text className="mt-3 text-sm text-muted dark:text-[#6B6878]">Searching databases…</Text>
        </View>
      </Modal>
    );
  }

  if (!product) return null;

  const hasNutrition = product.calories != null || product.protein != null;

  const handleAdd = async () => {
    setSaving(true);
    try {
      await onConfirm({
        ...product,
        quantity: parseFloat(qty) || 1,
        storageLocation: location,
        expirationDate: expiry ? new Date(expiry).getTime() : 0,
        priceOverride: price ? parseFloat(price) : undefined,
        notes,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Add to inventory">
      <ScrollView>
        <View className="mb-4 flex-row gap-4">
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} className="h-16 w-16 rounded-2xl" />
          ) : (
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Text className="text-2xl">🛒</Text>
            </View>
          )}
          <View className="flex-1">
            <Text className="text-lg font-bold text-ink dark:text-[#F0EEE9]">{product.name}</Text>
            {product.brand ? <Text className="text-sm text-muted dark:text-[#6B6878]">{product.brand}</Text> : null}
            {product.barcode ? <Text className="font-mono text-xs text-muted dark:text-[#6B6878]">{product.barcode}</Text> : null}
          </View>
        </View>

        {hasNutrition && (
          <Pressable onPress={() => setShowNutrition((s) => !s)} className="mb-3">
            <Text className="text-xs font-bold uppercase text-muted dark:text-[#6B6878]">Nutrition per 100g {showNutrition ? '▲' : '▼'}</Text>
          </Pressable>
        )}
        {showNutrition && hasNutrition && (
          <View className="mb-4 flex-row justify-between rounded-2xl bg-canvas dark:bg-[#0F0F13] p-3">
            <Text className="text-xs">Cal {product.calories ?? '—'}</Text>
            <Text className="text-xs">P {product.protein ?? '—'}g</Text>
            <Text className="text-xs">F {product.fat ?? '—'}g</Text>
            <Text className="text-xs">C {product.carbs ?? '—'}g</Text>
          </View>
        )}

        <View className="flex-row gap-3">
          <View className="flex-1">
            <TextField label="Quantity" value={qty} onChangeText={setQty} keyboardType="numeric" />
          </View>
          <View className="flex-1">
            <SelectField
              label="Location"
              value={location}
              onChange={setLocation}
              options={STORAGE_LOCATIONS.map((l) => ({ label: l, value: l }))}
            />
          </View>
        </View>
        <Text className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted dark:text-[#6B6878]">Expiry</Text>
        <DateInput value={expiry} onChange={setExpiry} placeholder="Select expiry date" />
        <TextField
          label={`Price (${prefs.currency})`}
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
          placeholder={product.pricePerUnit ? formatCurrency(product.pricePerUnit, prefs.currency) : ''}
        />
        <TextField label="Notes" value={notes} onChangeText={setNotes} multiline numberOfLines={3} />
        {noteLoading ? (
          <View className="mt-1 flex-row items-center gap-2">
            <ActivityIndicator size="small" color={c.primary} />
            <Text className="text-xs text-muted dark:text-[#6B6878]">Generating note with AI…</Text>
          </View>
        ) : null}

        <View className="mt-4 gap-2">
          <Button label="Add to pantry" onPress={handleAdd} loading={saving} />
          {onScanAgain && <Button label="Scan again" variant="secondary" onPress={onScanAgain} />}
        </View>
      </ScrollView>
    </Modal>
  );
}
