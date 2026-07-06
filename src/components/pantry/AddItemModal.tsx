import { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { PantryItem, StorageLocation, CATEGORIES, UNITS } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { getCategoryIcon } from '../../lib/appIcons';
import Modal from '../ui/Modal';
import TextField from '../ui/TextField';
import SelectField from '../ui/SelectField';
import DateInput from '../ui/DateInput';
import Button from '../ui/Button';
import { Icon } from '../ui/Icon';
import { useAppColors } from '../../hooks/useAppColors';
import { useKeyboard } from '../../hooks/useKeyboard';

type NewItem = Omit<PantryItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: NewItem) => Promise<{ error: Error | null }>;
  locations: StorageLocation[];
  prefill?: Partial<PantryItem>;
}

const CATEGORY_OPTIONS = CATEGORIES.filter((c) => c !== 'All').map((c) => ({ label: c, value: c }));
const UNIT_OPTIONS = UNITS.map((u) => ({ label: u, value: u }));

function buildInitialForm(prefill: Partial<PantryItem> | undefined, defaultLocationId: string | null): NewItem {
  return {
    product_id: prefill?.product_id ?? null,
    location_id: prefill?.location_id ?? defaultLocationId,
    name: prefill?.name ?? '',
    brand: prefill?.brand ?? '',
    image_url: prefill?.image_url ?? '',
    category: prefill?.category ?? 'Other',
    barcode: prefill?.barcode ?? '',
    quantity: prefill?.quantity ?? 1,
    unit: prefill?.unit ?? 'item',
    expiry_date: prefill?.expiry_date ?? null,
    low_stock_threshold: prefill?.low_stock_threshold ?? 1,
    purchase_price: prefill?.purchase_price ?? null,
    notes: prefill?.notes ?? '',
  };
}

export default function AddItemModal({ isOpen, onClose, onAdd, locations, prefill }: AddItemModalProps) {
  const c = useAppColors();
  const { keyboardHeight } = useKeyboard();
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);
  const { showToast } = useToast();
  const defaultLocationId = locations[0]?.id ?? null;
  const [form, setForm] = useState<NewItem>(() => buildInitialForm(prefill, defaultLocationId));

  useEffect(() => {
    if (isOpen) {
      setImgError(false);
      setForm(buildInitialForm(prefill, defaultLocationId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, prefill]);

  const set = <K extends keyof NewItem>(key: K, value: NewItem[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    if (!form.name.trim()) return;
    setLoading(true);
    const { error } = await onAdd(form);
    setLoading(false);
    if (error) {
      showToast(error.message || `Failed to add ${form.name} to your pantry`, 'error');
      return;
    }
    onClose();
  };

  const locationOptions = [
    { label: 'None', value: '' },
    ...locations.map((l) => ({ label: l.name, value: l.id })),
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Item to Pantry">
      {/* Preview */}
      <View className="mb-5 flex-row items-center gap-4 rounded-3xl border border-line dark:border-line-dark bg-surface-muted dark:bg-canvas-raised-dark p-4">
        {form.image_url && !imgError ? (
          <Image
            source={{ uri: form.image_url }}
            onError={() => setImgError(true)}
            className="h-20 w-20 rounded-3xl bg-white"
            resizeMode="contain"
          />
        ) : (
          <View className="h-20 w-20 items-center justify-center rounded-3xl border border-line dark:border-line-dark bg-white">
            <Icon name={getCategoryIcon(form.category)} size={32} color={c.ink} />
          </View>
        )}
        <View className="flex-1">
          <Text className="mb-1 text-xs font-bold uppercase tracking-widest text-muted dark:text-muted-dark">
            Product preview
          </Text>
          <Text numberOfLines={1} className="text-lg font-semibold text-ink dark:text-ink-dark">
            {form.name || 'New pantry item'}
          </Text>
          {form.brand ? <Text className="mt-0.5 text-sm text-muted dark:text-muted-dark">{form.brand}</Text> : null}
          <View className="mt-2 flex-row flex-wrap gap-2">
            <View className="rounded-full border border-line dark:border-line-dark bg-white px-3 py-1">
              <Text className="text-xs font-bold text-muted dark:text-muted-dark">{form.category}</Text>
            </View>
            {form.barcode ? (
              <View className="rounded-full border border-line dark:border-line-dark bg-white px-3 py-1">
                <Text className="text-xs font-bold text-muted dark:text-muted-dark">{form.barcode}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <View className="gap-4">
        <TextField
          label="Product Name *"
          value={form.name}
          onChangeText={(v) => set('name', v)}
          placeholder="e.g. Oat Milk"
        />
        <TextField
          label="Brand"
          value={form.brand}
          onChangeText={(v) => set('brand', v)}
          placeholder="e.g. Oatly"
        />
        <SelectField
          label="Category"
          value={form.category}
          options={CATEGORY_OPTIONS}
          onChange={(v) => set('category', v)}
          title="Category"
        />
        <View className="flex-row gap-3">
          <View className="flex-1">
            <TextField
              label="Quantity"
              value={String(form.quantity)}
              onChangeText={(v) => set('quantity', parseFloat(v) || 0)}
              keyboardType="decimal-pad"
            />
          </View>
          <View className="flex-1">
            <SelectField
              label="Unit"
              value={form.unit}
              options={UNIT_OPTIONS}
              onChange={(v) => set('unit', v)}
              title="Unit"
            />
          </View>
        </View>
        <SelectField
          label="Storage Location"
          value={form.location_id ?? ''}
          options={locationOptions}
          onChange={(v) => set('location_id', v || null)}
          title="Storage Location"
          placeholder="None"
        />
        <View>
          <Text className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted dark:text-muted-dark">
            Expiry Date
          </Text>
          <DateInput value={form.expiry_date ?? null} onChange={(v) => set('expiry_date', v)} />
        </View>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <TextField
              label="Low Stock Alert at"
              value={String(form.low_stock_threshold)}
              onChangeText={(v) => set('low_stock_threshold', parseFloat(v) || 0)}
              keyboardType="decimal-pad"
            />
          </View>
          <View className="flex-1">
            <TextField
              label="Price ($)"
              value={form.purchase_price?.toString() ?? ''}
              onChangeText={(v) => set('purchase_price', v ? parseFloat(v) : null)}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />
          </View>
        </View>
        <TextField
          label="Barcode"
          value={form.barcode}
          onChangeText={(v) => set('barcode', v)}
          placeholder="Optional"
          keyboardType="number-pad"
        />
        <TextField
          label="Notes"
          value={form.notes}
          onChangeText={(v) => set('notes', v)}
          placeholder="Any notes about this item..."
          multiline
          numberOfLines={3}
          style={{ minHeight: 72, textAlignVertical: 'top' }}
        />
      </View>

      <View
        className="mt-6 flex-row gap-3"
        style={{ paddingBottom: keyboardHeight ? Math.min(keyboardHeight, 180) : 0 }}
      >
        <Button label="Cancel" onPress={onClose} variant="secondary" className="flex-1" />
        <Button
          label="Add to Pantry"
          onPress={submit}
          loading={loading}
          disabled={!form.name.trim()}
          className="flex-1"
        />
      </View>
    </Modal>
  );
}
