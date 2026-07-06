import React from 'react';
import { View } from 'react-native';
import TextField from '../ui/TextField';
import Button from '../ui/Button';
import { useKeyboard } from '../../hooks/useKeyboard';

interface AddItemSheetProps {
  name: string;
  qty: string;
  price: string;
  onChangeName: (v: string) => void;
  onChangeQty: (v: string) => void;
  onChangePrice: (v: string) => void;
  onAdd: () => void;
  onCancel: () => void;
}

export default function AddItemSheet({
  name,
  qty,
  price,
  onChangeName,
  onChangeQty,
  onChangePrice,
  onAdd,
  onCancel,
}: AddItemSheetProps) {
  const { keyboardHeight } = useKeyboard();

  return (
    <View
      className="mt-6 rounded-2xl border border-line bg-surface p-4"
      style={{ paddingBottom: keyboardHeight ? Math.min(keyboardHeight, 180) : 16 }}
    >
      <TextField label="Item name" value={name} onChangeText={onChangeName} />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <TextField
            label="Qty"
            value={qty}
            onChangeText={onChangeQty}
            keyboardType="numeric"
          />
        </View>
        <View className="flex-1">
          <TextField
            label="Price est."
            value={price}
            onChangeText={onChangePrice}
            keyboardType="decimal-pad"
          />
        </View>
      </View>
      <View className="mt-3 flex-row gap-2">
        <Button label="Add" onPress={onAdd} className="flex-1" />
        <Button label="Cancel" variant="ghost" onPress={onCancel} className="flex-1" />
      </View>
    </View>
  );
}
