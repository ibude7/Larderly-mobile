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
  useAnimatedReaction,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import AppHeader from '../components/layout/AppHeader';
import { BlurView } from 'expo-blur';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { Icon, IconName } from '../components/ui/Icon';
import SmartSuggestionsCard from '../components/dashboard/SmartSuggestionsCard';
import { usePantryStore } from '../contexts/PantryContext';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useActivity } from '../hooks/useActivity';
import { useAuth } from '../contexts/AuthContext';
import { useAppColors } from '../hooks/useAppColors';
import { useTheme } from '../hooks/useTheme';
import { db } from '../lib/firebase';
import { getCategoryIcon, getLocationIcon } from '../lib/appIcons';
import { pantryItemToInventory } from '../lib/pantryInsights';
import { generateDashboardTip } from '../lib/recipeGen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PantryItem, StorageLocation } from '../types';

const STAT_ICONS: Record<string, IconName> = {
  'Total Items': 'pantry',
  'Shopping List': 'cart',
  'Low Stock': 'warning',
  'Expiring Soon': 'calendar',
};

export default function DashboardScreen() {
  const navigation = useNavigation<TabScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const c = useAppColors();
  const { householdId } = useAuth();
  const { itemCount, lowStockItems, expiringSoonItems, uncheckedCount, totalValue } =
    useDashboardStats();
  const { items, locations, shoppingList } = usePantryStore();
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
    <View className="flex-1 bg-canvas dark:bg-[#0F0F13]">
      <AppHeader
        onOpenSettings={() => navigation.navigate('Settings')}
        right={
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => navigation.navigate('Search')}
              className="h-10 w-10 items-center justify-center rounded-full border border-line dark:border-[#2A2A35] bg-surface dark:bg-[#1A1A22]"
            >
              <Icon name="search" size={18} color={c.ink} />
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('Settings')}
              className="h-10 w-10 items-center justify-center rounded-full border border-line dark:border-[#2A2A35] bg-surface dark:bg-[#1A1A22]"
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
        <Text className="text-3xl font-bold text-ink dark:text-[#F0EEE9]">{householdName}</Text>
        <Text className="mt-1 font-medium text-muted dark:text-[#6B6878]">{subtitle}</Text>
        <View className="mt-2 flex-row gap-2">
          <View className="rounded-full border border-line dark:border-[#2A2A35] bg-surface dark:bg-[#1A1A22] px-3 py-1">
            <Text className="text-[11px] font-bold text-muted dark:text-[#6B6878]">{memberCount} member{memberCount === 1 ? '' : 's'}</Text>
          </View>
          <View className="rounded-full border border-line dark:border-[#2A2A35] bg-surface dark:bg-[#1A1A22] px-3 py-1">
            <Text className="text-[11px] font-bold text-muted dark:text-[#6B6878]">{itemCount} items tracked</Text>
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
            value={itemCount}
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

        {totalValue > 0 ? (
          <LinearGradient
            colors={[c.primary, c.info]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 24, padding: 24, marginTop: 24 }}
          >
            <Text className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/80">
              Pantry Value
            </Text>
            <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 42 }}>
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontWeight: '900', fontSize: 28 }}>
                $
              </Text>
              {totalValue.toFixed(2)}
            </Text>
            <Text className="mt-3 text-xs text-white/90">
              Based on purchase prices of {itemCount} items
            </Text>
          </LinearGradient>
        ) : null}

        <SmartSuggestionsCard inventory={inventory} activity={activity} shoppingItems={shoppingNames} />

        {(aiTip || aiTipLoading) && (
          <Card className="mt-6">
            <CardHeader icon="sparkles" iconColor={c.primary} title="AI insight" />
            {aiTipLoading ? <AiTipSkeleton /> : <Text className="text-sm text-muted dark:text-[#6B6878]">{aiTip}</Text>}
          </Card>
        )}

        {activity.length > 0 ? (
          <Card className="mt-6">
            <CardHeader icon="trending-down" iconColor={c.primary} title="Recent activity" />
            <View className="gap-2">
              {activity.slice(0, 6).map((ev, i) => (
                <View key={`${ev.actorId}-${ev.target}-${i}`} className="flex-row items-center gap-3 rounded-xl bg-canvas dark:bg-[#0F0F13] px-3 py-2">
                  <Icon name="sparkles" size={14} color={c.muted} />
                  <View className="flex-1">
                    <Text className="text-sm text-ink dark:text-[#F0EEE9]">
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
  const c = useAppColors();
  const theme = useTheme();
  const highlight = alert && value > 0;
  const animatedValue = useSharedValue(0);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    animatedValue.value = 0;
    animatedValue.value = withSpring(value, { duration: 600 });
  }, [animatedValue, value]);

  useAnimatedReaction(
    () => animatedValue.value,
    (current) => {
      runOnJS(setDisplayValue)(Math.round(current));
    },
  );

  const iconName = STAT_ICONS[label];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1, width: '47.5%' }]}
    >
      <BlurView
        intensity={theme === 'dark' ? 75 : 80}
        tint={theme}
        style={{
          borderRadius: 20,
          borderWidth: 1,
          borderColor: highlight ? c.danger : c.line,
          overflow: 'hidden',
          width: '100%',
          padding: 20,
          ...(highlight
            ? {
                shadowColor: c.danger,
                shadowOpacity: 0.35,
                shadowRadius: 12,
              }
            : {}),
        }}
      >
        {iconName ? (
          <View style={{ position: 'absolute', top: 16, right: 16 }}>
            <Icon name={iconName} size={16} color={highlight ? c.danger : c.muted} />
          </View>
        ) : null}
        <Text className="text-3xl font-black text-ink dark:text-[#F0EEE9]">{displayValue}</Text>
        <Text className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted dark:text-[#6B6878]">
          {label}
        </Text>
      </BlurView>
    </Pressable>
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
      className={`rounded-card border border-line dark:border-[#2A2A35] bg-surface dark:bg-[#1A1A22] p-5 ${className}`}
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
        <Text className="text-lg font-bold text-ink dark:text-[#F0EEE9]">{title}</Text>
      </View>
      {onViewAll ? (
        <Pressable onPress={onViewAll}>
          <Text className="text-xs font-bold uppercase tracking-wider text-muted dark:text-[#6B6878]">View All</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ItemRow({ item }: { item: PantryItem }) {
  const c = useAppColors();

  return (
    <View className="flex-row items-center gap-4 rounded-xl border border-transparent p-1">
      <View className="h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-line dark:border-[#2A2A35] bg-canvas dark:bg-[#0F0F13]">
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} className="h-full w-full" contentFit="contain" />
        ) : (
          <Icon name={getCategoryIcon(item.category)} size={20} color={c.muted} />
        )}
      </View>
      <View className="flex-1">
        <Text numberOfLines={1} className="text-sm font-bold text-ink dark:text-[#F0EEE9]">
          {item.name}
        </Text>
        <Text numberOfLines={1} className="text-xs font-medium text-muted dark:text-[#6B6878]">
          {item.brand || item.category}
        </Text>
      </View>
      <Text className="text-sm font-black text-ink dark:text-[#F0EEE9]">
        {item.quantity}
        <Text className="text-[10px] font-bold uppercase text-muted dark:text-[#6B6878]"> {item.unit}</Text>
      </Text>
    </View>
  );
}

function LocationRow({ location, count }: { location: StorageLocation; count: number }) {
  const c = useAppColors();

  return (
    <View className="flex-row items-center justify-between rounded-xl border border-line dark:border-[#2A2A35] p-3">
      <View className="flex-row items-center gap-3">
        <View className="h-8 w-8 items-center justify-center rounded-lg bg-canvas dark:bg-[#0F0F13]">
          <Icon name={getLocationIcon(location.name)} size={16} color={c.ink} />
        </View>
        <Text className="text-sm font-bold text-ink dark:text-[#F0EEE9]">{location.name}</Text>
      </View>
      <Text className="text-xs font-semibold text-muted dark:text-[#6B6878]">{count} items</Text>
    </View>
  );
}
