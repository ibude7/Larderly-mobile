import { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Icon } from '../ui/Icon';
import { PantryItem, MealPlan, ShoppingListItem, MealIngredient } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { generateRecipe, type AIRecipe, type MealType as AIMealType } from '../../lib/mealAI';
import { formatDateString } from '../../lib/date';
import { useAppColors } from '../../hooks/useAppColors';

interface AIRecipeModalProps {
  mealName: string;
  pantryItems: PantryItem[];
  initialPartial?: Partial<AIRecipe>;
  saveContext?: { date: string; mealType: AIMealType };
  onSaveMeal?: (
    meal: Omit<MealPlan, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
  ) => Promise<{ error: Error | null }>;
  onAddToShoppingList: (
    item: Omit<ShoppingListItem, 'id' | 'user_id' | 'created_at'>,
  ) => Promise<{ error: Error | null }>;
  onClose: () => void;
}

const DIFFICULTY_LABEL: Record<'easy' | 'medium' | 'hard', string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Challenging',
};

export default function AIRecipeModal({
  mealName,
  pantryItems,
  initialPartial,
  saveContext,
  onSaveMeal,
  onAddToShoppingList,
  onClose,
}: AIRecipeModalProps) {
  const c = useAppColors();
  const { showToast } = useToast();
  const [recipe, setRecipe] = useState<Partial<AIRecipe> | null>(initialPartial ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [addingShopping, setAddingShopping] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    setRecipe(initialPartial ?? null);

    generateRecipe(mealName, pantryItems, {
      mealType: saveContext?.mealType,
      signal: ctrl.signal,
      onPartial: (partial) => {
        if (!ctrl.signal.aborted) setRecipe(partial);
      },
    })
      .then((final) => {
        if (ctrl.signal.aborted) return;
        setRecipe(final);
        setLoading(false);
      })
      .catch((err) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to generate recipe.');
        setLoading(false);
      });
  }, [mealName, pantryItems, initialPartial, saveContext?.mealType]);

  useEffect(() => {
    run();
    return () => abortRef.current?.abort();
  }, [run]);

  const missingIngredients = (recipe?.ingredients ?? []).filter((i) => !i.inPantry);

  const handleSaveMeal = async () => {
    if (!onSaveMeal || !recipe?.name) return;
    setSaving(true);
    const ingredients: MealIngredient[] = (recipe.ingredients ?? []).map((i) => ({
      name: i.name,
      quantity: i.quantity,
      unit: i.unit,
      pantry_item_id: i.pantryItemId,
    }));
    const date = saveContext?.date ?? formatDateString(new Date());
    const mealType = saveContext?.mealType ?? 'dinner';
    const notes = [
      recipe.description ?? '',
      '',
      ...(recipe.steps ?? []).map((s) => `${s.stepNumber}. ${s.title}\n${s.body}`),
      '',
      ...(recipe.tips ?? []).map((t) => `Tip: ${t}`),
    ]
      .join('\n')
      .trim();

    const { error: saveErr } = await onSaveMeal({
      date,
      meal_type: mealType,
      name: recipe.name,
      notes,
      ingredients,
    });
    setSaving(false);
    if (saveErr) {
      showToast('Could not save meal. Please try again.', 'error');
      return;
    }
    showToast(`Saved "${recipe.name}" to your plan`, 'success');
    onClose();
  };

  const handleAddMissing = async () => {
    if (missingIngredients.length === 0) return;
    setAddingShopping(true);
    let added = 0;
    for (const ing of missingIngredients) {
      const { error: shopErr } = await onAddToShoppingList({
        pantry_item_id: null,
        name: ing.name,
        brand: '',
        category: 'Other',
        quantity: ing.quantity,
        unit: ing.unit,
        is_checked: false,
        is_auto_generated: true,
        notes: `For: ${recipe?.name ?? mealName}`,
      });
      if (!shopErr) added += 1;
    }
    setAddingShopping(false);
    if (added > 0) showToast(`${added} ingredient${added === 1 ? '' : 's'} added to shopping list`, 'success');
    else showToast('Could not add to shopping list.', 'error');
  };

  const totalMin = (recipe?.prepTimeMin ?? 0) + (recipe?.cookTimeMin ?? 0);

  return (
    <Modal isOpen onClose={onClose} title={recipe?.name ?? mealName}>
      <View className="gap-5">
        {/* Hero */}
        <View className="rounded-3xl border border-primary/20 bg-primary/5 p-5">
          <View className="flex-row items-start gap-4">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary">
              <Icon name="chef" size={24} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <View className="mb-1 flex-row items-center gap-1.5">
                <Icon name="sparkles" size={13} color={c.primary} />
                <Text className="text-xs font-bold uppercase tracking-widest text-muted dark:text-[#9A948D]">
                  AI recipe
                </Text>
              </View>
              <Text className="text-xl font-bold text-ink dark:text-[#F6F1EA]">{recipe?.name ?? mealName}</Text>
              {recipe?.description ? (
                <Text className="mt-1.5 text-[13px] leading-relaxed text-ink/70 dark:text-[#F6F1EA]">
                  {recipe.description}
                </Text>
              ) : loading ? (
                <Text className="mt-1.5 text-[13px] text-muted dark:text-[#9A948D]">Crafting a recipe…</Text>
              ) : null}
              <View className="mt-3 flex-row flex-wrap gap-2">
                {totalMin > 0 ? <Badge icon="clock" label={`${totalMin} min`} /> : null}
                {recipe?.servings != null ? (
                  <Badge label={`${recipe.servings} ${recipe.servings === 1 ? 'serving' : 'servings'}`} />
                ) : null}
                {recipe?.difficulty ? <Badge label={DIFFICULTY_LABEL[recipe.difficulty]} /> : null}
              </View>
            </View>
          </View>
        </View>

        {error ? (
          <View className="rounded-2xl border border-danger/30 bg-danger/10 p-4">
            <Text className="text-sm font-semibold text-ink dark:text-[#F6F1EA]">Couldn't generate the recipe.</Text>
            <Text className="mt-1 text-sm text-ink/70 dark:text-[#F6F1EA]">{error}</Text>
            <View className="mt-3 self-start">
              <Button label="Try again" icon="refresh" variant="secondary" size="sm" onPress={run} />
            </View>
          </View>
        ) : null}

        {/* Ingredients */}
        {(recipe?.ingredients ?? []).length > 0 ? (
          <View className="rounded-3xl border border-line dark:border-[#303541] bg-canvas dark:bg-[#090A0D] p-4">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-xs font-bold uppercase tracking-widest text-muted dark:text-[#9A948D]">
                Ingredients
              </Text>
              {recipe?.pantryCoverage != null ? (
                <View className="rounded-full bg-success/10 px-2.5 py-0.5">
                  <Text className="text-xs font-bold uppercase text-success">
                    {Math.round((recipe.pantryCoverage ?? 0) * 100)}% in pantry
                  </Text>
                </View>
              ) : null}
            </View>
            <View className="gap-2">
              {(recipe?.ingredients ?? []).map((ing, i) => (
                <View
                  key={`${ing.name}-${i}`}
                  className={`flex-row items-center gap-2 rounded-2xl border p-3 ${
                    ing.inPantry ? 'border-success/20 bg-success/5' : 'border-primary/20 bg-primary/5'
                  }`}
                >
                  <Icon
                    name={ing.inPantry ? 'success' : 'warning'}
                    size={18}
                    color={ing.inPantry ? c.success : c.primary}
                  />
                  <Text className="flex-1 text-sm font-medium text-ink dark:text-[#F6F1EA]">{ing.name}</Text>
                  <Text className="text-xs font-semibold text-muted dark:text-[#9A948D]">
                    {ing.quantity} {ing.unit}
                  </Text>
                </View>
              ))}
            </View>
            {missingIngredients.length > 0 ? (
              <View className="mt-3">
                <Button
                  label={`Add ${missingIngredients.length} missing to shopping list`}
                  icon="cart"
                  variant="secondary"
                  onPress={handleAddMissing}
                  loading={addingShopping}
                  full
                />
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Steps */}
        {(recipe?.steps ?? []).length > 0 ? (
          <View className="rounded-3xl border border-line dark:border-[#303541] bg-surface dark:bg-[#171A21] p-4">
            <Text className="mb-3 text-xs font-bold uppercase tracking-widest text-muted dark:text-[#9A948D]">
              Steps
            </Text>
            <View className="gap-3">
              {(recipe?.steps ?? []).map((step, i) => (
                <View key={`step-${i}`} className="flex-row gap-3">
                  <View className="h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                    <Text className="text-[13px] font-black text-primary">{step.stepNumber}</Text>
                  </View>
                  <View className="flex-1">
                    {step.title ? (
                      <Text className="text-sm font-bold text-ink dark:text-[#F6F1EA]">{step.title}</Text>
                    ) : null}
                    {step.body ? (
                      <Text className="mt-0.5 text-[13px] leading-relaxed text-ink/70 dark:text-[#F6F1EA]">
                        {step.body}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Tips */}
        {(recipe?.tips ?? []).length > 0 ? (
          <View className="rounded-3xl border border-warning/30 bg-warning/5 p-4">
            <View className="mb-2 flex-row items-center gap-1.5">
              <Icon name="sparkles" size={13} color={c.warning} />
              <Text className="text-xs font-bold uppercase tracking-widest text-muted dark:text-[#9A948D]">Tips</Text>
            </View>
            <View className="gap-1.5">
              {(recipe?.tips ?? []).map((tip, i) => (
                <View key={`tip-${i}`} className="flex-row gap-2">
                  <View className="mt-1.5 h-1.5 w-1.5 rounded-full bg-warning" />
                  <Text className="flex-1 text-[13px] text-ink/80 dark:text-[#F6F1EA]">{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Actions */}
        <View className="gap-2">
          <Button label="Regenerate" icon="refresh" variant="secondary" onPress={run} disabled={loading} full />
          {onSaveMeal ? (
            <Button
              label="Save to meal plan"
              icon="plus"
              onPress={handleSaveMeal}
              loading={saving}
              disabled={loading || !recipe?.name}
              full
            />
          ) : null}
          <Button label="Close" variant="ghost" onPress={onClose} full />
        </View>
      </View>
    </Modal>
  );
}

function Badge({ icon, label }: { icon?: Parameters<typeof Icon>[0]['name']; label: string }) {
  const c = useAppColors();
  return (
    <View className="flex-row items-center gap-1 rounded-full border border-line dark:border-[#303541] bg-surface dark:bg-[#171A21] px-2.5 py-1">
      {icon ? <Icon name={icon} size={12} color={c.muted} /> : null}
      <Text className="text-xs font-bold text-ink dark:text-[#F6F1EA]">{label}</Text>
    </View>
  );
}
