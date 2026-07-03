import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  increment,
  getDocs,
  limit,
} from '@react-native-firebase/firestore';
import AppHeader from '../components/layout/AppHeader';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import TextField from '../components/ui/TextField';
import SelectField from '../components/ui/SelectField';
import { Icon } from '../components/ui/Icon';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { usePantryStore } from '../contexts/PantryContext';
import { db } from '../lib/firebase';
import { BUILTIN_RECIPES, type Recipe, type Cuisine, type MealType, type Difficulty } from '../lib/recipes';
import { generatePantryRecipes, generatePersonalizedRecipes } from '../lib/recipeGen';
import { recordActivity } from '../lib/activity';
import { bumpCounter } from '../lib/achievements';
import { isAllergenRisk } from '../lib/nutrition';
import { colors } from '../theme';

type Tab = 'browse' | 'expiring' | 'favorites' | 'mine' | 'trending';

type FavoriteRecipe = Recipe & { collection?: string };

export default function RecipesScreen() {
  const navigation = useNavigation<any>();
  const { user, userProfile, householdId } = useAuth();
  const { showToast } = useToast();
  const { items, addShoppingItem } = usePantryStore();

  const [tab, setTab] = useState<Tab>('browse');
  const [favorites, setFavorites] = useState<FavoriteRecipe[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [myRecipes, setMyRecipes] = useState<Recipe[]>([]);
  const [aiRecipes, setAiRecipes] = useState<Recipe[]>([]);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
  const [generating, setGenerating] = useState(false);
  const [mlGenerating, setMlGenerating] = useState(false);
  const [activeCollection, setActiveCollection] = useState('All');
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [filterCuisine, setFilterCuisine] = useState<string>('all');
  const [filterMeal, setFilterMeal] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [userRating, setUserRating] = useState(5);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, 'users', user.uid, 'favorites'), (snap) => {
      const list: FavoriteRecipe[] = [];
      const ids = new Set<string>();
      snap.forEach((d) => {
        list.push({ ...(d.data() as FavoriteRecipe), id: d.id });
        ids.add(d.id);
      });
      setFavorites(list);
      setFavoriteIds(ids);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'recipes'), where('createdBy', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setMyRecipes(snap.docs.map((d) => ({ ...(d.data() as Recipe), id: d.id })));
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!householdId) return;
    const unsub = onSnapshot(collection(db, 'households', householdId, 'recipeViews'), (snap) => {
      const counts: Record<string, number> = {};
      snap.forEach((d) => {
        counts[d.id] = (d.data().views as number) ?? 0;
      });
      setViewCounts(counts);
    });
    return unsub;
  }, [householdId]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, 'users', user.uid, 'recipeRatings'), (snap) => {
      const map: Record<string, number> = {};
      snap.forEach((d) => {
        map[d.id] = (d.data().rating as number) ?? 0;
      });
      setRatings(map);
    });
    return unsub;
  }, [user]);

  const collections = useMemo(() => {
    const s = new Set<string>();
    favorites.forEach((f) => {
      if (f.collection) s.add(f.collection);
    });
    return ['All', ...Array.from(s)];
  }, [favorites]);

  const expiringNames = useMemo(
    () =>
      items
        .filter((i) => i.expiry_date && new Date(i.expiry_date).getTime() - Date.now() < 7 * 86400000)
        .map((i) => i.name.toLowerCase()),
    [items],
  );

  const allergies = userProfile?.personalAllergies ?? '';
  const dietaryPrefs = userProfile?.dietaryPreferences ?? [];

  const allRecipes = useMemo(() => [...BUILTIN_RECIPES, ...myRecipes, ...aiRecipes], [myRecipes, aiRecipes]);

  const trendingRecipes = useMemo(() => {
    return [...allRecipes]
      .sort((a, b) => (viewCounts[b.id] ?? 0) - (viewCounts[a.id] ?? 0))
      .slice(0, 12);
  }, [allRecipes, viewCounts]);

  const recipes = useMemo(() => {
    let list = [...allRecipes];
    if (tab === 'favorites') list = favorites;
    if (tab === 'mine') list = myRecipes;
    if (tab === 'trending') list = trendingRecipes;
    if (tab === 'expiring') {
      list = list.filter((r) =>
        r.ingredients.some((ing) => expiringNames.some((n) => n.includes(ing.toLowerCase().split(' ')[0]))),
      );
    }
    if (activeCollection !== 'All' && tab === 'favorites') {
      list = list.filter((r) => (r as FavoriteRecipe).collection === activeCollection);
    }
    if (filterCuisine !== 'all') list = list.filter((r) => r.cuisine === filterCuisine);
    if (filterMeal !== 'all') list = list.filter((r) => r.mealType === filterMeal);
    if (filterDifficulty !== 'all') list = list.filter((r) => r.difficulty === filterDifficulty);
    return list;
  }, [tab, favorites, myRecipes, trendingRecipes, allRecipes, expiringNames, activeCollection, filterCuisine, filterMeal, filterDifficulty]);

  const toggleFavorite = async (recipe: Recipe, collection?: string) => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid, 'favorites', recipe.id);
    if (favoriteIds.has(recipe.id)) {
      await deleteDoc(ref);
    } else {
      await setDoc(ref, { ...recipe, collection: collection ?? null, savedAt: serverTimestamp() });
      if (householdId) {
        recordActivity(householdId, {
          verb: 'recipe.saved',
          target: recipe.title,
          actorId: user.uid,
          actorName: user.displayName || 'You',
        });
      }
    }
  };

  const rateRecipe = async (recipeId: string, rating: number) => {
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid, 'recipeRatings', recipeId), { rating, at: serverTimestamp() });
    setRatings((prev) => ({ ...prev, [recipeId]: rating }));
    showToast('Rating saved', 'success');
  };

  const cookRecipe = async (recipe: Recipe) => {
    if (!user || !householdId) return;
    const actorName = user.displayName || 'You';
    recordActivity(householdId, {
      verb: 'recipe.cooked',
      target: recipe.title,
      actorId: user.uid,
      actorName,
    });
    bumpCounter(user.uid, householdId, actorName, 'recipesCooked').catch(() => {});
    await setDoc(doc(db, 'households', householdId, 'recipeViews', recipe.id), { views: increment(1) }, { merge: true });
    showToast(`Marked "${recipe.title}" as cooked`, 'success');
    setActiveRecipe(null);
  };

  const addMissingToList = async (recipe: Recipe) => {
    const pantryLower = items.map((i) => i.name.toLowerCase());
    const missing = recipe.ingredients.filter((ing) => !pantryLower.some((p) => p.includes(ing.toLowerCase().split(' ')[0])));
    for (const ing of missing.slice(0, 8)) {
      await addShoppingItem({
        pantry_item_id: null,
        name: ing,
        brand: '',
        category: 'other',
        quantity: 1,
        unit: 'item',
        is_checked: false,
        is_auto_generated: false,
        notes: `For ${recipe.title}`,
      });
    }
    showToast(`Added ${missing.length} items to shopping list`, 'success');
  };

  const handleGenerateAI = async () => {
    if (!items.length) {
      showToast('Add pantry items first', 'warning');
      return;
    }
    setGenerating(true);
    try {
      const generated = await generatePantryRecipes(
        items.map((i) => i.name),
        dietaryPrefs,
        allergies,
      );
      setAiRecipes(generated);
      setActiveRecipe(generated[0] ?? null);
      showToast(`${generated.length} AI recipes ready`, 'success');
    } catch {
      showToast('Could not generate recipes', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateML = async () => {
    if (!user || !householdId) return;
    setMlGenerating(true);
    try {
      const actSnap = await getDocs(query(collection(db, 'households', householdId, 'activity'), limit(20)));
      const recent = actSnap.docs.map((d) => `${d.data().verb}: ${d.data().target}`).join('; ');
      const generated = await generatePersonalizedRecipes(recent, dietaryPrefs, allergies);
      setAiRecipes((prev) => [...generated, ...prev]);
      setActiveRecipe(generated[0] ?? null);
      showToast('Personalized recipes ready', 'success');
    } catch {
      showToast('Could not generate personalized recipes', 'error');
    } finally {
      setMlGenerating(false);
    }
  };

  const saveToCollection = async () => {
    if (!activeRecipe || !newCollectionName.trim()) return;
    await toggleFavorite(activeRecipe, newCollectionName.trim());
    setShowNewCollection(false);
    setNewCollectionName('');
  };

  return (
    <View className="flex-1 bg-canvas">
      <AppHeader
        onOpenSettings={() => navigation.navigate('Settings')}
        right={
          <Pressable onPress={() => navigation.navigate('MealPlanner')} className="rounded-full border border-line bg-surface px-3 py-1.5">
            <Text className="text-xs font-semibold text-ink">Planner</Text>
          </Pressable>
        }
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 py-3">
        <View className="flex-row gap-2">
          {(['browse', 'expiring', 'favorites', 'mine', 'trending'] as Tab[]).map((t) => (
            <Pressable key={t} onPress={() => setTab(t)} className={`rounded-full px-4 py-2 capitalize ${tab === t ? 'bg-ink' : 'border border-line bg-surface'}`}>
              <Text className={`text-sm font-semibold ${tab === t ? 'text-white' : 'text-ink'}`}>{t}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View className="flex-row gap-2 px-5 pb-2">
        <Button label={generating ? 'Generating…' : 'AI from pantry'} icon="sparkles" size="sm" onPress={handleGenerateAI} loading={generating} className="flex-1" />
        <Button label="For you" icon="star" size="sm" variant="secondary" onPress={handleGenerateML} loading={mlGenerating} className="flex-1" />
      </View>

      <View className="flex-row gap-2 px-5 pb-2">
        <View className="flex-1">
          <SelectField label="Cuisine" value={filterCuisine} onChange={setFilterCuisine} options={[
            { label: 'All', value: 'all' },
            ...(['american', 'italian', 'mexican', 'asian', 'indian', 'mediterranean', 'other'] as Cuisine[]).map((c) => ({ label: c, value: c })),
          ]} />
        </View>
        <View className="flex-1">
          <SelectField label="Meal" value={filterMeal} onChange={setFilterMeal} options={[
            { label: 'All', value: 'all' },
            ...(['breakfast', 'lunch', 'dinner', 'snack', 'dessert'] as MealType[]).map((m) => ({ label: m, value: m })),
          ]} />
        </View>
      </View>

      {tab === 'favorites' && collections.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 pb-2">
          <View className="flex-row gap-2">
            {collections.map((c) => (
              <Pressable key={c} onPress={() => setActiveCollection(c)} className={`rounded-full px-3 py-1.5 ${activeCollection === c ? 'bg-primary' : 'border border-line'}`}>
                <Text className={`text-xs font-bold ${activeCollection === c ? 'text-white' : 'text-ink'}`}>{c}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {recipes.length === 0 ? (
          <EmptyState icon="chef" title="No recipes" description="Try another tab or generate AI recipes." actionLabel="AI from pantry" onAction={handleGenerateAI} />
        ) : (
          recipes.map((recipe) => {
            const risky = isAllergenRisk(recipe.title, allergies) || recipe.ingredients.some((i) => isAllergenRisk(i, allergies));
            const views = viewCounts[recipe.id] ?? 0;
            const rating = ratings[recipe.id] ?? recipe.rating;
            return (
              <Pressable key={recipe.id} onPress={() => { setActiveRecipe(recipe); setUserRating(ratings[recipe.id] ?? 5); }} className="mb-3 overflow-hidden rounded-2xl border border-line bg-surface">
                {recipe.imageUrl ? <Image source={{ uri: recipe.imageUrl }} className="h-36 w-full" resizeMode="cover" /> : null}
                <View className="p-4">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-ink">{recipe.title}</Text>
                      <Text className="text-sm text-muted">{recipe.prepTime + recipe.cookTime} min · {recipe.difficulty} · ★ {rating.toFixed(1)}</Text>
                      {views > 0 && <Text className="text-xs text-muted">{views} views</Text>}
                    </View>
                    <Pressable onPress={() => toggleFavorite(recipe)} hitSlop={8}>
                      <Icon name="star" size={20} color={favoriteIds.has(recipe.id) ? colors.primary : colors.muted} />
                    </Pressable>
                  </View>
                  {risky && <Text className="mt-1 text-xs font-semibold text-danger">⚠ Allergen check</Text>}
                  {recipe.source === 'ai' && <Text className="mt-1 text-xs font-bold text-primary">AI generated</Text>}
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <Modal isOpen={!!activeRecipe} onClose={() => setActiveRecipe(null)} title={activeRecipe?.title ?? 'Recipe'}>
        {activeRecipe && (
          <ScrollView style={{ maxHeight: 420 }}>
            <Text className="mb-3 text-sm text-muted">{activeRecipe.description}</Text>
            <Text className="mb-1 font-semibold text-ink">Ingredients</Text>
            {activeRecipe.ingredients.map((ing, i) => (
              <Text key={i} className="text-sm text-ink">• {ing}</Text>
            ))}
            <Text className="mb-1 mt-4 font-semibold text-ink">Steps</Text>
            {activeRecipe.instructions.map((step, i) => (
              <Text key={i} className="mb-1 text-sm text-ink">{i + 1}. {step}</Text>
            ))}
            <View className="mt-4 gap-2">
              <TextField label="Your rating (1-5)" value={String(userRating)} onChangeText={(v) => setUserRating(Number(v) || 5)} keyboardType="numeric" />
              <Button label="Save rating" variant="secondary" onPress={() => rateRecipe(activeRecipe.id, userRating)} />
              <Button label="Mark as cooked" onPress={() => cookRecipe(activeRecipe)} />
              <Button label="Add missing to list" variant="secondary" onPress={() => addMissingToList(activeRecipe)} />
              <Button label="Save to collection" variant="ghost" onPress={() => setShowNewCollection(true)} />
            </View>
          </ScrollView>
        )}
      </Modal>

      <Modal isOpen={showNewCollection} onClose={() => setShowNewCollection(false)} title="New collection">
        <TextField label="Collection name" value={newCollectionName} onChangeText={setNewCollectionName} placeholder="Weeknight dinners" />
        <Button label="Save" onPress={saveToCollection} className="mt-4" />
      </Modal>
    </View>
  );
}
