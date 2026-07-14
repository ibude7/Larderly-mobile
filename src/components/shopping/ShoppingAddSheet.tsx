import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { Minus, Plus } from '../ui/Glyph';
import { GlassButton } from '../landing/GlassButton';
import { SettingsSheet } from '../settings/SettingsSheet';
import { SettingsTextField } from '../settings/SettingsTextField';
import { SettingsFieldLabel } from '../settings/SettingsFieldLabel';
import { settingsType } from '../settings/settingsFonts';
import PantryChip from '../pantry/PantryChip';
import { CATEGORIES, HOUSEHOLD_UNITS } from '../../lib/categories';
import { useAppColors } from '../../hooks/useAppColors';
import { useScale } from '../../theme/scale';

export type ShoppingDraft = {
  name: string;
  quantity: string;
  unit: string;
  category: string;
};

const emptyDraft = (): ShoppingDraft => ({
  name: '',
  quantity: '1',
  unit: 'pcs',
  category: 'other',
});

interface ShoppingAddSheetProps {
  open: boolean;
  onClose: () => void;
  saving: boolean;
  title: string;
  labels: {
    name: string;
    quantity: string;
    unit: string;
    category: string;
    save: string;
    cancel: string;
  };
  initial?: ShoppingDraft | null;
  onSave: (draft: ShoppingDraft) => void | Promise<void>;
}

export function ShoppingAddSheet({
  open,
  onClose,
  saving,
  title,
  labels,
  initial,
  onSave,
}: ShoppingAddSheetProps) {
  const { s, fs } = useScale();
  const c = useAppColors();
  const [draft, setDraft] = useState<ShoppingDraft>(emptyDraft);

  useEffect(() => {
    if (!open) return;
    setDraft(initial ?? emptyDraft());
  }, [open, initial]);

  const qty = Math.max(0, parseFloat(draft.quantity) || 0);
  const canSubmit = draft.name.trim().length > 0 && !saving;

  const bump = (delta: number) => {
    const next = Math.max(0, Math.round((qty + delta) * 100) / 100);
    setDraft((d) => ({ ...d, quantity: String(next) }));
  };

  return (
    <SettingsSheet isOpen={open} onClose={onClose} title={title} maxHeightRatio={0.82}>
      <YStack style={{ gap: s(16), paddingBottom: s(8) }}>
        <SettingsTextField
          label={labels.name}
          value={draft.name}
          onChangeText={(name) => setDraft((d) => ({ ...d, name }))}
          placeholder="Eggs"
          autoCapitalize="sentences"
          autoFocus
          testID="shopping-item-name"
        />

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
              <StepBtn onPress={() => bump(-1)} dec />
              <Text
                style={[
                  settingsType('bold'),
                  { minWidth: s(40), textAlign: 'center', fontSize: fs(18), color: c.ink },
                ]}
              >
                {Number.isInteger(qty) ? String(qty) : String(Math.round(qty * 100) / 100)}
              </Text>
              <StepBtn onPress={() => bump(1)} />
            </XStack>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: s(8) }} style={{ flex: 1 }}>
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

        <YStack style={{ gap: s(8) }}>
          <SettingsFieldLabel>{labels.category}</SettingsFieldLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: s(8) }}>
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

        <YStack style={{ gap: s(10), marginTop: s(4) }}>
          <GlassButton
            label={labels.save}
            variant="amber"
            loading={saving}
            disabled={!canSubmit}
            onPress={() => void onSave(draft)}
          />
          <Pressable onPress={onClose} disabled={saving} hitSlop={8} style={{ alignItems: 'center', paddingVertical: s(6) }}>
            <Text style={[settingsType('semibold'), { fontSize: fs(14), color: c.muted }]}>
              {labels.cancel}
            </Text>
          </Pressable>
        </YStack>
      </YStack>
    </SettingsSheet>
  );
}

function StepBtn({ onPress, dec }: { onPress: () => void; dec?: boolean }) {
  const { s, fs } = useScale();
  const c = useAppColors();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={{
        width: s(32),
        height: s(32),
        borderRadius: s(16),
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: c.surfaceElevated,
      }}
    >
      {dec ? (
        <Minus size={fs(15)} color={c.ink} strokeWidth={2.4} />
      ) : (
        <Plus size={fs(15)} color={c.ink} strokeWidth={2.4} />
      )}
    </Pressable>
  );
}
