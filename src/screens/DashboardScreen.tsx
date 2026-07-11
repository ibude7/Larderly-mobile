import { useMemo, useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, Dimensions, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useNavigation } from "@react-navigation/native";
import type { TabScreenNavigationProp } from "../navigation/types";
import { doc, onSnapshot } from "@react-native-firebase/firestore";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  FadeInUp,
  FadeIn,
} from "react-native-reanimated";
import EmptyState from "../components/ui/EmptyState";
import { Icon, type IconName } from "../components/ui/Icon";
import { AppLogoMark } from "../components/ui/AppLogo";
import { useInventory } from "../contexts/InventoryContext";
import { useShopping } from "../contexts/ShoppingContext";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { useHousehold } from "../contexts/HouseholdContext";
import { useAppColors } from "../hooks/useAppColors";
import { db } from "../lib/firebase";
import { getCategoryIcon, getLocationIcon } from "../lib/appIcons";
import { generateDashboardTip } from "../lib/recipeGen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PantryItem, StorageLocation } from "../types";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = Math.min(SCREEN_W - 40, 430);

export default function DashboardScreen() {
  const navigation = useNavigation<TabScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const c = useAppColors();
  const { householdId } = useHousehold();
  const stats = useDashboardStats();
  const {
    itemCount,
    lowStockItems,
    expiringSoonItems,
    uncheckedCount,
    totalValue,
  } = stats;
  const { items, locations } = useInventory();
  const { shoppingList } = useShopping();

  const [householdName, setHouseholdName] = useState("Your Pantry");
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [aiTipLoading, setAiTipLoading] = useState(false);

  useEffect(() => {
    if (!householdId) return;
    const unsub = onSnapshot(doc(db, "households", householdId), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() ?? {};
      setHouseholdName((data.name as string) ?? "Your Pantry");
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

  const recentItems = useMemo(() => items.slice(0, 5), [items]);
  const shelfItems = useMemo(() => {
    const source =
      expiringSoonItems.length > 0 ? expiringSoonItems : recentItems;
    return source.slice(0, 6);
  }, [expiringSoonItems, recentItems]);

  const locationsWithCounts = useMemo(
    () =>
      locations
        .map((location) => ({
          location,
          count: items.filter((item) => item.location_id === location.id)
            .length,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4),
    [items, locations],
  );

  const uncheckedShopping = useMemo(
    () => shoppingList.filter((item) => !item.is_checked).length,
    [shoppingList],
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.canvas }}>
      <LinearGradient
        pointerEvents="none"
        colors={[c.primaryGlow, "transparent", c.tealGlow]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 14,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 104,
        }}
        showsVerticalScrollIndicator={false}
      >
        <DashboardChrome
          onSearch={() => navigation.navigate("Search")}
          onSettings={() => navigation.navigate("Settings")}
        />

        <Animated.View entering={FadeIn.duration(500)}>
          <SmartShelfHero
            householdName={householdName}
            itemCount={itemCount}
            expiringCount={expiringSoonItems.length}
            lowStockCount={lowStockItems.length}
            uncheckedCount={uncheckedCount}
            totalValue={totalValue}
            shelfItems={shelfItems}
            onScan={() => navigation.navigate("Scanner", { mode: "add" })}
            onUse={() => navigation.navigate("Scanner", { mode: "consume" })}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(80).springify()}>
          <View style={styles.actionRail}>
            <ActionRailItem
              icon="scanner"
              label="Scan"
              accent={c.primary}
              onPress={() => navigation.navigate("Scanner", { mode: "add" })}
            />
            <ActionRailItem
              icon="pantry"
              label="Pantry"
              accent={c.teal}
              onPress={() => navigation.navigate("Pantry")}
            />
            <ActionRailItem
              icon="cart"
              label="List"
              accent={c.info}
              onPress={() => navigation.navigate("Shopping")}
            />
            <ActionRailItem
              icon="chef"
              label="Meals"
              accent={c.amber}
              onPress={() => navigation.navigate("Meals")}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(130).springify()}>
          <GlassSection
            title={
              expiringSoonItems.length > 0 ? "Expiring Soon" : "Recently Added"
            }
            eyebrow="Inventory"
            actionLabel="View pantry"
            onAction={() =>
              navigation.navigate(
                "Pantry",
                expiringSoonItems.length > 0
                  ? { filterExpiration: "Expiring Soon" }
                  : undefined,
              )
            }
          >
            {shelfItems.length === 0 ? (
              <EmptyState
                icon="pantry"
                title="No items yet"
                description="Add the first item to your pantry."
                variant="inline"
                actionLabel="Add item"
                onAction={() =>
                  navigation.navigate("Pantry", { openAdd: true })
                }
              />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.productStrip}
              >
                {shelfItems.map((item) => (
                  <ProductTile key={item.id} item={item} />
                ))}
              </ScrollView>
            )}
          </GlassSection>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(180).springify()}>
          <InsightPanel
            tip={aiTip}
            loading={aiTipLoading}
            uncheckedShopping={uncheckedShopping}
            lowStockCount={lowStockItems.length}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(230).springify()}>
          <GlassSection
            title="Low Stock"
            eyebrow="Restock"
            actionLabel="Open list"
            onAction={() => navigation.navigate("Shopping")}
          >
            {lowStockItems.length === 0 ? (
              <View style={styles.emptyCompact}>
                <Icon name="success" size={18} color={c.success} />
                <Text style={[styles.emptyCompactText, { color: c.muted }]}>
                  Everything looks stocked.
                </Text>
              </View>
            ) : (
              <View style={styles.rowStack}>
                {lowStockItems.slice(0, 4).map((item) => (
                  <ItemRow key={item.id} item={item} />
                ))}
              </View>
            )}
          </GlassSection>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(280).springify()}>
          <GlassSection
            title="Storage"
            eyebrow="Locations"
            actionLabel="Settings"
            onAction={() => navigation.navigate("Settings")}
          >
            {locationsWithCounts.length === 0 ? (
              <EmptyState
                icon="shelf"
                title="No locations"
                description="Set up storage spots in Settings."
                variant="inline"
                actionLabel="Settings"
                onAction={() => navigation.navigate("Settings")}
              />
            ) : (
              <View style={styles.rowStack}>
                {locationsWithCounts.map(({ location, count }) => (
                  <LocationRow
                    key={location.id}
                    location={location}
                    count={count}
                  />
                ))}
              </View>
            )}
          </GlassSection>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function DashboardChrome({
  onSearch,
  onSettings,
}: {
  onSearch: () => void;
  onSettings: () => void;
}) {
  const c = useAppColors();
  return (
    <View style={styles.chrome}>
      <View style={styles.brandLockup}>
        <AppLogoMark size="sm" />
        <View>
          <Text style={[styles.brandTitle, { color: c.ink }]}>Larderly</Text>
          <Text style={[styles.brandSub, { color: c.muted }]}>
            Liquid pantry OS
          </Text>
        </View>
      </View>
      <View style={styles.chromeActions}>
        <ChromeButton icon="search" onPress={onSearch} />
        <ChromeButton icon="settings" onPress={onSettings} />
      </View>
    </View>
  );
}

function ChromeButton({
  icon,
  onPress,
}: {
  icon: IconName;
  onPress: () => void;
}) {
  const c = useAppColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chromeButton,
        {
          backgroundColor: c.surfaceGlass,
          borderColor: c.glassLine,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
      ]}
    >
      <BlurView
        intensity={c.blurIntensity}
        tint={c.blurTint}
        style={StyleSheet.absoluteFill}
      />
      <Icon name={icon} size={18} color={c.ink} />
    </Pressable>
  );
}

function SmartShelfHero({
  householdName,
  itemCount,
  expiringCount,
  lowStockCount,
  uncheckedCount,
  totalValue,
  shelfItems,
  onScan,
  onUse,
}: {
  householdName: string;
  itemCount: number;
  expiringCount: number;
  lowStockCount: number;
  uncheckedCount: number;
  totalValue: number;
  shelfItems: PantryItem[];
  onScan: () => void;
  onUse: () => void;
}) {
  const c = useAppColors();
  return (
    <View style={[styles.hero, { width: CARD_W, shadowColor: c.shadow }]}>
      <LinearGradient
        colors={["#fffdf8", "#f6efe2", "#fffaf0"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.heroAuraOne} />
      <View style={styles.heroAuraTwo} />
      <View style={styles.heroHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.heroEyebrow, { color: c.primary }]}>
            Smart Shelf
          </Text>
          <Text style={[styles.heroTitle, { color: c.ink }]} numberOfLines={2}>
            {householdName}
          </Text>
        </View>
        <View
          style={[
            styles.valueBadge,
            { backgroundColor: "#FFFFFFAA", borderColor: c.glassLine },
          ]}
        >
          <Text style={[styles.valueBadgeLabel, { color: c.muted }]}>
            Value
          </Text>
          <Text style={[styles.valueBadgeText, { color: c.ink }]}>
            ${totalValue.toFixed(0)}
          </Text>
        </View>
      </View>

      <ShelfScene items={shelfItems} />

      <View style={styles.heroMetrics}>
        <HeroMetric value={itemCount} label="Items" />
        <HeroMetric
          value={expiringCount}
          label="Soon"
          active={expiringCount > 0}
        />
        <HeroMetric
          value={lowStockCount}
          label="Low"
          active={lowStockCount > 0}
        />
        <HeroMetric
          value={uncheckedCount}
          label="List"
          active={uncheckedCount > 0}
        />
      </View>

      <View style={styles.heroButtons}>
        <Pressable
          onPress={onUse}
          style={({ pressed }) => [
            styles.secondaryHeroButton,
            {
              borderColor: c.line,
              backgroundColor: "#FFFFFFB8",
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}
        >
          <Icon name="minus" size={16} color={c.ink} />
          <Text style={[styles.secondaryHeroText, { color: c.ink }]}>
            Use item
          </Text>
        </Pressable>
        <Pressable
          onPress={onScan}
          style={({ pressed }) => [
            styles.primaryHeroButton,
            {
              backgroundColor: c.primary,
              shadowColor: c.primary,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}
        >
          <Icon name="scanner" size={18} color="#FFFFFF" />
          <Text style={styles.primaryHeroText}>Scan shelf</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ShelfScene({ items }: { items: PantryItem[] }) {
  const c = useAppColors();
  const displayItems = items.slice(0, 5);
  return (
    <LinearGradient colors={["#3A3028", "#161513"]} style={styles.shelfScene}>
      <View style={styles.shelfTopBar}>
        <View style={styles.sparkDot} />
        <Text style={styles.shelfTitle}>Liquid scan</Text>
        <Icon name="flash" size={15} color="#FFD08A" />
      </View>
      <View style={styles.shelfRow}>
        {displayItems.length === 0 ? (
          <>
            <PantryObject tone="#DCC9A7" width={34} height={54} />
            <PantryObject tone="#E3B15F" width={42} height={38} shape="box" />
            <PantryObject tone="#7CC9B6" width={30} height={62} />
          </>
        ) : (
          displayItems.map((item, index) => (
            <ShelfItemObject key={item.id} item={item} index={index} />
          ))
        )}
      </View>
      <View style={styles.shelfBoard} />
      <View style={styles.shelfRowLower}>
        <PantryObject tone="#F2A33A" width={24} height={72} />
        <PantryObject tone="#E9DFCB" width={50} height={46} shape="box" />
        <PantryObject tone="#D96B3A" width={34} height={42} />
        <PantryObject tone="#6CB9A8" width={46} height={34} shape="box" />
      </View>
      <View
        style={[
          styles.scanFrame,
          { borderColor: `${c.primary}DE`, shadowColor: c.primary },
        ]}
      >
        <View style={[styles.scanLine, { backgroundColor: c.primary }]} />
      </View>
    </LinearGradient>
  );
}

function ShelfItemObject({ item, index }: { item: PantryItem; index: number }) {
  const c = useAppColors();
  const dims = [
    { width: 34, height: 58 },
    { width: 46, height: 42 },
    { width: 30, height: 66 },
    { width: 48, height: 36 },
    { width: 36, height: 52 },
  ][index % 5];

  if (item.image_url) {
    return (
      <View
        style={[
          styles.imageShelfItem,
          { width: dims.width + 16, height: dims.height + 14 },
        ]}
      >
        <Image
          source={{ uri: item.image_url }}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.iconShelfItem,
        {
          width: dims.width,
          height: dims.height,
          backgroundColor: `${c.surface}F0`,
        },
      ]}
    >
      <Icon
        name={getCategoryIcon(item.category)}
        size={Math.min(24, dims.width - 8)}
        color={c.primary}
      />
    </View>
  );
}

function PantryObject({
  tone,
  width,
  height,
  shape = "jar",
}: {
  tone: string;
  width: number;
  height: number;
  shape?: "jar" | "box";
}) {
  return (
    <View
      style={[
        styles.pantryObject,
        {
          width,
          height,
          backgroundColor: tone,
          borderRadius: shape === "box" ? 8 : Math.min(width / 2, 16),
        },
      ]}
    >
      <View style={styles.objectGloss} />
      {shape === "jar" ? <View style={styles.objectCap} /> : null}
    </View>
  );
}

function HeroMetric({
  value,
  label,
  active = false,
}: {
  value: number;
  label: string;
  active?: boolean;
}) {
  const c = useAppColors();
  return (
    <View
      style={[
        styles.heroMetric,
        {
          backgroundColor: active ? `${c.primary}16` : "#FFFFFFA8",
          borderColor: active ? `${c.primary}40` : c.glassLine,
        },
      ]}
    >
      <Text
        style={[styles.heroMetricValue, { color: active ? c.primary : c.ink }]}
      >
        {value}
      </Text>
      <Text style={[styles.heroMetricLabel, { color: c.muted }]}>{label}</Text>
    </View>
  );
}

function ActionRailItem({
  icon,
  label,
  accent,
  onPress,
}: {
  icon: IconName;
  label: string;
  accent: string;
  onPress: () => void;
}) {
  const c = useAppColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionRailItem,
        {
          backgroundColor: c.surfaceGlass,
          borderColor: c.glassLine,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
      ]}
    >
      <BlurView
        intensity={c.blurIntensity}
        tint={c.blurTint}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.actionIcon, { backgroundColor: `${accent}18` }]}>
        <Icon name={icon} size={18} color={accent} />
      </View>
      <Text style={[styles.actionLabel, { color: c.ink }]}>{label}</Text>
    </Pressable>
  );
}

function GlassSection({
  eyebrow,
  title,
  actionLabel,
  onAction,
  children,
}: {
  eyebrow: string;
  title: string;
  actionLabel: string;
  onAction: () => void;
  children: React.ReactNode;
}) {
  const c = useAppColors();
  return (
    <View
      style={[
        styles.section,
        {
          backgroundColor: c.surfaceGlass,
          borderColor: c.glassLine,
          shadowColor: c.shadow,
        },
      ]}
    >
      <BlurView
        intensity={c.blurIntensity}
        tint={c.blurTint}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.sectionEyebrow, { color: c.primary }]}>
            {eyebrow}
          </Text>
          <Text style={[styles.sectionTitle, { color: c.ink }]}>{title}</Text>
        </View>
        <Pressable onPress={onAction} hitSlop={10}>
          <Text style={[styles.sectionAction, { color: c.primary }]}>
            {actionLabel}
          </Text>
        </Pressable>
      </View>
      {children}
    </View>
  );
}

function ProductTile({ item }: { item: PantryItem }) {
  const c = useAppColors();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.productTile,
        {
          backgroundColor: c.surface,
          borderColor: c.line,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      <LinearGradient
        pointerEvents="none"
        colors={[`${c.primary}16`, `${c.teal}12`]}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          styles.productVisual,
          { backgroundColor: `${c.canvasRaised}CC` },
        ]}
      >
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={styles.productImage}
            contentFit="contain"
          />
        ) : (
          <Icon
            name={getCategoryIcon(item.category)}
            size={28}
            color={c.primary}
          />
        )}
      </View>
      <Text numberOfLines={2} style={[styles.productName, { color: c.ink }]}>
        {item.name}
      </Text>
      <Text numberOfLines={1} style={[styles.productMeta, { color: c.muted }]}>
        {item.quantity} {item.unit}
      </Text>
    </Pressable>
  );
}

function InsightPanel({
  tip,
  loading,
  uncheckedShopping,
  lowStockCount,
}: {
  tip: string | null;
  loading: boolean;
  uncheckedShopping: number;
  lowStockCount: number;
}) {
  const c = useAppColors();
  return (
    <LinearGradient
      colors={["rgba(35, 31, 26, 0.96)", "rgba(18, 17, 15, 0.98)"]}
      style={[styles.insightPanel, { shadowColor: c.shadow }]}
    >
      <View style={styles.insightGlow} />
      <View style={styles.insightTop}>
        <View
          style={[
            styles.aiOrb,
            {
              backgroundColor: `${c.primary}24`,
              borderColor: `${c.primary}66`,
            },
          ]}
        >
          <Icon name="chef" size={22} color={c.amber} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.insightEyebrow}>AI Chef</Text>
          <Text style={styles.insightTitle}>Pantry readout</Text>
        </View>
      </View>
      {loading ? (
        <AiTipSkeleton />
      ) : (
        <Text style={styles.insightCopy}>
          {tip ??
            "Scan your shelf to unlock meal ideas, restock timing, and waste-saving suggestions."}
        </Text>
      )}
      <View style={styles.insightStats}>
        <InsightStat label="To buy" value={uncheckedShopping} />
        <InsightStat label="Low stock" value={lowStockCount} />
      </View>
    </LinearGradient>
  );
}

function InsightStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.insightStat}>
      <Text style={styles.insightStatValue}>{value}</Text>
      <Text style={styles.insightStatLabel}>{label}</Text>
    </View>
  );
}

function AiTipSkeleton() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.35, { duration: 700 }),
        withTiming(1, { duration: 700 }),
      ),
      -1,
      false,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const widths = ["100%", "82%", "58%"] as const;

  return (
    <View style={styles.skeletonStack}>
      {widths.map((width, index) => (
        <Animated.View
          key={index}
          style={[animatedStyle, styles.skeletonLine, { width }]}
        />
      ))}
    </View>
  );
}

function ItemRow({ item }: { item: PantryItem }) {
  const c = useAppColors();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.itemRow,
        {
          backgroundColor: `${c.surface}D8`,
          borderColor: c.line,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={[styles.itemThumb, { backgroundColor: `${c.primary}12` }]}>
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={styles.itemImage}
            contentFit="contain"
          />
        ) : (
          <Icon
            name={getCategoryIcon(item.category)}
            size={18}
            color={c.primary}
          />
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={[styles.itemName, { color: c.ink }]}>
          {item.name}
        </Text>
        <Text numberOfLines={1} style={[styles.itemMeta, { color: c.muted }]}>
          {item.brand || item.category}
        </Text>
      </View>
      <Text style={[styles.itemQty, { color: c.ink }]}>
        {item.quantity}
        <Text style={[styles.itemUnit, { color: c.muted }]}> {item.unit}</Text>
      </Text>
    </Pressable>
  );
}

function LocationRow({
  location,
  count,
}: {
  location: StorageLocation;
  count: number;
}) {
  const c = useAppColors();

  return (
    <View
      style={[
        styles.itemRow,
        { backgroundColor: `${c.surface}D8`, borderColor: c.line },
      ]}
    >
      <View
        style={[styles.itemThumb, { backgroundColor: `${location.color}18` }]}
      >
        <Icon
          name={getLocationIcon(location.name)}
          size={17}
          color={location.color}
        />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={[styles.itemName, { color: c.ink }]}>
          {location.name}
        </Text>
        <Text style={[styles.itemMeta, { color: c.muted }]}>Storage zone</Text>
      </View>
      <Text style={[styles.itemQty, { color: c.ink }]}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  actionIcon: {
    alignItems: "center",
    borderRadius: 16,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  actionLabel: {
    fontFamily: "Outfit_800ExtraBold",
    fontSize: 12,
  },
  actionRail: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  actionRailItem: {
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    gap: 8,
    minHeight: 88,
    justifyContent: "center",
    overflow: "hidden",
  },
  aiOrb: {
    alignItems: "center",
    borderRadius: 24,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  brandLockup: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  brandSub: {
    fontFamily: "Outfit_700Bold",
    fontSize: 10,
    textTransform: "uppercase",
  },
  brandTitle: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 22,
    lineHeight: 25,
  },
  chrome: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  chromeActions: {
    flexDirection: "row",
    gap: 9,
  },
  chromeButton: {
    alignItems: "center",
    borderRadius: 19,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    overflow: "hidden",
    width: 40,
  },
  emptyCompact: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  emptyCompactText: {
    fontFamily: "Outfit_600SemiBold",
    fontSize: 13,
  },
  hero: {
    alignSelf: "center",
    borderRadius: 34,
    minHeight: 498,
    overflow: "hidden",
    padding: 18,
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.18,
    shadowRadius: 34,
  },
  heroAuraOne: {
    backgroundColor: "rgba(241, 118, 34, 0.18)",
    borderRadius: 80,
    height: 160,
    position: "absolute",
    right: -36,
    top: 76,
    width: 160,
  },
  heroAuraTwo: {
    backgroundColor: "rgba(108, 185, 168, 0.16)",
    borderRadius: 110,
    bottom: -54,
    height: 220,
    left: -70,
    position: "absolute",
    width: 220,
  },
  heroButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  heroEyebrow: {
    fontFamily: "Outfit_800ExtraBold",
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  heroHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  heroMetric: {
    alignItems: "center",
    borderRadius: 17,
    borderWidth: 1,
    flex: 1,
    minHeight: 63,
    justifyContent: "center",
  },
  heroMetricLabel: {
    fontFamily: "Outfit_800ExtraBold",
    fontSize: 10,
    marginTop: 2,
    textTransform: "uppercase",
  },
  heroMetricValue: {
    fontFamily: "Outfit_800ExtraBold",
    fontSize: 23,
    fontVariant: ["tabular-nums"],
  },
  heroMetrics: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  heroTitle: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 38,
    lineHeight: 40,
    marginTop: 4,
    maxWidth: 240,
  },
  iconShelfItem: {
    alignItems: "center",
    borderColor: "rgba(255,255,255,0.42)",
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    overflow: "hidden",
  },
  imageShelfItem: {
    overflow: "hidden",
  },
  insightCopy: {
    color: "rgba(255, 247, 233, 0.78)",
    fontFamily: "Outfit_500Medium",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 14,
  },
  insightEyebrow: {
    color: "rgba(255, 208, 138, 0.82)",
    fontFamily: "Outfit_800ExtraBold",
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  insightGlow: {
    backgroundColor: "rgba(241, 118, 34, 0.2)",
    borderRadius: 80,
    height: 160,
    position: "absolute",
    right: -40,
    top: -62,
    width: 160,
  },
  insightPanel: {
    borderRadius: 28,
    marginTop: 16,
    minHeight: 178,
    overflow: "hidden",
    padding: 20,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
  },
  insightStat: {
    backgroundColor: "rgba(255, 255, 255, 0.09)",
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  insightStatLabel: {
    color: "rgba(255, 247, 233, 0.58)",
    fontFamily: "Outfit_700Bold",
    fontSize: 10,
    marginTop: 1,
    textTransform: "uppercase",
  },
  insightStatValue: {
    color: "#FFF7E9",
    fontFamily: "Outfit_800ExtraBold",
    fontSize: 20,
  },
  insightStats: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  insightTitle: {
    color: "#FFF7E9",
    fontFamily: "Fraunces_700Bold",
    fontSize: 23,
    lineHeight: 27,
    marginTop: 1,
  },
  insightTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  itemImage: {
    height: 40,
    width: 40,
  },
  itemMeta: {
    fontFamily: "Outfit_500Medium",
    fontSize: 12,
    marginTop: 1,
  },
  itemName: {
    fontFamily: "Outfit_800ExtraBold",
    fontSize: 14,
  },
  itemQty: {
    fontFamily: "Outfit_800ExtraBold",
    fontSize: 16,
    fontVariant: ["tabular-nums"],
  },
  itemRow: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    minHeight: 64,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  itemThumb: {
    alignItems: "center",
    borderRadius: 15,
    height: 42,
    justifyContent: "center",
    overflow: "hidden",
    width: 42,
  },
  itemUnit: {
    fontFamily: "Outfit_700Bold",
    fontSize: 10,
    textTransform: "uppercase",
  },
  objectCap: {
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: 4,
    height: 6,
    marginTop: -4,
    width: "54%",
  },
  objectGloss: {
    backgroundColor: "rgba(255,255,255,0.28)",
    borderRadius: 999,
    height: "80%",
    left: 5,
    position: "absolute",
    top: 5,
    width: 5,
  },
  pantryObject: {
    borderColor: "rgba(255,255,255,0.32)",
    borderWidth: 1,
    overflow: "hidden",
  },
  primaryHeroButton: {
    alignItems: "center",
    borderRadius: 21,
    flex: 1.1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingVertical: 15,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.32,
    shadowRadius: 18,
  },
  primaryHeroText: {
    color: "#FFFFFF",
    fontFamily: "Outfit_800ExtraBold",
    fontSize: 14,
  },
  productImage: {
    height: 62,
    width: 62,
  },
  productMeta: {
    fontFamily: "Outfit_700Bold",
    fontSize: 11,
    marginTop: 4,
  },
  productName: {
    fontFamily: "Outfit_800ExtraBold",
    fontSize: 13,
    lineHeight: 16,
    marginTop: 10,
    minHeight: 32,
    textAlign: "center",
  },
  productStrip: {
    gap: 12,
    paddingRight: 2,
  },
  productTile: {
    alignItems: "center",
    borderRadius: 24,
    borderWidth: 1,
    minHeight: 172,
    overflow: "hidden",
    padding: 12,
    width: 116,
  },
  productVisual: {
    alignItems: "center",
    borderRadius: 22,
    height: 76,
    justifyContent: "center",
    overflow: "hidden",
    width: 76,
  },
  rowStack: {
    gap: 10,
  },
  scanFrame: {
    borderRadius: 26,
    borderWidth: 2,
    bottom: 36,
    left: 28,
    position: "absolute",
    right: 28,
    shadowOpacity: 0.75,
    shadowRadius: 18,
    top: 48,
  },
  scanLine: {
    borderRadius: 999,
    height: 2,
    left: 18,
    opacity: 0.9,
    position: "absolute",
    right: 18,
    top: "50%",
  },
  secondaryHeroButton: {
    alignItems: "center",
    borderRadius: 21,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingVertical: 15,
  },
  secondaryHeroText: {
    fontFamily: "Outfit_800ExtraBold",
    fontSize: 14,
  },
  section: {
    borderRadius: 28,
    borderWidth: 1,
    marginTop: 16,
    overflow: "hidden",
    padding: 16,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
  },
  sectionAction: {
    fontFamily: "Outfit_800ExtraBold",
    fontSize: 11,
    textTransform: "uppercase",
  },
  sectionEyebrow: {
    fontFamily: "Outfit_800ExtraBold",
    fontSize: 10,
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: "Fraunces_700Bold",
    fontSize: 24,
    lineHeight: 28,
    marginTop: 1,
  },
  shelfBoard: {
    backgroundColor: "rgba(255, 247, 233, 0.84)",
    borderRadius: 999,
    height: 8,
    left: 18,
    position: "absolute",
    right: 18,
    top: 122,
  },
  shelfRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 12,
    height: 72,
    justifyContent: "center",
    marginTop: 28,
    paddingHorizontal: 18,
  },
  shelfRowLower: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 14,
    height: 82,
    justifyContent: "center",
    marginTop: 14,
    paddingHorizontal: 24,
  },
  shelfScene: {
    borderRadius: 30,
    height: 242,
    marginTop: 18,
    overflow: "hidden",
  },
  shelfTitle: {
    color: "#FFF7E9",
    flex: 1,
    fontFamily: "Outfit_800ExtraBold",
    fontSize: 12,
    textTransform: "uppercase",
  },
  shelfTopBar: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    gap: 8,
    left: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    position: "absolute",
    right: 14,
    top: 12,
    zIndex: 2,
  },
  skeletonLine: {
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    borderRadius: 999,
    height: 12,
  },
  skeletonStack: {
    gap: 8,
    marginTop: 16,
  },
  sparkDot: {
    backgroundColor: "#FFD08A",
    borderRadius: 5,
    height: 9,
    width: 9,
  },
  valueBadge: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    minWidth: 72,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  valueBadgeLabel: {
    fontFamily: "Outfit_800ExtraBold",
    fontSize: 9,
    textTransform: "uppercase",
  },
  valueBadgeText: {
    fontFamily: "Outfit_800ExtraBold",
    fontSize: 18,
    fontVariant: ["tabular-nums"],
    marginTop: 1,
  },
});
