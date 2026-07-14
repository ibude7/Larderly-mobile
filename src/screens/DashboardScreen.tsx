import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack } from 'tamagui';
import {
  HomeAlertColumns,
  HomeGreeting,
  HomeInventoryLocations,
  HomeOverview,
  HomeQuickAdd,
  HomeRecentlyAdded,
  HomeSearchScan,
} from '../components/home';
import { useAuth } from '../contexts/AuthContext';
import { useInventory } from '../contexts/InventoryContext';
import { useProfile } from '../contexts/ProfileContext';
import { defaultStorageLocations, locationNameFromId } from '../lib/inventoryMapper';
import { useAppColors } from '../hooks/useAppColors';
import { useScale } from '../theme/scale';
import { getExpiryInfo } from '../components/pantry/pantryExpiry';
import type { TabScreenNavigationProp } from '../navigation/types';
import type { PantryItem } from '../types';

export default function DashboardScreen() {
  const navigation = useNavigation<TabScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { s, fsLayout } = useScale();
  const c = useAppColors();
  const { user } = useAuth();
  const { userProfile } = useProfile();
  const { items, locations: rawLocations, lowStockItems, expiringSoonItems } = useInventory();

  const firstName =
    userProfile?.firstName || user?.displayName?.split(' ')[0] || 'Guest';

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const locations = useMemo(() => {
    if (rawLocations.length) return rawLocations;
    return defaultStorageLocations(user?.uid ?? 'local');
  }, [rawLocations, user?.uid]);

  const locationLabel = (item: PantryItem) => locationNameFromId(item.location_id, locations);

  const urgent = useMemo(
    () =>
      [...expiringSoonItems]
        .sort((a, b) => {
          const da = getExpiryInfo(a.expiry_date).days ?? 99;
          const db = getExpiryInfo(b.expiry_date).days ?? 99;
          return da - db;
        })
        .slice(0, 3),
    [expiringSoonItems],
  );

  const low = useMemo(() => lowStockItems.slice(0, 3), [lowStockItems]);

  const categoryCount = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean));
    return set.size;
  }, [items]);

  const locationCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const loc of locations) map[loc.id] = 0;
    for (const item of items) {
      const key = item.location_id ?? locations[0]?.id;
      if (!key) continue;
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [items, locations]);

  const recent = useMemo(
    () =>
      [...items]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 8),
    [items],
  );

  const goPantry = (params?: { openAdd?: boolean; filterExpiration?: string }) => {
    navigation.navigate('Pantry', params);
  };

  const goScanner = () => navigation.navigate('Scanner', { mode: 'add' });

  const tabPad = fsLayout(100);

  return (
    <View style={{ flex: 1, backgroundColor: c.canvas }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + s(12),
          paddingHorizontal: s(16),
          paddingBottom: insets.bottom + tabPad,
          gap: s(18),
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <HomeGreeting
          greeting={greeting}
          name={firstName}
          onBell={() => navigation.navigate('Notifications')}
          onProfile={() => navigation.navigate('Settings')}
        />

        <HomeSearchScan onSearch={() => navigation.navigate('Search')} onScan={goScanner} />

        <HomeQuickAdd
          onScan={goScanner}
          onManual={() => goPantry({ openAdd: true })}
          onRecipe={() => navigation.navigate('Meals')}
          onCategory={() => navigation.navigate('SettingsHousehold')}
        />

        <HomeOverview
          total={items.length}
          expiring={expiringSoonItems.length}
          lowStock={lowStockItems.length}
          categories={categoryCount}
          onTotal={() => goPantry()}
          onExpiring={() => goPantry({ filterExpiration: 'soon' })}
          onLow={() => goPantry({ filterExpiration: 'low' })}
          onCategories={() => goPantry()}
        />

        <HomeAlertColumns
          expiring={urgent}
          lowStock={low}
          locationLabel={locationLabel}
          onViewExpiring={() => goPantry({ filterExpiration: 'soon' })}
          onViewLow={() => goPantry({ filterExpiration: 'low' })}
          onItem={() => goPantry()}
        />

        <HomeInventoryLocations
          locations={locations}
          counts={locationCounts}
          total={Math.max(items.length, 1)}
          onViewAll={() => goPantry()}
          onLocation={() => goPantry()}
        />

        <HomeRecentlyAdded
          items={recent}
          locationLabel={locationLabel}
          onViewAll={() => goPantry()}
          onItem={() => goPantry()}
        />

        <YStack style={{ height: s(8) }} />
      </ScrollView>
    </View>
  );
}
