import type { ComponentType } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import {
  Bell,
  Box,
  LayoutGrid,
  Plus,
  ScanBarcode,
  Search,
  Trash2,
  TrendingDown,
  User,
  UtensilsCrossed,
  Clock,
} from '../ui/Glyph';
import { Icon } from '../ui/Icon';
import { settingsType } from '../settings/settingsFonts';
import { SettingsGlass } from '../settings/SettingsGlass';
import { SettingsChromeButton } from '../settings/SettingsChromeButton';
import { HomeSectionHeader, HomePanel } from './HomeSection';
import { HomeSparkline } from './HomeSparkline';
import { HomeItemThumb } from './HomeItemThumb';
import { expiryCountdownLabel, relativeAddedLabel } from './homeFormat';
import { getExpiryInfo } from '../pantry/pantryExpiry';
import { resolveStorageLocationIcon } from '../../lib/appIcons';
import { categoryFromName } from '../../lib/categories';
import { useAppColors } from '../../hooks/useAppColors';
import { useSettingsTheme } from '../../theme/settings';
import { useScale } from '../../theme/scale';
import type { PantryItem, StorageLocation } from '../../types';

type GlyphIcon = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

export function HomeGreeting({
  greeting,
  name,
  onBell,
  onProfile,
  showNotifDot = true,
}: {
  greeting: string;
  name: string;
  onBell: () => void;
  onProfile: () => void;
  showNotifDot?: boolean;
}) {
  const { s, fs } = useScale();
  const c = useAppColors();

  return (
    <XStack style={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: s(12) }}>
      <YStack style={{ flex: 1, minWidth: 0, gap: s(4) }}>
        <Text style={[settingsType('regular'), { fontSize: fs(15), color: c.muted }]}>{greeting},</Text>
        <Text
          numberOfLines={1}
          style={[settingsType('bold'), { fontSize: fs(28), color: c.ink, letterSpacing: fs(-0.6) }]}
        >
          {name} 👋
        </Text>
        <Text style={[settingsType('regular'), { fontSize: fs(14), color: c.muted, marginTop: s(2) }]}>
          Here's what's in your pantry.
        </Text>
      </YStack>
      <XStack style={{ gap: s(8), paddingTop: s(2) }}>
        <View>
          <SettingsChromeButton icon={Bell} onPress={onBell} accessibilityLabel="Notifications" />
          {showNotifDot ? (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: s(6),
                right: s(6),
                width: s(9),
                height: s(9),
                borderRadius: s(99),
                backgroundColor: c.success,
                borderWidth: 1.5,
                borderColor: c.surfaceElevated,
              }}
            />
          ) : null}
        </View>
        <SettingsChromeButton icon={User} onPress={onProfile} accessibilityLabel="Profile" />
      </XStack>
    </XStack>
  );
}

export function HomeSearchScan({
  onSearch,
  onScan,
}: {
  onSearch: () => void;
  onScan: () => void;
}) {
  const { s, fs, fsLayout } = useScale();
  const c = useAppColors();

  return (
    <XStack style={{ alignItems: 'center', gap: s(10) }}>
      <Pressable
        onPress={onSearch}
        accessibilityRole="button"
        accessibilityLabel="Search pantry"
        style={{ flex: 1, minWidth: 0 }}
      >
        <SettingsGlass
          elevated
          interactive
          radius={s(18)}
          contentStyle={{
            minHeight: fsLayout(48),
            flexDirection: 'row',
            alignItems: 'center',
            gap: s(8),
            paddingHorizontal: s(14),
          }}
        >
          <Search size={fs(18)} color={c.muted} strokeWidth={2} />
          <Text
            numberOfLines={1}
            style={[settingsType('regular'), { flex: 1, fontSize: fs(14), color: c.muted }]}
          >
            Search items in your pantry...
          </Text>
        </SettingsGlass>
      </Pressable>
      <Pressable
        onPress={onScan}
        accessibilityRole="button"
        accessibilityLabel="Scan"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: s(6),
          minHeight: fsLayout(48),
          paddingHorizontal: s(16),
          borderRadius: s(99),
          backgroundColor: c.success,
        }}
      >
        <ScanBarcode size={fs(16)} color="#FFFFFF" strokeWidth={2.2} />
        <Text style={[settingsType('semibold'), { fontSize: fs(14), color: '#FFFFFF' }]}>Scan</Text>
      </Pressable>
    </XStack>
  );
}

export function HomeQuickAdd({
  onScan,
  onManual,
  onRecipe,
  onCategory,
}: {
  onScan: () => void;
  onManual: () => void;
  onRecipe: () => void;
  onCategory: () => void;
}) {
  const { s, fs } = useScale();
  const c = useAppColors();
  const actions: Array<{ label: string; icon: GlyphIcon; onPress: () => void }> = [
    { label: 'Scan item', icon: ScanBarcode, onPress: onScan },
    { label: 'Add manually', icon: Plus, onPress: onManual },
    { label: 'From recipe', icon: UtensilsCrossed, onPress: onRecipe },
    { label: 'Add category', icon: Box, onPress: onCategory },
  ];

  return (
    <HomePanel>
      <YStack style={{ gap: s(2) }}>
        <Text style={[settingsType('bold'), { fontSize: fs(17), color: c.ink }]}>Quick add</Text>
        <Text style={[settingsType('regular'), { fontSize: fs(13), color: c.muted }]}>
          Add items in seconds
        </Text>
      </YStack>
      <XStack style={{ justifyContent: 'space-between', gap: s(6) }}>
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <Pressable
              key={a.label}
              onPress={a.onPress}
              style={{ flex: 1, alignItems: 'center', gap: s(8) }}
              accessibilityRole="button"
              accessibilityLabel={a.label}
            >
              <SettingsGlass
                elevated
                interactive
                radius={s(26)}
                style={{ width: s(52), height: s(52) }}
                contentStyle={{
                  width: s(52),
                  height: s(52),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={fs(20)} color={c.ink} strokeWidth={2} />
              </SettingsGlass>
              <Text
                numberOfLines={2}
                style={[
                  settingsType('medium'),
                  { fontSize: fs(11), color: c.inkSoft, textAlign: 'center', lineHeight: fs(14) },
                ]}
              >
                {a.label}
              </Text>
            </Pressable>
          );
        })}
      </XStack>
    </HomePanel>
  );
}

export function HomeOverview({
  total,
  expiring,
  lowStock,
  categories,
  onTotal,
  onExpiring,
  onLow,
  onCategories,
}: {
  total: number;
  expiring: number;
  lowStock: number;
  categories: number;
  onTotal: () => void;
  onExpiring: () => void;
  onLow: () => void;
  onCategories: () => void;
}) {
  const { s, fs } = useScale();
  const c = useAppColors();
  const t = useSettingsTheme();

  const cards: Array<{
    key: string;
    label: string;
    value: number;
    unit: string;
    color: string;
    icon: GlyphIcon;
    spark: boolean;
    onPress: () => void;
  }> = [
    {
      key: 'total',
      label: 'Total items',
      value: total,
      unit: 'items',
      color: '#5B9A6B',
      icon: Trash2,
      spark: true,
      onPress: onTotal,
    },
    {
      key: 'exp',
      label: 'Expiring soon',
      value: expiring,
      unit: 'items',
      color: '#E08A4A',
      icon: Clock,
      spark: true,
      onPress: onExpiring,
    },
    {
      key: 'low',
      label: 'Low stock',
      value: lowStock,
      unit: 'items',
      color: '#8B6BB8',
      icon: TrendingDown,
      spark: true,
      onPress: onLow,
    },
    {
      key: 'cat',
      label: 'Categories',
      value: categories,
      unit: 'categories',
      color: t.blue,
      icon: LayoutGrid,
      spark: false,
      onPress: onCategories,
    },
  ];

  return (
    <YStack style={{ gap: s(12) }}>
      <Text style={[settingsType('bold'), { fontSize: fs(18), color: c.ink }]}>Overview</Text>
      <XStack style={{ gap: s(8), alignItems: 'stretch' }}>
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Pressable key={card.key} onPress={card.onPress} style={{ flex: 1, minWidth: 0 }}>
              <SettingsGlass
                elevated
                interactive
                radius={s(18)}
                style={{ flex: 1, minHeight: s(122) }}
                contentStyle={{
                  flex: 1,
                  minHeight: s(122),
                  paddingTop: s(12),
                  paddingHorizontal: s(10),
                  paddingBottom: card.spark ? s(34) : s(12),
                  overflow: 'hidden',
                }}
              >
                <XStack style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: s(4) }}>
                  <Text
                    numberOfLines={2}
                    style={[
                      settingsType('medium'),
                      {
                        flex: 1,
                        minWidth: 0,
                        fontSize: fs(11),
                        lineHeight: fs(14),
                        color: c.muted,
                      },
                    ]}
                  >
                    {card.label}
                  </Text>
                  <Icon size={fs(13)} color={card.color} strokeWidth={2.2} />
                </XStack>

                <YStack style={{ marginTop: s(10), gap: s(0), flexShrink: 0, zIndex: 1 }}>
                  <Text
                    numberOfLines={1}
                    style={[
                      settingsType('bold'),
                      {
                        fontSize: fs(26),
                        lineHeight: fs(30),
                        color: c.ink,
                        letterSpacing: fs(-0.8),
                      },
                    ]}
                  >
                    {card.value}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[settingsType('regular'), { fontSize: fs(11), color: c.muted, marginTop: s(1) }]}
                  >
                    {card.unit}
                  </Text>
                </YStack>

                {card.spark ? <HomeSparkline color={card.color} /> : null}
              </SettingsGlass>
            </Pressable>
          );
        })}
      </XStack>
    </YStack>
  );
}

export function HomeAlertColumns({
  expiring,
  lowStock,
  locationLabel,
  onViewExpiring,
  onViewLow,
  onItem,
}: {
  expiring: PantryItem[];
  lowStock: PantryItem[];
  locationLabel: (item: PantryItem) => string;
  onViewExpiring: () => void;
  onViewLow: () => void;
  onItem: (item: PantryItem) => void;
}) {
  const { s, fs } = useScale();
  const c = useAppColors();
  const t = useSettingsTheme();

  return (
    <XStack style={{ gap: s(10), alignItems: 'stretch' }}>
      <HomePanel style={{ flex: 1, minWidth: 0 }}>
        <XStack style={{ alignItems: 'center', justifyContent: 'space-between', gap: s(6) }}>
          <XStack style={{ flex: 1, minWidth: 0, alignItems: 'center', gap: s(6) }}>
            <Clock size={fs(14)} color={t.orange} strokeWidth={2.2} />
            <Text
              numberOfLines={1}
              style={[settingsType('semibold'), { fontSize: fs(13), color: c.ink, flexShrink: 1 }]}
            >
              Expiring soon
            </Text>
          </XStack>
          <Pressable onPress={onViewExpiring} hitSlop={8} accessibilityRole="button" accessibilityLabel="View all expiring">
            <Text style={[settingsType('semibold'), { fontSize: fs(12), color: c.muted }]}>View all ›</Text>
          </Pressable>
        </XStack>
        {expiring.length === 0 ? (
          <Text style={[settingsType('regular'), { fontSize: fs(12), color: c.muted }]}>
            Nothing urgent.
          </Text>
        ) : (
          expiring.map((item) => {
            const info = getExpiryInfo(item.expiry_date);
            return (
              <Pressable key={item.id} onPress={() => onItem(item)}>
                <XStack style={{ gap: s(8), alignItems: 'center' }}>
                  <HomeItemThumb name={item.name} imageUrl={item.image_url} size={36} />
                  <YStack style={{ flex: 1, minWidth: 0, gap: s(1) }}>
                    <Text
                      numberOfLines={1}
                      style={[settingsType('semibold'), { fontSize: fs(13), color: c.ink }]}
                    >
                      {item.name}
                    </Text>
                    <Text numberOfLines={1} style={[settingsType('regular'), { fontSize: fs(11), color: c.muted }]}>
                      {locationLabel(item)} · {item.quantity} {item.unit}
                    </Text>
                    <Text style={[settingsType('semibold'), { fontSize: fs(11), color: c.danger }]}>
                      {expiryCountdownLabel(info.days)}
                    </Text>
                  </YStack>
                </XStack>
              </Pressable>
            );
          })
        )}
      </HomePanel>

      <HomePanel style={{ flex: 1, minWidth: 0 }}>
        <XStack style={{ alignItems: 'center', justifyContent: 'space-between', gap: s(6) }}>
          <XStack style={{ flex: 1, minWidth: 0, alignItems: 'center', gap: s(6) }}>
            <TrendingDown size={fs(14)} color={t.purple} strokeWidth={2.2} />
            <Text
              numberOfLines={1}
              style={[settingsType('semibold'), { fontSize: fs(13), color: c.ink, flexShrink: 1 }]}
            >
              Low stock
            </Text>
          </XStack>
          <Pressable onPress={onViewLow} hitSlop={8} accessibilityRole="button" accessibilityLabel="View all low stock">
            <Text style={[settingsType('semibold'), { fontSize: fs(12), color: c.muted }]}>View all ›</Text>
          </Pressable>
        </XStack>
        {lowStock.length === 0 ? (
          <Text style={[settingsType('regular'), { fontSize: fs(12), color: c.muted }]}>
            Stock looks good.
          </Text>
        ) : (
          lowStock.map((item) => (
            <Pressable key={item.id} onPress={() => onItem(item)}>
              <XStack style={{ gap: s(8), alignItems: 'center' }}>
                <HomeItemThumb name={item.name} imageUrl={item.image_url} size={36} />
                <YStack style={{ flex: 1, minWidth: 0, gap: s(1) }}>
                  <Text
                    numberOfLines={1}
                    style={[settingsType('semibold'), { fontSize: fs(13), color: c.ink }]}
                  >
                    {item.name}
                  </Text>
                  <Text numberOfLines={1} style={[settingsType('regular'), { fontSize: fs(11), color: c.muted }]}>
                    {locationLabel(item)} · {item.quantity} {item.unit}
                  </Text>
                </YStack>
                <View
                  style={{
                    paddingHorizontal: s(8),
                    paddingVertical: s(3),
                    borderRadius: s(99),
                    backgroundColor: t.tint(t.purple, 0.16),
                  }}
                >
                  <Text style={[settingsType('semibold'), { fontSize: fs(10), color: t.purple }]}>Low</Text>
                </View>
              </XStack>
            </Pressable>
          ))
        )}
      </HomePanel>
    </XStack>
  );
}

export function HomeInventoryLocations({
  locations,
  counts,
  total,
  onViewAll,
  onLocation,
}: {
  locations: StorageLocation[];
  counts: Record<string, number>;
  total: number;
  onViewAll: () => void;
  onLocation: (locationId: string) => void;
}) {
  const { s, fs } = useScale();
  const c = useAppColors();
  const t = useSettingsTheme();

  return (
    <YStack style={{ gap: s(12) }}>
      <HomeSectionHeader
        title="Your inventory"
        subtitle="See what you have and keep it organized."
        onAction={onViewAll}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: s(10) }}>
        {locations.map((loc) => {
          const count = counts[loc.id] ?? 0;
          const accent = loc.color || c.success;
          const iconName = resolveStorageLocationIcon(loc);
          const pct = total > 0 ? Math.max(0.08, Math.min(1, count / total)) : 0.08;
          return (
            <Pressable key={loc.id} onPress={() => onLocation(loc.id)}>
              <SettingsGlass
                elevated
                interactive
                radius={s(18)}
                style={{ width: s(112) }}
                contentStyle={{ padding: s(14), gap: s(10) }}
              >
                <SettingsGlass
                  elevated
                  interactive={false}
                  accent={accent}
                  radius={s(12)}
                  style={{ width: s(36), height: s(36) }}
                  contentStyle={{
                    width: s(36),
                    height: s(36),
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name={iconName} size={fs(18)} color={accent} />
                </SettingsGlass>
                <YStack style={{ gap: s(2) }}>
                  <Text style={[settingsType('semibold'), { fontSize: fs(14), color: c.ink }]}>{loc.name}</Text>
                  <Text style={[settingsType('regular'), { fontSize: fs(12), color: c.muted }]}>
                    {count} items
                  </Text>
                </YStack>
                <View
                  style={{
                    height: s(4),
                    borderRadius: s(99),
                    backgroundColor: t.tint(accent, 0.14),
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      width: `${Math.round(pct * 100)}%`,
                      height: '100%',
                      borderRadius: s(99),
                      backgroundColor: accent,
                    }}
                  />
                </View>
              </SettingsGlass>
            </Pressable>
          );
        })}
      </ScrollView>
    </YStack>
  );
}

export function HomeRecentlyAdded({
  items,
  locationLabel,
  onViewAll,
  onItem,
}: {
  items: PantryItem[];
  locationLabel: (item: PantryItem) => string;
  onViewAll: () => void;
  onItem: (item: PantryItem) => void;
}) {
  const { s, fs } = useScale();
  const c = useAppColors();

  return (
    <YStack style={{ gap: s(10) }}>
      <HomeSectionHeader title="Recently added" onAction={onViewAll} />
      {items.length === 0 ? (
        <Text style={[settingsType('regular'), { fontSize: fs(13), color: c.muted }]}>
          Newly scanned items will show up here.
        </Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: s(10) }}>
          {items.map((item) => (
            <Pressable key={item.id} onPress={() => onItem(item)}>
              <SettingsGlass
                elevated
                interactive
                radius={s(16)}
                style={{ width: s(108) }}
                contentStyle={{ overflow: 'hidden', padding: 0, gap: 0 }}
              >
                <View
                  style={{
                    height: s(80),
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {item.image_url ? (
                    <HomeItemThumb name={item.name} imageUrl={item.image_url} size={64} />
                  ) : (
                    <Text style={{ fontSize: fs(32) }}>{categoryFromName(item.name).emoji}</Text>
                  )}
                </View>
                <YStack style={{ padding: s(10), gap: s(1) }}>
                  <Text
                    numberOfLines={1}
                    style={[settingsType('semibold'), { fontSize: fs(13), color: c.ink }]}
                  >
                    {item.name}
                  </Text>
                  <Text numberOfLines={1} style={[settingsType('regular'), { fontSize: fs(11), color: c.muted }]}>
                    {locationLabel(item)}
                  </Text>
                  <Text style={[settingsType('medium'), { fontSize: fs(10), color: c.muted }]}>
                    {relativeAddedLabel(item.created_at)}
                  </Text>
                </YStack>
              </SettingsGlass>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </YStack>
  );
}
