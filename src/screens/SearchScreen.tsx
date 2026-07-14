import { useMemo, useState } from 'react';
import { Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Text, YStack } from 'tamagui';
import { FeaturePageShell } from '../components/main/FeaturePageShell';
import { SettingsGlass } from '../components/settings/SettingsGlass';
import { SettingsTextField } from '../components/settings/SettingsTextField';
import { settingsType } from '../components/settings/settingsFonts';
import { useInventory } from '../contexts/InventoryContext';
import { useShopping } from '../contexts/ShoppingContext';
import { BUILTIN_RECIPES } from '../lib/recipes';
import { useGoBack } from '../navigation/useGoBack';
import { useAppColors } from '../hooks/useAppColors';
import { useScale } from '../theme/scale';
import type { MainStackNavigationProp } from '../navigation/types';

type Hit =
  | { kind: 'pantry'; id: string; title: string; subtitle: string }
  | { kind: 'list'; id: string; title: string; subtitle: string }
  | { kind: 'recipe'; id: string; title: string; subtitle: string };

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export default function SearchScreen() {
  const navigation = useNavigation<MainStackNavigationProp>();
  const goBack = useGoBack();
  const { s, fs } = useScale();
  const c = useAppColors();
  const { items } = useInventory();
  const { shoppingList } = useShopping();
  const [query, setQuery] = useState('');

  const hits = useMemo(() => {
    const q = normalize(query.trim());
    if (q.length < 1) return [] as Hit[];
    const out: Hit[] = [];

    for (const item of items) {
      const hay = normalize(`${item.name} ${item.brand} ${item.category} ${item.barcode}`);
      if (hay.includes(q)) {
        out.push({
          kind: 'pantry',
          id: item.id,
          title: item.name,
          subtitle: `${item.quantity} ${item.unit} · pantry`,
        });
      }
      if (out.length >= 20) break;
    }

    for (const item of shoppingList) {
      const hay = normalize(`${item.name} ${item.brand} ${item.category}`);
      if (hay.includes(q)) {
        out.push({
          kind: 'list',
          id: item.id,
          title: item.name,
          subtitle: item.is_checked ? 'Checked · list' : 'To buy · list',
        });
      }
      if (out.length >= 30) break;
    }

    for (const recipe of BUILTIN_RECIPES) {
      const hay = normalize(`${recipe.title} ${recipe.tags.join(' ')} ${recipe.ingredients.join(' ')}`);
      if (hay.includes(q)) {
        out.push({
          kind: 'recipe',
          id: recipe.id,
          title: recipe.title,
          subtitle: `${recipe.mealType} · recipe`,
        });
      }
      if (out.length >= 40) break;
    }

    return out;
  }, [items, query, shoppingList]);

  return (
    <FeaturePageShell title="Search" subtitle="Pantry, list, and meals" onBack={goBack} variant="stack">
      <SettingsTextField
        label="Find anything"
        value={query}
        onChangeText={setQuery}
        placeholder="Milk, pesto, eggs…"
        autoFocus
        returnKeyType="search"
      />

      {query.trim().length === 0 ? (
        <Text style={[settingsType('regular'), { fontSize: fs(14), color: c.muted }]}>
          Search pantry items, shopping list entries, and recipes.
        </Text>
      ) : hits.length === 0 ? (
        <Text style={[settingsType('regular'), { fontSize: fs(14), color: c.muted }]}>
          No matches for “{query.trim()}”.
        </Text>
      ) : (
        <YStack style={{ gap: s(10) }}>
          {hits.map((hit) => (
            <Pressable
              key={`${hit.kind}-${hit.id}`}
              onPress={() => {
                if (hit.kind === 'pantry') {
                  navigation.navigate('Tabs', { screen: 'Pantry' });
                } else if (hit.kind === 'list') {
                  navigation.navigate('Tabs', { screen: 'Shopping' });
                } else {
                  navigation.navigate('Tabs', { screen: 'Meals' });
                }
              }}
            >
              <SettingsGlass
                elevated
                interactive={false}
                radius={s(16)}
                contentStyle={{ padding: s(14), gap: s(2) }}
              >
                <Text style={[settingsType('semibold'), { fontSize: fs(15), color: c.ink }]}>
                  {hit.title}
                </Text>
                <Text style={[settingsType('regular'), { fontSize: fs(12), color: c.muted }]}>
                  {hit.subtitle}
                </Text>
              </SettingsGlass>
            </Pressable>
          ))}
        </YStack>
      )}
    </FeaturePageShell>
  );
}
