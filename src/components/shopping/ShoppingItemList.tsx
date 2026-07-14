import { memo, useCallback, useMemo, type ReactNode } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';
import { Text } from 'tamagui';
import SwipeableRow from '../ui/SwipeableRow';
import LoadingSpinner from '../ui/LoadingSpinner';
import type { ShoppingListItem } from '../../types';
import { useAppColors } from '../../hooks/useAppColors';
import { useScale } from '../../theme/scale';
import { settingsType } from '../settings/settingsFonts';
import ShoppingItemRow from './ShoppingItemRow';
import { ShoppingEmptyState } from './ShoppingEmptyState';

type Section = { title: string; data: ShoppingListItem[] };

interface ShoppingItemListProps {
  items: ShoppingListItem[];
  loading: boolean;
  canEdit: boolean;
  emptyTitle: string;
  emptyDescription: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  emptySecondaryLabel?: string;
  onEmptySecondary?: () => void;
  toBuyLabel: string;
  doneLabel: string;
  autoLabel: string;
  deleteLabel: string;
  onToggle: (item: ShoppingListItem) => void;
  onPressItem: (item: ShoppingListItem) => void;
  onDelete: (item: ShoppingListItem) => void;
  listHeader?: ReactNode;
}

function ShoppingItemList({
  items,
  loading,
  canEdit,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  emptySecondaryLabel,
  onEmptySecondary,
  toBuyLabel,
  doneLabel,
  autoLabel,
  deleteLabel,
  onToggle,
  onPressItem,
  onDelete,
  listHeader,
}: ShoppingItemListProps) {
  const { s, fs } = useScale();
  const c = useAppColors();

  const sections = useMemo((): Section[] => {
    const open = items.filter((i) => !i.is_checked);
    const done = items.filter((i) => i.is_checked);
    const out: Section[] = [];
    if (open.length) out.push({ title: toBuyLabel, data: open });
    if (done.length) out.push({ title: doneLabel, data: done });
    return out;
  }, [items, toBuyLabel, doneLabel]);

  const renderItem = useCallback(
    ({ item, index }: { item: ShoppingListItem; index: number }) => {
      const row = (
        <ShoppingItemRow
          item={item}
          index={index}
          canEdit={canEdit}
          autoLabel={autoLabel}
          onToggle={() => onToggle(item)}
          onPress={() => onPressItem(item)}
        />
      );

      if (!canEdit) {
        return <View style={{ marginBottom: s(10) }}>{row}</View>;
      }

      return (
        <View style={{ marginBottom: s(10) }}>
          <SwipeableRow
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
    [autoLabel, c.danger, canEdit, deleteLabel, onDelete, onPressItem, onToggle, s],
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
      <ShoppingEmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={canEdit ? emptyActionLabel : undefined}
        onAction={canEdit ? onEmptyAction : undefined}
        secondaryLabel={canEdit ? emptySecondaryLabel : undefined}
        onSecondary={canEdit ? onEmptySecondary : undefined}
      />
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={listHeader ? <>{listHeader}</> : null}
      renderSectionHeader={({ section }) => (
        <Text
          style={[
            settingsType('semibold'),
            {
              fontSize: fs(12),
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              color: c.muted,
              marginBottom: s(8),
              marginTop: s(6),
            },
          ]}
        >
          {section.title}
          {' · '}
          {section.data.length}
        </Text>
      )}
      contentContainerStyle={{
        paddingHorizontal: s(16),
        paddingTop: s(4),
        paddingBottom: s(24),
      }}
      showsVerticalScrollIndicator={false}
      testID="shopping-item-list"
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default memo(ShoppingItemList);
