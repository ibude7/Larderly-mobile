import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Icon } from '../ui/Icon';
import { getCategoryIcon } from '../../lib/appIcons';
import { locationNameFromId } from '../../lib/inventoryMapper';
import { PantryItem, StorageLocation } from '../../types';
import { useAppColors } from '../../hooks/useAppColors';
import { getDaysUntilDate } from '../../lib/date';
import { IMAGE_BLURHASH } from '../../shared/constants';

export interface InventoryCardProps {
  item: PantryItem;
  locations: StorageLocation[];
  listMode?: boolean;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  onAddStock: () => void;
  onPress: () => void;
}

function InventoryCard({
  item,
  locations,
  listMode,
  selected,
  onToggleSelect,
  onAddStock,
  onPress,
}: InventoryCardProps) {
  const c = useAppColors();
  const days = getDaysUntilDate(item.expiry_date);

  let accentColor: string = c.line;
  let expiryText = '';
  let expiryBadgeBg = 'bg-line/20 dark:bg-line/10';
  let expiryTextColor = 'text-muted dark:text-[#6B6878]';

  if (days !== null) {
    if (days < 0) {
      accentColor = c.danger;
      expiryText = 'Expired';
      expiryBadgeBg = 'bg-danger/10';
      expiryTextColor = 'text-danger';
    } else if (days <= 2) {
      accentColor = `${c.danger}99`; // 60% opacity
      expiryText = days === 0 ? 'Expires today' : days === 1 ? 'Expires tomorrow' : `Expires in ${days} days`;
      expiryBadgeBg = 'bg-danger/10';
      expiryTextColor = 'text-danger';
    } else if (days <= 7) {
      accentColor = c.warning;
      expiryText = `Expires in ${days} days`;
      expiryBadgeBg = 'bg-warning/10';
      expiryTextColor = 'text-warning';
    } else {
      accentColor = c.success;
      expiryText = `Expires in ${days} days`;
      expiryBadgeBg = 'bg-success/10';
      expiryTextColor = 'text-success';
    }
  }

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onToggleSelect}
      style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1, flex: listMode ? undefined : 1 }]}
      className={`rounded-card border bg-surface dark:bg-[#1A1A22] p-4 ${selected ? 'border-primary' : 'border-line dark:border-[#2A2A35]'} ${listMode ? 'mx-5 mb-3' : ''} overflow-hidden`}
    >
      {/* Expiry Urgency Left Accent Bar */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          backgroundColor: accentColor,
        }}
      />

      {/* Top Section: Name (Large and bold) + Image/Icon */}
      <View className="flex-row justify-between items-start gap-2 pl-1">
        <View className="flex-1">
          <Text numberOfLines={2} className="text-base font-extrabold text-ink dark:text-[#F0EEE9] leading-tight">
            {item.name}
          </Text>
          {item.brand ? (
            <Text numberOfLines={1} className="text-xs font-semibold text-muted dark:text-[#6B6878] mt-0.5">
              {item.brand}
            </Text>
          ) : null}
        </View>

        {/* Product Image or Icon */}
        <View className="h-12 w-12 items-center justify-center rounded-lg bg-canvas dark:bg-[#0F0F13] overflow-hidden">
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={{ width: '100%', height: '100%' }}
              placeholder={{ blurhash: IMAGE_BLURHASH }}
              contentFit="contain"
            />
          ) : (
            <Icon name={getCategoryIcon(item.category)} size={22} color={c.muted} />
          )}
        </View>
      </View>

      {/* Middle Section: Expiry Badge Pill */}
      <View className="mt-3 flex-row pl-1">
        {expiryText ? (
          <View className={`rounded-full px-2.5 py-0.5 ${expiryBadgeBg}`}>
            <Text className={`text-[10px] font-bold uppercase tracking-wider ${expiryTextColor}`}>
              {expiryText}
            </Text>
          </View>
        ) : (
          <View className="rounded-full px-2.5 py-0.5 bg-line/20 dark:bg-line/10">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-muted dark:text-[#6B6878]">
              No expiry
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Section: Qty Pill (bottom-left) + Add Stock (bottom-right) */}
      <View className="mt-4 flex-row items-center justify-between border-t border-canvas dark:border-[#2A2A35] pt-3 pl-1">
        {/* Quantity Badge Pill */}
        <View className="rounded-full px-2.5 py-0.5 bg-primary/10">
          <Text className="text-[11px] font-bold text-primary">
            {item.quantity} {item.unit}
          </Text>
        </View>

        {/* Add Stock Action */}
        <Pressable onPress={onAddStock} hitSlop={8} className="flex-row items-center gap-1.5">
          <View className="h-5 w-5 rounded-full bg-primary/10 items-center justify-center">
            <Icon name="plus" size={10} color={c.primary} />
          </View>
          <Text className="text-xs font-bold text-primary">Add Stock</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

export default React.memo(InventoryCard, (prevProps, nextProps) => {
  return (
    prevProps.item.quantity === nextProps.item.quantity &&
    prevProps.item.expiry_date === nextProps.item.expiry_date &&
    prevProps.item.name === nextProps.item.name &&
    prevProps.item.image_url === nextProps.item.image_url &&
    prevProps.selected === nextProps.selected
  );
});

/** List row height (card + bottom margin) for FlatList getItemLayout. */
export const INVENTORY_LIST_ROW_HEIGHT = 204;
