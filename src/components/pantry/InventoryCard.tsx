import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
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
  const cardHeight = listMode ? 148 : 220;
  const imageSize = listMode ? 72 : 96;

  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      onLongPress={onToggleSelect}
      style={({ pressed }) => [
        styles.card,
        {
          opacity: pressed ? 0.92 : 1,
          flex: listMode ? undefined : 1,
          minHeight: cardHeight,
          backgroundColor: c.surfaceGlass,
          borderColor: selected ? c.primary : c.glassLine,
          shadowColor: c.shadow,
        },
        listMode ? styles.listCard : undefined,
      ]}
    >
      <LinearGradient
        pointerEvents="none"
        colors={[`${c.primary}12`, 'rgba(255,255,255,0.06)', 'transparent']}
        locations={[0, 0.48, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.accent, { backgroundColor: accentColor }]} />

      <View style={[styles.visual, { width: imageSize, height: imageSize, borderRadius: listMode ? 22 : 30, backgroundColor: `${c.surface}AA` }]}>
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={{ width: '82%', height: '82%' }}
            placeholder={{ blurhash: IMAGE_BLURHASH }}
            contentFit="contain"
            cachePolicy="memory-disk"
            recyclingKey={item.id}
          />
        ) : (
          <Icon name={getCategoryIcon(item.category)} size={listMode ? 30 : 42} color={c.primary} />
        )}
      </View>

      <View style={styles.copy}>
        <Text numberOfLines={2} style={[styles.name, { color: c.ink }]}>
          {item.name}
        </Text>
        <Text numberOfLines={1} style={[styles.meta, { color: c.muted }]}>
          {item.brand || item.category}
        </Text>
      </View>

      <View style={styles.badgeRow}>
        <Badge label={stockBadge.label} variant={stockBadge.variant} />
        {days !== null ? (
          <View
            style={[
              styles.expiryPill,
              {
                backgroundColor:
                  days < 0 ? c.danger : days <= 3 ? `${c.danger}1A` : days <= 7 ? `${c.amber}2E` : `${c.teal}1F`,
              },
            ]}
          >
            <Text style={[styles.expiryText, { color: days < 0 ? '#FFFFFF' : days <= 3 ? c.danger : days <= 7 ? '#7A5B00' : c.success }]}>
              {days < 0 ? 'Expired' : days === 0 ? 'Today' : `${days}d`}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.footer, { borderTopColor: `${c.line}66` }]}>
        <View style={[styles.quantityPill, { backgroundColor: `${c.primary}14` }]}>
          <Text style={[styles.quantityText, { color: c.primary }]}>
            {item.quantity} {item.unit}
          </Text>
        </View>

        <Pressable
          onPress={() => {
            haptics.tap();
            onAddStock();
          }}
          hitSlop={8}
          style={[styles.addButton, { backgroundColor: c.primary }]}
        >
          <Icon name="plus" size={13} color="#FFFFFF" />
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

const styles = StyleSheet.create({
  accent: {
    borderRadius: 999,
    height: 34,
    position: 'absolute',
    right: 12,
    top: 12,
    width: 4,
  },
  addButton: {
    alignItems: 'center',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    width: 32,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'space-between',
    overflow: 'hidden',
    padding: 14,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
  },
  copy: {
    marginTop: 12,
  },
  expiryPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  expiryText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 10,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  footer: {
    alignItems: 'center',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
  },
  listCard: {
    marginBottom: 12,
    marginHorizontal: 20,
  },
  meta: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  name: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 16,
    lineHeight: 19,
  },
  quantityPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  quantityText: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 12,
  },
  visual: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
});
