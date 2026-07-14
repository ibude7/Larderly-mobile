import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { Minus, Plus } from '../ui/Glyph';
import DateInput from '../ui/DateInput';
import { GlassButton } from '../landing/GlassButton';
import { SettingsSheet } from '../settings/SettingsSheet';
import { SettingsTextField } from '../settings/SettingsTextField';
import { SettingsFieldLabel } from '../settings/SettingsFieldLabel';
import { settingsType } from '../settings/settingsFonts';
import PantryChip from './PantryChip';
import { CATEGORIES, HOUSEHOLD_UNITS } from '../../lib/categories';
import { formatDateString } from '../../lib/date';
import { locationIdFromName, locationNameFromId } from '../../lib/inventoryMapper';
import type { PantryItem, StorageLocation } from '../../types';
import { useAppColors } from '../../hooks/useAppColors';
import { useScale } from '../../theme/scale';

export type PantryDraft = {
  name: string;
  quantity: string;
  unit: string;
  locationId: string | null;
  category: string;
  expiry_date: string | null;
  low_stock_threshold: string;
};

const emptyDraft = (defaultLocationId: string | null): PantryDraft => ({
  name: '',
  quantity: '1',
  unit: 'pcs',
  locationId: defaultLocationId,
  category: 'other',
  expiry_date: null,
  low_stock_threshold: '1',
});

export function draftFromItem(item: PantryItem): PantryDraft {
  return {
    name: item.name,
    quantity: String(item.quantity),
    unit: item.unit || 'pcs',
    locationId: item.location_id,
    category: item.category || 'other',
    expiry_date: item.expiry_date,
    low_stock_threshold: String(item.low_stock_threshold ?? 1),
  };
}

export function draftFromVoice(
  parsed: {
    name: string;
    quantity: number;
    unit: string;
    storageLocation: string;
    category: string;
  },
  locations: StorageLocation[],
): PantryDraft {
  return {
    name: parsed.name,
    quantity: String(parsed.quantity || 1),
    unit: parsed.unit || 'pcs',
    locationId: locationIdFromName(parsed.storageLocation, locations),
    category: parsed.category || 'other',
    expiry_date: null,
    low_stock_threshold: '1',
  };
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return formatDateString(d);
}

interface PantryAddEditSheetProps {
  open: boolean;
  onClose: () => void;
  locations: StorageLocation[];
  editing: PantryItem | null;
  initialDraft?: PantryDraft | null;
  saving: boolean;
  titleAdd: string;
  titleEdit: string;
  labels: {
    name: string;
    quantity: string;
    unit: string;
    location: string;
    category: string;
    expiry: string;
    lowStock: string;
    save: string;
    cancel: string;
    expiryNone?: string;
    expiryWeek?: string;
    expiryMonth?: string;
  };
  onSave: (draft: PantryDraft, editingId: string | null) => void | Promise<void>;
}

export function PantryAddEditSheet({
  open,
  onClose,
  locations,
  editing,
  initialDraft,
  saving,
  titleAdd,
  titleEdit,
  labels,
  onSave,
}: PantryAddEditSheetProps) {
  const { s, fs, fsLayout } = useScale();
  const c = useAppColors();
  const defaultLoc = locations[0]?.id ?? null;
  const [draft, setDraft] = useState<PantryDraft>(() => emptyDraft(defaultLoc));
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setDraft(draftFromItem(editing));
      setShowDatePicker(Boolean(editing.expiry_date));
      return;
    }
    if (initialDraft) {
      setDraft(initialDraft);
      setShowDatePicker(Boolean(initialDraft.expiry_date));
      return;
    }
    setDraft(emptyDraft(defaultLoc));
    setShowDatePicker(false);
  }, [open, editing, initialDraft, defaultLoc]);

  const selectedCategory = useMemo(
    () => CATEGORIES.find((cat) => cat.id === draft.category) ?? CATEGORIES[CATEGORIES.length - 1],
    [draft.category],
  );

  const qty = Math.max(0, parseFloat(draft.quantity) || 0);
  const canSubmit = draft.name.trim().length > 0 && !saving;

  const bumpQty = (delta: number) => {
    const next = Math.max(0, Math.round((qty + delta) * 100) / 100);
    setDraft((d) => ({ ...d, quantity: String(next) }));
  };

  const bumpLow = (delta: number) => {
    const low = Math.max(0, (parseFloat(draft.low_stock_threshold) || 0) + delta);
    setDraft((d) => ({ ...d, low_stock_threshold: String(low) }));
  };

  const expiryNone = labels.expiryNone ?? 'None';
  const expiryWeek = labels.expiryWeek ?? '1 week';
  const expiryMonth = labels.expiryMonth ?? '1 month';

  return (
    <SettingsSheet
      isOpen={open}
      onClose={onClose}
      title={editing ? titleEdit : titleAdd}
      maxHeightRatio={0.88}
    >
      <YStack style={{ gap: s(18), paddingBottom: s(8) }}>
        {/* Hero preview */}
        <XStack
          style={{
            alignItems: 'center',
            gap: s(14),
            padding: s(12),
            borderRadius: s(18),
            backgroundColor: c.surfaceMuted,
          }}
        >
          <View
            style={{
              width: s(52),
              height: s(52),
              borderRadius: s(16),
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: `${selectedCategory.color}28`,
            }}
          >
            <Text style={{ fontSize: fs(26) }}>{selectedCategory.emoji}</Text>
          </View>
          <YStack style={{ flex: 1, minWidth: 0, gap: s(2) }}>
            <Text
              numberOfLines={1}
              style={[
                settingsType('semibold'),
                { fontSize: fs(17), color: c.ink, letterSpacing: fs(-0.2) },
              ]}
            >
              {draft.name.trim() || labels.name}
            </Text>
            <Text
              numberOfLines={1}
              style={[settingsType('regular'), { fontSize: fs(13), color: c.muted }]}
            >
              {locationNameFromId(draft.locationId, locations)}
              {' · '}
              {formatQty(qty)} {draft.unit}
            </Text>
          </YStack>
        </XStack>

        <SettingsTextField
          label={labels.name}
          value={draft.name}
          onChangeText={(name) => setDraft((d) => ({ ...d, name }))}
          placeholder="Milk"
          autoCapitalize="sentences"
          autoFocus={!editing}
          returnKeyType="done"
          testID="pantry-item-name"
        />

        {/* Quantity + unit */}
        <YStack style={{ gap: s(8) }}>
          <SettingsFieldLabel>{labels.quantity}</SettingsFieldLabel>
          <XStack style={{ alignItems: 'center', gap: s(12) }}>
            <XStack
              style={{
                alignItems: 'center',
                gap: s(4),
                backgroundColor: c.surfaceMuted,
                borderRadius: s(999),
                paddingHorizontal: s(4),
                paddingVertical: s(4),
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: c.glassLine,
              }}
            >
              <StepperButton onPress={() => bumpQty(-1)} label="Decrease" />
              <Text
                style={[
                  settingsType('bold'),
                  {
                    minWidth: s(40),
                    textAlign: 'center',
                    fontSize: fs(18),
                    color: c.ink,
                  },
                ]}
                testID="pantry-item-qty"
              >
                {formatQty(qty)}
              </Text>
              <StepperButton onPress={() => bumpQty(1)} label="Increase" />
            </XStack>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: s(8), alignItems: 'center' }}
              style={{ flex: 1 }}
            >
              {HOUSEHOLD_UNITS.map((unit) => (
                <PantryChip
                  key={unit}
                  label={unit}
                  selected={draft.unit === unit}
                  onPress={() => setDraft((d) => ({ ...d, unit }))}
                />
              ))}
            </ScrollView>
          </XStack>
        </YStack>

        {/* Location */}
        <YStack style={{ gap: s(8) }}>
          <SettingsFieldLabel>{labels.location}</SettingsFieldLabel>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: s(8) }}
          >
            {locations.map((loc) => (
              <PantryChip
                key={loc.id}
                label={loc.name}
                selected={draft.locationId === loc.id}
                onPress={() => setDraft((d) => ({ ...d, locationId: loc.id }))}
              />
            ))}
          </ScrollView>
        </YStack>

        {/* Category */}
        <YStack style={{ gap: s(8) }}>
          <SettingsFieldLabel>{labels.category}</SettingsFieldLabel>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: s(8) }}
          >
            {CATEGORIES.map((cat) => (
              <PantryChip
                key={cat.id}
                label={`${cat.emoji} ${cat.name}`}
                selected={draft.category === cat.id}
                onPress={() => setDraft((d) => ({ ...d, category: cat.id }))}
              />
            ))}
          </ScrollView>
        </YStack>

        {/* Expiry */}
        <YStack style={{ gap: s(8) }}>
          <SettingsFieldLabel>{labels.expiry}</SettingsFieldLabel>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: s(8) }}
          >
            <PantryChip
              label={expiryNone}
              selected={!draft.expiry_date && !showDatePicker}
              onPress={() => {
                setDraft((d) => ({ ...d, expiry_date: null }));
                setShowDatePicker(false);
              }}
            />
            <PantryChip
              label={expiryWeek}
              selected={draft.expiry_date === daysFromNow(7)}
              onPress={() => {
                setDraft((d) => ({ ...d, expiry_date: daysFromNow(7) }));
                setShowDatePicker(false);
              }}
            />
            <PantryChip
              label={expiryMonth}
              selected={draft.expiry_date === daysFromNow(30)}
              onPress={() => {
                setDraft((d) => ({ ...d, expiry_date: daysFromNow(30) }));
                setShowDatePicker(false);
              }}
            />
            <PantryChip
              label={labels.expiry}
              selected={showDatePicker}
              onPress={() => setShowDatePicker(true)}
            />
          </ScrollView>
          {showDatePicker ? (
            <DateInput
              value={draft.expiry_date}
              onChange={(expiry_date) => setDraft((d) => ({ ...d, expiry_date }))}
            />
          ) : null}
        </YStack>

        {/* Low stock */}
        <YStack style={{ gap: s(8) }}>
          <SettingsFieldLabel>{labels.lowStock}</SettingsFieldLabel>
          <XStack
            style={{
              alignSelf: 'flex-start',
              alignItems: 'center',
              gap: s(4),
              backgroundColor: c.surfaceMuted,
              borderRadius: s(999),
              paddingHorizontal: s(4),
              paddingVertical: s(4),
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: c.glassLine,
              minHeight: fsLayout(40),
            }}
          >
            <StepperButton onPress={() => bumpLow(-1)} label="Decrease low stock" />
            <Text
              style={[
                settingsType('semibold'),
                { minWidth: s(36), textAlign: 'center', fontSize: fs(15), color: c.ink },
              ]}
            >
              {draft.low_stock_threshold || '0'}
            </Text>
            <StepperButton onPress={() => bumpLow(1)} label="Increase low stock" />
          </XStack>
        </YStack>

        <YStack style={{ gap: s(10), marginTop: s(4) }}>
          <GlassButton
            label={labels.save}
            variant="amber"
            loading={saving}
            disabled={!canSubmit}
            onPress={() => void onSave(draft, editing?.id ?? null)}
          />
          <Pressable
            onPress={onClose}
            disabled={saving}
            hitSlop={8}
            style={{ alignItems: 'center', paddingVertical: s(6) }}
          >
            <Text style={[settingsType('semibold'), { fontSize: fs(14), color: c.muted }]}>
              {labels.cancel}
            </Text>
          </Pressable>
        </YStack>
      </YStack>
    </SettingsSheet>
  );
}

function StepperButton({ onPress, label }: { onPress: () => void; label: string }) {
  const { s, fs } = useScale();
  const c = useAppColors();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityLabel={label}
      style={{
        width: s(32),
        height: s(32),
        borderRadius: s(16),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: c.surfaceElevated,
      }}
    >
      {label.toLowerCase().includes('decrease') ? (
        <Minus size={fs(15)} color={c.ink} strokeWidth={2.4} />
      ) : (
        <Plus size={fs(15)} color={c.ink} strokeWidth={2.4} />
      )}
    </Pressable>
  );
}

function formatQty(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return String(Math.round(n * 100) / 100);
}
