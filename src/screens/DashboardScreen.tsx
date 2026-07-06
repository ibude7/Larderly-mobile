import { useMemo, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { TabScreenNavigationProp } from '../navigation/types';
import { doc, onSnapshot } from '@react-native-firebase/firestore';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  FadeInUp,
} from 'react-native-reanimated';
import AppHeader from '../components/layout/AppHeader';
import AnimatedNumber from '../components/ui/AnimatedNumber';
import DashboardStatSkeleton from '../components/dashboard/DashboardStatSkeleton';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import SmartSuggestionsCard from '../components/dashboard/SmartSuggestionsCard';
import StatTileRow from '../components/dashboard/StatTileRow';
import ExpiryAlertBanner from '../components/dashboard/ExpiryAlertBanner';
import HouseholdBanner from '../components/dashboard/HouseholdBanner';
import ActivityFeedCard from '../components/dashboard/ActivityFeedCard';
import { useInventory } from '../contexts/InventoryContext';
import { useShopping } from '../contexts/ShoppingContext';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useActivity } from '../hooks/useActivity';
import { useHousehold } from '../contexts/HouseholdContext';
import { useAppColors } from '../hooks/useAppColors';
import { db } from '../lib/firebase';
import { getCategoryIcon, getLocationIcon } from '../lib/appIcons';
import { pantryItemToInventory } from '../lib/pantryInsights';
import { generateDashboardTip } from '../lib/recipeGen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PantryItem, StorageLocation } from '../types';

export default function DashboardScreen() {
  const navigation = useNavigation<TabScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const c = useAppColors();
  const { householdId } = useHousehold();
  const stats = useDashboardStats();
  const { itemCount, lowStockItems, expiringSoonItems, uncheckedCount, totalValue, loading: statsLoading } = stats;
  const { items, locations } = useInventory();
  const { shoppingList } = useShopping();
  const activity = useActivity();

  const itemsAddedToday = useMemo(() => {
    return items.filter((i) => {
      if (!i.created_at) return false;
      const d = new Date(i.created_at);
      return d.toDateString() === new Date().toDateString();
    }).length;
  }, [items]);

  const shoppingAddedToday = useMemo(() => {
    return shoppingList.filter((s) => {
      if (!s.created_at) return false;
      const d = new Date(s.created_at);
      return d.toDateString() === new Date().toDateString();
    }).length;
  }, [shoppingList]);

  const itemsTrend = itemsAddedToday > 0 ? `+${itemsAddedToday} today` : 'Stable today';
  const shoppingTrend = shoppingAddedToday > 0 ? `+${shoppingAddedToday} today` : 'No new items';
  const [householdName, setHouseholdName] = useState('Your household');
  const [householdMembers, setHouseholdMembers] = useState<string[]>([]);
  const [householdMemberNames, setHouseholdMemberNames] = useState<Record<string, string>>({});
  const [inviteCode, setInviteCode] = useState<string | undefined>(undefined);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [aiTipLoading, setAiTipLoading] = useState(false);

  useEffect(() => {
    if (!householdId) return;
    const unsub = onSnapshot(doc(db, 'households', householdId), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() ?? {};
      setHouseholdName((data.name as string) ?? 'Your household');
      setHouseholdMembers((data.members as string[]) ?? []);
      setHouseholdMemberNames((data.memberNames as Record<string, string>) ?? {});
      setInviteCode((data.inviteCode as string) ?? undefined);
    });
    return unsub;
  }, [householdId]);

  useEffect(() => {
    if (!itemCount) return;
    const cacheKey = `larderly:tip:${new Date().toDateString()}`;
    AsyncStorage.getItem(cacheKey).then((cached) => {
      if (cached) {
        setAiTip(cached);
        return;
      }
      setAiTipLoading(true);
      const summary = `${itemCount} items, ${lowStockItems.length} low stock, ${expiringSoonItems.length} expiring soon`;
      generateDashboardTip(summary)
        .then((tip) => {
          setAiTip(tip);
          AsyncStorage.setItem(cacheKey, tip);
        })
        .catch(() => {})
        .finally(() => setAiTipLoading(false));
    });
  }, [itemCount, lowStockItems.length, expiringSoonItems.length]);

  const inventory = useMemo(() => items.map(pantryItemToInventory), [items]);
  const shoppingNames = useMemo(
    () => shoppingList.filter((s) => !s.is_checked).map((s) => ({ productName: s.name })),
    [shoppingList],
  );

  const subtitle =
    itemCount === 0
      ? 'Your pantry is empty — start adding items.'
      : `You're tracking ${itemCount} items. ${
          uncheckedCount > 0 ? `${uncheckedCount} on your list.` : 'List is clear.'
        }`;

  return (
    <View className="flex-1 bg-canvas dark:bg-canvas-dark">
      <AppHeader
        onOpenSettings={() => navigation.navigate('Settings')}
        right={
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => navigation.navigate('Search')}
              className="h-10 w-10 items-center justify-center rounded-full border border-line dark:border-line-dark bg-surface dark:bg-surface-dark"
            >
              <Icon name="search" size={18} color={c.ink} />
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('Settings')}
              className="h-10 w-10 items-center justify-center rounded-full border border-line dark:border-line-dark bg-surface dark:bg-surface-dark"
            >
              <Icon name="settings" size={18} color={c.ink} />
            </Pressable>
          </View>
        }
      />
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 90 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.duration(450)}>
          <HouseholdBanner
            name={householdName}
            memberNames={householdMemberNames}
            members={householdMembers}
            inviteCode={inviteCode}
            itemCount={itemCount}
          />
          <Text className="mt-1 font-medium text-muted dark:text-muted-dark">{subtitle}</Text>
        </Animated.View>

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

        {statsLoading ? (
          <View className="mt-6">
            <DashboardStatSkeleton />
          </View>
        ) : (
          <Animated.View entering={FadeInUp.duration(450).delay(80)} className="mt-6">
            <StatTileRow stats={stats} itemsTrend={itemsTrend} shoppingTrend={shoppingTrend} />
          </Animated.View>
        )}

        {totalValue > 0 ? (
          <LinearGradient
            colors={[c.teal, c.success]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 28, borderBottomLeftRadius: 10, padding: 24, marginTop: 24 }}
          >
            <Text className="mb-1 text-[11px] font-bold uppercase tracking-widest text-[#04231A]/70">
              Pantry Value
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={{ color: 'rgba(4,35,26,0.6)', fontFamily: 'Outfit_800ExtraBold', fontSize: 28 }}>
                $
              </Text>
              <AnimatedNumber
                value={totalValue}
                formatFn={(n) => n.toFixed(2)}
                style={{ color: '#04231A', fontFamily: 'Outfit_800ExtraBold', fontSize: 42 }}
              />
            </View>
            <Text className="mt-3 text-xs font-medium text-[#04231A]/80">
              Based on purchase prices of {itemCount} items
            </Text>
          </LinearGradient>
        ) : null}

        <Animated.View entering={FadeInUp.duration(450).delay(160)}>
          <ExpiryAlertBanner
            items={expiringSoonItems}
            onPress={() => navigation.navigate('Pantry', { filterExpiration: 'Expiring Soon' })}
          />
        </Animated.View>

        <SmartSuggestionsCard inventory={inventory} activity={activity} shoppingItems={shoppingNames} />

        {(aiTip || aiTipLoading) && (
          <Card className="mt-6">
            <CardHeader icon="sparkles" iconColor={c.primary} title="AI insight" />
            {aiTipLoading ? <AiTipSkeleton /> : <Text className="text-sm text-muted dark:text-muted-dark">{aiTip}</Text>}
          </Card>
        )}

        <ActivityFeedCard activities={activity} />

        {lowStockItems.length > 0 ? (
          <Card className="mt-6">
            <CardHeader
              icon="warning"
              iconColor={c.primary}
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
            iconColor={c.ink}
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

        <Card className="mt-6">
          <CardHeader icon="shelf" iconColor={c.ink} title="Locations" />
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

function AiTipSkeleton() {
  const c = useAppColors();
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 700 }),
        withTiming(1, { duration: 700 }),
      ),
      -1,
      false,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const widths = ['100%', '85%', '60%'] as const;

  return (
    <View className="gap-2.5">
      {widths.map((width, index) => (
        <Animated.View
          key={index}
          style={[
            animatedStyle,
            {
              width,
              height: 12,
              borderRadius: 6,
              backgroundColor: c.muted,
            },
          ]}
        />
      ))}
    </View>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <View
      className={`rounded-card border border-line dark:border-line-dark bg-surface dark:bg-surface-dark p-5 ${className}`}
    >
      {children}
    </View>
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
        <Text className="font-display text-xl text-ink dark:text-ink-dark">{title}</Text>
      </View>
      {onViewAll ? (
        <Pressable onPress={onViewAll}>
          <Text className="text-xs font-bold uppercase tracking-wider text-muted dark:text-muted-dark">View All</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ItemRow({ item }: { item: PantryItem }) {
  const c = useAppColors();

  return (
    <View className="flex-row items-center gap-4 rounded-xl border border-transparent p-1">
      <View className="h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-line dark:border-line-dark bg-canvas dark:bg-canvas-dark">
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} className="h-full w-full" contentFit="contain" />
        ) : (
          <Icon name={getCategoryIcon(item.category)} size={20} color={c.muted} />
        )}
      </View>
      <View className="flex-1">
        <Text numberOfLines={1} className="text-sm font-bold text-ink dark:text-ink-dark">
          {item.name}
        </Text>
        <Text numberOfLines={1} className="text-xs font-medium text-muted dark:text-muted-dark">
          {item.brand || item.category}
        </Text>
      </View>
      <Text className="text-sm font-black text-ink dark:text-ink-dark">
        {item.quantity}
        <Text className="text-[11px] font-bold uppercase text-muted dark:text-muted-dark"> {item.unit}</Text>
      </Text>
    </View>
  );
}

function LocationRow({ location, count }: { location: StorageLocation; count: number }) {
  const c = useAppColors();

  return (
    <View className="flex-row items-center justify-between rounded-xl border border-line dark:border-line-dark p-3">
      <View className="flex-row items-center gap-3">
        <View className="h-8 w-8 items-center justify-center rounded-lg bg-canvas dark:bg-canvas-dark">
          <Icon name={getLocationIcon(location.name)} size={16} color={c.ink} />
        </View>
        <Text className="text-sm font-bold text-ink dark:text-ink-dark">{location.name}</Text>
      </View>
      <Text className="text-xs font-semibold text-muted dark:text-muted-dark">{count} items</Text>
    </View>
  );
}
