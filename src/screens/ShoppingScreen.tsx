import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import AppHeader from '../components/layout/AppHeader';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import TextField from '../components/ui/TextField';
import SelectField from '../components/ui/SelectField';
import Modal from '../components/ui/Modal';
import VoiceInputButton from '../components/ui/VoiceInputButton';
import SmartSuggestionsCard from '../components/dashboard/SmartSuggestionsCard';
import ShoppingModeOverlay from '../components/shopping/ShoppingModeOverlay';
import { Icon } from '../components/ui/Icon';
import { usePantryStore } from '../contexts/PantryContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { usePrefs } from '../contexts/PreferencesContext';
import { useActivity } from '../hooks/useActivity';
import { formatCurrency } from '../lib/format';
import { CATEGORIES, categoryFromName } from '../lib/categories';
import { parseReceiptImage } from '../lib/receiptScan';
import { parseShoppingVoiceCommand } from '../lib/voiceCommands';
import { pantryItemToInventory } from '../lib/pantryInsights';
import { colors } from '../theme';

export default function ShoppingScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const {
    items: pantryItems,
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
    addItem,
  } = usePantryStore();
  const activity = useActivity();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const { prefs } = usePrefs();

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
  const [showListSettings, setShowListSettings] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [listTab, setListTab] = useState<'active' | 'history' | 'templates'>('active');
  const [settingsBudget, setSettingsBudget] = useState('');
  const [settingsStore, setSettingsStore] = useState('');
  const [scanningReceipt, setScanningReceipt] = useState(false);
  const shoppingNames = useMemo(
    () => shoppingList.filter((s) => !s.is_checked).map((s) => ({ productName: s.name })),
    [shoppingList],
  );

  const inventory = useMemo(() => pantryItems.map(pantryItemToInventory), [pantryItems]);
  const activeLists = lists.filter((l) => !l.isTemplate && !l.archivedAt);
  const historyLists = lists.filter((l) => !l.isTemplate && l.archivedAt);
  const templates = lists.filter((l) => l.isTemplate);

  const unchecked = useMemo(() => shoppingList.filter((i) => !i.is_checked), [shoppingList]);
  const checked = useMemo(() => shoppingList.filter((i) => i.is_checked), [shoppingList]);
  const spent = checked.reduce((s, i) => s + (i as any).estimatedPrice * i.quantity || 0, 0);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof unchecked> = {};
    unchecked.forEach((item) => {
      const cat = item.category || 'other';
      (groups[cat] ??= []).push(item);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [unchecked]);

  const budget = activeList?.budget ?? 0;
  const overBudget = budget > 0 && spent > budget;

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

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    const { error } = await createList(newListName.trim(), {
      isTemplate: newListTemplate,
      isRecurring: newListRecurring,
      budget: newListBudget ? parseFloat(newListBudget) : undefined,
      recurringFrequency: newListFrequency,
    });
    if (error) showToast('Could not create list', 'error');
    else {
      showToast(newListTemplate ? 'Template saved' : 'List created', 'success');
      setNewListName('');
      setNewListBudget('');
      setNewListTemplate(false);
      setNewListRecurring(false);
      setShowNewList(false);
    }
  };

  const handleAddItem = async () => {
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
    } as any);
    if (error) showToast('Failed to add item', 'error');
    else {
      setAddName('');
      setAddPrice('');
      setAddQty('1');
      setAdding(false);
    }
  };

  const handleVoice = async (transcript: string) => {
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
      } as any);
      showToast(`Added ${parsed.productName}`, 'success');
    } catch {
      showToast('Could not parse voice command', 'error');
    }
  };

  const handleReceiptScan = async () => {
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
      showToast(`Added ${parsed.length} items from receipt`, 'success');
    } catch {
      showToast('Receipt scan failed', 'error');
    } finally {
      setScanningReceipt(false);
    }
  };

  const handleCheckout = async () => {
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
    else showToast('Items added to pantry', 'success');
  };

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

  return (
    <View className="flex-1 bg-canvas">
      <AppHeader onOpenSettings={() => navigation.navigate('Settings')} />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <View className="mb-4 flex-row items-center justify-between">
          <View className="flex-1">
            <Pressable onPress={() => setShowListPicker(true)} className="flex-row items-center gap-2">
              <Text className="text-3xl font-bold text-ink">{activeList?.name ?? 'Shopping'}</Text>
              <Icon name="chevron-down" size={18} color={colors.muted} />
            </Pressable>
            <Text className={`mt-1 text-sm ${overBudget ? 'font-bold text-danger' : 'text-muted'}`}>
              {budget > 0
                ? `Budget ${formatCurrency(budget, prefs.currency)} · Spent ${formatCurrency(spent, prefs.currency)} · Est. ${formatCurrency(listTotal, prefs.currency)}`
                : `Est. ${formatCurrency(listTotal, prefs.currency)}`}
            </Text>
            {activeList?.isRecurring && (
              <Text className="text-xs text-primary">Recurring · {activeList.recurringFrequency || 'weekly'}</Text>
            )}
          </View>
          <Pressable
            onPress={() => setShopMode(true)}
            className={`rounded-full px-3 py-2 ${shopMode ? 'bg-ink' : 'border border-line bg-surface'}`}
          >
            <Text className={`text-xs font-bold ${shopMode ? 'text-white' : 'text-ink'}`}>Shop mode</Text>
          </Pressable>
        </View>

        <View className="mb-4 flex-row flex-wrap gap-2">
          <Button label="New list" icon="plus" size="sm" variant="secondary" onPress={() => setShowNewList(true)} />
          <Button label="Templates" icon="box" size="sm" variant="ghost" onPress={() => setShowTemplatePicker(true)} />
          {canEdit && activeListId && (
            <>
              <Button label="Settings" icon="settings" size="sm" variant="ghost" onPress={openSettings} />
              <Button label="Archive" icon="box" size="sm" variant="ghost" onPress={async () => {
                if (!activeListId) return;
                await archiveList(activeListId);
                showToast('List archived', 'info');
              }} />
            </>
          )}
        </View>

        {canEdit && (
          <View className="mb-4 flex-row gap-2">
            <View className="flex-1">
              <Button label={scanningReceipt ? 'Scanning…' : 'Scan receipt'} icon="camera" variant="secondary" size="sm" onPress={handleReceiptScan} loading={scanningReceipt} />
            </View>
            <View className="flex-1">
              <VoiceInputButton label="Voice add" onTranscript={handleVoice} />
            </View>
          </View>
        )}

        <SmartSuggestionsCard inventory={inventory} activity={activity} shoppingItems={shoppingNames} />

        {unchecked.length === 0 && checked.length === 0 ? (
          <EmptyState icon="shopping" title="List is empty" description="Add items manually, by voice, or scan a receipt." actionLabel="Add item" onAction={() => setAdding(true)} />
        ) : (
          <>
            {grouped.map(([cat, catItems]) => (
              <View key={cat} className="mb-4">
                <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
                  {CATEGORIES.find((c) => c.id === cat)?.name ?? cat}
                </Text>
                {catItems.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => toggleShoppingItem(item.id)}
                    className="mb-2 flex-row items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3"
                  >
                    <Icon name={item.is_checked ? 'success' : 'cart'} size={20} color={item.is_checked ? colors.success : colors.primary} />
                    <View className="flex-1">
                      <Text className={`font-semibold ${item.is_checked ? 'text-muted line-through' : 'text-ink'}`}>{item.name}</Text>
                      <Text className="text-xs text-muted">{item.quantity} {item.unit}</Text>
                    </View>
                    {!shopMode && canEdit && (
                      <Pressable onPress={() => deleteShoppingItem(item.id)} hitSlop={8}>
                        <Icon name="trash" size={16} color={colors.danger} />
                      </Pressable>
                    )}
                  </Pressable>
                ))}
              </View>
            ))}
            {checked.length > 0 && (
              <View className="mt-4">
                <Text className="mb-2 font-semibold text-ink">Purchased ({checked.length})</Text>
                <Button label="Move to pantry" icon="pantry" onPress={handleCheckout} />
                <Button label="Clear purchased" variant="secondary" onPress={() => clearCheckedItems()} className="mt-2" />
              </View>
            )}
          </>
        )}

        {adding && (
          <View className="mt-6 rounded-2xl border border-line bg-surface p-4">
            <TextField label="Item name" value={addName} onChangeText={setAddName} />
            <View className="flex-row gap-3">
              <View className="flex-1"><TextField label="Qty" value={addQty} onChangeText={setAddQty} keyboardType="numeric" /></View>
              <View className="flex-1"><TextField label="Price est." value={addPrice} onChangeText={setAddPrice} keyboardType="decimal-pad" /></View>
            </View>
            <View className="mt-3 flex-row gap-2">
              <Button label="Add" onPress={handleAddItem} className="flex-1" />
              <Button label="Cancel" variant="ghost" onPress={() => setAdding(false)} className="flex-1" />
            </View>
          </View>
        )}
        {!adding && canEdit && <Button label="Add item" icon="plus" variant="secondary" onPress={() => setAdding(true)} className="mt-6" />}
      </ScrollView>

      <Modal isOpen={showNewList} onClose={() => setShowNewList(false)} title="New shopping list">
        <TextField label="List name" value={newListName} onChangeText={setNewListName} placeholder="Weekly groceries" />
        <TextField label="Budget (optional)" value={newListBudget} onChangeText={setNewListBudget} keyboardType="decimal-pad" />
        <View className="mt-3 flex-row gap-2">
          <Pressable onPress={() => setNewListTemplate((v) => !v)} className={`rounded-full px-4 py-2 ${newListTemplate ? 'bg-primary' : 'border border-line'}`}>
            <Text className={newListTemplate ? 'text-white' : 'text-ink'}>Template</Text>
          </Pressable>
          <Pressable onPress={() => setNewListRecurring((v) => !v)} className={`rounded-full px-4 py-2 ${newListRecurring ? 'bg-primary' : 'border border-line'}`}>
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
      </Modal>

      <Modal isOpen={showListSettings} onClose={() => setShowListSettings(false)} title="List settings">
        <TextField label="Budget" value={settingsBudget} onChangeText={setSettingsBudget} keyboardType="decimal-pad" />
        <TextField label="Store" value={settingsStore} onChangeText={setSettingsStore} placeholder="Costco" />
        <Button label="Save" onPress={handleSaveSettings} className="mt-4" />
        <Button label="Delete list" variant="danger" onPress={handleDeleteList} className="mt-2" />
      </Modal>

      <Modal isOpen={showTemplatePicker} onClose={() => setShowTemplatePicker(false)} title="Use a template">
        {templates.length === 0 ? (
          <Text className="text-sm text-muted">No templates yet. Create a list and mark it as a template.</Text>
        ) : (
          templates.map((t) => (
            <Pressable
              key={t.id}
              onPress={async () => {
                const name = `${t.name} copy`;
                const { error } = await createFromTemplate(t.id, name);
                if (error) showToast('Could not create from template', 'error');
                else {
                  showToast('List created from template', 'success');
                  setShowTemplatePicker(false);
                }
              }}
              className="mb-2 rounded-xl border border-line px-4 py-3"
            >
              <Text className="font-semibold text-ink">{t.name}</Text>
            </Pressable>
          ))
        )}
      </Modal>

      <Modal isOpen={showListPicker} onClose={() => setShowListPicker(false)} title="Your lists">
        <View className="mb-3 flex-row gap-2">
          {(['active', 'history', 'templates'] as const).map((t) => (
            <Pressable key={t} onPress={() => setListTab(t)} className={`rounded-full px-3 py-1.5 capitalize ${listTab === t ? 'bg-ink' : 'border border-line'}`}>
              <Text className={listTab === t ? 'text-xs font-semibold text-white' : 'text-xs text-ink'}>{t}</Text>
            </Pressable>
          ))}
        </View>
        {(listTab === 'active' ? activeLists : listTab === 'history' ? historyLists : templates).map((list) => (
          <Pressable
            key={list.id}
            onPress={() => {
              if (!list.isTemplate) setActiveListId(list.id);
              setShowListPicker(false);
            }}
            className={`mb-2 rounded-xl border px-4 py-3 ${list.id === activeListId ? 'border-primary bg-primary/5' : 'border-line'}`}
          >
            <Text className="font-semibold text-ink">{list.name}</Text>
            {list.budget ? <Text className="text-xs text-muted">Budget {formatCurrency(list.budget, prefs.currency)}</Text> : null}
          </Pressable>
        ))}
      </Modal>

      <ShoppingModeOverlay
        visible={shopMode}
        list={activeList ? { name: activeList.name, budget: activeList.budget } : null}
        items={shoppingList.map((i) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
          is_checked: i.is_checked,
          estimatedPrice: (i as { estimatedPrice?: number }).estimatedPrice,
          barcode: (i as { barcode?: string }).barcode,
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
