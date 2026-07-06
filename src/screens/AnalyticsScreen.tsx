import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Share } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { RootStackNavigationProp } from '../navigation/types';
import { collection, onSnapshot } from '@react-native-firebase/firestore';
import AppHeader from '../components/layout/AppHeader';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useHousehold } from '../contexts/HouseholdContext';
import { usePrefs } from '../contexts/PreferencesContext';
import { formatCurrency } from '../lib/format';
import { CATEGORIES, categoryFromName } from '../lib/categories';
import { db } from '../lib/firebase';
import { InventoryItem } from '../types/household';
import { mapInventoryDoc } from '../lib/inventoryMapper';
import { generateStructuredJson, Schema } from '../lib/aiCore';
import {
  spendingByPerson,
  mostPurchasedItems,
  sustainabilityMetrics,
  spendInWindow,
  type ActivityEvent,
  type ShoppingListSummary,
} from '../lib/insights';

const PERIODS = [7, 30, 90] as const;
type Period = (typeof PERIODS)[number];

export default function AnalyticsScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const { householdId } = useHousehold();
  const { prefs } = usePrefs();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [lists, setLists] = useState<ShoppingListSummary[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [period, setPeriod] = useState<Period>(30);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!householdId) return;
    const unsubInv = onSnapshot(collection(db, 'households', householdId, 'inventory'), (snap) => {
      setInventory(snap.docs.map((d) => mapInventoryDoc(d.id, d.data() ?? {})));
    });
    const unsubLists = onSnapshot(collection(db, 'households', householdId, 'shoppingLists'), (snap) => {
      setLists(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ShoppingListSummary)));
    });
    const unsubAct = onSnapshot(collection(db, 'households', householdId, 'activity'), (snap) => {
      setActivity(snap.docs.map((d) => d.data() as ActivityEvent));
    });
    return () => {
      unsubInv();
      unsubLists();
      unsubAct();
    };
  }, [householdId]);

  const totalValue = inventory.reduce((s, i) => s + (i.quantity ?? 0) * (i.pricePerUnit ?? 0), 0);
  const totalSpent = lists.reduce((s, l) => s + (l.totalSpent ?? 0), 0);
  const periodSpend = spendInWindow(lists, period * 86_400_000);

  const expired = inventory.filter((i) => i.expirationDate && i.expirationDate < Date.now());
  const expiredValue = expired.reduce((s, i) => s + (i.quantity ?? 0) * (i.pricePerUnit ?? 0), 0);
  const wasteRatio = totalValue > 0 ? expiredValue / (totalValue + expiredValue) : 0;

  const byCategory = useMemo(() => {
    const map = new Map<string, { count: number; value: number }>();
    inventory.forEach((i) => {
      const cat = i.category ?? categoryFromName(i.name).id;
      const cur = map.get(cat) ?? { count: 0, value: 0 };
      cur.count += i.quantity ?? 0;
      cur.value += (i.quantity ?? 0) * (i.pricePerUnit ?? 0);
      map.set(cat, cur);
    });
    return Array.from(map.entries())
      .map(([id, v]) => {
        const cat = CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
        return { ...cat, count: v.count, value: v.value };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [inventory]);

  const byPerson = useMemo(() => [...spendingByPerson(activity, lists).values()], [activity, lists]);
  const topPurchased = useMemo(() => mostPurchasedItems(activity), [activity]);
  const sustainability = useMemo(() => sustainabilityMetrics(activity, inventory), [activity, inventory]);
  const mostExpensive = useMemo(
    () =>
      inventory
        .map((item) => {
          const latestHistoryPrice = item.priceHistory?.[item.priceHistory.length - 1]?.price;
          return { ...item, latestPrice: latestHistoryPrice ?? item.pricePerUnit ?? 0 };
        })
        .filter((item) => item.latestPrice > 0)
        .sort((a, b) => b.latestPrice - a.latestPrice)
        .slice(0, 5),
    [inventory],
  );

  const activityCount = useMemo(() => ({
    added: activity.filter((a) => a.verb === 'item.added').length,
    consumed: activity.filter((a) => a.verb === 'item.consumed').length,
    checkouts: activity.filter((a) => a.verb === 'list.checkout').length,
    recipes: activity.filter((a) => a.verb === 'recipe.cooked').length,
  }), [activity]);

  const trend = useMemo(() => {
    const buckets = period === 7 ? 7 : period === 30 ? 10 : 13;
    const bucketDays = period / buckets;
    const days: { label: string; spent: number }[] = [];
    for (let i = buckets - 1; i >= 0; i--) {
      const end = Date.now() - i * bucketDays * 86_400_000;
      const start = end - bucketDays * 86_400_000;
      const spent = lists
        .filter((l) => {
          const ts = l.createdAt?.toMillis?.() ?? 0;
          return ts >= start && ts < end;
        })
        .reduce((s, l) => s + (l.totalSpent ?? 0), 0);
      const mid = new Date(start + (end - start) / 2);
      days.push({
        label:
          period === 7
            ? mid.toLocaleDateString('en-US', { weekday: 'short' })
            : mid.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        spent,
      });
    }
    return days;
  }, [lists, period]);

  const trendMax = Math.max(1, ...trend.map((d) => d.spent));

  useEffect(() => {
    if (!householdId || inventory.length === 0) return;
    let cancelled = false;
    setAiLoading(true);
    const prompt = `Analyze this household pantry data and give one actionable insight (max 2 sentences).
Pantry value: ${formatCurrency(totalValue, prefs.currency)}
Waste ratio: ${Math.round(wasteRatio * 100)}%
Items: ${inventory.length}
Spent last ${period}d: ${formatCurrency(periodSpend, prefs.currency)}
Top category: ${byCategory[0]?.name ?? 'n/a'}`;
    generateStructuredJson<{ insight: string }>(
      prompt,
      Schema.object({ properties: { insight: Schema.string() }, required: ['insight'] }),
    )
      .then((r) => {
        if (!cancelled) setAiInsight(r.insight);
      })
      .catch(() => {
        if (!cancelled) setAiInsight(null);
      })
      .finally(() => {
        if (!cancelled) setAiLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [householdId, inventory.length, totalValue, wasteRatio, period, periodSpend, byCategory, prefs.currency]);

  const exportReport = async () => {
    const lines = [
      'Larderly Analytics Report',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      `Pantry value: ${formatCurrency(totalValue, prefs.currency)}`,
      `Total spent: ${formatCurrency(totalSpent, prefs.currency)}`,
      `Waste ratio: ${Math.round(wasteRatio * 100)}%`,
      `CO2 saved (est.): ${sustainability.co2SavedKg}kg`,
      '',
      'By category:',
      ...byCategory.map((c) => `- ${c.name}: ${formatCurrency(c.value, prefs.currency)}`),
    ];
    await Share.share({ message: lines.join('\n') });
  };

  return (
    <View className="flex-1 bg-canvas dark:bg-canvas-dark">
      <AppHeader title="Analytics" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View className="mb-4 flex-row gap-2">
          {PERIODS.map((p) => (
            <Pressable
              key={p}
              onPress={() => setPeriod(p)}
              className={`rounded-full px-4 py-2 ${period === p ? 'bg-primary' : 'border border-line dark:border-line-dark bg-surface dark:bg-surface-dark'}`}
            >
              <Text className={period === p ? 'text-xs font-bold text-white' : 'text-xs text-ink dark:text-ink-dark'}>{p}d</Text>
            </Pressable>
          ))}
          <Button label="Share" variant="ghost" size="sm" onPress={exportReport} />
        </View>

        <View className="mb-4 flex-row flex-wrap gap-3">
          {[
            { label: 'Pantry value', value: formatCurrency(totalValue, prefs.currency) },
            { label: `${period}d spend`, value: formatCurrency(periodSpend, prefs.currency) },
            { label: 'Items tracked', value: String(inventory.length) },
            { label: 'Waste ratio', value: `${Math.round(wasteRatio * 100)}%` },
          ].map((s) => (
            <View key={s.label} className="min-w-[45%] flex-1 rounded-2xl border border-line dark:border-line-dark bg-surface dark:bg-surface-dark p-4">
              <Text className="text-xs text-muted dark:text-muted-dark">{s.label}</Text>
              <Text className="mt-1 font-display text-2xl text-ink dark:text-ink-dark">{s.value}</Text>
            </View>
          ))}
        </View>

        {(aiLoading || aiInsight) && (
          <View className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <Text className="text-xs font-bold uppercase text-primary">AI insight</Text>
            {aiLoading ? <LoadingSpinner className="mt-2" /> : <Text className="mt-2 text-sm text-ink dark:text-ink-dark">{aiInsight}</Text>}
          </View>
        )}

        <View className="mb-4 rounded-2xl border border-line dark:border-line-dark bg-surface dark:bg-surface-dark p-4">
          <Text className="font-semibold text-ink dark:text-ink-dark">Spending trend</Text>
          <View className="mt-3 h-24 flex-row items-end gap-1">
            {trend.map((d) => (
              <View key={d.label} className="flex-1 items-center">
                <View className="w-full rounded-t-md bg-primary/70" style={{ height: Math.max(4, (d.spent / trendMax) * 80) }} />
                <Text className="mt-1 text-xs text-muted dark:text-muted-dark">{d.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="mb-4 rounded-2xl border border-line dark:border-line-dark bg-surface dark:bg-surface-dark p-4">
          <Text className="font-semibold text-ink dark:text-ink-dark">Activity</Text>
          <Text className="mt-2 text-sm text-muted dark:text-muted-dark">
            {activityCount.added} added · {activityCount.consumed} consumed · {activityCount.checkouts} checkouts · {activityCount.recipes} recipes cooked
          </Text>
        </View>

        <View className="mb-4 rounded-2xl border border-line dark:border-line-dark bg-surface dark:bg-surface-dark p-4">
          <Text className="mb-2 font-semibold text-ink dark:text-ink-dark">Sustainability</Text>
          <Text className="text-sm text-muted dark:text-muted-dark">Est. savings {formatCurrency(sustainability.estimatedSavings, prefs.currency)}</Text>
          <Text className="text-sm text-muted dark:text-muted-dark">CO₂ saved ~{sustainability.co2SavedKg}kg · Organic {sustainability.organicPercent}%</Text>
        </View>

        {byPerson.length > 0 && (
          <>
            <Text className="mb-2 font-semibold text-ink dark:text-ink-dark">Spending by person</Text>
            {byPerson.map((p, i) => (
              <View key={i} className="mb-2 flex-row justify-between rounded-xl border border-line dark:border-line-dark bg-surface dark:bg-surface-dark px-4 py-3">
                <Text className="text-ink dark:text-ink-dark">{p.name}</Text>
                <Text className="font-semibold text-ink dark:text-ink-dark">{formatCurrency(p.spent, prefs.currency)}</Text>
              </View>
            ))}
          </>
        )}

        {topPurchased.length > 0 && (
          <>
            <Text className="mb-2 mt-2 font-semibold text-ink dark:text-ink-dark">Most purchased</Text>
            {topPurchased.map((item) => (
              <View key={item.name} className="mb-2 flex-row justify-between rounded-xl border border-line dark:border-line-dark bg-surface dark:bg-surface-dark px-4 py-3">
                <Text className="text-ink dark:text-ink-dark">{item.name}</Text>
                <Text className="text-muted dark:text-muted-dark">{item.count}×</Text>
              </View>
            ))}
          </>
        )}

        {mostExpensive.length > 0 && (
          <>
            <Text className="mb-2 mt-2 font-semibold text-ink dark:text-ink-dark">Most expensive items</Text>
            {mostExpensive.map((item) => (
              <View key={item.id} className="mb-2 flex-row justify-between rounded-xl border border-line dark:border-line-dark bg-surface dark:bg-surface-dark px-4 py-3">
                <Text className="text-ink dark:text-ink-dark">{item.name}</Text>
                <Text className="font-semibold text-ink dark:text-ink-dark">
                  {formatCurrency(item.latestPrice, prefs.currency)}
                </Text>
              </View>
            ))}
          </>
        )}

        <Text className="mb-2 mt-2 font-semibold text-ink dark:text-ink-dark">By category</Text>
        {byCategory.map((c) => (
          <View key={c.id} className="mb-2 flex-row items-center justify-between rounded-xl border border-line dark:border-line-dark bg-surface dark:bg-surface-dark px-4 py-3">
            <Text>{c.emoji} {c.name}</Text>
            <Text className="font-semibold text-ink dark:text-ink-dark">{formatCurrency(c.value, prefs.currency)}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
