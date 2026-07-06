import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ShoppingListItem } from '../../types';
import { CATEGORIES } from '../../lib/categories';
import { Icon } from '../ui/Icon';
import SwipeableRow from '../ui/SwipeableRow';
import { useAppColors } from '../../hooks/useAppColors';
import { useHaptics } from '../../hooks/useHaptics';

interface ShoppingItemRowProps {
  item: ShoppingListItem;
  canEdit: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ShoppingItemRow({
  item,
  canEdit,
  onToggle,
  onDelete,
}: ShoppingItemRowProps) {
  const c = useAppColors();
  const haptics = useHaptics();
  const catColor = CATEGORIES.find((cat) => cat.id === item.category)?.color || c.muted;
  const row = (
    <Pressable
      onPress={() => {
        haptics.tap();
        onToggle(item.id);
      }}
      className="mb-2"
    >
      <View className="flex-row items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: catColor,
          }}
        />

        <Icon
          name={item.is_checked ? 'success' : 'cart'}
          size={20}
          color={item.is_checked ? c.success : c.primary}
        />

        <View className="flex-1">
          <Text className={`font-semibold ${item.is_checked ? 'text-muted line-through' : 'text-ink'}`}>
            {item.name}
          </Text>
          <Text className="text-xs text-muted">
            {item.quantity} {item.unit}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  if (!canEdit) return row;

  return (
    <SwipeableRow
      leftAction={{
        label: '✓ Got it',
        icon: 'check',
        color: c.success,
        onPress: () => onToggle(item.id),
      }}
      rightAction={{
        label: 'Delete',
        icon: 'trash',
        color: c.danger,
        onPress: () => onDelete(item.id),
      }}
    >
      {row}
    </SwipeableRow>
  );
}
