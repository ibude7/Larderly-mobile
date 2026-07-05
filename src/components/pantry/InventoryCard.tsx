import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '../ui/Icon';
import { getCategoryIcon } from '../../lib/appIcons';
import { locationNameFromId } from '../../lib/inventoryMapper';
import { getDaysUntilDate } from '../../lib/date';
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
  
  const days = getDaysUntilDate(item.expiry_date);
  let badge = null;
  if (days !== null) {
    if (days < 0) {
      badge = <View style={[styles.badge, { backgroundColor: c.danger }]}><Text style={[styles.badgeText, { color: '#fff' }]}>EXPIRED</Text></View>;
    } else if (days <= 2) {
      badge = <View style={[styles.badge, { backgroundColor: c.warning }]}><Text style={[styles.badgeText, { color: '#000' }]}>{days}d</Text></View>;
    } else if (days <= 7) {
      badge = <View style={[styles.badge, { backgroundColor: c.warning + '33' }]}><Text style={[styles.badgeText, { color: c.warning }]}>{days}d</Text></View>;
    }
  }

  const isOut = item.quantity === 0;
  const isLow = item.quantity > 0 && item.quantity <= item.low_stock_threshold;
  const statusColor = isOut ? c.danger : isLow ? c.warning : c.success;
  const statusText = isOut ? 'Out' : isLow ? 'Low' : 'In stock';

  const cardBorderColor = selected ? c.primary : c.line;
  const cardBorderWidth = selected ? 2 : 1;

  if (listMode) {
    return (
      <Pressable 
        onPress={onPress}
        onLongPress={onToggleSelect}
        style={({ pressed }) => [
          styles.listCard, 
          { backgroundColor: c.surface, borderColor: cardBorderColor, borderWidth: cardBorderWidth },
          pressed && { opacity: 0.92 }
        ]}
      >
        <View style={styles.listImageArea}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.listImage} placeholder={{ blurhash: IMAGE_BLURHASH }} contentFit="cover" />
          ) : (
            <LinearGradient colors={[c.primaryGlow || 'rgba(232,122,61,0.2)', 'transparent']} style={styles.listImage}>
              <Icon name={getCategoryIcon(item.category)} size={24} color={c.muted} />
            </LinearGradient>
          )}
          {selectMode && (
            <View style={[styles.selectOverlayList, { backgroundColor: selected ? c.primary : 'rgba(255,255,255,0.8)' }]}>
              {selected && <Icon name="check" size={12} color="#fff" />}
            </View>
          )}
        </View>
        <View style={styles.listBody}>
          <View style={{ flex: 1, paddingVertical: 2 }}>
            <Text style={[styles.name, { color: c.ink }]} numberOfLines={1}>{item.name}</Text>
            <Text style={[styles.qty, { color: c.muted }]} numberOfLines={1}>{item.quantity} {item.unit} • {item.brand || locName}</Text>
            <View style={[styles.statusWrap, { marginTop: 'auto' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end', justifyContent: 'space-between', paddingVertical: 2 }}>
            {badge}
            <Pressable onPress={onAddStock} hitSlop={8} style={[styles.addBtn, { backgroundColor: c.primary + '26', marginTop: badge ? 'auto' : 0 }]}>
              <Icon name="plus" size={16} color={c.primary} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onToggleSelect}
      style={({ pressed }) => [
        styles.card, 
        { backgroundColor: c.surface, borderColor: cardBorderColor, borderWidth: cardBorderWidth },
        pressed && { opacity: 0.92 }
      ]}
    >
      {/* Top Image Area */}
      <View style={styles.imageArea}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.image} placeholder={{ blurhash: IMAGE_BLURHASH }} contentFit="cover" />
        ) : (
          <LinearGradient colors={[c.primaryGlow || 'rgba(232,122,61,0.2)', 'transparent']} style={styles.imagePlaceholder}>
            <Icon name={getCategoryIcon(item.category)} size={32} color={c.muted} />
          </LinearGradient>
        )}
        {badge}
        {selectMode && (
          <View style={[styles.selectOverlay, { backgroundColor: selected ? c.primary : 'rgba(255,255,255,0.9)' }]}>
            {selected && <Icon name="check" size={16} color="#fff" />}
          </View>
        )}
      </View>

      {/* Body Area */}
      <View style={styles.body}>
        <Text style={[styles.name, { color: c.ink }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.qty, { color: c.muted }]} numberOfLines={1}>{item.quantity} {item.unit}</Text>
        <Text style={[styles.brand, { color: c.subtle }]} numberOfLines={1}>{item.brand || locName}</Text>
      </View>

      {/* Bottom Row */}
      <View style={[styles.bottomRow, { borderTopColor: c.line + '66' }]}>
        <View style={styles.statusWrap}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
        </View>
        <Pressable onPress={onAddStock} hitSlop={12} style={[styles.addBtn, { backgroundColor: c.primary + '26' }]}>
          <Icon name="plus" size={16} color={c.primary} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    height: 164,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    flex: 1,
  },
  listCard: {
    borderRadius: 16,
    height: 76,
    overflow: 'hidden',
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  imageArea: {
    height: 76,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  selectOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectOverlayList: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  body: {
    paddingTop: 8,
    paddingHorizontal: 10,
    paddingBottom: 6,
    flex: 1,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  qty: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  brand: {
    fontSize: 10,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  statusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listImageArea: {
    width: 56,
    height: 56,
    borderRadius: 12,
    position: 'relative',
    marginRight: 12,
  },
  listImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listBody: {
    flex: 1,
    flexDirection: 'row',
  },
});

export default React.memo(InventoryCard);

export const INVENTORY_LIST_ROW_HEIGHT = 88; // 76 height + 12 margin
