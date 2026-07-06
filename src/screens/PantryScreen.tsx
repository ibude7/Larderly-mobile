import { useState, useMemo, useEffect, useReducer, useDeferredValue, useCallback } from 'react';
import { View, Text, FlatList, Pressable, ScrollView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import AppHeader from '../components/layout/AppHeader';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import TextField from '../components/ui/TextField';
import SelectField from '../components/ui/SelectField';
import Chip from '../components/ui/Chip';
import SwipeableRow from '../components/ui/SwipeableRow';
import VoiceInputButton from '../components/ui/VoiceInputButton';
import { Icon } from '../components/ui/Icon';
import AddItemModal from '../components/pantry/AddItemModal';
import ItemDetailModal from '../components/pantry/ItemDetailModal';
import InventoryCard, { INVENTORY_LIST_ROW_HEIGHT } from '../components/pantry/InventoryCard';
import PantryCardSkeleton from '../components/pantry/PantryCardSkeleton';
import { useInventory } from '../contexts/InventoryContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { CATEGORIES, STORAGE_LOCATIONS } from '../lib/categories';
import { locationIdFromName } from '../lib/inventoryMapper';
import { parsePantryVoiceCommand } from '../lib/voiceCommands';
import { identifyFoodFromImage } from '../lib/foodIdentify';
import { TabParamList } from '../navigation/types';
import { PantryItem } from '../types';
import { useAppColors } from '../hooks/useAppColors';
import { useDebounce } from '../hooks/useDebounce';
import {
  useFilteredPantry,
  ExpirationFilter,
  StockFilter,
  SortKey,
  FilterState,
} from '../hooks/useFilteredPantry';

type ViewMode = 'grid' | 'list';

const GRID_CARD_HEIGHT = 220;

type FilterAction =
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_LOCATION'; payload: string }
  | { type: 'SET_CATEGORY'; payload: string }
  | { type: 'SET_EXPIRATION_FILTER'; payload: ExpirationFilter }
  | { type: 'SET_STOCK_FILTER'; payload: StockFilter }
  | { type: 'SET_PRICE_RANGE'; payload: { min?: string; max?: string } }
  | { type: 'SET_SORT'; payload: SortKey }
  | { type: 'TOGGLE_FILTERS' }
  | { type: 'CLEAR_FILTERS' };

const initialFilterState: FilterState & { showFilters: boolean } = {
  search: '',
  activeLocation: 'All',
  activeCategory: 'All',
  filterExpiration: 'All',
  filterStock: 'All',
  filterPriceMin: '',
  filterPriceMax: '',
  sortKey: 'expiration',
  showFilters: false,
};

function filterReducer(
  state: FilterState & { showFilters: boolean },
  action: FilterAction,
): FilterState & { showFilters: boolean } {
  switch (action.type) {
    case 'SET_SEARCH':
      return { ...state, search: action.payload };
    case 'SET_LOCATION':
      return { ...state, activeLocation: action.payload };
    case 'SET_CATEGORY':
      return { ...state, activeCategory: action.payload };
    case 'SET_EXPIRATION_FILTER':
      return { ...state, filterExpiration: action.payload };
    case 'SET_STOCK_FILTER':
      return { ...state, filterStock: action.payload };
    case 'SET_PRICE_RANGE':
      return {
        ...state,
        filterPriceMin: action.payload.min !== undefined ? action.payload.min : state.filterPriceMin,
        filterPriceMax: action.payload.max !== undefined ? action.payload.max : state.filterPriceMax,
      };
    case 'SET_SORT':
      return { ...state, sortKey: action.payload };
    case 'TOGGLE_FILTERS':
      return { ...state, showFilters: !state.showFilters };
    case 'CLEAR_FILTERS':
      return {
        ...state,
        filterExpiration: 'All',
        filterStock: 'All',
        filterPriceMin: '',
        filterPriceMax: '',
        activeLocation: 'All',
        activeCategory: 'All',
      };
    default:
      return state;
  }
}

export default function PantryScreen() {
  const { items, locations, addItem, updateItem, deleteItem, consumeItem, isLoading } = useInventory();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<TabParamList, 'Pantry'>>();
  const c = useAppColors();

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [identifying, setIdentifying] = useState(false);

  const [state, dispatch] = useReducer(filterReducer, initialFilterState, (base) => {
    const fromRoute = route.params?.filterExpiration;
    if (!fromRoute) return base;
    return { ...base, filterExpiration: fromRoute as FilterState['filterExpiration'] };
  });
  const {
    search,
    activeLocation,
    activeCategory,
    filterExpiration,
    filterStock,
    filterPriceMin,
    filterPriceMax,
    sortKey,
    showFilters,
  } = state;

  const selectedItem = useMemo(
    () => (selectedItemId ? items.find((i) => i.id === selectedItemId) ?? null : null),
    [items, selectedItemId],
  );
  const debouncedSearch = useDebounce(search);
  const debouncedFilterState = useMemo(
    () => ({ ...state, search: debouncedSearch }),
    [debouncedSearch, state],
  );

  useEffect(() => {
    if (route.params?.openAdd) {
      setAddOpen(true);
      navigation.setParams({ openAdd: undefined });
    }
  }, [route.params?.openAdd, navigation]);

  // Use the custom hook for filtering and sorting
  const filtered = useFilteredPantry(items, locations, debouncedFilterState);
  const deferredFiltered = useDeferredValue(filtered);

  const hasActiveFilters =
    filterExpiration !== 'All' ||
    filterStock !== 'All' ||
    !!filterPriceMin ||
    !!filterPriceMax ||
    activeLocation !== 'All' ||
    activeCategory !== 'All';

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (!selected.size) return;
    const ok = await confirm({
      title: `Delete ${selected.size} items?`,
      message: 'This cannot be undone.',
      destructive: true,
      confirmLabel: 'Delete all',
    });
    if (!ok) return;
    for (const id of selected) await deleteItem(id);
    setSelected(new Set());
    setSelectMode(false);
    showToast('Items removed', 'info');
  }, [confirm, deleteItem, selected, showToast]);

  const handleBulkMove = useCallback(async (locName: string) => {
    const locId = locationIdFromName(locName, locations);
    if (!locId) return;
    for (const id of selected) await updateItem(id, { location_id: locId });
    setSelected(new Set());
    setSelectMode(false);
    showToast(`Moved to ${locName}`, 'success');
  }, [locations, selected, showToast, updateItem]);

  const handleSwipeConsume = useCallback(async (item: PantryItem) => {
    if (item.quantity <= 0) return;
    await consumeItem(item.id, 1);
    showToast(`Used 1 ${item.unit} of ${item.name}`, 'success');
  }, [consumeItem, showToast]);

  const handleSwipeDelete = useCallback(async (item: PantryItem) => {
    const ok = await confirm({
      title: `Delete ${item.name}?`,
      message: 'This item will be removed from your pantry.',
      destructive: true,
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    await deleteItem(item.id);
    showToast(`${item.name} removed`, 'info');
  }, [confirm, deleteItem, showToast]);

  const handleVoice = useCallback(async (transcript: string) => {
    try {
      const parsed = await parsePantryVoiceCommand(transcript);
      await addItem({
        name: parsed.name,
        brand: '',
        image_url: '',
        category: parsed.category,
        barcode: '',
        unit: parsed.unit,
        quantity: parsed.quantity,
        location_id: locationIdFromName(parsed.storageLocation, locations),
        expiry_date: null,
        low_stock_threshold: 1,
        purchase_price: null,
        notes: 'voice',
        product_id: null,
      });
      showToast(`Added ${parsed.name}`, 'success');
    } catch {
      showToast('Could not parse voice command', 'error');
    }
  }, [addItem, locations, showToast]);

  const handlePhotoIdentify = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      showToast('Camera permission required', 'error');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7 });
    if (result.canceled || !result.assets[0]?.base64) return;
    setIdentifying(true);
    try {
      const food = await identifyFoodFromImage(result.assets[0].base64, result.assets[0].mimeType ?? 'image/jpeg');
      await addItem({
        name: food.name,
        brand: '',
        image_url: '',
        category: food.category,
        barcode: '',
        unit: food.unit,
        quantity: food.quantity,
        location_id: locationIdFromName(food.storageLocation, locations),
        expiry_date: null,
        low_stock_threshold: 1,
        purchase_price: null,
        notes: 'AI photo',
        product_id: null,
      });
      showToast(`Added ${food.name}`, 'success');
    } catch {
      showToast('Could not identify food', 'error');
    } finally {
      setIdentifying(false);
    }
  }, [addItem, locations, showToast]);

  const getItemLayout = useCallback(
    (_: ArrayLike<PantryItem> | null | undefined, index: number) => {
      const length = viewMode === 'list' ? INVENTORY_LIST_ROW_HEIGHT : GRID_CARD_HEIGHT;
      const rowIndex = viewMode === 'list' ? index : Math.floor(index / 2);
      return {
        length,
        offset: length * rowIndex,
        index,
      };
    },
    [viewMode],
  );

  return (
    <View className="flex-1 bg-canvas dark:bg-canvas-dark">
      <AppHeader onOpenSettings={() => navigation.navigate('Settings')} />

      {isLoading ? (
        <FlatList
          data={[1, 2, 3, 4, 5, 6]}
          keyExtractor={(item) => item.toString()}
          numColumns={viewMode === 'grid' ? 2 : 1}
          columnWrapperStyle={viewMode === 'grid' ? { gap: 12, paddingHorizontal: 20 } : undefined}
          contentContainerStyle={{ paddingBottom: 120, gap: 12, paddingTop: 20 }}
          showsVerticalScrollIndicator={false}
          renderItem={() => <PantryCardSkeleton listMode={viewMode === 'list'} />}
        />
      ) : (
        <FlatList
          data={deferredFiltered}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        columnWrapperStyle={viewMode === 'grid' ? { gap: 12, paddingHorizontal: 20 } : undefined}
        contentContainerStyle={{ paddingBottom: 120, gap: 12 }}
        showsVerticalScrollIndicator={false}
        getItemLayout={getItemLayout}
        windowSize={5}
        maxToRenderPerBatch={8}
        initialNumToRender={10}
        removeClippedSubviews={Platform.OS === 'android'}
        ListHeaderComponent={
          <View className="px-5 pb-4 pt-5">
            <View className="mb-3 flex-row items-center justify-between">
              <View>
                <Text className="font-display text-4xl text-ink dark:text-ink-dark">Pantry</Text>
                <Text className="mt-0.5 text-sm font-medium text-muted dark:text-muted-dark">
                  {items.length} item{items.length === 1 ? '' : 's'} on your shelves
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={() => setViewMode((v) => (v === 'grid' ? 'list' : 'grid'))}
                  testID="pantry-view-toggle"
                  className="h-10 w-10 items-center justify-center rounded-full border border-line dark:border-line-dark bg-surface dark:bg-surface-dark"
                >
                  <Icon name={viewMode === 'grid' ? 'grid' : 'shelf'} size={16} color={c.ink} />
                </Pressable>
                <Button label="Add" icon="plus" size="sm" onPress={() => setAddOpen(true)} />
              </View>
            </View>
            <TextField
              value={search}
              onChangeText={(v) => dispatch({ type: 'SET_SEARCH', payload: v })}
              placeholder="Search items…"
              icon="search"
            />
            <View className="mt-3 flex-row items-center gap-2">
              <View className="flex-1"><VoiceInputButton label="Voice add" onTranscript={handleVoice} /></View>
              <Button label={identifying ? '…' : 'Photo AI'} icon="camera" size="sm" variant="secondary" onPress={handlePhotoIdentify} loading={identifying} />
              <Pressable
                onPress={() => { setSelectMode((v) => !v); setSelected(new Set()); }}
                testID="pantry-select-toggle"
                className={`h-10 w-10 items-center justify-center rounded-full border ${selectMode ? 'border-ink bg-ink dark:border-ink-dark dark:bg-ink-dark' : 'border-line dark:border-line-dark bg-surface dark:bg-surface-dark'}`}
                accessibilityRole="button"
                accessibilityLabel={selectMode ? 'Cancel selection' : 'Select items'}
              >
                <Icon name="checkmark-done" size={16} color={selectMode ? c.canvas : c.ink} />
              </Pressable>
            </View>
            {selectMode && selected.size > 0 && (
              <View className="mt-3 flex-row gap-2">
                <Button label={`Delete (${selected.size})`} size="sm" variant="danger" onPress={handleBulkDelete} />
                <Button label="→ Pantry" size="sm" variant="secondary" onPress={() => handleBulkMove('Pantry')} />
              </View>
            )}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
              <View className="flex-row gap-2">
                <Chip label="All" active={activeLocation === 'All'} onPress={() => dispatch({ type: 'SET_LOCATION', payload: 'All' })} />
                {STORAGE_LOCATIONS.map((l) => (
                  <Chip
                    key={l}
                    label={l}
                    active={activeLocation === l}
                    onPress={() => dispatch({ type: 'SET_LOCATION', payload: l })}
                  />
                ))}
              </View>
            </ScrollView>
            <View className="mt-3 flex-row items-center justify-between">
              <Text className="font-semibold text-muted">
                {deferredFiltered.length} of {items.length} items
              </Text>
              <Pressable onPress={() => dispatch({ type: 'TOGGLE_FILTERS' })}>
                <Text className="text-sm font-bold text-primary">
                  {showFilters ? 'Hide filters' : 'Filters & sort'}
                  {hasActiveFilters ? ' •' : ''}
                </Text>
              </Pressable>
            </View>
            {showFilters && (
              <View className="mt-3 gap-3 rounded-2xl border border-line bg-surface p-3">
                <SelectField
                  label="Expiration"
                  value={filterExpiration}
                  onChange={(v) => dispatch({ type: 'SET_EXPIRATION_FILTER', payload: v as ExpirationFilter })}
                  options={['All', 'Fresh', 'Expiring Soon', 'Expired'].map((v) => ({ label: v, value: v }))}
                />
                <SelectField
                  label="Stock"
                  value={filterStock}
                  onChange={(v) => dispatch({ type: 'SET_STOCK_FILTER', payload: v as StockFilter })}
                  options={['All', 'In Stock', 'Low Stock', 'Out of Stock'].map((v) => ({ label: v, value: v }))}
                />
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <TextField
                      label="Min price"
                      value={filterPriceMin}
                      onChangeText={(v) => dispatch({ type: 'SET_PRICE_RANGE', payload: { min: v } })}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View className="flex-1">
                    <TextField
                      label="Max price"
                      value={filterPriceMax}
                      onChangeText={(v) => dispatch({ type: 'SET_PRICE_RANGE', payload: { max: v } })}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
                <SelectField
                  label="Category"
                  value={activeCategory}
                  onChange={(v) => dispatch({ type: 'SET_CATEGORY', payload: v })}
                  options={[{ label: 'All', value: 'All' }, ...CATEGORIES.map((c) => ({ label: c.name, value: c.id }))]}
                />
                <SelectField
                  label="Sort by"
                  value={sortKey}
                  onChange={(v) => dispatch({ type: 'SET_SORT', payload: v as SortKey })}
                  options={[
                    { label: 'Expiration', value: 'expiration' },
                    { label: 'Name', value: 'name' },
                    { label: 'Quantity', value: 'quantity' },
                    { label: 'Price', value: 'price' },
                  ]}
                />
                {hasActiveFilters && (
                  <Button
                    label="Clear filters"
                    variant="ghost"
                    size="sm"
                    onPress={() => dispatch({ type: 'CLEAR_FILTERS' })}
                  />
                )}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View className="px-5">
            <EmptyState
              icon="pantry"
              title={items.length === 0 ? 'Your pantry is empty' : 'No matching items'}
              description={
                items.length === 0
                  ? 'Keep track of your ingredients, snacks, and supplies.'
                  : 'Try adjusting your filters or search.'
              }
              variant="card"
              actionLabel={items.length === 0 ? 'Add your first item' : 'Clear filters'}
              onAction={() => {
                if (items.length === 0) {
                  setAddOpen(true);
                } else {
                  dispatch({ type: 'CLEAR_FILTERS' });
                  dispatch({ type: 'SET_SEARCH', payload: '' });
                }
              }}
              secondaryActionLabel="Open scanner"
              onSecondaryAction={() => navigation.navigate('Scanner', { mode: 'add' })}
            />
          </View>
        }
        renderItem={({ item }) => {
          const isListMode = viewMode === 'list';
          const card = (
            <InventoryCard
              item={item}
              c={c}
              listMode={isListMode && selectMode}
              selected={selected.has(item.id)}
              selectMode={selectMode}
              onToggleSelect={() => toggleSelect(item.id)}
              onAddStock={() => updateItem(item.id, { quantity: item.quantity + 1 })}
              onPress={() => (selectMode ? toggleSelect(item.id) : setSelectedItemId(item.id))}
            />
          );

          if (!isListMode || selectMode) return card;

          return (
            <View className="mx-5 mb-3">
              <SwipeableRow
                leftAction={{
                  label: 'Consume',
                  icon: 'minus',
                  color: c.success,
                  onPress: () => {
                    void handleSwipeConsume(item);
                  },
                }}
                rightAction={{
                  label: 'Delete',
                  icon: 'trash',
                  color: c.danger,
                  onPress: () => {
                    void handleSwipeDelete(item);
                  },
                }}
              >
                {card}
              </SwipeableRow>
            </View>
          );
        }}
      />
      )}

      <AddItemModal isOpen={addOpen} onClose={() => setAddOpen(false)} locations={locations} onAdd={addItem} />

      <ItemDetailModal
        isOpen={!!selectedItem}
        item={selectedItem}
        onClose={() => setSelectedItemId(null)}
        locations={locations}
        onUpdate={updateItem}
        onDelete={deleteItem}
        onConsume={consumeItem}
      />
    </View>
  );
}
