import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { XStack } from 'tamagui';
import {
  PantryAddEditSheet,
  PantryBulkActionBar,
  PantryFilterChips,
  PantryItemList,
  PantryScreenShell,
  PantrySearchBar,
  SettingsChromeButton,
  comparePantryUrgency,
  draftFromVoice,
  filterPantryByQuery,
  getExpiryInfo,
  type PantryDraft,
  type PantryStatusFilter,
} from '../components/pantry';
import VoiceInputButton from '../components/ui/VoiceInputButton';
import { CheckCheck, Plus, Search, X } from '../components/ui/Glyph';
import { useInventory } from '../contexts/InventoryContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { useToast } from '../contexts/ToastContext';
import { useI18n } from '../i18n';
import { parsePantryVoiceCommand } from '../lib/voiceCommands';
import { defaultStorageLocations } from '../lib/inventoryMapper';
import { useAuth } from '../contexts/AuthContext';
import type { PantryItem } from '../types';
import type { TabParamList } from '../navigation/types';
import type { RouteProp } from '@react-navigation/native';
import { useScale } from '../theme/scale';

export default function PantryScreen() {
  const { t } = useI18n();
  const { s } = useScale();
  const { user } = useAuth();
  const confirm = useConfirm();
  const { showToast } = useToast();
  const route = useRoute<RouteProp<TabParamList, 'Pantry'>>();
  const {
    items,
    locations: rawLocations,
    loading,
    canEdit,
    lowStockItems,
    expiringSoonItems,
    addItem,
    updateItem,
    deleteItem,
    consumeItem,
  } = useInventory();

  const locations = useMemo(() => {
    if (rawLocations.length) return rawLocations;
    return defaultStorageLocations(user?.uid ?? 'local');
  }, [rawLocations, user?.uid]);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<PantryStatusFilter>('all');
  const [locationId, setLocationId] = useState<string | 'all'>('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<PantryItem | null>(null);
  const [voiceDraft, setVoiceDraft] = useState<PantryDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [voiceOpen, setVoiceOpen] = useState(false);

  const openAdd = useCallback(() => {
    setEditing(null);
    setVoiceDraft(null);
    setSheetOpen(true);
  }, []);

  const openEdit = useCallback((item: PantryItem) => {
    setEditing(item);
    setVoiceDraft(null);
    setSheetOpen(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      const params = route.params;
      if (!params) return;
      if (params.openAdd && canEdit) {
        openAdd();
      }
      if (params.filterExpiration === 'low') {
        setStatus('low');
      } else if (params.filterExpiration) {
        setStatus('expiring');
      }
    }, [route.params, canEdit, openAdd]),
  );

  const filtered = useMemo(() => {
    let list = items;
    if (status === 'low') {
      const ids = new Set(lowStockItems.map((i) => i.id));
      list = list.filter((i) => ids.has(i.id));
    } else if (status === 'expiring') {
      const ids = new Set(expiringSoonItems.map((i) => i.id));
      list = list.filter((i) => ids.has(i.id));
    }
    if (locationId !== 'all') {
      list = list.filter((i) => i.location_id === locationId);
    }
    list = filterPantryByQuery(list, locations, query);
    return [...list].sort(comparePantryUrgency);
  }, [items, status, locationId, query, lowStockItems, expiringSoonItems, locations]);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setQuery('');
  }, []);

  const openSearch = useCallback(() => {
    setSearchOpen(true);
  }, []);

  const resolveExpiryLabel = useCallback(
    (item: PantryItem) => {
      const info = getExpiryInfo(item.expiry_date);
      if (info.labelKey === 'pantry.expiry.days') {
        return t(info.labelKey, { days: info.daysForLabel });
      }
      if (info.labelKey === 'pantry.expiry.expired') {
        return t(info.labelKey);
      }
      return t(info.labelKey);
    },
    [t],
  );

  const exitSelect = useCallback(() => {
    setSelecting(false);
    setSelectedIds(new Set());
  }, []);

  const toggleSelect = useCallback((item: PantryItem) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
  }, []);

  const onPressItem = useCallback(
    (item: PantryItem) => {
      if (selecting) {
        toggleSelect(item);
        return;
      }
      if (canEdit) openEdit(item);
    },
    [selecting, toggleSelect, canEdit, openEdit],
  );

  const onLongPressItem = useCallback(
    (item: PantryItem) => {
      if (!canEdit) return;
      setSelecting(true);
      setSelectedIds(new Set([item.id]));
    },
    [canEdit],
  );

  const bumpQty = useCallback(
    async (item: PantryItem, delta: number) => {
      const next = Math.max(0, item.quantity + delta);
      const { error } = await updateItem(item.id, { quantity: next });
      if (error) showToast(t('pantry.error.update'), 'error');
    },
    [updateItem, showToast, t],
  );

  const handleConsume = useCallback(
    async (item: PantryItem) => {
      const { error } = await consumeItem(item.id, 1);
      if (error) showToast(t('pantry.error.update'), 'error');
    },
    [consumeItem, showToast, t],
  );

  const handleDelete = useCallback(
    async (item: PantryItem) => {
      const ok = await confirm({
        title: t('pantry.delete.title'),
        message: t('pantry.delete.message', { name: item.name }),
        confirmLabel: t('pantry.delete.confirm'),
        cancelLabel: t('common.cancel'),
        destructive: true,
      });
      if (!ok) return;
      const { error } = await deleteItem(item.id);
      if (error) showToast(t('pantry.error.delete'), 'error');
    },
    [confirm, deleteItem, showToast, t],
  );

  const handleBulkConsume = useCallback(async () => {
    const ids = [...selectedIds];
    for (const id of ids) {
      await consumeItem(id, 1);
    }
    exitSelect();
  }, [selectedIds, consumeItem, exitSelect]);

  const handleBulkDelete = useCallback(async () => {
    const ok = await confirm({
      title: t('pantry.bulk.deleteTitle'),
      message: t('pantry.bulk.deleteMessage', { count: selectedIds.size }),
      confirmLabel: t('pantry.delete.confirm'),
      cancelLabel: t('common.cancel'),
      destructive: true,
    });
    if (!ok) return;
    for (const id of selectedIds) {
      await deleteItem(id);
    }
    exitSelect();
  }, [confirm, selectedIds, deleteItem, exitSelect, t]);

  const handleSave = useCallback(
    async (draft: PantryDraft, editingId: string | null) => {
      const name = draft.name.trim();
      if (!name) return;
      const quantity = Math.max(0, parseFloat(draft.quantity) || 0);
      const low = Math.max(0, parseFloat(draft.low_stock_threshold) || 0);
      setSaving(true);
      try {
        if (editingId) {
          const { error } = await updateItem(editingId, {
            name,
            quantity,
            unit: draft.unit,
            location_id: draft.locationId,
            category: draft.category,
            expiry_date: draft.expiry_date,
            low_stock_threshold: low,
          });
          if (error) {
            showToast(t('pantry.error.update'), 'error');
            return;
          }
        } else {
          const { error } = await addItem({
            product_id: null,
            location_id: draft.locationId,
            name,
            brand: '',
            image_url: '',
            category: draft.category,
            barcode: '',
            quantity,
            unit: draft.unit,
            expiry_date: draft.expiry_date,
            low_stock_threshold: low,
            purchase_price: null,
            notes: '',
          });
          if (error) {
            showToast(t('pantry.error.add'), 'error');
            return;
          }
        }
        setSheetOpen(false);
        setEditing(null);
        setVoiceDraft(null);
      } finally {
        setSaving(false);
      }
    },
    [addItem, updateItem, showToast, t],
  );

  const handleVoice = useCallback(
    async (transcript: string) => {
      try {
        const parsed = await parsePantryVoiceCommand(transcript);
        setEditing(null);
        setVoiceDraft(draftFromVoice(parsed, locations));
        setSheetOpen(true);
      } catch {
        showToast(t('pantry.error.voice'), 'error');
      }
    },
    [locations, showToast, t],
  );

  const rightSlot = selecting ? (
    <SettingsChromeButton icon={X} onPress={exitSelect} accessibilityLabel={t('common.done')} />
  ) : (
    <XStack style={{ gap: s(8), alignItems: 'center' }}>
      {canEdit && items.length > 0 ? (
        <VoiceInputButton
          variant="chrome"
          label={t('pantry.voice')}
          accessibilityLabel={t('pantry.voice')}
          onTranscript={handleVoice}
        />
      ) : null}
      <SettingsChromeButton
        icon={Search}
        onPress={searchOpen ? closeSearch : openSearch}
        accessibilityLabel={t('pantry.search')}
      />
      {canEdit ? (
        <SettingsChromeButton
          icon={Plus}
          onPress={openAdd}
          accessibilityLabel={t('pantry.add')}
        />
      ) : null}
    </XStack>
  );

  const leftSlot =
    canEdit && items.length > 0 ? (
      <SettingsChromeButton
        icon={CheckCheck}
        onPress={() => {
          if (selecting) exitSelect();
          else setSelecting(true);
        }}
        accessibilityLabel={t('pantry.bulk.select')}
      />
    ) : undefined;

  const itemCountLabel = searchOpen
    ? query.trim()
      ? t('pantry.search.results', { count: filtered.length })
      : t('pantry.search.hint')
    : items.length === 0
      ? t('pantry.subtitle.empty')
      : t('pantry.subtitle.count', { count: items.length });

  return (
    <>
      <PantryScreenShell
        title={t('pantry.title')}
        subtitle={itemCountLabel}
        leftSlot={leftSlot}
        rightSlot={rightSlot}
        searchSlot={
          searchOpen ? (
            <PantrySearchBar
              value={query}
              onChangeText={setQuery}
              onCancel={closeSearch}
              placeholder={t('pantry.searchPlaceholder')}
              cancelLabel={t('common.cancel')}
            />
          ) : null
        }
        filterSlot={
          items.length > 0 ? (
            <PantryFilterChips
              locations={locations}
              status={status}
              locationId={locationId}
              lowCount={lowStockItems.length}
              expiringCount={expiringSoonItems.length}
              onStatusChange={setStatus}
              onLocationChange={setLocationId}
              labels={{
                all: t('pantry.filter.all'),
                low: t('pantry.filter.low'),
                expiring: t('pantry.filter.expiring'),
              }}
            />
          ) : null
        }
        footerSlot={
          selecting && selectedIds.size > 0 ? (
            <PantryBulkActionBar
              count={selectedIds.size}
              countLabel={t('pantry.bulk.count')}
              consumeLabel={t('pantry.bulk.consume')}
              deleteLabel={t('pantry.bulk.delete')}
              cancelLabel={t('common.cancel')}
              onConsume={() => void handleBulkConsume()}
              onDelete={() => void handleBulkDelete()}
              onCancel={exitSelect}
            />
          ) : null
        }
      >
        <PantryItemList
          items={filtered}
          locations={locations}
          loading={loading}
          canEdit={canEdit}
          selecting={selecting}
          selectedIds={selectedIds}
          groupByLocation={status === 'all' && locationId === 'all' && !query.trim()}
          emptyTitle={
            query.trim() ? t('pantry.search.emptyTitle') : t('pantry.empty.title')
          }
          emptyDescription={
            query.trim()
              ? t('pantry.search.emptyDescription', { query: query.trim() })
              : status !== 'all' || locationId !== 'all'
                ? t('pantry.empty.filtered')
                : t('pantry.empty.description')
          }
          emptyActionLabel={
            query.trim() ? t('pantry.search.clear') : canEdit ? t('pantry.add') : undefined
          }
          onEmptyAction={query.trim() ? () => setQuery('') : openAdd}
          emptySecondaryLabel={t('pantry.empty.voice')}
          onEmptySecondary={() => setVoiceOpen(true)}
          emptyHints={locations.slice(0, 4).map((l) => l.name)}
          lowCount={lowStockItems.length}
          expiringCount={expiringSoonItems.length}
          insightLowLabel={t('pantry.insight.low')}
          insightExpiringLabel={t('pantry.insight.expiring')}
          insightLowDetail={t('pantry.insight.lowDetail', { count: lowStockItems.length })}
          insightExpiringDetail={t('pantry.insight.expiringDetail', {
            count: expiringSoonItems.length,
          })}
          onInsightLow={() => setStatus('low')}
          onInsightExpiring={() => setStatus('expiring')}
          resolveExpiryLabel={resolveExpiryLabel}
          lowLabel={t('pantry.badge.low')}
          onPressItem={onPressItem}
          onLongPressItem={onLongPressItem}
          onIncrement={(item) => void bumpQty(item, 1)}
          onDecrement={(item) => void bumpQty(item, -1)}
          onConsume={(item) => void handleConsume(item)}
          onDelete={(item) => void handleDelete(item)}
          consumeLabel={t('pantry.consume')}
          deleteLabel={t('pantry.delete.confirm')}
        />
      </PantryScreenShell>

      {canEdit ? (
        <VoiceInputButton
          variant="none"
          open={voiceOpen}
          onOpenChange={setVoiceOpen}
          onTranscript={handleVoice}
          label={t('pantry.voice')}
        />
      ) : null}

      <PantryAddEditSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setEditing(null);
          setVoiceDraft(null);
        }}
        locations={locations}
        editing={editing}
        initialDraft={voiceDraft}
        saving={saving}
        titleAdd={t('pantry.sheet.add')}
        titleEdit={t('pantry.sheet.edit')}
        labels={{
          name: t('pantry.field.name'),
          quantity: t('pantry.field.quantity'),
          unit: t('pantry.field.unit'),
          location: t('pantry.field.location'),
          category: t('pantry.field.category'),
          expiry: t('pantry.field.expiry'),
          lowStock: t('pantry.field.lowStock'),
          save: t('common.save'),
          cancel: t('common.cancel'),
          expiryNone: t('pantry.expiry.none'),
          expiryWeek: t('pantry.sheet.expiryWeek'),
          expiryMonth: t('pantry.sheet.expiryMonth'),
        }}
        onSave={handleSave}
      />
    </>
  );
}
