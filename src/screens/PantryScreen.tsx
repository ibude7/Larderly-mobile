import { useState, useMemo, useEffect } from 'react';
import { View, Text, FlatList, Pressable, Image, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import AppHeader from '../components/layout/AppHeader';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import TextField from '../components/ui/TextField';
import SelectField from '../components/ui/SelectField';
import VoiceInputButton from '../components/ui/VoiceInputButton';
import { Icon } from '../components/ui/Icon';
import AddItemModal from '../components/pantry/AddItemModal';
import ItemDetailModal from '../components/pantry/ItemDetailModal';
import InventoryCard from '../components/pantry/InventoryCard';
import Chip from '../components/ui/Chip';
import { usePantryStore } from '../contexts/PantryContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { getCategoryIcon } from '../lib/appIcons';
import { CATEGORIES, STORAGE_LOCATIONS } from '../lib/categories';
import { getDaysUntilDate } from '../lib/date';
import { locationNameFromId, locationIdFromName } from '../lib/inventoryMapper';
import { parsePantryVoiceCommand } from '../lib/voiceCommands';
import { identifyFoodFromImage } from '../lib/foodIdentify';
import { PantryItem, StorageLocation } from '../types';
import { TabParamList } from '../navigation/types';
import { colors } from '../theme';

type ViewMode = 'grid' | 'list';

type ExpirationFilter = 'All' | 'Fresh' | 'Expiring Soon' | 'Expired';
type StockFilter = 'All' | 'In Stock' | 'Low Stock' | 'Out of Stock';
type SortKey = 'expiration' | 'name' | 'quantity' | 'price';

function expirationStatus(expiry: string | null): 'fresh' | 'soon' | 'urgent' | 'expired' | 'none' {
  const days = getDaysUntilDate(expiry);
  if (days === null) return 'none';
  if (days < 0) return 'expired';
  if (days <= 2) return 'urgent';
  if (days <= 7) return 'soon';
  return 'fresh';
}

export default function PantryScreen() {
  const { items, locations, addItem, updateItem, deleteItem, consumeItem } = usePantryStore();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<TabParamList, 'Pantry'>>();

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [identifying, setIdentifying] = useState(false);
  const [search, setSearch] = useState('');
  const [activeLocation, setActiveLocation] = useState('All');
  const [activeCategory, setActiveCategory] = useState('All');
  const [filterExpiration, setFilterExpiration] = useState<ExpirationFilter>('All');
  const [filterStock, setFilterStock] = useState<StockFilter>('All');
  const [filterPriceMin, setFilterPriceMin] = useState('');
  const [filterPriceMax, setFilterPriceMax] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('expiration');
  const [showFilters, setShowFilters] = useState(false);

  const selectedItem = useMemo(
    () => (selectedItemId ? items.find((i) => i.id === selectedItemId) ?? null : null),
    [items, selectedItemId],
  );

  useEffect(() => {
    if (route.params?.openAdd) {
      setAddOpen(true);
      navigation.setParams({ openAdd: undefined });
    }
  }, [route.params?.openAdd, navigation]);

  const filtered = useMemo(() => {
    let arr = [...items];
    if (activeLocation !== 'All') {
      arr = arr.filter((i) => locationNameFromId(i.location_id, locations) === activeLocation);
    }
    if (activeCategory !== 'All') {
      arr = arr.filter((i) => (i.category ?? 'other') === activeCategory);
    }
    if (filterExpiration !== 'All') {
      arr = arr.filter((i) => {
        const stat = expirationStatus(i.expiry_date);
        if (filterExpiration === 'Expired') return stat === 'expired';
        if (filterExpiration === 'Expiring Soon') return stat === 'urgent' || stat === 'soon';
        if (filterExpiration === 'Fresh') return stat === 'fresh' || stat === 'none';
        return true;
      });
    }
    if (filterStock !== 'All') {
      arr = arr.filter((i) => {
        if (filterStock === 'Out of Stock') return i.quantity === 0;
        if (filterStock === 'Low Stock') return i.quantity > 0 && i.quantity <= i.low_stock_threshold;
        if (filterStock === 'In Stock') return i.quantity > i.low_stock_threshold;
        return true;
      });
    }
    if (filterPriceMin) {
      arr = arr.filter((i) => (i.purchase_price ?? 0) >= Number(filterPriceMin));
    }
    if (filterPriceMax) {
      arr = arr.filter((i) => (i.purchase_price ?? 0) <= Number(filterPriceMax));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(
        (i) => i.name.toLowerCase().includes(q) || (i.brand ?? '').toLowerCase().includes(q),
      );
    }
    arr.sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name);
      if (sortKey === 'quantity') return b.quantity - a.quantity;
      if (sortKey === 'price') return (b.purchase_price ?? 0) - (a.purchase_price ?? 0);
      const da = getDaysUntilDate(a.expiry_date) ?? 9999;
      const db = getDaysUntilDate(b.expiry_date) ?? 9999;
      return da - db;
    });
    return arr;
  }, [
    items,
    locations,
    activeLocation,
    activeCategory,
    search,
    sortKey,
    filterExpiration,
    filterStock,
    filterPriceMin,
    filterPriceMax,
  ]);

  const hasActiveFilters =
    filterExpiration !== 'All' ||
    filterStock !== 'All' ||
    !!filterPriceMin ||
    !!filterPriceMax ||
    activeLocation !== 'All' ||
    activeCategory !== 'All';

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
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
  };

  const handleBulkMove = async (locName: string) => {
    const locId = locationIdFromName(locName, locations);
    if (!locId) return;
    for (const id of selected) await updateItem(id, { location_id: locId });
    setSelected(new Set());
    setSelectMode(false);
    showToast(`Moved to ${locName}`, 'success');
  };

  const handleVoice = async (transcript: string) => {
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
  };

  const handlePhotoIdentify = async () => {
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
  };

  return (
    <View className="flex-1 bg-canvas">
      <AppHeader onOpenSettings={() => navigation.navigate('Settings')} />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        columnWrapperStyle={viewMode === 'grid' ? { gap: 12, paddingHorizontal: 20 } : undefined}
        contentContainerStyle={{ paddingBottom: 40, gap: 12 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="px-5 pb-4 pt-5">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-3xl font-bold text-ink">Pantry</Text>
              <View className="flex-row gap-2">
                <Pressable onPress={() => setViewMode((v) => (v === 'grid' ? 'list' : 'grid'))} className="h-9 w-9 items-center justify-center rounded-full border border-line bg-surface">
                  <Icon name={viewMode === 'grid' ? 'grid' : 'shelf'} size={16} color={colors.ink} />
                </Pressable>
                <Button label="Add" icon="plus" size="sm" onPress={() => setAddOpen(true)} />
              </View>
            </View>
            <View className="mb-3 flex-row gap-2">
              <View className="flex-1"><VoiceInputButton label="Voice add" onTranscript={handleVoice} /></View>
              <Button label={identifying ? '…' : 'Photo AI'} icon="camera" size="sm" variant="secondary" onPress={handlePhotoIdentify} loading={identifying} />
            </View>
            <View className="mb-3 flex-row gap-2">
              <Button label={selectMode ? 'Cancel select' : 'Select'} size="sm" variant="ghost" onPress={() => { setSelectMode((v) => !v); setSelected(new Set()); }} />
              {selectMode && selected.size > 0 && (
                <>
                  <Button label={`Delete (${selected.size})`} size="sm" variant="danger" onPress={handleBulkDelete} />
                  <Button label="→ Pantry" size="sm" variant="secondary" onPress={() => handleBulkMove('Pantry')} />
                </>
              )}
            </View>
            <TextField
              value={search}
              onChangeText={setSearch}
              placeholder="Search items…"
              icon="search"
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
              <View className="flex-row gap-2">
                <Chip label="All" active={activeLocation === 'All'} onPress={() => setActiveLocation('All')} />
                {STORAGE_LOCATIONS.map((l) => (
                  <Chip
                    key={l}
                    label={l}
                    active={activeLocation === l}
                    onPress={() => setActiveLocation(l)}
                  />
                ))}
              </View>
            </ScrollView>
            <View className="mt-3 flex-row items-center justify-between">
              <Text className="font-semibold text-muted">
                {filtered.length} of {items.length} items
              </Text>
              <Pressable onPress={() => setShowFilters((v) => !v)}>
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
                  onChange={(v) => setFilterExpiration(v as ExpirationFilter)}
                  options={['All', 'Fresh', 'Expiring Soon', 'Expired'].map((v) => ({ label: v, value: v }))}
                />
                <SelectField
                  label="Stock"
                  value={filterStock}
                  onChange={(v) => setFilterStock(v as StockFilter)}
                  options={['All', 'In Stock', 'Low Stock', 'Out of Stock'].map((v) => ({ label: v, value: v }))}
                />
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <TextField
                      label="Min price"
                      value={filterPriceMin}
                      onChangeText={setFilterPriceMin}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View className="flex-1">
                    <TextField
                      label="Max price"
                      value={filterPriceMax}
                      onChangeText={setFilterPriceMax}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
                <SelectField
                  label="Category"
                  value={activeCategory}
                  onChange={setActiveCategory}
                  options={[{ label: 'All', value: 'All' }, ...CATEGORIES.map((c) => ({ label: c.name, value: c.id }))]}
                />
                <SelectField
                  label="Sort by"
                  value={sortKey}
                  onChange={(v) => setSortKey(v as SortKey)}
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
                    onPress={() => {
                      setFilterExpiration('All');
                      setFilterStock('All');
                      setFilterPriceMin('');
                      setFilterPriceMax('');
                      setActiveLocation('All');
                      setActiveCategory('All');
                    }}
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
              onAction={() =>
                items.length === 0 ? setAddOpen(true) : (setSearch(''), setFilterExpiration('All'), setFilterStock('All'), setFilterPriceMin(''), setFilterPriceMax(''), setActiveLocation('All'), setActiveCategory('All'))
              }
              secondaryActionLabel="Open scanner"
              onSecondaryAction={() => navigation.navigate('Scanner', { mode: 'add' })}
            />
          </View>
        }
        renderItem={({ item }) => (
          <InventoryCard
            item={item}
            locations={locations}
            listMode={viewMode === 'list'}
            selected={selected.has(item.id)}
            selectMode={selectMode}
            onToggleSelect={() => toggleSelect(item.id)}
            onAddStock={() => updateItem(item.id, { quantity: item.quantity + 1 })}
            onPress={() => (selectMode ? toggleSelect(item.id) : setSelectedItemId(item.id))}
          />
        )}
      />

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