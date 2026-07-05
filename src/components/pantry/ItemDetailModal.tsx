import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { PantryItem, StorageLocation, CATEGORIES, UNITS } from '../../types';
import { getDaysUntilDate } from '../../lib/date';
import { getCategoryIcon } from '../../lib/appIcons';
import { useToast } from '../../contexts/ToastContext';
import { generateProductNote } from '../../lib/productNoteAI';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';
import TextField from '../ui/TextField';
import SelectField from '../ui/SelectField';
import DateInput from '../ui/DateInput';
import Button from '../ui/Button';
import { Icon, IconName } from '../ui/Icon';
import { useAppColors } from '../../hooks/useAppColors';

interface ItemDetailModalProps {
  item: PantryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<PantryItem>) => Promise<{ error: Error | null } | unknown>;
  onDelete: (id: string) => Promise<{ error: Error | null }>;
  onConsume: (id: string, amount?: number) => Promise<unknown>;
  locations: StorageLocation[];
}

const CATEGORY_OPTIONS = CATEGORIES.filter((c) => c !== 'All').map((c) => ({ label: c, value: c }));
const UNIT_OPTIONS = UNITS.map((u) => ({ label: u, value: u }));

type ChipTone = 'red' | 'orange' | 'yellow' | 'green' | 'stone';
const CHIP_TONE: Record<ChipTone, { bg: string; text: string }> = {
  red: { bg: 'bg-danger/10', text: 'text-danger' },
  orange: { bg: 'bg-primary/10', text: 'text-primary' },
  yellow: { bg: 'bg-warning/10', text: 'text-warning' },
  green: { bg: 'bg-success/10', text: 'text-success' },
  stone: { bg: 'bg-canvas dark:bg-[#0F0F13]', text: 'text-muted dark:text-[#6B6878]' },
};

export default function ItemDetailModal({
  item,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onConsume,
  locations,
}: ItemDetailModalProps) {
  const c = useAppColors();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editForm, setEditForm] = useState<Partial<PantryItem>>({});
  const [imgError, setImgError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen && item) setImgError(false);
    if (!isOpen) {
      setConfirmDelete(false);
      setEditing(false);
      setEditForm({});
    }
  }, [isOpen, item]);

  if (!item) return null;

  const set = <K extends keyof PantryItem>(key: K, value: PantryItem[K]) =>
    setEditForm((f) => ({ ...f, [key]: value }));

  const startEdit = () => {
    setEditForm({ ...item });
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditForm({});
  };

  const handleSave = async () => {
    setLoading(true);
    await onUpdate(item.id, editForm);
    setLoading(false);
    setEditing(false);
  };

  const handleConsume = async (amount: number) => {
    setLoading(true);
    await onConsume(item.id, amount);
    setLoading(false);
    showToast(`Used 1 ${item.unit} of ${item.name}`, 'success');
  };

  const handleAdd = async (amount: number) => {
    setLoading(true);
    await onUpdate(item.id, { quantity: item.quantity + amount });
    setLoading(false);
    showToast(`Added 1 ${item.unit} of ${item.name}`, 'success');
  };

  const handleDelete = async () => {
    setLoading(true);
    await onDelete(item.id);
    setLoading(false);
    setConfirmDelete(false);
    onClose();
  };

  const daysLeft = getDaysUntilDate(item.expiry_date);
  const location = locations.find((l) => l.id === item.location_id);
  const isLowStock = item.quantity <= item.low_stock_threshold;
  const showImage = !!item.image_url && !imgError;

  const locationOptions = [
    { label: 'None', value: '' },
    ...locations.map((l) => ({ label: l.name, value: l.id })),
  ];

  const expiryValue =
    daysLeft === null
      ? null
      : daysLeft < 0
        ? 'Expired'
        : daysLeft === 0
          ? 'Today'
          : `In ${daysLeft} days`;
  const expiryTone: ChipTone =
    daysLeft === null
      ? 'stone'
      : daysLeft < 0
        ? 'red'
        : daysLeft <= 2
          ? 'orange'
          : daysLeft <= 7
            ? 'yellow'
            : 'green';

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={editing ? 'Edit Item' : item.name}>
        {!editing ? (
          <View className="gap-5">
            {/* Preview */}
            <View className="flex-row items-start gap-4 rounded-3xl border border-line dark:border-[#2A2A35] bg-surface-muted dark:bg-[#14141C] p-4">
              {showImage ? (
                <Image
                  source={{ uri: item.image_url }}
                  onError={() => setImgError(true)}
                  className="h-20 w-20 rounded-3xl bg-white"
                  resizeMode="contain"
                />
              ) : (
                <View className="h-20 w-20 items-center justify-center rounded-3xl border border-line dark:border-[#2A2A35] bg-white">
                  <Icon name={getCategoryIcon(item.category)} size={32} color={c.ink} />
                </View>
              )}
              <View className="flex-1">
                <Text className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted dark:text-[#6B6878]">
                  Pantry item
                </Text>
                <Text className="text-xl font-bold text-ink dark:text-[#F0EEE9]">{item.name}</Text>
                {item.brand ? <Text className="mt-0.5 text-sm text-muted dark:text-[#6B6878]">{item.brand}</Text> : null}
                <View className="mt-2 flex-row flex-wrap gap-2">
                  <Chip label={item.category} />
                  {location ? <Chip label={location.name} icon="location" /> : null}
                  {isLowStock ? <Chip label="Low Stock" tone="warning" /> : null}
                </View>
              </View>
            </View>

            {/* Quantity */}
            <View className="rounded-3xl border border-line dark:border-[#2A2A35] bg-surface-muted dark:bg-[#14141C] p-4">
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-muted dark:text-[#6B6878]">Quantity</Text>
                <Text
                  className={`text-3xl font-bold ${isLowStock ? 'text-warning' : 'text-ink dark:text-[#F0EEE9]'}`}
                >
                  {item.quantity}
                  <Text className="text-sm font-normal text-muted dark:text-[#6B6878]"> {item.unit}</Text>
                </Text>
              </View>
              <View className="flex-row gap-2">
                <Button
                  label="Use 1"
                  icon="minus"
                  variant="secondary"
                  onPress={() => handleConsume(1)}
                  disabled={loading || item.quantity <= 0}
                  className="flex-1"
                />
                <Button
                  label="Add 1"
                  icon="plus"
                  onPress={() => handleAdd(1)}
                  disabled={loading}
                  className="flex-1"
                />
              </View>
            </View>

            {/* Detail chips */}
            <View className="flex-row flex-wrap gap-3">
              {expiryValue ? (
                <DetailChip icon="clock" label="Expires" value={expiryValue} tone={expiryTone} />
              ) : null}
              <DetailChip
                icon="tag"
                label="Low stock alert"
                value={`<= ${item.low_stock_threshold} ${item.unit}`}
                tone="stone"
              />
              {item.purchase_price ? (
                <DetailChip
                  icon="tag"
                  label="Purchase price"
                  value={`$${item.purchase_price.toFixed(2)}`}
                  tone="stone"
                />
              ) : null}
              {item.barcode ? (
                <DetailChip icon="scanner" label="Barcode" value={item.barcode} tone="stone" />
              ) : null}
            </View>

            {item.notes ? (
              <View className="rounded-3xl border border-line dark:border-[#2A2A35] bg-surface-muted dark:bg-[#14141C] p-4">
                <Text className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted dark:text-[#6B6878]">
                  Notes
                </Text>
                <Text className="text-sm leading-6 text-ink/80 dark:text-[#F0EEE9]">{item.notes}</Text>
              </View>
            ) : null}

            <View className="flex-row gap-3">
              <Button
                label="Remove"
                icon="trash"
                variant="danger"
                onPress={() => setConfirmDelete(true)}
                disabled={loading}
              />
              <Button
                label="Edit Item"
                icon="edit"
                onPress={startEdit}
                disabled={loading}
                className="flex-1"
              />
            </View>
          </View>
        ) : (
          <View className="gap-4">
            <TextField
              label="Product Name *"
              value={editForm.name ?? ''}
              onChangeText={(v) => set('name', v)}
            />
            <TextField
              label="Brand"
              value={editForm.brand ?? ''}
              onChangeText={(v) => set('brand', v)}
            />
            <SelectField
              label="Category"
              value={editForm.category ?? 'Other'}
              options={CATEGORY_OPTIONS}
              onChange={(v) => set('category', v)}
              title="Category"
            />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <TextField
                  label="Quantity"
                  value={String(editForm.quantity ?? 1)}
                  onChangeText={(v) => set('quantity', parseFloat(v) || 0)}
                  keyboardType="decimal-pad"
                />
              </View>
              <View className="flex-1">
                <SelectField
                  label="Unit"
                  value={editForm.unit ?? 'item'}
                  options={UNIT_OPTIONS}
                  onChange={(v) => set('unit', v)}
                  title="Unit"
                />
              </View>
            </View>
            <SelectField
              label="Location"
              value={editForm.location_id ?? ''}
              options={locationOptions}
              onChange={(v) => set('location_id', v || null)}
              title="Location"
              placeholder="None"
            />
            <View>
              <Text className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted dark:text-[#6B6878]">
                Expiry Date
              </Text>
              <DateInput value={editForm.expiry_date ?? null} onChange={(v) => set('expiry_date', v)} />
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <TextField
                  label="Low Stock Alert"
                  value={String(editForm.low_stock_threshold ?? 1)}
                  onChangeText={(v) => set('low_stock_threshold', parseFloat(v) || 0)}
                  keyboardType="decimal-pad"
                />
              </View>
              <View className="flex-1">
                <TextField
                  label="Price ($)"
                  value={editForm.purchase_price?.toString() ?? ''}
                  onChangeText={(v) => set('purchase_price', v ? parseFloat(v) : null)}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            <View>
              <View className="mb-1.5 flex-row items-center justify-between">
                <Text className="text-[11px] font-bold uppercase tracking-wider text-muted dark:text-[#6B6878]">
                  Notes
                </Text>
                <Button
                  label="Regenerate"
                  icon="sparkles"
                  variant="ghost"
                  size="sm"
                  onPress={async () => {
                    const base = { ...item, ...editForm };
                    const generated = await generateProductNote({
                      name: base.name || '',
                      brand: base.brand || '',
                      category: base.category || 'Other',
                      barcode: base.barcode || '',
                      unit: base.unit || 'item',
                    });
                    if (!generated) {
                      showToast('Not enough info to generate notes yet', 'warning');
                      return;
                    }
                    set('notes', generated);
                    showToast('Notes regenerated', 'success');
                  }}
                />
              </View>
              <TextField
                value={editForm.notes ?? ''}
                onChangeText={(v) => set('notes', v)}
                multiline
                numberOfLines={3}
                style={{ minHeight: 80, textAlignVertical: 'top' }}
              />
            </View>

            <View className="flex-row gap-3">
              <Button label="Cancel" icon="close" variant="secondary" onPress={cancelEdit} />
              <Button
                label="Save Changes"
                icon="check"
                onPress={handleSave}
                loading={loading}
                className="flex-1"
              />
            </View>
          </View>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        busy={loading}
        title="Remove from pantry"
        description={`Remove ${item.name} from your pantry? This also clears any auto-added shopping list entry for it.`}
        confirmLabel="Remove item"
        cancelLabel="Keep"
      />
    </>
  );
}

function Chip({ label, icon, tone }: { label: string; icon?: IconName; tone?: 'warning' }) {
  const c = useAppColors();
  const bg = tone === 'warning' ? 'bg-warning/10' : 'bg-white border border-line dark:border-[#2A2A35]';
  const text = tone === 'warning' ? 'text-warning' : 'text-muted dark:text-[#6B6878]';
  return (
    <View className={`flex-row items-center gap-1 rounded-full px-3 py-1 ${bg}`}>
      {icon ? <Icon name={icon} size={12} color={c.muted} /> : null}
      <Text className={`text-[11px] font-bold ${text}`}>{label}</Text>
    </View>
  );
}

function DetailChip({
  icon,
  label,
  value,
  tone,
}: {
  icon: IconName;
  label: string;
  value: string;
  tone: ChipTone;
}) {
  const c = useAppColors();
  const t = CHIP_TONE[tone];
  return (
    <View className={`min-w-[45%] grow rounded-2xl p-3.5 ${t.bg}`}>
      <View className="mb-1 flex-row items-center gap-1">
        <Icon name={icon} size={14} color={c.muted} />
        <Text className="text-xs font-semibold uppercase tracking-wide text-muted dark:text-[#6B6878]">{label}</Text>
      </View>
      <Text className={`text-sm font-semibold ${t.text}`}>{value}</Text>
    </View>
  );
}
