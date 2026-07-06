import { useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import TextField from '../ui/TextField';
import { Icon } from '../ui/Icon';
import { PantryItem, MealPlan, ShoppingListItem, MealIngredient } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { generateSlotMeal, type AIMealIdea } from '../../lib/mealAI';
import { parseStoredDate } from '../../lib/date';
import { getMealTypeIcon } from '../../lib/appIcons';
import { useAppColors } from '../../hooks/useAppColors';

const MEAL_TYPE_LABELS: Record<MealPlan['meal_type'], string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

interface AddMealModalProps {
  slot: { date: string; mealType: MealPlan['meal_type'] };
  pantryItems: PantryItem[];
  onAdd: (
    meal: Omit<MealPlan, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
  ) => Promise<{ error: Error | null }>;
  onClose: () => void;
  onAddToShoppingList: (
    item: Omit<ShoppingListItem, 'id' | 'user_id' | 'created_at'>,
  ) => Promise<{ error: Error | null }>;
}

export default function AddMealModal({
  slot,
  pantryItems,
  onAdd,
  onClose,
  onAddToShoppingList,
}: AddMealModalProps) {
  const c = useAppColors();
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [ingredients, setIngredients] = useState<MealIngredient[]>([]);
  const [ingName, setIngName] = useState('');
  const [ingQty, setIngQty] = useState('1');
  const [ingUnit, setIngUnit] = useState('item');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<AIMealIdea | null>(null);
  const aiAbortRef = useRef<AbortController | null>(null);
  const { showToast } = useToast();

  const date = parseStoredDate(slot.date);
  const label = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const addIngredient = () => {
    if (!ingName.trim()) return;
    const pantryMatch = pantryItems.find((p) =>
      p.name.toLowerCase().includes(ingName.toLowerCase()),
    );
    setIngredients((prev) => [
      ...prev,
      {
        name: ingName.trim(),
        quantity: parseFloat(ingQty) || 1,
        unit: ingUnit,
        pantry_item_id: pantryMatch?.id,
      },
    ]);
    setIngName('');
    setIngQty('1');
  };

  const removeIngredient = (i: number) =>
    setIngredients((prev) => prev.filter((_, idx) => idx !== i));

  const applyAISuggestion = (idea: AIMealIdea) => {
    setAiSuggestion(idea);
    setName(idea.name);
    if (idea.description && !notes.trim()) setNotes(idea.description);
    setIngredients(
      idea.ingredients.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        pantry_item_id: i.pantryItemId,
      })),
    );
  };

  const handleAISuggest = async () => {
    aiAbortRef.current?.abort();
    const ctrl = new AbortController();
    aiAbortRef.current = ctrl;
    setAiLoading(true);
    setAiError(null);
    try {
      const idea = await generateSlotMeal(pantryItems, slot.mealType, { signal: ctrl.signal });
      if (ctrl.signal.aborted) return;
      applyAISuggestion(idea);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setAiError(err instanceof Error ? err.message : 'Could not generate a suggestion.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const { error } = await onAdd({
      date: slot.date,
      meal_type: slot.mealType,
      name: name.trim(),
      notes,
      ingredients,
    });
    if (!error) {
      const missing = ingredients.filter((i) => !i.pantry_item_id);
      for (const ing of missing) {
        await onAddToShoppingList({
          pantry_item_id: null,
          name: ing.name,
          brand: '',
          category: 'Other',
          quantity: ing.quantity,
          unit: ing.unit,
          is_checked: false,
          is_auto_generated: true,
          notes: `For: ${name}`,
        });
      }
      if (missing.length > 0) {
        showToast(
          `${missing.length} missing ingredient${missing.length > 1 ? 's' : ''} added to shopping list`,
          'info',
        );
      }
      onClose();
    }
    setLoading(false);
  };

  return (
    <Modal isOpen onClose={onClose} title={`Add ${MEAL_TYPE_LABELS[slot.mealType]}`}>
      <View className="gap-5">
        <View className="rounded-3xl border border-line dark:border-[#303541] bg-canvas dark:bg-[#090A0D] p-4">
          <View className="flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
              <Icon name={getMealTypeIcon(slot.mealType)} size={22} color={c.primary} />
            </View>
            <View>
              <Text className="text-xs font-bold uppercase tracking-widest text-muted dark:text-[#9A948D]">
                Meal slot
              </Text>
              <Text className="text-base font-bold text-ink dark:text-[#F6F1EA]">{MEAL_TYPE_LABELS[slot.mealType]}</Text>
              <Text className="text-[13px] font-medium text-muted dark:text-[#9A948D]">{label}</Text>
            </View>
          </View>
        </View>

        <View className="rounded-3xl border border-primary/20 bg-primary/5 p-4">
          <View className="flex-row items-start gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-2xl bg-primary">
              <Icon name="sparkles" size={18} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold uppercase tracking-widest text-muted dark:text-[#9A948D]">
                AI assist
              </Text>
              <Text className="text-[13px] font-semibold text-ink dark:text-[#F6F1EA]">
                Let Larderly pick a {slot.mealType} from your pantry.
              </Text>
              {aiSuggestion ? (
                <View className="mt-2 flex-row flex-wrap gap-1.5">
                  <View className="rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5">
                    <Text className="text-xs font-bold text-success">
                      {Math.round((aiSuggestion.pantryCoverage ?? 0) * 100)}% from pantry
                    </Text>
                  </View>
                </View>
              ) : null}
              {aiError ? <Text className="mt-2 text-xs font-medium text-danger">{aiError}</Text> : null}
            </View>
            <Button
              label={aiLoading ? '…' : aiSuggestion ? 'Again' : 'Suggest'}
              icon={aiLoading ? undefined : aiSuggestion ? 'refresh' : 'sparkles'}
              variant="primary"
              size="sm"
              onPress={handleAISuggest}
              disabled={aiLoading || pantryItems.length === 0}
              loading={aiLoading}
            />
          </View>
        </View>

        <TextField
          label="Meal Name *"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Avocado Toast"
          autoFocus
        />

        <View>
          <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-muted dark:text-[#9A948D]">
            Ingredients
          </Text>
          <View className="mb-3 gap-2">
            {ingredients.map((ing, i) => {
              const inPantry = !!ing.pantry_item_id;
              return (
                <View
                  key={`${ing.name}-${i}`}
                  className={`flex-row items-center gap-2 rounded-2xl border p-3 ${
                    inPantry ? 'border-success/20 bg-success/5' : 'border-primary/20 bg-primary/5'
                  }`}
                >
                  <Icon
                    name={inPantry ? 'success' : 'warning'}
                    size={18}
                    color={inPantry ? c.success : c.primary}
                  />
                  <Text className="flex-1 text-sm font-medium text-ink dark:text-[#F6F1EA]">{ing.name}</Text>
                  <Text className="text-xs text-muted dark:text-[#9A948D]">
                    {ing.quantity} {ing.unit}
                  </Text>
                  <Pressable onPress={() => removeIngredient(i)} hitSlop={8}>
                    <Icon name="close" size={16} color={c.muted} />
                  </Pressable>
                </View>
              );
            })}
          </View>
          <View className="flex-row gap-2">
            <View className="flex-1">
              <TextField
                value={ingName}
                onChangeText={setIngName}
                placeholder="Ingredient…"
                onSubmitEditing={addIngredient}
              />
            </View>
            <View className="w-16">
              <TextField value={ingQty} onChangeText={setIngQty} keyboardType="decimal-pad" />
            </View>
            <View className="w-20">
              <TextField value={ingUnit} onChangeText={setIngUnit} placeholder="unit" />
            </View>
            <Pressable
              onPress={addIngredient}
              className="h-[46px] w-12 items-center justify-center rounded-field bg-primary"
            >
              <Icon name="plus" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
          {ingredients.some((i) => !i.pantry_item_id) ? (
            <Text className="mt-2 text-xs text-primary">
              Orange items will be added to your shopping list
            </Text>
          ) : null}
        </View>

        <TextField
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Recipe notes…"
          multiline
          numberOfLines={3}
          style={{ minHeight: 72, textAlignVertical: 'top' }}
        />

        <View className="flex-row gap-2">
          <Button label="Cancel" variant="secondary" onPress={onClose} />
          <Button
            label={loading ? 'Saving…' : 'Save Meal'}
            onPress={handleSave}
            disabled={loading || !name.trim()}
            loading={loading}
            className="flex-1"
          />
        </View>
      </View>
    </Modal>
  );
}
