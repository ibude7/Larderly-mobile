import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import AIRecipeModal from './AIRecipeModal';
import { Icon } from '../ui/Icon';
import { PantryItem, MealPlan, ShoppingListItem, MealIngredient } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { parseStoredDate } from '../../lib/date';
import { getMealTypeIcon } from '../../lib/appIcons';
import { useAppColors } from '../../hooks/useAppColors';

const MEAL_TYPE_LABELS: Record<MealPlan['meal_type'], string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

interface ViewMealModalProps {
  meal: MealPlan;
  pantryItems: PantryItem[];
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
  onAddToShoppingList: (
    item: Omit<ShoppingListItem, 'id' | 'user_id' | 'created_at'>,
  ) => Promise<{ error: Error | null }>;
  onAdd: (
    meal: Omit<MealPlan, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
  ) => Promise<{ error: Error | null }>;
}

export default function ViewMealModal({
  meal,
  pantryItems,
  onClose,
  onDelete,
  onAddToShoppingList,
  onAdd,
}: ViewMealModalProps) {
  const c = useAppColors();
  const date = parseStoredDate(meal.date);
  const label = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  const { showToast } = useToast();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [showRecipe, setShowRecipe] = useState(false);

  const handleDelete = async () => {
    setRemoving(true);
    await onDelete(meal.id);
    setRemoving(false);
    setConfirmRemove(false);
    onClose();
  };

  const handleAddMissing = async () => {
    if (!meal.ingredients) return;
    const missing = meal.ingredients.filter((i: MealIngredient) => !i.pantry_item_id);
    for (const ing of missing) {
      await onAddToShoppingList({
        pantry_item_id: null,
        name: ing.name,
        brand: '',
        category: 'Other',
        quantity: ing.quantity,
        unit: ing.unit,
        is_checked: false,
        is_auto_generated: false,
        notes: `For: ${meal.name}`,
      });
    }
    showToast(
      `${missing.length} ingredient${missing.length !== 1 ? 's' : ''} added to shopping list`,
      'success',
    );
  };

  const missingCount =
    meal.ingredients?.filter((i: MealIngredient) => !i.pantry_item_id).length ?? 0;

  return (
    <>
      <Modal isOpen onClose={onClose} title={meal.name}>
        <View className="gap-5">
          <View className="rounded-3xl border border-line dark:border-line-dark bg-canvas dark:bg-canvas-dark p-4">
            <View className="flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
                <Icon
                  name={getMealTypeIcon(meal.meal_type)}
                  size={22}
                  color={c.primary}
                />
              </View>
              <View>
                <Text className="text-xs font-bold uppercase tracking-widest text-muted dark:text-muted-dark">
                  Scheduled meal
                </Text>
                <Text className="text-base font-bold text-ink dark:text-ink-dark">
                  {MEAL_TYPE_LABELS[meal.meal_type]}
                </Text>
                <Text className="text-[13px] font-medium text-muted dark:text-muted-dark">{label}</Text>
              </View>
            </View>
          </View>

          <Pressable
            onPress={() => setShowRecipe(true)}
            className="flex-row items-center gap-3 rounded-3xl border border-primary/30 bg-primary/5 p-4"
          >
            <View className="h-10 w-10 items-center justify-center rounded-2xl bg-primary">
              <Icon name="chef" size={20} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5">
                <Icon name="sparkles" size={13} color={c.primary} />
                <Text className="text-xs font-bold uppercase tracking-widest text-muted dark:text-muted-dark">
                  AI recipe
                </Text>
              </View>
              <Text className="text-sm font-bold text-ink dark:text-ink-dark">Generate a full recipe</Text>
              <Text className="text-xs text-muted dark:text-muted-dark">Steps, timing, and tips</Text>
            </View>
            <Icon name="chevron-right" size={18} color={c.muted} />
          </Pressable>

          {meal.ingredients && meal.ingredients.length > 0 ? (
            <View className="rounded-3xl border border-line dark:border-line-dark bg-canvas dark:bg-canvas-dark p-4">
              <Text className="mb-3 text-xs font-bold uppercase tracking-widest text-muted dark:text-muted-dark">
                Ingredients
              </Text>
              <View className="gap-2">
                {meal.ingredients.map((ing: MealIngredient, i: number) => {
                  const inPantry =
                    !!ing.pantry_item_id ||
                    pantryItems.some((p) => p.name.toLowerCase() === ing.name.toLowerCase());
                  return (
                    <View
                      key={`${ing.name}-${i}`}
                      className={`flex-row items-center gap-2 rounded-2xl border p-3 ${
                        inPantry ? 'border-success/20 bg-success/5' : 'border-primary/20 bg-primary/5'
                      }`}
                    >
                      <Icon
                        name={inPantry ? 'success' : 'warning'}
                        size={16}
                        color={inPantry ? c.success : c.primary}
                      />
                      <Text className="flex-1 text-sm text-ink dark:text-ink-dark">{ing.name}</Text>
                      <Text className="text-xs text-muted dark:text-muted-dark">
                        {ing.quantity} {ing.unit}
                      </Text>
                    </View>
                  );
                })}
              </View>
              {missingCount > 0 ? (
                <View className="mt-3">
                  <Button
                    label={`Add ${missingCount} missing to shopping list`}
                    icon="plus"
                    variant="secondary"
                    onPress={handleAddMissing}
                    full
                  />
                </View>
              ) : null}
            </View>
          ) : null}

          {meal.notes ? (
            <View className="rounded-3xl border border-line dark:border-line-dark bg-surface dark:bg-surface-dark p-4">
              <Text className="mb-2 text-xs font-bold uppercase tracking-widest text-muted dark:text-muted-dark">
                Notes
              </Text>
              <Text className="text-sm leading-relaxed text-ink/80 dark:text-ink-dark">{meal.notes}</Text>
            </View>
          ) : null}

          <View className="flex-row gap-2">
            <Button
              label="Remove"
              icon="trash"
              variant="danger"
              onPress={() => setConfirmRemove(true)}
            />
            <Button label="Close" variant="secondary" onPress={onClose} className="flex-1" />
          </View>
        </View>
      </Modal>

      {showRecipe ? (
        <AIRecipeModal
          mealName={meal.name}
          pantryItems={pantryItems}
          saveContext={{ date: meal.date, mealType: meal.meal_type }}
          onSaveMeal={onAdd}
          onAddToShoppingList={onAddToShoppingList}
          onClose={() => setShowRecipe(false)}
        />
      ) : null}

      <ConfirmDialog
        isOpen={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={handleDelete}
        busy={removing}
        title="Remove meal"
        description={`Remove ${meal.name} from the plan? Ingredients already on your shopping list will stay.`}
        confirmLabel="Remove meal"
        cancelLabel="Keep"
      />
    </>
  );
}
