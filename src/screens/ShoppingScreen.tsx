import { useCallback, useMemo, useState } from 'react';
import { XStack } from 'tamagui';
import {
  ShoppingAddSheet,
  ShoppingCheckoutBar,
  ShoppingItemList,
  ShoppingScreenShell,
  ShoppingSearchBar,
  ShoppingSmartRail,
  SettingsChromeButton,
  type ShoppingDraft,
} from '../components/shopping';
import VoiceInputButton from '../components/ui/VoiceInputButton';
import { Plus, Search, X } from '../components/ui/Glyph';
import { useShopping } from '../contexts/ShoppingContext';
import { useInventory } from '../contexts/InventoryContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { useToast } from '../contexts/ToastContext';
import { useI18n } from '../i18n';
import { parseShoppingVoiceCommand } from '../lib/voiceCommands';
import { defaultStorageLocations } from '../lib/inventoryMapper';
import { useAuth } from '../contexts/AuthContext';
import { categoryFromName } from '../lib/categories';
import type { PantryItem, ShoppingListItem } from '../types';
import { useScale } from '../theme/scale';
import { trackEvent } from '../lib/analytics';

export default function ShoppingScreen() {
  const { t } = useI18n();
  const { s } = useScale();
  const { user } = useAuth();
  const confirm = useConfirm();
  const { showToast } = useToast();
  const {
    shoppingList,
    loading,
    canEdit,
    listTotal,
    uncheckedItems,
    checkedItems,
    activeList,
    addShoppingItem,
    toggleShoppingItem,
    deleteShoppingItem,
    clearCheckedItems,
    checkoutToPantry,
    bulkAddItems,
  } = useShopping();
  const { lowStockItems, addItem, locations: rawLocations } = useInventory();

  const locations = useMemo(() => {
    if (rawLocations.length) return rawLocations;
    return defaultStorageLocations(user?.uid ?? 'local');
  }, [rawLocations, user?.uid]);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [voiceDraft, setVoiceDraft] = useState<ShoppingDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);

  const openAdd = useCallback(() => {
    setVoiceDraft(null);
    setSheetOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setQuery('');
  }, []);

  const onList = useMemo(
    () => shoppingList.filter((i) => !i.is_checked),
    [shoppingList],
  );
  const suggestions = useMemo(() => {
    const names = new Set(onList.map((i) => i.name.toLowerCase()));
    return lowStockItems.filter((p) => !names.has(p.name.toLowerCase()));
  }, [lowStockItems, onList]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return shoppingList;
    return shoppingList.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.brand.toLowerCase().includes(q),
    );
  }, [shoppingList, query]);

  const handleToggle = useCallback(
    async (item: ShoppingListItem) => {
      const { error } = await toggleShoppingItem(item.id);
      if (error) showToast(t('shopping.error.update'), 'error');
    },
    [toggleShoppingItem, showToast, t],
  );

  const handleDelete = useCallback(
    async (item: ShoppingListItem) => {
      const ok = await confirm({
        title: t('shopping.delete.title'),
        message: t('shopping.delete.message', { name: item.name }),
        confirmLabel: t('shopping.delete.confirm'),
        cancelLabel: t('common.cancel'),
        destructive: true,
      });
      if (!ok) return;
      const { error } = await deleteShoppingItem(item.id);
      if (error) showToast(t('shopping.error.delete'), 'error');
    },
    [confirm, deleteShoppingItem, showToast, t],
  );

  const handleSave = useCallback(
    async (draft: ShoppingDraft) => {
      const name = draft.name.trim();
      if (!name) return;
      setSaving(true);
      try {
        const { error } = await addShoppingItem({
          pantry_item_id: null,
          name,
          brand: '',
          category: draft.category || categoryFromName(name).id,
          quantity: Math.max(0, parseFloat(draft.quantity) || 1),
          unit: draft.unit || 'pcs',
          is_checked: false,
          is_auto_generated: false,
          notes: '',
          estimatedPrice: 0,
        });
        if (error) {
          showToast(t('shopping.error.add'), 'error');
          return;
        }
        setSheetOpen(false);
        setVoiceDraft(null);
      } finally {
        setSaving(false);
      }
    },
    [addShoppingItem, showToast, t],
  );

  const handleVoice = useCallback(
    async (transcript: string) => {
      try {
        const parsed = await parseShoppingVoiceCommand(transcript);
        setVoiceDraft({
          name: parsed.productName,
          quantity: String(parsed.quantity || 1),
          unit: 'pcs',
          category: categoryFromName(parsed.productName).id,
        });
        setSheetOpen(true);
      } catch {
        showToast(t('shopping.error.voice'), 'error');
      }
    },
    [showToast, t],
  );

  const addSuggestion = useCallback(
    async (item: PantryItem) => {
      const qty = Math.max(1, item.low_stock_threshold - item.quantity + 1);
      const { error } = await addShoppingItem({
        pantry_item_id: item.id,
        name: item.name,
        brand: item.brand,
        category: item.category,
        quantity: qty,
        unit: item.unit || 'pcs',
        is_checked: false,
        is_auto_generated: true,
        notes: '',
        estimatedPrice: 0,
      });
      if (error) showToast(t('shopping.error.add'), 'error');
      else trackEvent('smart_restock_used', { count: 1 }).catch(() => {});
    },
    [addShoppingItem, showToast, t],
  );

  const addAllSuggestions = useCallback(async () => {
    if (suggestions.length === 0) return;
    const rows = suggestions.map((item) => ({
      name: item.name,
      quantity: Math.max(1, item.low_stock_threshold - item.quantity + 1),
      price: 0,
      unit: item.unit || 'pcs',
      category: item.category,
    }));
    const { error } = await bulkAddItems(rows);
    if (error) showToast(t('shopping.error.add'), 'error');
    else {
      trackEvent('smart_restock_used', { count: rows.length }).catch(() => {});
      showToast(t('shopping.smart.added', { count: rows.length }), 'success');
    }
  }, [suggestions, bulkAddItems, showToast, t]);

  const handleCheckout = useCallback(async () => {
    const ok = await confirm({
      title: t('shopping.checkout.title'),
      message: t('shopping.checkout.message', { count: checkedItems.length }),
      confirmLabel: t('shopping.checkout.confirm'),
      cancelLabel: t('common.cancel'),
    });
    if (!ok) return;
    setCheckoutBusy(true);
    try {
      const defaultLoc = locations[0]?.id ?? null;
      const { error } = await checkoutToPantry(async (name, qty, unit, category, price) => {
        await addItem({
          product_id: null,
          location_id: defaultLoc,
          name,
          brand: '',
          image_url: '',
          category,
          barcode: '',
          quantity: qty,
          unit,
          expiry_date: null,
          low_stock_threshold: 1,
          purchase_price: price || null,
          notes: '',
        });
      });
      if (error) showToast(t('shopping.error.checkout'), 'error');
      else showToast(t('shopping.checkout.done'), 'success');
    } finally {
      setCheckoutBusy(false);
    }
  }, [confirm, checkedItems.length, checkoutToPantry, addItem, locations, showToast, t]);

  const handleClear = useCallback(async () => {
    const ok = await confirm({
      title: t('shopping.clear.title'),
      message: t('shopping.clear.message', { count: checkedItems.length }),
      confirmLabel: t('shopping.clear.confirm'),
      cancelLabel: t('common.cancel'),
      destructive: true,
    });
    if (!ok) return;
    const { error } = await clearCheckedItems();
    if (error) showToast(t('shopping.error.clear'), 'error');
  }, [confirm, checkedItems.length, clearCheckedItems, showToast, t]);

  const subtitle = searchOpen
    ? query.trim()
      ? t('shopping.search.results', { count: filtered.length })
      : t('shopping.search.hint')
    : shoppingList.length === 0
      ? t('shopping.subtitle.empty')
      : t('shopping.subtitle.count', {
          open: uncheckedItems.length,
          done: checkedItems.length,
        });

  const rightSlot = (
    <XStack style={{ gap: s(8), alignItems: 'center' }}>
      {canEdit && shoppingList.length > 0 ? (
        <VoiceInputButton
          variant="chrome"
          label={t('shopping.voice')}
          accessibilityLabel={t('shopping.voice')}
          onTranscript={handleVoice}
        />
      ) : null}
      {searchOpen ? (
        <SettingsChromeButton
          icon={X}
          onPress={closeSearch}
          accessibilityLabel={t('common.cancel')}
        />
      ) : (
        <SettingsChromeButton
          icon={Search}
          onPress={() => setSearchOpen(true)}
          accessibilityLabel={t('shopping.search')}
        />
      )}
      {canEdit ? (
        <SettingsChromeButton
          icon={Plus}
          onPress={openAdd}
          accessibilityLabel={t('shopping.add')}
        />
      ) : null}
    </XStack>
  );

  return (
    <>
      <ShoppingScreenShell
        title={activeList?.name || t('shopping.title')}
        subtitle={subtitle}
        rightSlot={rightSlot}
        searchSlot={
          searchOpen ? (
            <ShoppingSearchBar
              value={query}
              onChangeText={setQuery}
              onCancel={closeSearch}
              placeholder={t('shopping.searchPlaceholder')}
              cancelLabel={t('common.cancel')}
            />
          ) : null
        }
        footerSlot={
          canEdit && shoppingList.length > 0 ? (
            <ShoppingCheckoutBar
              checkedCount={checkedItems.length}
              uncheckedCount={uncheckedItems.length}
              totalLabel={
                listTotal > 0
                  ? t('shopping.total', { amount: listTotal.toFixed(2) })
                  : t('shopping.progress', {
                      open: uncheckedItems.length,
                      done: checkedItems.length,
                    })
              }
              checkoutLabel={t('shopping.checkout.cta', { count: checkedItems.length })}
              clearLabel={t('shopping.clear.cta')}
              onCheckout={() => void handleCheckout()}
              onClear={() => void handleClear()}
              busy={checkoutBusy}
            />
          ) : null
        }
      >
        <ShoppingItemList
          items={filtered}
          loading={loading}
          canEdit={canEdit}
          emptyTitle={
            query.trim() ? t('shopping.search.emptyTitle') : t('shopping.empty.title')
          }
          emptyDescription={
            query.trim()
              ? t('shopping.search.emptyDescription', { query: query.trim() })
              : t('shopping.empty.description')
          }
          emptyActionLabel={query.trim() ? t('shopping.search.clear') : t('shopping.add')}
          onEmptyAction={query.trim() ? () => setQuery('') : openAdd}
          emptySecondaryLabel={t('shopping.empty.voice')}
          onEmptySecondary={() => setVoiceOpen(true)}
          toBuyLabel={t('shopping.section.toBuy')}
          doneLabel={t('shopping.section.done')}
          autoLabel={t('shopping.badge.auto')}
          deleteLabel={t('shopping.delete.confirm')}
          onToggle={(item) => void handleToggle(item)}
          onPressItem={() => {}}
          onDelete={(item) => void handleDelete(item)}
          listHeader={
            canEdit && !query.trim() ? (
              <ShoppingSmartRail
                suggestions={suggestions}
                title={t('shopping.smart.title')}
                addAllLabel={t('shopping.smart.addAll')}
                onAddOne={(item) => void addSuggestion(item)}
                onAddAll={() => void addAllSuggestions()}
              />
            ) : null
          }
        />
      </ShoppingScreenShell>

      {canEdit ? (
        <VoiceInputButton
          variant="none"
          open={voiceOpen}
          onOpenChange={setVoiceOpen}
          onTranscript={handleVoice}
          label={t('shopping.voice')}
        />
      ) : null}

      <ShoppingAddSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setVoiceDraft(null);
        }}
        saving={saving}
        title={t('shopping.sheet.add')}
        initial={voiceDraft}
        labels={{
          name: t('shopping.field.name'),
          quantity: t('shopping.field.quantity'),
          unit: t('shopping.field.unit'),
          category: t('shopping.field.category'),
          save: t('common.save'),
          cancel: t('common.cancel'),
        }}
        onSave={handleSave}
      />
    </>
  );
}
