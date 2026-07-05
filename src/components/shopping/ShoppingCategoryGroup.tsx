import React from 'react';
import { View, Text } from 'react-native';
import { ShoppingListItem } from '../../types';
import { CATEGORIES } from '../../lib/categories';
import ShoppingItemRow from './ShoppingItemRow';

interface ShoppingCategoryGroupProps {
  category: string;
  items: ShoppingListItem[];
  canEdit: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ShoppingCategoryGroup({
  category,
  items,
  canEdit,
  onToggle,
  onDelete,
}: ShoppingCategoryGroupProps) {
  const label = CATEGORIES.find((c) => c.id === category)?.name ?? category;

  return (
    <View className="mb-4">
      <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
        {label}
      </Text>
      {items.map((item) => (
        <ShoppingItemRow
          key={item.id}
          item={item}
          canEdit={canEdit}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </View>
  );
}
