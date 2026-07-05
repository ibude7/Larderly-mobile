import React from 'react';
import { ShoppingListItem } from '../../types';
import SwipeableShoppingRow from './SwipeableShoppingRow';

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
  return (
    <SwipeableShoppingRow
      item={item}
      canEdit={canEdit}
      shopMode={false}
      onToggle={onToggle}
      onDelete={onDelete}
    />
  );
}
