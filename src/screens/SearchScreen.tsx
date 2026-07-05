import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { RootStackNavigationProp } from '../navigation/types';
import TextField from '../components/ui/TextField';
import { Icon } from '../components/ui/Icon';
import EmptyState from '../components/ui/EmptyState';
import { usePantryStore } from '../contexts/PantryContext';
import { useMealPlans } from '../hooks/useMealPlans';
import { useAppColors } from '../hooks/useAppColors';

type ResultType = 'pantry' | 'shopping' | 'meal';

interface SearchResult {
  type: ResultType;
  id: string;
  title: string;
  subtitle: string;
  tab: 'Pantry' | 'Shopping' | 'Meals';
}

export default function SearchScreen() {
  const c = useAppColors();
  const navigation = useNavigation<RootStackNavigationProp>();
  const { items, shoppingList } = usePantryStore();
  const { meals } = useMealPlans();
  const [query, setQuery] = useState('');

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const out: SearchResult[] = [];

    for (const item of items) {
      const hay = `${item.name} ${item.brand} ${item.category} ${item.notes}`.toLowerCase();
      if (hay.includes(q)) {
        out.push({
          type: 'pantry',
          id: item.id,
          title: item.name,
          subtitle: item.brand || item.category,
          tab: 'Pantry',
        });
      }
    }

    for (const item of shoppingList) {
      const hay = `${item.name} ${item.brand} ${item.category} ${item.notes}`.toLowerCase();
      if (hay.includes(q)) {
        out.push({
          type: 'shopping',
          id: item.id,
          title: item.name,
          subtitle: item.is_checked ? 'Checked off' : 'On your list',
          tab: 'Shopping',
        });
      }
    }

    for (const meal of meals) {
      const ingNames = meal.ingredients.map((i) => i.name).join(' ');
      const hay = `${meal.name} ${meal.meal_type} ${meal.notes} ${ingNames}`.toLowerCase();
      if (hay.includes(q)) {
        out.push({
          type: 'meal',
          id: meal.id,
          title: meal.name,
          subtitle: `${meal.meal_type} · ${meal.date}`,
          tab: 'Meals',
        });
      }
    }

    return out.slice(0, 40);
  }, [query, items, shoppingList, meals]);

  return (
    <SafeAreaView className="flex-1 bg-canvas dark:bg-[#0F0F13]" edges={['top']}>
      <View className="flex-row items-center gap-3 border-b border-line dark:border-[#2A2A35] px-5 py-4">
        <Pressable onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center rounded-full border border-line dark:border-[#2A2A35] bg-surface dark:bg-[#1A1A22]">
          <Icon name="chevron-left" size={20} color={c.ink} />
        </Pressable>
        <View className="flex-1">
          <TextField
            value={query}
            onChangeText={setQuery}
            placeholder="Search pantry, list, meals…"
            autoFocus
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {query.trim() === '' ? (
          <EmptyState
            icon="search"
            title="Search everything"
            description="Find pantry items, shopping list entries, and meal plans in one place."
            variant="inline"
          />
        ) : results.length === 0 ? (
          <EmptyState
            icon="sad"
            title="No matches"
            description={`Nothing found for "${query.trim()}".`}
            variant="inline"
          />
        ) : (
          <View className="gap-2">
            {results.map((r) => (
              <Pressable
                key={`${r.type}-${r.id}`}
                onPress={() => navigation.navigate('Main', { screen: r.tab })}
                className="flex-row items-center gap-3 rounded-2xl border border-line dark:border-[#2A2A35] bg-surface dark:bg-[#1A1A22] p-4"
              >
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-canvas dark:bg-[#0F0F13]">
                  <Icon
                    name={r.type === 'pantry' ? 'pantry' : r.type === 'shopping' ? 'shopping' : 'meals'}
                    size={18}
                    color={c.ink}
                  />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-ink dark:text-[#F0EEE9]">{r.title}</Text>
                  <Text className="text-xs text-muted dark:text-[#6B6878]">{r.subtitle}</Text>
                </View>
                <Icon name="chevron-right" size={16} color={c.muted} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
