import { useEffect, useMemo, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query } from '@react-native-firebase/firestore';
import { Text, XStack, YStack } from 'tamagui';
import { FeaturePageShell } from '../components/main/FeaturePageShell';
import { SettingsGlass } from '../components/settings/SettingsGlass';
import { settingsType } from '../components/settings/settingsFonts';
import { useInventory } from '../contexts/InventoryContext';
import { useShopping } from '../contexts/ShoppingContext';
import { useHousehold } from '../contexts/HouseholdContext';
import { db } from '../lib/firebase';
import {
  buildSuggestions,
  mostPurchasedItems,
  sustainabilityMetrics,
  type ActivityEvent,
  type InventoryItem,
} from '../lib/insights';
import { useGoBack } from '../navigation/useGoBack';
import { useAppColors } from '../hooks/useAppColors';
import { useScale } from '../theme/scale';

export default function AnalyticsScreen() {
  const goBack = useGoBack();
  const { s, fs } = useScale();
  const c = useAppColors();
  const { householdId } = useHousehold();
  const { items, lowStockItems, expiringSoonItems } = useInventory();
  const { shoppingList, uncheckedItems } = useShopping();
  const [activity, setActivity] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    if (!householdId) {
      setActivity([]);
      return;
    }
    const q = query(
      collection(db, 'households', householdId, 'activity'),
      orderBy('createdAt', 'desc'),
      limit(120),
    );
    return onSnapshot(
      q,
      (snap) => {
        setActivity(
          snap.docs.map((d) => {
            const data = d.data() as Record<string, unknown>;
            return {
              verb: String(data.verb ?? ''),
              target: String(data.target ?? ''),
              actorId: typeof data.actorId === 'string' ? data.actorId : undefined,
              actorName: typeof data.actorName === 'string' ? data.actorName : undefined,
              createdAt: data.createdAt as { toMillis?: () => number } | undefined,
            };
          }),
        );
      },
      () => setActivity([]),
    );
  }, [householdId]);

  const inventory: InventoryItem[] = useMemo(
    () =>
      items.map((i) => ({
        id: i.id,
        name: i.name,
        category: i.category,
        quantity: i.quantity,
        unit: i.unit,
        pricePerUnit: i.purchase_price ?? undefined,
        expirationDate: i.expiry_date ? new Date(i.expiry_date).getTime() : undefined,
      })),
    [items],
  );

  const suggestions = useMemo(
    () =>
      buildSuggestions(
        inventory,
        activity,
        uncheckedItems.map((i) => ({ productName: i.productName })),
      ).slice(0, 6),
    [activity, inventory, uncheckedItems],
  );

  const topBuys = useMemo(() => mostPurchasedItems(activity, 5), [activity]);
  const eco = useMemo(() => sustainabilityMetrics(activity, inventory), [activity, inventory]);

  return (
    <FeaturePageShell title="Analytics" subtitle="Kitchen insights" onBack={goBack} variant="stack">
      <XStack style={{ gap: s(10) }}>
        <Metric label="Pantry" value={String(items.length)} />
        <Metric label="Low" value={String(lowStockItems.length)} />
        <Metric label="Expiring" value={String(expiringSoonItems.length)} />
      </XStack>

      <XStack style={{ gap: s(10) }}>
        <Metric label="List open" value={String(uncheckedItems.length)} />
        <Metric label="List total" value={String(shoppingList.length)} />
        <Metric label="CO₂ saved" value={`${eco.co2SavedKg.toFixed(0)}kg`} />
      </XStack>

      <SettingsGlass
        elevated
        interactive={false}
        radius={s(18)}
        contentStyle={{ padding: s(14), gap: s(10) }}
      >
        <Text style={[settingsType('semibold'), { fontSize: fs(16), color: c.ink }]}>
          Smart suggestions
        </Text>
        {suggestions.length === 0 ? (
          <Text style={[settingsType('regular'), { fontSize: fs(14), color: c.muted }]}>
            Keep scanning and shopping — suggestions appear as patterns form.
          </Text>
        ) : (
          suggestions.map((sug) => (
            <YStack key={sug.id} style={{ gap: s(2) }}>
              <Text style={[settingsType('semibold'), { fontSize: fs(14), color: c.ink }]}>
                {sug.title}
              </Text>
              <Text style={[settingsType('regular'), { fontSize: fs(12), color: c.muted, lineHeight: fs(17) }]}>
                {sug.body}
              </Text>
            </YStack>
          ))
        )}
      </SettingsGlass>

      <SettingsGlass
        elevated
        interactive={false}
        radius={s(18)}
        contentStyle={{ padding: s(14), gap: s(8) }}
      >
        <Text style={[settingsType('semibold'), { fontSize: fs(16), color: c.ink }]}>
          Most added
        </Text>
        {topBuys.length === 0 ? (
          <Text style={[settingsType('regular'), { fontSize: fs(14), color: c.muted }]}>
            No purchase history yet.
          </Text>
        ) : (
          topBuys.map((row) => (
            <XStack key={row.name} style={{ justifyContent: 'space-between' }}>
              <Text style={[settingsType('medium'), { fontSize: fs(14), color: c.ink }]}>
                {row.name}
              </Text>
              <Text style={[settingsType('semibold'), { fontSize: fs(13), color: c.muted }]}>
                ×{row.count}
              </Text>
            </XStack>
          ))
        )}
      </SettingsGlass>
    </FeaturePageShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const { s, fs } = useScale();
  const c = useAppColors();
  return (
    <SettingsGlass
      elevated
      interactive={false}
      radius={s(16)}
      style={{ flex: 1 }}
      contentStyle={{ padding: s(12), gap: s(2), alignItems: 'center' }}
    >
      <Text style={[settingsType('bold'), { fontSize: fs(18), color: c.ink }]}>{value}</Text>
      <Text style={[settingsType('medium'), { fontSize: fs(11), color: c.muted }]}>{label}</Text>
    </SettingsGlass>
  );
}
