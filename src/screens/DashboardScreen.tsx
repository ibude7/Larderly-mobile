import { useMemo, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { doc, onSnapshot } from '@react-native-firebase/firestore';
import AppHeader from '../components/layout/AppHeader';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import SmartSuggestionsCard from '../components/dashboard/SmartSuggestionsCard';
import { usePantryStore } from '../contexts/PantryContext';
import { useActivity } from '../hooks/useActivity';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { getCategoryIcon, getLocationIcon } from '../lib/appIcons';
import { pantryItemToInventory } from '../lib/pantryInsights';
import { generateDashboardTip } from '../lib/recipeGen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PantryItem, StorageLocation } from '../types';
import { colors } from '../theme';

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const { householdId } = useAuth();
  const { items, locations, shoppingList, lowStockItems, expiringSoonItems } = usePantryStore();
  const activity = useActivity();
  const [householdName, setHouseholdName] = useState('Your household');
  const [memberCount, setMemberCount] = useState(1);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [aiTipLoading, setAiTipLoading] = useState(false);

  useEffect(() => {
    if (!householdId) return;
    const unsub = onSnapshot(doc(db, 'households', householdId), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() ?? {};
      setHouseholdName((data.name as string) ?? 'Your household');
      setMemberCount(((data.members as string[]) ?? []).length || 1);
    });
    return unsub;
  }, [householdId]);

  useEffect(() => {
    if (!items.length) return;
    const cacheKey = `larderly:tip:${new Date().toDateString()}`;
    AsyncStorage.getItem(cacheKey).then((cached) => {
      if (cached) {
        setAiTip(cached);
        return;
      }
      setAiTipLoading(true);
      const summary = `${items.length} items, ${lowStockItems.length} low stock, ${expiringSoonItems.length} expiring soon`;
      generateDashboardTip(summary)
        .then((tip) => {
          setAiTip(tip);
          AsyncStorage.setItem(cacheKey, tip);
        })
        .catch(() => {})
        .finally(() => setAiTipLoading(false));
    });
  }, [items.length, lowStockItems.length, expiringSoonItems.length]);

  const inventory = useMemo(() => items.map(pantryItemToInventory), [items]);
  const shoppingNames = useMemo(
    () => shoppingList.filter((s) => !s.is_checked).map((s) => ({ productName: s.name })),
    [shoppingList],
  );

  const uncheckedCount = shoppingList.filter((s) => !s.is_checked).length;
  const totalValue = items.reduce((sum, i) => sum + (i.purchase_price || 0) * i.quantity, 0);

  const subtitle =
    items.length === 0
      ? 'Your pantry is empty — start adding items.'
      : `You're tracking ${items.length} items. ${
          uncheckedCount > 0 ? `${uncheckedCount} on your list.` : 'List is clear.'
        }`;

  return (
    <View className="flex-1 bg-canvas">
      <AppHeader
        onOpenSettings={() => navigation.navigate('Settings')}
        right={
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => navigation.navigate('Search')}
              className="h-10 w-10 items-center justify-center rounded-full border border-line bg-surface"
            >
              <Icon name="search" size={18} color={colors.ink} />
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('Settings')}
              className="h-10 w-10 items-center justify-center rounded-full border border-line bg-surface"
            >
              <Icon name="settings" size={18} color={colors.ink} />
            </Pressable>
          </View>
        }
      />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-3xl font-bold text-ink">{householdName}</Text>
        <Text className="mt-1 font-medium text-muted">{subtitle}</Text>
        <View className="mt-2 flex-row gap-2">
          <View className="rounded-full border border-line bg-surface px-3 py-1">
            <Text className="text-[11px] font-bold text-muted">{memberCount} member{memberCount === 1 ? '' : 's'}</Text>
          </View>
          <View className="rounded-full border border-line bg-surface px-3 py-1">
            <Text className="text-[11px] font-bold text-muted">{items.length} items tracked</Text>
          </View>
        </View>

        <View className="mt-5 flex-row gap-3">
          <Button
            label="Consume"
            icon="minus"
            variant="secondary"
            size="sm"
            onPress={() => navigation.navigate('Scanner', { mode: 'consume' })}
            className="flex-1"
          />
          <Button
            label="Add Item"
            icon="plus"
            variant="primary"
            size="sm"
            onPress={() => navigation.navigate('Scanner', { mode: 'add' })}
            className="flex-1"
          />
        </View>

        <View className="mt-6 flex-row flex-wrap gap-3">
          <StatCard
            label="Total Items"
            value={items.length}
            onPress={() => navigation.navigate('Pantry')}
          />
          <StatCard
            label="Shopping List"
            value={uncheckedCount}
            onPress={() => navigation.navigate('Shopping')}
          />
          <StatCard
            label="Low Stock"
            value={lowStockItems.length}
            alert={lowStockItems.length > 0}
            onPress={() => navigation.navigate('Pantry')}
          />
          <StatCard
            label="Expiring Soon"
            value={expiringSoonItems.length}
            alert={expiringSoonItems.length > 0}
            onPress={() => navigation.navigate('Pantry')}
          />
        </View>

        <SmartSuggestionsCard inventory={inventory} activity={activity} shoppingItems={shoppingNames} />

        {(aiTip || aiTipLoading) && (
          <Card className="mt-6">
            <CardHeader icon="sparkles" iconColor={colors.primary} title="AI insight" />
            <Text className="text-sm text-muted">{aiTipLoading ? 'Generating tip…' : aiTip}</Text>
          </Card>
        )}

        {activity.length > 0 ? (
          <Card className="mt-6">
            <CardHeader icon="trending-down" iconColor={colors.primary} title="Recent activity" />
            <View className="gap-2">
              {activity.slice(0, 6).map((ev, i) => (
                <View key={`${ev.actorId}-${ev.target}-${i}`} className="flex-row items-center gap-3 rounded-xl bg-canvas px-3 py-2">
                  <Icon name="sparkles" size={14} color={colors.muted} />
                  <View className="flex-1">
                    <Text className="text-sm text-ink">
                      <Text className="font-bold">{ev.actorName}</Text> {ev.verb} {ev.target}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        {lowStockItems.length > 0 ? (
          <Card className="mt-6">
            <CardHeader
              icon="warning"
              iconColor={colors.primary}
              title="Low Stock"
              onViewAll={() => navigation.navigate('Pantry')}
            />
            <View className="gap-3">
              {lowStockItems.slice(0, 5).map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </View>
          </Card>
        ) : null}

        <Card className="mt-6">
          <CardHeader
            icon="pantry"
            iconColor={colors.ink}
            title="Recently Added"
            onViewAll={() => navigation.navigate('Pantry')}
          />
          {items.length === 0 ? (
            <EmptyState
              icon="pantry"
              title="No items yet"
              description="Add something to your pantry."
              variant="inline"
              actionLabel="Add item manually"
              onAction={() => navigation.navigate('Pantry', { openAdd: true })}
            />
          ) : (
            <View className="gap-3">
              {items.slice(0, 5).map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </View>
          )}
        </Card>

        {totalValue > 0 ? (
          <View className="mt-6 rounded-card bg-primary p-6">
            <Text className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/80">
              Pantry Value
            </Text>
            <Text className="text-4xl font-black text-white">
              <Text className="text-2xl font-bold text-white/75">$</Text>
              {totalValue.toFixed(2)}
            </Text>
            <Text className="mt-3 text-xs text-white/90">
              Based on purchase prices of {items.length} items
            </Text>
          </View>
        ) : null}

        <Card className="mt-6">
          <CardHeader icon="shelf" iconColor={colors.ink} title="Locations" />
          {locations.length === 0 ? (
            <EmptyState
              icon="shelf"
              title="No locations"
              description="Set up storage spots in Settings."
              variant="inline"
              actionLabel="Settings"
              onAction={() => navigation.navigate('Settings')}
            />
          ) : (
            <View className="gap-3">
              {locations.map((loc) => (
                <LocationRow
                  key={loc.id}
                  location={loc}
                  count={items.filter((i) => i.location_id === loc.id).length}
                />
              ))}
            </View>
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

function StatCard({
  label,
  value,
  alert,
  onPress,
}: {
  label: string;
  value: number;
  alert?: boolean;
  onPress: () => void;
}) {
  const highlight = alert && value > 0;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }, { width: '47.5%' }]}
      className={`grow rounded-card border bg-surface p-5 ${
        highlight ? 'border-danger' : 'border-line'
      }`}
    >
      <Text className="text-3xl font-black text-ink">{value}</Text>
      <Text className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted">
        {label}
      </Text>
    </Pressable>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <View className={`rounded-card border border-line bg-surface p-5 ${className}`}>{children}</View>
  );
}

function CardHeader({
  icon,
  iconColor,
  title,
  onViewAll,
}: {
  icon: Parameters<typeof Icon>[0]['name'];
  iconColor: string;
  title: string;
  onViewAll?: () => void;
}) {
  return (
    <View className="mb-4 flex-row items-center justify-between">
      <View className="flex-row items-center gap-2">
        <Icon name={icon} size={20} color={iconColor} />
        <Text className="text-lg font-bold text-ink">{title}</Text>
      </View>
      {onViewAll ? (
        <Pressable onPress={onViewAll}>
          <Text className="text-xs font-bold uppercase tracking-wider text-muted">View All</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ItemRow({ item }: { item: PantryItem }) {
  return (
    <View className="flex-row items-center gap-4 rounded-xl border border-transparent p-1">
      <View className="h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-line bg-canvas">
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} className="h-full w-full" resizeMode="contain" />
        ) : (
          <Icon name={getCategoryIcon(item.category)} size={20} color={colors.muted} />
        )}
      </View>
      <View className="flex-1">
        <Text numberOfLines={1} className="text-sm font-bold text-ink">
          {item.name}
        </Text>
        <Text numberOfLines={1} className="text-xs font-medium text-muted">
          {item.brand || item.category}
        </Text>
      </View>
      <Text className="text-sm font-black text-ink">
        {item.quantity}
        <Text className="text-[10px] font-bold uppercase text-muted"> {item.unit}</Text>
      </Text>
    </View>
  );
}

function LocationRow({ location, count }: { location: StorageLocation; count: number }) {
  return (
    <View className="flex-row items-center justify-between rounded-xl border border-line p-3">
      <View className="flex-row items-center gap-3">
        <View className="h-8 w-8 items-center justify-center rounded-lg bg-canvas">
          <Icon name={getLocationIcon(location.name)} size={16} color={colors.ink} />
        </View>
        <Text className="text-sm font-bold text-ink">{location.name}</Text>
      </View>
      <Text className="text-xs font-semibold text-muted">{count} items</Text>
    </View>
  );
}
