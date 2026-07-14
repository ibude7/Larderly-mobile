import { memo, useCallback, useMemo, type ReactNode } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';
import { Text } from 'tamagui';
import SwipeableRow from '../ui/SwipeableRow';
import LoadingSpinner from '../ui/LoadingSpinner';
import type { PantryItem, StorageLocation } from '../../types';
import { locationNameFromId } from '../../lib/inventoryMapper';
import { useAppColors } from '../../hooks/useAppColors';
import { useScale } from '../../theme/scale';
import { settingsType } from '../settings/settingsFonts';
import PantryItemRow from './PantryItemRow';
import { PantryEmptyState } from './PantryEmptyState';
import { PantryInsightRail } from './PantryInsightRail';
import { getExpiryInfo } from './pantryExpiry';

type Section = { title: string; data: PantryItem[] };

interface PantryItemListProps {
  items: PantryItem[];
  locations: StorageLocation[];
  loading: boolean;
  canEdit: boolean;
  selecting: boolean;
  selectedIds: Set<string>;
  groupByLocation: boolean;
  emptyTitle: string;
  emptyDescription: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  emptySecondaryLabel?: string;
  onEmptySecondary?: () => void;
  emptyHints?: string[];
  lowCount: number;
  expiringCount: number;
  insightLowLabel: string;
  insightExpiringLabel: string;
  insightLowDetail: string;
  insightExpiringDetail: string;
  onInsightLow: () => void;
  onInsightExpiring: () => void;
  resolveExpiryLabel: (item: PantryItem) => string;
  lowLabel: string;
  onPressItem: (item: PantryItem) => void;
  onLongPressItem: (item: PantryItem) => void;
  onIncrement: (item: PantryItem) => void;
  onDecrement: (item: PantryItem) => void;
  onConsume: (item: PantryItem) => void;
  onDelete: (item: PantryItem) => void;
  consumeLabel: string;
  deleteLabel: string;
  listHeader?: ReactNode;
}

function PantryItemList({
  items,
  locations,
  loading,
  canEdit,
  selecting,
  selectedIds,
  groupByLocation,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  emptySecondaryLabel,
  onEmptySecondary,
  emptyHints,
  lowCount,
  expiringCount,
  insightLowLabel,
  insightExpiringLabel,
  insightLowDetail,
  insightExpiringDetail,
  onInsightLow,
  onInsightExpiring,
  resolveExpiryLabel,
  lowLabel,
  onPressItem,
  onLongPressItem,
  onIncrement,
  onDecrement,
  onConsume,
  onDelete,
  consumeLabel,
  deleteLabel,
  listHeader,
}: PantryItemListProps) {
  const { s, fs } = useScale();
  const c = useAppColors();

  const sections = useMemo((): Section[] => {
    if (!groupByLocation) {
      return [{ title: '', data: items }];
    }
    const order = locations.map((l) => l.id);
    const map = new Map<string, PantryItem[]>();
    for (const item of items) {
      const key = item.location_id ?? 'unknown';
      const bucket = map.get(key) ?? [];
      bucket.push(item);
      map.set(key, bucket);
    }
    const sortedKeys = [...map.keys()].sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
    return sortedKeys.map((key) => ({
      title: locationNameFromId(key === 'unknown' ? null : key, locations),
      data: map.get(key) ?? [],
    }));
  }, [groupByLocation, items, locations]);

  const renderItem = useCallback(
    ({ item, index }: { item: PantryItem; index: number }) => {
      const row = (
        <PantryItemRow
          item={item}
          locations={locations}
          index={index}
          canEdit={canEdit}
          selected={selectedIds.has(item.id)}
          selecting={selecting}
          expiryLabel={resolveExpiryLabel(item)}
          lowLabel={lowLabel}
          onPress={() => onPressItem(item)}
          onLongPress={() => onLongPressItem(item)}
          onIncrement={() => onIncrement(item)}
          onDecrement={() => onDecrement(item)}
        />
      );

      if (!canEdit || selecting) {
        return <View style={{ marginBottom: s(10) }}>{row}</View>;
      }

      return (
        <View style={{ marginBottom: s(10) }}>
          <SwipeableRow
            leftAction={{
              label: consumeLabel,
              icon: 'minus',
              color: c.teal,
              onPress: () => onConsume(item),
            }}
            rightAction={{
              label: deleteLabel,
              icon: 'trash',
              color: c.danger,
              onPress: () => onDelete(item),
            }}
          >
            {row}
          </SwipeableRow>
        </View>
      );
    },
    [
      canEdit,
      c.danger,
      c.teal,
      consumeLabel,
      deleteLabel,
      locations,
      lowLabel,
      onConsume,
      onDecrement,
      onDelete,
      onIncrement,
      onLongPressItem,
      onPressItem,
      resolveExpiryLabel,
      s,
      selectedIds,
      selecting,
    ],
  );

  if (loading && items.length === 0) {
    return (
      <View style={styles.centered}>
        <LoadingSpinner size="lg" />
      </View>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <PantryEmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={canEdit ? emptyActionLabel : undefined}
        onAction={canEdit ? onEmptyAction : undefined}
        secondaryLabel={canEdit ? emptySecondaryLabel : undefined}
        onSecondary={canEdit ? onEmptySecondary : undefined}
        hints={emptyHints}
      />
    );
  }

  const header = (
    <View>
      {listHeader}
      <PantryInsightRail
        lowCount={lowCount}
        expiringCount={expiringCount}
        lowLabel={insightLowLabel}
        expiringLabel={insightExpiringLabel}
        lowDetail={insightLowDetail}
        expiringDetail={insightExpiringDetail}
        onPressLow={onInsightLow}
        onPressExpiring={onInsightExpiring}
      />
    </View>
  );

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={header}
      renderSectionHeader={({ section }) =>
        groupByLocation && section.title ? (
          <Text
            style={[
              settingsType('semibold'),
              {
                fontSize: fs(12),
                letterSpacing: 0.6,
                textTransform: 'uppercase',
                color: c.muted,
                marginBottom: s(8),
                marginTop: s(4),
              },
            ]}
          >
            {section.title}
          </Text>
        ) : null
      }
      contentContainerStyle={{
        paddingHorizontal: s(16),
        paddingTop: s(4),
        paddingBottom: s(24),
      }}
      showsVerticalScrollIndicator={false}
      testID="pantry-item-list"
      extraData={{ selecting, selectedIds, locations }}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default memo(PantryItemList);

export { getExpiryInfo };
