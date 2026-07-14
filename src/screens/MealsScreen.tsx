import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Text, XStack, YStack } from 'tamagui';
import { FeaturePageShell } from '../components/main/FeaturePageShell';
import { SettingsGlass } from '../components/settings/SettingsGlass';
import { SettingsChoiceChip } from '../components/settings/SettingsChoiceChip';
import { SettingsSheet } from '../components/settings/SettingsSheet';
import { settingsType } from '../components/settings/settingsFonts';
import { GlassButton } from '../components/landing/GlassButton';
import { useInventory } from '../contexts/InventoryContext';
import { BUILTIN_RECIPES, type MealType, type Recipe } from '../lib/recipes';
import { useAppColors } from '../hooks/useAppColors';
import { useScale } from '../theme/scale';
import type { TabScreenNavigationProp } from '../navigation/types';

const MEAL_FILTERS: Array<{ id: 'all' | MealType; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snack', label: 'Snack' },
];

export default function MealsScreen() {
  const navigation = useNavigation<TabScreenNavigationProp>();
  const { s, fs } = useScale();
  const c = useAppColors();
  const { items } = useInventory();
  const [filter, setFilter] = useState<(typeof MEAL_FILTERS)[number]['id']>('all');
  const [selected, setSelected] = useState<Recipe | null>(null);

  const pantryNames = useMemo(
    () => items.map((i) => i.name.toLowerCase()),
    [items],
  );

  const recipes = useMemo(() => {
    const list = filter === 'all' ? BUILTIN_RECIPES : BUILTIN_RECIPES.filter((r) => r.mealType === filter);
    return [...list].sort((a, b) => b.rating - a.rating);
  }, [filter]);

  const matchCount = (recipe: Recipe) =>
    recipe.ingredients.filter((ing) =>
      pantryNames.some((n) => n.includes(ing.toLowerCase()) || ing.toLowerCase().includes(n)),
    ).length;

  return (
    <FeaturePageShell
      title="Meals"
      subtitle={`${recipes.length} recipes · match your pantry`}
      variant="tab"
      headerExtra={
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <XStack style={{ gap: s(8) }}>
            {MEAL_FILTERS.map((f) => (
              <SettingsChoiceChip
                key={f.id}
                label={f.label}
                selected={filter === f.id}
                onPress={() => setFilter(f.id)}
              />
            ))}
          </XStack>
        </ScrollView>
      }
    >
      <GlassButton
        label="Open meal planner"
        variant="light"
        frosted
        showArrow
        onPress={() => navigation.navigate('MealPlanner')}
      />

      {recipes.map((recipe) => {
        const have = matchCount(recipe);
        const total = recipe.ingredients.length;
        return (
          <Pressable key={recipe.id} onPress={() => setSelected(recipe)}>
            <SettingsGlass
              elevated
              interactive={false}
              radius={s(20)}
              contentStyle={{ padding: s(12), gap: s(10) }}
            >
              <XStack style={{ gap: s(12), alignItems: 'center' }}>
                {recipe.imageUrl ? (
                  <Image
                    source={{ uri: recipe.imageUrl }}
                    style={{ width: s(72), height: s(72), borderRadius: s(14) }}
                  />
                ) : (
                  <View
                    style={{
                      width: s(72),
                      height: s(72),
                      borderRadius: s(14),
                      backgroundColor: c.surfaceMuted,
                    }}
                  />
                )}
                <YStack style={{ flex: 1, minWidth: 0, gap: s(4) }}>
                  <Text
                    numberOfLines={2}
                    style={[settingsType('semibold'), { fontSize: fs(16), color: c.ink }]}
                  >
                    {recipe.title}
                  </Text>
                  <Text style={[settingsType('regular'), { fontSize: fs(12), color: c.muted }]}>
                    {recipe.prepTime + recipe.cookTime} min · {recipe.difficulty} · ★ {recipe.rating}
                  </Text>
                  <Text style={[settingsType('medium'), { fontSize: fs(12), color: c.teal }]}>
                    {have}/{total} ingredients in pantry
                  </Text>
                </YStack>
              </XStack>
            </SettingsGlass>
          </Pressable>
        );
      })}

      <SettingsSheet
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.title ?? 'Recipe'}
        maxHeightRatio={0.85}
      >
        {selected ? (
          <YStack style={{ gap: s(14), paddingBottom: s(12) }}>
            {selected.description ? (
              <Text style={[settingsType('regular'), { fontSize: fs(14), color: c.muted, lineHeight: fs(20) }]}>
                {selected.description}
              </Text>
            ) : null}
            <Text style={[settingsType('semibold'), { fontSize: fs(15), color: c.ink }]}>Ingredients</Text>
            {selected.ingredients.map((ing) => {
              const have = pantryNames.some(
                (n) => n.includes(ing.toLowerCase()) || ing.toLowerCase().includes(n),
              );
              return (
                <XStack key={ing} style={{ justifyContent: 'space-between', gap: s(8) }}>
                  <Text style={[settingsType('regular'), { fontSize: fs(14), color: c.ink, flex: 1 }]}>
                    {ing}
                  </Text>
                  <Text
                    style={[
                      settingsType('semibold'),
                      { fontSize: fs(12), color: have ? c.success : c.muted },
                    ]}
                  >
                    {have ? 'Have' : 'Need'}
                  </Text>
                </XStack>
              );
            })}
            <Text style={[settingsType('semibold'), { fontSize: fs(15), color: c.ink }]}>Steps</Text>
            {selected.instructions.map((step, i) => (
              <Text
                key={`${selected.id}-step-${i}`}
                style={[settingsType('regular'), { fontSize: fs(14), color: c.ink, lineHeight: fs(20) }]}
              >
                {i + 1}. {step}
              </Text>
            ))}
            <GlassButton
              label="Plan this meal"
              variant="amber"
              onPress={() => {
                setSelected(null);
                navigation.navigate('MealPlanner');
              }}
            />
          </YStack>
        ) : null}
      </SettingsSheet>
    </FeaturePageShell>
  );
}
