import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import AppHeader from '../components/layout/AppHeader';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import BottomSheet from '../components/ui/BottomSheet';
import ProgressBar from '../components/ui/ProgressBar';
import SelectField from '../components/ui/SelectField';
import TextField from '../components/ui/TextField';
import VoiceInputButton from '../components/ui/VoiceInputButton';
import SmartSuggestionsCard from '../components/dashboard/SmartSuggestionsCard';
import ShoppingModeOverlay from '../components/shopping/ShoppingModeOverlay';
import ShoppingCategoryGroup from '../components/shopping/ShoppingCategoryGroup';
import AddItemSheet from '../components/shopping/AddItemSheet';
import SmartRestockCard from '../components/shopping/SmartRestockCard';
import ListPickerSheet from '../components/shopping/ListPickerSheet';
import ListSettingsSheet from '../components/shopping/ListSettingsSheet';
import { Icon } from '../components/ui/Icon';
import { useInventory } from '../contexts/InventoryContext';
import { useShopping } from '../contexts/ShoppingContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { usePrefs } from '../contexts/PreferencesContext';
import { useActivity } from '../hooks/useActivity';
import { formatCurrency } from '../lib/format';
import { categoryFromName } from '../lib/categories';
import { parseReceiptImage } from '../lib/receiptScan';
import { parseShoppingVoiceCommand } from '../lib/voiceCommands';
import { pantryItemToInventory } from '../lib/pantryInsights';
import { colors } from '../theme';
import { trackEvent } from '../lib/analytics';

export default function ShoppingScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { items: pantryItems, addItem } = useInventory();
  const {
    lists,
    activeList,
    activeListId,
    setActiveListId,
    shoppingList,
    listTotal,
    canEdit,
    createList,
    createFromTemplate,
    bulkAddItems,
    archiveList,
    deleteList,
    updateListMeta,
    addShoppingItem,
    toggleShoppingItem,
    deleteShoppingItem,
    clearCheckedItems,
    checkoutToPantry,
    templates,
    saveAsTemplate,
    deleteTemplate,
  } = useShopping();
  const activity = useActivity();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const { prefs } = usePrefs();

  // ── UI state ────────────────────────────────────────────────────────────────
  const [shopMode, setShopMode] = useState(false);
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListBudget, setNewListBudget] = useState('');
  const [newListTemplate, setNewListTemplate] = useState(false);
  const [newListRecurring, setNewListRecurring] = useState(false);
  const [newListFrequency, setNewListFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('weekly');
  const [adding, setAdding] = useState(false);
  const [addName, setAddName] = useState('');
  const [addPrice, setAddPrice] = useState('');
  const [addQty, setAddQty] = useState('1');
  const [showListPicker, setShowListPicker] = useState(false);
  const [listTab, setListTab] = useState<'active' | 'history' | 'templates'>('active');
  const [showListSettings, setShowListSettings] = useState(false);
  const [settingsBudget, setSettingsBudget] = useState('');
  const [settingsStore, setSettingsStore] = useState('');
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [saveTemplateName, setSaveTemplateName] = useState('');
  const [scanningReceipt, setScanningReceipt] = useState(false);

  // ── Derived data ─────────────────────────────────────────────────────────────
  const shoppingNames = useMemo(
    () => shoppingList.filter((s) => !s.is_checked).map((s) => ({ productName: s.name })),
    [shoppingList],
  );
  const inventory = useMemo(() => pantryItems.map(pantryItemToInventory), [pantryItems]);
  const activeLists = lists.filter((l) => !l.isTemplate && !l.archivedAt);
  const historyLists = lists.filter((l) => !l.isTemplate && l.archivedAt);
  const unchecked = useMemo(() => shoppingList.filter((i) => !i.is_checked), [shoppingList]);
  const checked = useMemo(() => shoppingList.filter((i) => i.is_checked), [shoppingList]);
  const spent = checked.reduce((s, i) => s + (i.estimatedPrice || 0) * i.quantity, 0);
  const grouped = useMemo(() => {
    const groups: Record<string, typeof unchecked> = {};
    unchecked.forEach((item) => {
      const cat = item.category || 'other';
      (groups[cat] ??= []).push(item);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [unchecked]);

  const budget = activeList?.budget ?? 0;
  const budgetProgress = budget > 0 ? spent / budget : 0;

  // ── Budget notification ───────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !activeListId || !budget || !prefs.notifications.budget) return;
    const ratio = spent / budget;
    const key = `larderly:budget:${activeListId}`;
    AsyncStorage.getItem(key).then((seen) => {
      if (ratio >= 0.8 && !seen) {
        showToast(
          ratio >= 1
            ? `Over budget on ${activeList?.name}`
            : `${Math.round(ratio * 100)}% of budget used`,
          'warning',
        );
        AsyncStorage.setItem(key, '1');
      }
    });
  }, [spent, budget, activeListId, user, prefs.notifications.budget, activeList?.name, showToast]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleCreateList = useCallback(async () => {
    if (!newListName.trim()) return;
    const { error } = await createList(newListName.trim(), {
      isTemplate: newListTemplate,
      isRecurring: newListRecurring,
      budget: newListBudget ? parseFloat(newListBudget) : undefined,
      recurringFrequency: newListFrequency,
    });
    if (error) showToast('Could not create list', 'error');
    else {
      trackEvent('list_created', { recurring: newListRecurring ? 1 : 0, template: newListTemplate ? 1 : 0 }).catch(() => {});
      showToast(newListTemplate ? 'Template saved' : 'List created', 'success');
      setNewListName('');
      setNewListBudget('');
      setNewListTemplate(false);
      setNewListRecurring(false);
      setShowNewList(false);
    }
  }, [createList, newListBudget, newListFrequency, newListName, newListRecurring, newListTemplate, showToast]);

  const handleAddItem = useCallback(async () => {
    if (!addName.trim()) return;
    const { error } = await addShoppingItem({
      pantry_item_id: null,
      name: addName.trim(),
      brand: '',
      category: categoryFromName(addName).id,
      quantity: parseFloat(addQty) || 1,
      unit: 'pcs',
      is_checked: false,
      is_auto_generated: false,
      notes: '',
      estimatedPrice: parseFloat(addPrice) || 0,
    });
    if (error) showToast('Failed to add item', 'error');
    else {
      setAddName('');
      setAddPrice('');
      setAddQty('1');
      setAdding(false);
    }
  }, [addName, addPrice, addQty, addShoppingItem, showToast]);

  const handleVoice = useCallback(async (transcript: string) => {
    try {
      const parsed = await parseShoppingVoiceCommand(transcript);
      await addShoppingItem({
        pantry_item_id: null,
        name: parsed.productName,
        brand: '',
        category: categoryFromName(parsed.productName).id,
        quantity: parsed.quantity || 1,
        unit: 'pcs',
        is_checked: false,
        is_auto_generated: false,
        notes: 'voice',
        estimatedPrice: 0,
      });
      trackEvent('voice_command_used', { target: 'shopping' }).catch(() => {});
      showToast(`Added ${parsed.productName}`, 'success');
    } catch {
      showToast('Could not parse voice command', 'error');
    }
  }, [addShoppingItem, showToast]);

  const handleReceiptScan = useCallback(async () => {
    if (!activeListId) return;
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      showToast('Camera permission required', 'error');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7 });
    if (result.canceled || !result.assets[0]?.base64) return;
    setScanningReceipt(true);
    try {
      const mime = result.assets[0].mimeType ?? 'image/jpeg';
      const parsed = await parseReceiptImage(result.assets[0].base64, mime);
      if (!parsed.length) throw new Error('No items');
      await bulkAddItems(
        parsed.map((p) => ({
          name: p.name,
          quantity: p.quantity,
          price: p.price,
          category: categoryFromName(p.name).id,
        })),
      );
      trackEvent('receipt_scanned', { item_count: parsed.length }).catch(() => {});
      showToast(`Added ${parsed.length} items from receipt`, 'success');
    } catch {
      showToast('Receipt scan failed', 'error');
    } finally {
      setScanningReceipt(false);
    }
  }, [activeListId, bulkAddItems, showToast]);

  const handleCheckout = useCallback(async () => {
    const ok = await confirm({
      title: 'Move to pantry?',
      message: `Add ${checked.length} purchased items to your household inventory?`,
      confirmLabel: 'Move to pantry',
    });
    if (!ok) return;
    const { error } = await checkoutToPantry(async (name, qty, unit, category, price) => {
      await addItem({
        product_id: null,
        location_id: null,
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
    if (error) showToast('Checkout failed', 'error');
    else {
      trackEvent('checkout_completed', { item_count: checked.length }).catch(() => {});
      showToast('Items added to pantry', 'success');
    }
  }, [addItem, checked.length, checkoutToPantry, confirm, showToast]);

  const handleSaveSettings = async () => {
    if (!activeListId) return;
    await updateListMeta(activeListId, {
      budget: settingsBudget ? parseFloat(settingsBudget) : undefined,
      store: settingsStore,
    });
    setShowListSettings(false);
    showToast('List updated', 'success');
  };

  const handleDeleteList = async () => {
    if (!activeListId || !activeList) return;
    const ok = await confirm({
      title: `Delete "${activeList.name}"?`,
      message: 'All items will be removed.',
      destructive: true,
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    await deleteList(activeListId);
    showToast('List deleted', 'info');
  };

  const openSettings = () => {
    setSettingsBudget(activeList?.budget?.toString() ?? '');
    setSettingsStore(activeList?.store ?? '');
    setShowListSettings(true);
  };

  const handleSaveAsTemplate = async () => {
    if (!activeListId || !saveTemplateName.trim()) return;
    const { error } = await saveAsTemplate(activeListId, saveTemplateName.trim());
    if (error) showToast('Could not save as template', 'error');
    else {
      showToast('Template saved', 'success');
      setSaveTemplateName('');
      setShowSaveTemplate(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-canvas dark:bg-canvas-dark">
      <AppHeader onOpenSettings={() => navigation.navigate('Settings')} />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* List title + budget summary */}
        <View className="mb-4 flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">SHOPPING</Text>
            <Pressable onPress={() => setShowListPicker(true)} className="flex-row items-center gap-2">
              <Text className="font-display text-4xl text-ink dark:text-ink-dark">{activeList?.name ?? 'Shopping'}</Text>
              <Icon name="chevron-down" size={18} color={colors.muted} />
            </Pressable>
            {budget > 0 ? (
              <View className="mt-2">
                <ProgressBar
                  value={budgetProgress}
                  showLabel
                  labelText={`Spent ${formatCurrency(spent, prefs.currency)} of ${formatCurrency(budget, prefs.currency)} · Est. ${formatCurrency(listTotal, prefs.currency)}`}
                />
              </View>
            ) : null}
            {activeList?.isRecurring && (
              <Text className="text-xs text-primary">Recurring · {activeList.recurringFrequency || 'weekly'}</Text>
            )}
          </View>
          <Pressable
            onPress={() => setShopMode(true)}
            className={`rounded-full px-4 py-2.5 ${shopMode ? 'bg-primary' : 'border border-line dark:border-line-dark bg-surface/80 dark:bg-surface-dark/80'}`}
          >
            <Text className={`text-xs font-bold ${shopMode ? 'text-white' : 'text-ink dark:text-ink-dark'}`}>Shop mode</Text>
          </Pressable>
        </View>

        {/* List action buttons */}
        <View className="mb-4 flex-row flex-wrap gap-2">
          <Button label="New list" icon="plus" size="sm" variant="secondary" onPress={() => setShowNewList(true)} />
          <Button label="Templates" icon="box" size="sm" variant="ghost" onPress={() => setShowTemplatePicker(true)} />
          {canEdit && activeListId && !activeList?.isTemplate && (
            <Button label="Save as template" icon="box" size="sm" variant="ghost" onPress={() => {
              setSaveTemplateName(activeList?.name ? `${activeList.name} template` : '');
              setShowSaveTemplate(true);
            }} />
          )}
          {canEdit && activeListId && (
            <>
              <Button label="Settings" icon="settings" size="sm" variant="ghost" onPress={openSettings} />
              <Button
                label="Archive"
                icon="box"
                size="sm"
                variant="ghost"
                onPress={async () => {
                  if (!activeListId) return;
                  await archiveList(activeListId);
                  showToast('List archived', 'info');
                }}
              />
            </>
          )}
        </View>

        {/* Receipt scan + voice input */}
        {canEdit && (
          <View className="mb-4 flex-row gap-2">
            <View className="flex-1">
              <Button
                label={scanningReceipt ? 'Scanning…' : 'Scan receipt'}
                icon="camera"
                variant="secondary"
                size="sm"
                onPress={handleReceiptScan}
                loading={scanningReceipt}
              />
            </View>
            <View className="flex-1">
              <VoiceInputButton label="Voice add" onTranscript={handleVoice} />
            </View>
          </View>
        )}

        {canEdit && activeListId ? (
          <SmartRestockCard
            pantryItems={pantryItems}
            existingNames={shoppingList.map((s) => s.name)}
            onRestock={async (items) => {
              await bulkAddItems(
                items.map((i) => ({
                  name: i.name,
                  quantity: Math.max(1, i.low_stock_threshold - i.quantity + 1),
                  price: i.purchase_price ?? 0,
                  category: i.category || categoryFromName(i.name).id,
                })),
              );
              trackEvent('smart_restock_used', { item_count: items.length }).catch(() => {});
              showToast(`Added ${items.length} low-stock items`, 'success');
            }}
          />
        ) : null}

        <SmartSuggestionsCard inventory={inventory} activity={activity} shoppingItems={shoppingNames} />

        {/* Item list */}
        {unchecked.length === 0 && checked.length === 0 ? (
          <EmptyState
            icon="shopping"
            title="List is empty"
            description="Add items manually, by voice, or scan a receipt."
            actionLabel="Add item"
            onAction={() => setAdding(true)}
          />
        ) : (
          <>
            {grouped.map(([cat, catItems]) => (
              <ShoppingCategoryGroup
                key={cat}
                category={cat}
                items={catItems}
                canEdit={canEdit}
                onToggle={toggleShoppingItem}
                onDelete={deleteShoppingItem}
              />
            ))}
            {checked.length > 0 && (
              <View className="mt-4 overflow-hidden rounded-3xl border border-white/20 bg-surface/60 dark:bg-surface-dark/60 p-4">
                <Text className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-muted dark:text-muted-dark">
                  Purchased ({checked.length})
                </Text>
                <Button label="Move to pantry" icon="pantry" onPress={handleCheckout} />
                <Button label="Clear purchased" variant="secondary" onPress={() => clearCheckedItems()} className="mt-2" />
              </View>
            )}
          </>
        )}

        {/* Add item inline form */}
        {adding && (
          <AddItemSheet
            name={addName}
            qty={addQty}
            price={addPrice}
            onChangeName={setAddName}
            onChangeQty={setAddQty}
            onChangePrice={setAddPrice}
            onAdd={handleAddItem}
            onCancel={() => setAdding(false)}
          />
        )}
        {!adding && canEdit && (
          <Button label="Add item" icon="plus" variant="secondary" onPress={() => setAdding(true)} className="mt-6" />
        )}
      </ScrollView>

      {/* New list sheet */}
      <BottomSheet isOpen={showNewList} onClose={() => setShowNewList(false)} title="New shopping list">
        <TextField label="List name" value={newListName} onChangeText={setNewListName} placeholder="Weekly groceries" />
        <TextField label="Budget (optional)" value={newListBudget} onChangeText={setNewListBudget} keyboardType="decimal-pad" />
        <View className="mt-3 flex-row gap-2">
          <Pressable
            onPress={() => setNewListTemplate((v) => !v)}
            className={`rounded-full px-4 py-2 ${newListTemplate ? 'bg-primary' : 'border border-line'}`}
          >
            <Text className={newListTemplate ? 'text-white' : 'text-ink'}>Template</Text>
          </Pressable>
          <Pressable
            onPress={() => setNewListRecurring((v) => !v)}
            className={`rounded-full px-4 py-2 ${newListRecurring ? 'bg-primary' : 'border border-line'}`}
          >
            <Text className={newListRecurring ? 'text-white' : 'text-ink'}>Recurring</Text>
          </Pressable>
        </View>
        {newListRecurring && (
          <SelectField
            label="Frequency"
            value={newListFrequency}
            onChange={(v) => setNewListFrequency(v as typeof newListFrequency)}
            options={[
              { label: 'Weekly', value: 'weekly' },
              { label: 'Biweekly', value: 'biweekly' },
              { label: 'Monthly', value: 'monthly' },
            ]}
          />
        )}
        <Button label="Create" onPress={handleCreateList} className="mt-4" />
      </BottomSheet>

      {/* Template picker modal */}
      <Modal isOpen={showTemplatePicker} onClose={() => setShowTemplatePicker(false)} title="Use a template">
        {templates.length === 0 ? (
          <Text className="text-sm text-muted">No templates yet. Create a list and mark it as a template.</Text>
        ) : (
          templates.map((t) => (
            <View key={t.id} className="mb-2 flex-row items-center gap-2">
              <Pressable
                className="flex-1 rounded-xl border border-line px-4 py-3"
                onPress={async () => {
                  const name = `${t.name} copy`;
                  const { error } = await createFromTemplate(t.id, name);
                  if (error) showToast('Could not create from template', 'error');
                  else {
                    showToast('List created from template', 'success');
                    setShowTemplatePicker(false);
                  }
                }}
              >
                <Text className="font-semibold text-ink">{t.name}</Text>
              </Pressable>
              <Pressable
                onPress={async () => {
                  const ok = await confirm({
                    title: `Delete template "${t.name}"?`,
                    message: 'This cannot be undone.',
                    destructive: true,
                    confirmLabel: 'Delete',
                  });
                  if (!ok) return;
                  const { error } = await deleteTemplate(t.id);
                  if (error) showToast('Could not delete template', 'error');
                  else showToast('Template deleted', 'info');
                }}
                className="h-10 w-10 items-center justify-center rounded-lg border border-line"
              >
                <Icon name="trash" size={16} color={colors.muted} />
              </Pressable>
            </View>
          ))
        )}
      </Modal>

      {/* Save as template modal */}
      <Modal isOpen={showSaveTemplate} onClose={() => setShowSaveTemplate(false)} title="Save as template">
        <TextField label="Template name" value={saveTemplateName} onChangeText={setSaveTemplateName} placeholder="e.g. Weekly groceries" />
        <Button label="Save template" onPress={handleSaveAsTemplate} className="mt-4" />
      </Modal>

      {/* List picker sheet */}
      <ListPickerSheet
        isOpen={showListPicker}
        onClose={() => setShowListPicker(false)}
        activeListId={activeListId}
        activeLists={activeLists}
        historyLists={historyLists}
        templates={templates}
        tab={listTab}
        onTabChange={setListTab}
        onSelectList={(id, isTemplate) => {
          if (!isTemplate) setActiveListId(id);
        }}
      />

      {/* List settings sheet */}
      <ListSettingsSheet
        isOpen={showListSettings}
        onClose={() => setShowListSettings(false)}
        budget={settingsBudget}
        store={settingsStore}
        onChangeBudget={setSettingsBudget}
        onChangeStore={setSettingsStore}
        onSave={handleSaveSettings}
        onDelete={handleDeleteList}
        isRecurring={activeList?.isRecurring}
        recurringFrequency={activeList?.recurringFrequency}
        archivedAt={activeList?.archivedAt}
        lastGeneratedAt={activeList?.lastGeneratedAt}
      />

      {/* Shop mode overlay */}
      <ShoppingModeOverlay
        visible={shopMode}
        list={activeList ? { name: activeList.name, budget: activeList.budget } : null}
        items={shoppingList.map((i) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
          is_checked: i.is_checked,
          estimatedPrice: i.estimatedPrice,
          barcode: i.barcode,
        }))}
        onTogglePurchased={toggleShoppingItem}
        onCheckout={async () => {
          setShopMode(false);
          await handleCheckout();
        }}
        onClose={() => setShopMode(false)}
        onAddToInventory={async (name, qty, unit, barcode, price, category) => {
          await addItem({
            product_id: null,
            location_id: null,
            name,
            brand: '',
            image_url: '',
            category: category ?? categoryFromName(name).id,
            barcode: barcode ?? '',
            quantity: qty,
            unit,
            expiry_date: null,
            low_stock_threshold: 1,
            purchase_price: price || null,
            notes: '',
          });
        }}
      />
    </View>
  );
}
