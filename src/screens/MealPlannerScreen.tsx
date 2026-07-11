import { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppHeader from '../components/layout/AppHeader';
import Button from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import RecipeDetailSheet from '../components/meals/RecipeDetailSheet';
import { useInventory } from '../contexts/InventoryContext';
import { useAppColors } from '../hooks/useAppColors';
import { useTheme } from '../hooks/useTheme';
import { BUILTIN_RECIPES, Recipe } from '../lib/recipes';

function matchCount(recipe: Recipe, pantryNames: string[]) {
  return recipe.ingredients.filter((ingredient) => {
    const token = ingredient.toLowerCase().split(/\s+/)[0];
    return pantryNames.some((name) => name.includes(token) || token.includes(name.split(/\s+/)[0]));
  }).length;
}

export default function MealPlannerScreen() {
  const c = useAppColors();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { items } = useInventory();
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
  const pantryNames = useMemo(() => items.map((item) => item.name.toLowerCase()), [items]);
  const suggested = useMemo(() => {
    return [...BUILTIN_RECIPES]
      .sort((a, b) => matchCount(b, pantryNames) - matchCount(a, pantryNames))
      .slice(0, 4);
  }, [pantryNames]);
  const pantryChips = items.slice(0, 8);
  const tipItem = items.find((item) => item.expiry_date) ?? items[0];
  const ingredientAvailable = useCallback(
    (ingredient: string) => {
      const token = ingredient.toLowerCase().split(/\s+/)[0];
      return pantryNames.some((name) => name.includes(token) || token.includes(name.split(/\s+/)[0]));
    },
    [pantryNames],
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.canvas }}>
      <LinearGradient
        pointerEvents="none"
        colors={[c.primaryGlow, 'transparent', c.tealGlow]}
        locations={[0, 0.52, 1]}
        style={StyleSheet.absoluteFill}
      />
      <AppHeader title="AI Recipe Planner" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 112 }}
      >
        <View className="mb-4">
          <Text className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Larderly</Text>
          <Text className="font-display text-4xl leading-[42px] text-ink dark:text-ink-dark">
            What should we cook?
          </Text>
          <Text className="mt-2 max-w-[310px] text-sm font-medium leading-5 text-muted dark:text-muted-dark">
            Suggestions are ranked from what is already in your pantry.
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
          {suggested.map((recipe) => {
            const available = matchCount(recipe, pantryNames);
            return (
              <Pressable
                key={recipe.id}
                onPress={() => setActiveRecipe(recipe)}
                style={({ pressed }) => [
                  styles.mealCard,
                  {
                    borderColor: c.glassLine,
                    shadowColor: c.shadow,
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}
              >
                <Image source={{ uri: recipe.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                <LinearGradient
                  colors={['rgba(0,0,0,0.12)', 'rgba(0,0,0,0.12)', 'rgba(0,0,0,0.76)']}
                  locations={[0, 0.4, 1]}
                  style={StyleSheet.absoluteFill}
                />
                <View className="p-4">
                  <Text numberOfLines={2} className="font-display text-2xl leading-7 text-white">
                    {recipe.title}
                  </Text>
                </View>
                <BlurView
                  intensity={70}
                  tint="dark"
                  style={styles.ingredientsGlass}
                >
                  <Text className="text-[11px] font-bold text-white/85">Ingredients in Inventory</Text>
                  {recipe.ingredients.slice(0, 4).map((ingredient) => {
                    const owned = matchCount({ ...recipe, ingredients: [ingredient] }, pantryNames) > 0;
                    return (
                      <View key={ingredient} className="mt-1 flex-row items-center gap-1.5">
                        <View
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: 4,
                            backgroundColor: owned ? c.primary : 'rgba(255,255,255,0.38)',
                          }}
                        />
                        <Text className="text-xs font-medium text-white/85">{ingredient}</Text>
                      </View>
                    );
                  })}
                </BlurView>
                <View style={styles.mealFooter}>
                  <Button label={`${available}/${recipe.ingredients.length} ready`} size="sm" variant="secondary" onPress={() => setActiveRecipe(recipe)} />
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <View className="mt-6 flex-row items-center justify-between">
          <View>
            <Text className="font-display text-2xl text-ink dark:text-ink-dark">Your Pantry</Text>
            <Text className="text-sm font-medium text-muted dark:text-muted-dark">{items.length} ingredients available</Text>
          </View>
          <View style={[styles.chefBubble, { backgroundColor: `${c.primary}22`, borderColor: `${c.primary}44`, shadowColor: c.primary }]}>
            <Icon name="chef" size={22} color={c.primary} />
            <Text className="text-[10px] font-bold text-primary">AI Chef</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
          <View className="flex-row gap-2">
            {pantryChips.length > 0 ? pantryChips.map((item) => (
              <View
                key={item.id}
                className="rounded-full border px-3 py-2"
                style={{ backgroundColor: c.surfaceGlass, borderColor: c.glassLine }}
              >
                <Text className="text-xs font-bold text-ink dark:text-ink-dark">
                  {item.name} ({item.quantity})
                </Text>
              </View>
            )) : (
              <View className="rounded-full border px-3 py-2" style={{ backgroundColor: c.surfaceGlass, borderColor: c.glassLine }}>
                <Text className="text-xs font-bold text-muted dark:text-muted-dark">Add pantry items to unlock suggestions</Text>
              </View>
            )}
          </View>
        </ScrollView>

        <BlurView
          intensity={c.blurIntensity}
          tint={theme}
          style={[
            styles.tipCard,
            {
              backgroundColor: c.surfaceGlass,
              borderColor: c.glassLine,
              shadowColor: c.shadow,
            },
          ]}
        >
          <View className="flex-row items-start gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: `${c.primary}18` }}>
              <Icon name="sparkles" size={18} color={c.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold uppercase tracking-wider text-primary">Tip</Text>
              <Text className="mt-1 text-sm font-medium leading-5 text-ink dark:text-ink-dark">
                {tipItem
                  ? `Use your ${tipItem.name} soon. I can bias the plan around it.`
                  : 'Add a few staples and I will build faster meal suggestions.'}
              </Text>
            </View>
          </View>
        </BlurView>
      </ScrollView>
      <RecipeDetailSheet
        recipe={activeRecipe}
        isOpen={!!activeRecipe}
        userRating={activeRecipe?.rating ?? 5}
        isAvailable={ingredientAvailable}
        onClose={() => setActiveRecipe(null)}
        onFavorite={() => {}}
        onRate={() => {}}
        onCook={() => setActiveRecipe(null)}
        onAddMissing={() => {}}
        onSaveToCollection={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chefBubble: {
    alignItems: 'center',
    borderRadius: 30,
    borderWidth: 1,
    height: 66,
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    width: 66,
  },
  ingredientsGlass: {
    borderRadius: 18,
    bottom: 58,
    left: 14,
    overflow: 'hidden',
    padding: 12,
    position: 'absolute',
    right: 14,
  },
  mealCard: {
    borderRadius: 22,
    borderWidth: 1,
    height: 330,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    width: 244,
  },
  mealFooter: {
    bottom: 14,
    left: 14,
    position: 'absolute',
    right: 14,
  },
  tipCard: {
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 20,
    overflow: 'hidden',
    padding: 16,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.1,
    shadowRadius: 22,
  },
});
