import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Icon } from '../ui/Icon';
import { getCategoryIcon } from '../../lib/appIcons';
import { PantryItem } from '../../types';
import { getDaysUntilDate } from '../../lib/date';
import { IMAGE_BLURHASH } from '../../shared/constants';
import Badge from '../ui/Badge';
import { ColorTokens } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';

export interface InventoryCardProps {
  item: PantryItem;
  c: ColorTokens;
  listMode?: boolean;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  onAddStock: () => void;
  onPress: () => void;
}

function InventoryCard({
  item,
  c,
  listMode,
  selected,
  onToggleSelect,
  onAddStock,
  onPress,
}: InventoryCardProps) {
  const haptics = useHaptics();
  const days = getDaysUntilDate(item.expiry_date);

  let accentColor = 'transparent';

  if (days !== null) {
    if (days < 0) {
      accentColor = c.danger;
    } else if (days <= 2) {
      accentColor = `${c.danger}B3`;
    } else if (days <= 7) {
      accentColor = '#F59E0B';
    } else {
      accentColor = c.primary;
    }
  }

  const isOutOfStock = item.quantity <= 0;
  const isLowStock = !isOutOfStock && item.quantity <= item.low_stock_threshold;
  const stockBadge = isOutOfStock
    ? { label: 'Out of stock', variant: 'danger' as const }
    : isLowStock
      ? { label: 'Low stock', variant: 'warning' as const }
      : { label: 'In stock', variant: 'success' as const };

  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      onLongPress={onToggleSelect}
      style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1, flex: listMode ? undefined : 1 }]}
      className={`rounded-card border bg-surface dark:bg-surface-dark p-4 ${selected ? 'border-primary' : 'border-line dark:border-line-dark'} ${listMode ? 'mx-5 mb-3' : ''} overflow-hidden`}
    >
      {/* Expiry Urgency Left Accent Bar */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          borderRadius: 2,
          backgroundColor: accentColor,
        }}
      />

      {/* Top Section: Name (Large and bold) + Image/Icon */}
      <View className="flex-row justify-between items-start gap-2 pl-1">
        <View className="flex-1">
          <Text numberOfLines={2} className="text-base font-bold leading-tight text-ink dark:text-ink-dark">
            {item.name}
          </Text>
          {item.brand ? (
            <Text numberOfLines={1} className="text-xs font-semibold text-muted dark:text-muted-dark mt-0.5">
              {item.brand}
            </Text>
          ) : null}
        </View>

        {/* Product Image or Icon */}
        <View className="h-12 w-12 items-center justify-center rounded-lg bg-canvas dark:bg-canvas-dark overflow-hidden">
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={{ width: '100%', height: '100%' }}
              placeholder={{ blurhash: IMAGE_BLURHASH }}
              contentFit="contain"
              cachePolicy="memory-disk"
              recyclingKey={item.id}
            />
          ) : (
            <Icon name={getCategoryIcon(item.category)} size={22} color={c.muted} />
          )}
        </View>
      </View>

      <View className="mt-3 flex-row items-center gap-2 pl-1">
        <Badge label={stockBadge.label} variant={stockBadge.variant} />
        {days !== null ? (
          <View
            style={{
              backgroundColor:
                days < 0 ? c.danger : days <= 3 ? `${c.danger}1A` : days <= 7 ? `${c.amber}2E` : `${c.teal}1F`,
              borderRadius: 999,
              paddingHorizontal: 9,
              paddingVertical: 3,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontFamily: 'Outfit_700Bold',
                textTransform: 'uppercase',
                letterSpacing: 0.4,
                color: days < 0 ? '#FFFFFF' : days <= 3 ? c.danger : days <= 7 ? '#7A5B00' : c.success,
              }}
            >
              {days < 0 ? 'Expired' : days === 0 ? 'Today' : `${days}d left`}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Bottom Section: Qty Pill (bottom-left) + Add Stock (bottom-right) */}
      <View className="mt-4 flex-row items-center justify-between border-t border-canvas dark:border-line-dark pt-3 pl-1">
        <View className="rounded-full px-2.5 py-0.5 bg-primary/10">
          <Text className="text-xs font-bold text-primary">
            {item.quantity} {item.unit}
          </Text>
        </View>

        {/* Add Stock Action */}
        <Pressable
          onPress={() => {
            haptics.tap();
            onAddStock();
          }}
          hitSlop={8}
          className="flex-row items-center gap-1.5"
        >
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
    prevProps.selected === nextProps.selected &&
    prevProps.c === nextProps.c
  );
});

/** List row height (card + bottom margin) for FlatList getItemLayout. */
export const INVENTORY_LIST_ROW_HEIGHT = 204;
