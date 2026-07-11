import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { MainStackNavigationProp } from '../navigation/types';
import TextField from '../components/ui/TextField';
import { Icon } from '../components/ui/Icon';
import EmptyState from '../components/ui/EmptyState';
import { useInventory } from '../contexts/InventoryContext';
import { useShopping } from '../contexts/ShoppingContext';
import { useActivity } from '../hooks/useActivity';
import { useDebounce } from '../hooks/useDebounce';
import { useAppColors } from '../hooks/useAppColors';
import { BUILTIN_RECIPES, type Recipe } from '../lib/recipes';
import { getCategoryIcon } from '../lib/appIcons';
import { CATEGORIES } from '../lib/categories';
import { PantryItem, StorageLocation, ShoppingListItem } from '../types';
import { collection, query, where, getDocs } from '@react-native-firebase/firestore';
import { db } from '../lib/firebase';
import type { ActivityEvent } from '../lib/insights';

type Tab = 'All' | 'Pantry' | 'Recipes' | 'Shopping';

// --- Row Components ---

function PantryResultRow({ item, locations }: { item: PantryItem; locations: StorageLocation[] }) {
  const c = useAppColors();
  const locName = locations.find((l) => l.id === item.location_id)?.name || '—';
  return (
    <View className="mb-2 flex-row items-center gap-3 rounded-2xl border border-line dark:border-line-dark bg-surface dark:bg-surface-dark px-4 py-3">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-primary/10">
        <Icon name={getCategoryIcon(item.category)} size={18} color={c.primary} />
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-ink dark:text-ink-dark">{item.name}</Text>
        <Text className="text-xs text-muted dark:text-muted-dark mt-0.5">
          {item.quantity} {item.unit} · {locName}
        </Text>
      </View>
    </View>
  );
}

function RecipeResultRow({ recipe, pantryItems }: { recipe: Recipe; pantryItems: PantryItem[] }) {
  const c = useAppColors();
  const availableCount = useMemo(() => {
    if (!recipe.ingredients) return 0;
    return recipe.ingredients.filter((ing) =>
      pantryItems.some(
        (pi) =>
          pi.name.toLowerCase().includes(ing.toLowerCase()) ||
          ing.toLowerCase().includes(pi.name.toLowerCase())
      )
    ).length;
  }, [recipe.ingredients, pantryItems]);

  return (
    <View className="mb-2 flex-row items-center gap-3 rounded-2xl border border-line dark:border-line-dark bg-surface dark:bg-surface-dark px-4 py-3">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-success/10">
        <Icon name="chef" size={18} color={c.success} />
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-ink dark:text-ink-dark">{recipe.title}</Text>
        <Text className="text-xs text-muted dark:text-muted-dark mt-0.5">
          {availableCount} ingredients available
        </Text>
      </View>
    </View>
  );
}

function ShoppingResultRow({ item, listName }: { item: ShoppingListItem; listName: string }) {
  const c = useAppColors();
  return (
    <View className="mb-2 flex-row items-center gap-3 rounded-2xl border border-line dark:border-line-dark bg-surface dark:bg-surface-dark px-4 py-3">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-info/10">
        <Icon name="cart" size={18} color={c.info} />
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-ink dark:text-ink-dark">{item.name}</Text>
        <Text className="text-xs text-muted dark:text-muted-dark mt-0.5">{listName}</Text>
      </View>
    </View>
  );
}

function ActivityResultRow({ activity }: { activity: ActivityEvent }) {
  const c = useAppColors();
  const dateStr = activity.createdAt && typeof activity.createdAt.toMillis === 'function'
    ? new Date(activity.createdAt.toMillis()).toLocaleDateString()
    : '';
  const actionText = `${activity.actorName || 'Someone'} ${activity.verb.replace('item.', '')} ${activity.target || ''}`;

  return (
    <View className="mb-2 flex-row items-center gap-3 rounded-2xl border border-line dark:border-line-dark bg-surface dark:bg-surface-dark px-4 py-3">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-line/20 dark:bg-line/10">
        <Icon name="clock" size={18} color={c.muted} />
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-ink dark:text-ink-dark">{actionText}</Text>
        {dateStr ? <Text className="text-xs text-muted dark:text-muted-dark mt-0.5">{dateStr}</Text> : null}
      </View>
    </View>
  );
}

// --- Main Search Screen ---

export default function SearchScreen() {
  const c = useAppColors();
  const navigation = useNavigation<MainStackNavigationProp>();

  // Fetch local contexts
  const { items, locations } = useInventory();
  const { shoppingList, activeList } = useShopping();
  const activity = useActivity(50);

  // States
  const [queryText, setQueryText] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('All');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(false);

  // Debounced input
  const debouncedQuery = useDebounce(queryText, 300);

  // 1. Fetch recipes from Firestore collection using debounced query
  useEffect(() => {
    const fetchRecipes = async () => {
      const qVal = debouncedQuery.trim();
      if (!qVal) {
        setRecipes([]);
        return;
      }
      setRecipesLoading(true);
      try {
        const q = query(
          collection(db, 'recipes'),
          where('name', '>=', qVal),
          where('name', '<=', qVal + '\uf8ff')
        );
        const snap = await getDocs(q);
        const fetched = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: data.title || data.name || 'Unnamed recipe',
            description: data.description || '',
            ingredients: data.ingredients || [],
            cuisine: data.cuisine || 'other',
            mealType: data.mealType || 'lunch',
            difficulty: data.difficulty || 'easy',
            prepTime: data.prepTime || 0,
            cookTime: data.cookTime || 0,
            servings: data.servings || 1,
            rating: data.rating || 5,
            tags: data.tags || [],
            instructions: data.instructions || [],
            source: data.source || 'user',
          } as Recipe;
        });
        setRecipes(fetched);
      } catch (err) {
        console.error('Error fetching recipes:', err);
      } finally {
        setRecipesLoading(false);
      }
    };
    fetchRecipes();
  }, [debouncedQuery]);

  // Combine Firestore query results with seeded recipes
  const mergedRecipes = useMemo(() => {
    const qVal = debouncedQuery.trim().toLowerCase();
    if (!qVal) return [];

    const local = BUILTIN_RECIPES.filter((r) => r.title.toLowerCase().includes(qVal));

    const seen = new Set(local.map((r) => r.id));
    const merged = [...local];
    recipes.forEach((r) => {
      if (!seen.has(r.id)) {
        merged.push(r);
      }
    });
    return merged;
  }, [recipes, debouncedQuery]);

  // Filter local contexts
  const pantryResults = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return [];
    return items.filter((i) => i.name.toLowerCase().includes(q) || (i.brand ?? '').toLowerCase().includes(q));
  }, [items, debouncedQuery]);

  const shoppingResults = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return [];
    return shoppingList.filter((s) => s.name.toLowerCase().includes(q) || (s.brand ?? '').toLowerCase().includes(q));
  }, [shoppingList, debouncedQuery]);

  const activityResults = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return [];
    return activity.filter(
      (a) =>
        (a.target ?? '').toLowerCase().includes(q) ||
        (a.actorName ?? '').toLowerCase().includes(q) ||
        (a.verb ?? '').toLowerCase().includes(q)
    );
  }, [activity, debouncedQuery]);

  const hasAnyResults =
    pantryResults.length > 0 ||
    mergedRecipes.length > 0 ||
    shoppingResults.length > 0 ||
    activityResults.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-canvas dark:bg-canvas-dark" edges={['top']}>
      {/* Top Search Input */}
      <View className="flex-row items-center gap-3 border-b border-line dark:border-line-dark px-5 py-4">
        <Pressable
          onPress={() => navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full border border-line dark:border-line-dark bg-surface dark:bg-surface-dark"
        >
          <Icon name="chevron-left" size={20} color={c.ink} />
        </Pressable>
        <View className="flex-1">
          <TextField
            value={queryText}
            onChangeText={setQueryText}
            placeholder="Search pantry, list, recipes…"
            autoFocus
          />
        </View>
      </View>

      {/* Segmented Control Tabs */}
      <View className="flex-row gap-2 px-5 py-3">
        {(['All', 'Pantry', 'Recipes', 'Shopping'] as Tab[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            testID={`search-tab-${tab.toLowerCase()}`}
            className={`rounded-full px-4 py-2 ${activeTab === tab ? 'bg-ink dark:bg-ink-dark' : 'border border-line dark:border-line-dark bg-surface dark:bg-surface-dark'}`}
          >
            <Text className={activeTab === tab ? 'text-xs font-bold text-canvas dark:text-canvas-dark' : 'text-xs font-semibold text-muted dark:text-muted-dark'}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {queryText.trim() === '' ? (
          <EmptyState
            icon="search"
            title="Search everything"
            description="Find pantry items, recipes, shopping list entries, and household logs."
            variant="inline"
          />
        ) : recipesLoading && !hasAnyResults ? (
          <Text className="text-sm text-muted dark:text-muted-dark italic text-center mt-10">Searching...</Text>
        ) : !hasAnyResults ? (
          <EmptyState
            icon="sad"
            title="No matches"
            description={`Nothing found for "${queryText.trim()}".`}
            variant="inline"
          />
        ) : (
          <>
            {recipesLoading && (
              <Text className="text-xs text-muted dark:text-muted-dark italic mb-3">Syncing cloud recipes...</Text>
            )}

            {/* Render Tab Results */}

            {activeTab === 'All' && (
              <>
                {pantryResults.length > 0 && (
                  <View className="mb-5">
                    <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-muted dark:text-muted-dark">Pantry Items</Text>
                    {pantryResults.map((item) => (
                      <PantryResultRow key={item.id} item={item} locations={locations} />
                    ))}
                  </View>
                )}

                {mergedRecipes.length > 0 && (
                  <View className="mb-5">
                    <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-muted dark:text-muted-dark">Recipes</Text>
                    {mergedRecipes.map((recipe) => (
                      <RecipeResultRow key={recipe.id} recipe={recipe} pantryItems={items} />
                    ))}
                  </View>
                )}

                {shoppingResults.length > 0 && (
                  <View className="mb-5">
                    <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-muted dark:text-muted-dark">Shopping List</Text>
                    {shoppingResults.map((item) => (
                      <ShoppingResultRow key={item.id} item={item} listName={activeList?.name || 'Active list'} />
                    ))}
                  </View>
                )}

                {activityResults.length > 0 && (
                  <View className="mb-5">
                    <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-muted dark:text-muted-dark">Activity</Text>
                    {activityResults.map((act, index) => (
                      <ActivityResultRow
                        key={act.createdAt && typeof act.createdAt.toMillis === 'function' ? `act-${act.createdAt.toMillis()}-${index}` : `act-${index}`}
                        activity={act}
                      />
                    ))}
                  </View>
                )}
              </>
            )}

            {activeTab === 'Pantry' && (
              <View>
                <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-muted dark:text-muted-dark">Pantry Items</Text>
                {pantryResults.map((item) => (
                  <PantryResultRow key={item.id} item={item} locations={locations} />
                ))}
                {pantryResults.length === 0 && (
                  <Text className="text-sm text-muted dark:text-muted-dark italic mt-2">No matching pantry items.</Text>
                )}
              </View>
            )}

            {activeTab === 'Recipes' && (
              <View>
                <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-muted dark:text-muted-dark">Recipes</Text>
                {mergedRecipes.map((recipe) => (
                  <RecipeResultRow key={recipe.id} recipe={recipe} pantryItems={items} />
                ))}
                {mergedRecipes.length === 0 && (
                  <Text className="text-sm text-muted dark:text-muted-dark italic mt-2">No matching recipes.</Text>
                )}
              </View>
            )}

            {activeTab === 'Shopping' && (
              <View>
                <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-muted dark:text-muted-dark">Shopping List</Text>
                {shoppingResults.map((item) => (
                  <ShoppingResultRow key={item.id} item={item} listName={activeList?.name || 'Active list'} />
                ))}
                {shoppingResults.length === 0 && (
                  <Text className="text-sm text-muted dark:text-muted-dark italic mt-2">No matching shopping list items.</Text>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
