import React from 'react';
import { Text } from 'react-native';
import BottomSheet from '../ui/BottomSheet';
import TextField from '../ui/TextField';
import Button from '../ui/Button';

interface ListSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  budget: string;
  store: string;
  onChangeBudget: (v: string) => void;
  onChangeStore: (v: string) => void;
  onSave: () => void;
  onDelete: () => void;
  isRecurring?: boolean;
  recurringFrequency?: 'weekly' | 'biweekly' | 'monthly' | '';
  archivedAt?: number | null;
  lastGeneratedAt?: number | null;
}

const FREQUENCY_DAYS = { weekly: 7, biweekly: 14, monthly: 30 } as const;

function nextRefreshLabel(
  frequency?: 'weekly' | 'biweekly' | 'monthly' | '',
  archivedAt?: number | null,
  lastGeneratedAt?: number | null,
) {
  if (!frequency || !(frequency in FREQUENCY_DAYS)) return 'Next refresh date unavailable';
  const baseline = lastGeneratedAt ?? archivedAt ?? Date.now();
  const next = baseline + FREQUENCY_DAYS[frequency] * 86_400_000;
  const days = Math.max(0, Math.ceil((next - Date.now()) / 86_400_000));
  return days === 0 ? 'Next refresh: today' : `Next refresh: ${days} day${days === 1 ? '' : 's'}`;
}

export default function ListSettingsSheet({
  isOpen,
  onClose,
  budget,
  store,
  onChangeBudget,
  onChangeStore,
  onSave,
  onDelete,
  isRecurring,
  recurringFrequency,
  archivedAt,
  lastGeneratedAt,
}: ListSettingsSheetProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="List settings">
      <TextField
        label="Budget"
        value={budget}
        onChangeText={onChangeBudget}
        keyboardType="decimal-pad"
      />
      <TextField
        label="Store"
        value={store}
        onChangeText={onChangeStore}
        placeholder="Costco"
      />
      {isRecurring ? (
        <Text className="mt-2 text-xs font-semibold text-muted dark:text-muted-dark">
          {nextRefreshLabel(recurringFrequency, archivedAt, lastGeneratedAt)}
        </Text>
      ) : null}
      <Button label="Save" onPress={onSave} className="mt-4" />
      <Button label="Delete list" variant="danger" onPress={onDelete} className="mt-2" />
    </BottomSheet>
  );
}
