import { useMemo, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import TextField from '../ui/TextField';
import LoadingSpinner from '../ui/LoadingSpinner';
import { Icon } from '../ui/Icon';
import { PantryItem, MealPlan, ShoppingListItem, MealIngredient } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import {
  generateWeekPlan,
  type AIWeekPlan,
  type AIWeekPlanEntry,
  type MealType as AIMealType,
  type WeekPlanPreferences,
} from '../../lib/mealAI';
import { formatDateString } from '../../lib/date';
import { getMealTypeIcon } from '../../lib/appIcons';
import { useAppColors } from '../../hooks/useAppColors';

interface AIPlanWeekModalProps {
  weekStart: Date;
  pantryItems: PantryItem[];
  onClose: () => void;
  onAddMeal: (
    meal: Omit<MealPlan, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
  ) => Promise<{ error: Error | null }>;
  onAddToShoppingList: (
    item: Omit<ShoppingListItem, 'id' | 'user_id' | 'created_at'>,
  ) => Promise<{ error: Error | null }>;
}

const ALL_MEAL_TYPES: AIMealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const MEAL_TYPE_LABEL: Record<AIMealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

type Stage = 'configure' | 'generating' | 'review';

export default function AIPlanWeekModal({
  weekStart,
  pantryItems,
  onClose,
  onAddMeal,
  onAddToShoppingList,
}: AIPlanWeekModalProps) {
  const c = useAppColors();
  const { showToast } = useToast();
  const [stage, setStage] = useState<Stage>('configure');
  const [plan, setPlan] = useState<AIWeekPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [mealTypes, setMealTypes] = useState<AIMealType[]>(['dinner']);
  const [servings, setServings] = useState('2');
  const [restrictions, setRestrictions] = useState('');
  const [useExpiringFirst, setUseExpiringFirst] = useState(true);
  const [alsoShoppingList, setAlsoShoppingList] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const weekRange = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(weekStart)} – ${fmt(end)}`;
  }, [weekStart]);

  const expiringSoon = useMemo(() => {
    const now = new Date();
    return pantryItems.filter((i) => {
      if (!i.expiry_date) return false;
      const d = new Date(i.expiry_date);
      const days = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= 7;
    });
  }, [pantryItems]);

  const toggleMealType = (t: AIMealType) => {
    setMealTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const handleGenerate = async () => {
    if (mealTypes.length === 0) {
      setError('Pick at least one meal type to plan.');
      return;
    }
    if (pantryItems.length === 0) {
      setError('Add a few pantry items first — I need something to cook with.');
      return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const prefs: WeekPlanPreferences = {
      startDate: formatDateString(weekStart),
      mealTypes,
      servings: parseInt(servings, 10) || 2,
      restrictions: restrictions.trim(),
      useExpiringFirst,
    };

    setError(null);
    setPlan(null);
    setStage('generating');

    try {
      const result = await generateWeekPlan(pantryItems, prefs, { signal: ctrl.signal });
      if (ctrl.signal.aborted) return;
      setPlan(result);
      setStage('review');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Could not generate plan.');
      setStage('configure');
    }
  };

  const handleSave = async () => {
    if (!plan) return;
    setSaving(true);
    let saved = 0;
    let shoppingAdded = 0;

    for (const entry of plan.entries) {
      const ingredients: MealIngredient[] = entry.meal.ingredients.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        pantry_item_id: i.pantryItemId,
      }));

      const { error: saveErr } = await onAddMeal({
        date: entry.date,
        meal_type: entry.mealType,
        name: entry.meal.name,
        notes: entry.meal.description,
        ingredients,
      });
      if (!saveErr) saved += 1;

      if (alsoShoppingList) {
        const missing = entry.meal.ingredients.filter((i) => !i.inPantry);
        for (const ing of missing) {
          const { error: shopErr } = await onAddToShoppingList({
            pantry_item_id: null,
            name: ing.name,
            brand: '',
            category: 'Other',
            quantity: ing.quantity,
            unit: ing.unit,
            is_checked: false,
            is_auto_generated: true,
            notes: `For: ${entry.meal.name}`,
          });
          if (!shopErr) shoppingAdded += 1;
        }
      }
    }

    setSaving(false);
    if (saved > 0) {
      const shopNote =
        alsoShoppingList && shoppingAdded > 0 ? ` and ${shoppingAdded} to shopping list` : '';
      showToast(`Added ${saved} meal${saved === 1 ? '' : 's'} to your week${shopNote}`, 'success');
      onClose();
    } else {
      showToast('Could not save plan. Please try again.', 'error');
    }
  };

  const handleClose = () => {
    abortRef.current?.abort();
    onClose();
  };

  const handleRemoveEntry = (entry: AIWeekPlanEntry) => {
    if (!plan) return;
    setPlan({
      ...plan,
      entries: plan.entries.filter(
        (e) => !(e.date === entry.date && e.mealType === entry.mealType),
      ),
    });
  };

  return (
    <Modal isOpen onClose={handleClose} title="Plan my week with AI">
      {stage === 'configure' ? (
        <View className="gap-5">
          <View className="rounded-3xl border border-primary/20 bg-primary/5 p-4">
            <View className="flex-row items-start gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary">
                <Icon name="sparkles" size={22} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-bold uppercase tracking-widest text-muted dark:text-[#6B6878]">
                  The week of {weekRange}
                </Text>
                <Text className="text-[15px] font-bold text-ink dark:text-[#F0EEE9]">
                  I'll build a smart plan around what you have.
                </Text>
                <Text className="mt-1 text-xs text-muted dark:text-[#6B6878]">
                  {pantryItems.length} pantry items · {expiringSoon.length} expiring soon
                </Text>
              </View>
            </View>
          </View>

          <View>
            <Text className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted dark:text-[#6B6878]">
              Meal types to plan
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {ALL_MEAL_TYPES.map((t) => {
                const selected = mealTypes.includes(t);
                return (
                  <Pressable
                    key={t}
                    onPress={() => toggleMealType(t)}
                    className={`flex-row items-center gap-1.5 rounded-full border px-3 py-2 ${
                      selected ? 'border-primary bg-primary/10' : 'border-line dark:border-[#2A2A35] bg-surface dark:bg-[#1A1A22]'
                    }`}
                  >
                    <Icon
                      name={getMealTypeIcon(t)}
                      size={14}
                      color={selected ? c.primary : c.muted}
                    />
                    <Text
                      className={`text-xs font-bold ${selected ? 'text-primary' : 'text-muted dark:text-[#6B6878]'}`}
                    >
                      {MEAL_TYPE_LABEL[t]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <TextField
            label="Servings per meal"
            value={servings}
            onChangeText={setServings}
            keyboardType="number-pad"
          />
          <TextField
            label="Dietary restrictions (optional)"
            value={restrictions}
            onChangeText={setRestrictions}
            placeholder="e.g. vegetarian, nut-free"
          />

          <Pressable
            onPress={() => setUseExpiringFirst((v) => !v)}
            className="flex-row items-center gap-3 rounded-2xl border border-line dark:border-[#2A2A35] bg-canvas dark:bg-[#0F0F13] p-3"
          >
            <Icon
              name={useExpiringFirst ? 'checkmark-done' : 'add'}
              size={20}
              color={useExpiringFirst ? c.success : c.muted}
            />
            <Text className="flex-1 text-sm text-ink dark:text-[#F0EEE9]">Prioritize expiring pantry items</Text>
          </Pressable>

          <Pressable
            onPress={() => setAlsoShoppingList((v) => !v)}
            className="flex-row items-center gap-3 rounded-2xl border border-line dark:border-[#2A2A35] bg-canvas dark:bg-[#0F0F13] p-3"
          >
            <Icon
              name={alsoShoppingList ? 'checkmark-done' : 'add'}
              size={20}
              color={alsoShoppingList ? c.success : c.muted}
            />
            <Text className="flex-1 text-sm text-ink dark:text-[#F0EEE9]">
              Add missing ingredients to shopping list
            </Text>
          </Pressable>

          {error ? <Text className="text-sm font-medium text-danger">{error}</Text> : null}

          <View className="flex-row gap-2">
            <Button label="Cancel" variant="secondary" onPress={handleClose} />
            <Button label="Generate plan" icon="sparkles" onPress={handleGenerate} className="flex-1" />
          </View>
        </View>
      ) : null}

      {stage === 'generating' ? (
        <View className="items-center gap-4 py-10">
          <LoadingSpinner size="lg" />
          <Text className="text-base font-bold text-ink dark:text-[#F0EEE9]">Planning your week…</Text>
          <Text className="text-center text-sm text-muted dark:text-[#6B6878]">
            Matching meals to your pantry and preferences.
          </Text>
          <Button label="Cancel" variant="ghost" onPress={handleClose} />
        </View>
      ) : null}

      {stage === 'review' && plan ? (
        <View className="gap-4">
          {plan.summary ? (
            <View className="rounded-2xl border border-line dark:border-[#2A2A35] bg-canvas dark:bg-[#0F0F13] p-3">
              <Text className="text-sm leading-relaxed text-ink/80 dark:text-[#F0EEE9]">{plan.summary}</Text>
            </View>
          ) : null}
          <View className="gap-2">
            {plan.entries.map((entry, i) => (
              <View
                key={`${entry.date}-${entry.mealType}-${i}`}
                className="flex-row items-center gap-3 rounded-2xl border border-line dark:border-[#2A2A35] bg-surface dark:bg-[#1A1A22] p-3"
              >
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <Icon name={getMealTypeIcon(entry.mealType)} size={18} color={c.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] font-bold uppercase text-muted dark:text-[#6B6878]">
                    {entry.date} · {MEAL_TYPE_LABEL[entry.mealType]}
                  </Text>
                  <Text className="text-sm font-bold text-ink dark:text-[#F0EEE9]">{entry.meal.name}</Text>
                </View>
                <Pressable onPress={() => handleRemoveEntry(entry)} hitSlop={8}>
                  <Icon name="close" size={16} color={c.muted} />
                </Pressable>
              </View>
            ))}
          </View>
          <View className="flex-row gap-2">
            <Button label="Back" variant="secondary" onPress={() => setStage('configure')} />
            <Button
              label={saving ? 'Saving…' : 'Save to calendar'}
              onPress={handleSave}
              loading={saving}
              disabled={plan.entries.length === 0}
              className="flex-1"
            />
          </View>
        </View>
      ) : null}
    </Modal>
  );
}
