import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Icon } from '../ui/Icon';
import { getCategoryIcon } from '../../lib/appIcons';
import { locationNameFromId } from '../../lib/inventoryMapper';
import { PantryItem, StorageLocation } from '../../types';
import { useAppColors } from '../../hooks/useAppColors';

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
  selectMode,
  selected,
  onToggleSelect,
  onAddStock,
  onPress,
}: InventoryCardProps) {
  const c = useAppColors();
  const locName = locationNameFromId(item.location_id, locations);
  const isOut = item.quantity === 0;
  const isLow = item.quantity <= item.low_stock_threshold;
  const statusText = isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'Full';
  const statusStyle = isOut ? 'bg-danger/10' : 'bg-primary/10';
  const statusText2 = isOut ? 'text-danger' : 'text-primary';

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onToggleSelect}
      style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1, flex: listMode ? undefined : 1 }]}
      className={`rounded-card border bg-surface dark:bg-[#1A1A22] p-4 ${selected ? 'border-primary' : 'border-line dark:border-[#2A2A35]'} ${listMode ? 'mx-5 mb-3' : ''}`}
    >
      <View className="min-h-[92px] flex-row justify-between">
        <View>
          <View className={`self-start rounded-md px-2 py-1 ${statusStyle}`}>
            <Text className={`text-[9px] font-bold uppercase tracking-wider ${statusText2}`}>
              {statusText}
            </Text>
          </View>
          <View className="mt-3 gap-1">
            <Text className="text-[9px] font-bold uppercase text-muted dark:text-[#6B6878]">
              QTY <Text className="text-ink dark:text-[#F0EEE9]">{item.quantity} {item.unit}</Text>
            </Text>
            <Text className="text-[9px] font-bold uppercase text-muted dark:text-[#6B6878]">
              PP <Text className="text-ink dark:text-[#F0EEE9]">${item.purchase_price?.toFixed(2) || '0.00'}</Text>
            </Text>
            <Text numberOfLines={1} className="text-[9px] font-bold uppercase text-muted dark:text-[#6B6878]">
              LOC <Text className="text-ink dark:text-[#F0EEE9]">{locName}</Text>
            </Text>
          </View>
        </View>
        <View className="h-14 w-14 items-center justify-center">
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={{ width: '100%', height: '100%' }}
              placeholder={{ blurhash: IMAGE_BLURHASH }}
              contentFit="contain"
            />
          ) : (
            <View className="h-12 w-12 items-center justify-center rounded-full bg-canvas dark:bg-[#0F0F13]">
              <Icon name={getCategoryIcon(item.category)} size={24} color={c.muted} />
            </View>
          )}
        </View>
      </View>

      <View className="mt-3">
        <Text numberOfLines={1} className="text-base font-bold text-ink dark:text-[#F0EEE9]">
          {item.name}
        </Text>
        <View className="mt-3 flex-row items-center justify-between border-t border-canvas pt-3">
          <Text numberOfLines={1} className="flex-1 text-[10px] font-semibold text-muted dark:text-[#6B6878]">
            #{item.barcode || item.id.substring(0, 8).toUpperCase()}
          </Text>
          <Pressable onPress={onAddStock} hitSlop={8} className="flex-row items-center gap-1">
            <Icon name="plus" size={12} color={c.primary} />
            <Text className="text-[10px] font-bold uppercase tracking-wider text-primary">Add Stock</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

export default React.memo(InventoryCard);

/** List row height (card + bottom margin) for FlatList getItemLayout. */
export const INVENTORY_LIST_ROW_HEIGHT = 204;
