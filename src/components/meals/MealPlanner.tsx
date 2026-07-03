import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import { Icon } from '../ui/Icon';
import AddMealModal from './AddMealModal';
import ViewMealModal from './ViewMealModal';
import AIIdeasCard from './AIIdeasCard';
import AIPlanWeekModal from './AIPlanWeekModal';
import AIChatModal from './AIChatModal';
import { MealPlan, PantryItem, ShoppingListItem } from '../../types';
import { formatDateString } from '../../lib/date';
import { getMealTypeIcon } from '../../lib/appIcons';
import { colors } from '../../theme';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
type MealType = (typeof MEAL_TYPES)[number];

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function getWeekDays(startDate: Date) {
  return Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
}

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

interface MealPlannerProps {
  meals: MealPlan[];
  loading: boolean;
  pantryItems: PantryItem[];
  onAdd: (
    meal: Omit<MealPlan, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
  ) => Promise<{ error: Error | null }>;
  onDelete: (id: string) => Promise<void>;
  onAddToShoppingList: (
    item: Omit<ShoppingListItem, 'id' | 'user_id' | 'created_at'>,
  ) => Promise<{ error: Error | null }>;
}

export default function MealPlanner({
  meals,
  loading,
  pantryItems,
  onAdd,
  onDelete,
  onAddToShoppingList,
}: MealPlannerProps) {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; mealType: MealType } | null>(
    null,
  );
  const [selectedMeal, setSelectedMeal] = useState<MealPlan | null>(null);
  const [showWeekPlanModal, setShowWeekPlanModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const today = formatDateString(new Date());
  const isCurrentWeek =
    formatDateString(weekStart) === formatDateString(getMonday(new Date()));

  const getMealsForSlot = (date: string, mealType: MealType) =>
    meals.filter((m) => m.date === date && m.meal_type === mealType);

  const prevWeek = () => setWeekStart((d) => addDays(d, -7));
  const nextWeek = () => setWeekStart((d) => addDays(d, 7));
  const thisWeek = () => setWeekStart(getMonday(new Date()));

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <>
      <View className="mb-5 flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-3xl font-bold text-ink">Meal Planner</Text>
          <View className="mt-1 flex-row items-center gap-1.5">
            <Icon name="sparkles" size={14} color={colors.primary} />
            <Text className="font-medium text-muted">AI meal planning</Text>
          </View>
        </View>
        <View className="flex-row gap-2">
          <Button
            label="Chat"
            icon="sparkles"
            variant="secondary"
            size="sm"
            onPress={() => setShowChatModal(true)}
          />
          <Button
            label="Auto-plan"
            icon="sparkles"
            size="sm"
            onPress={() => setShowWeekPlanModal(true)}
          />
        </View>
      </View>

      <View className="mb-5 flex-row items-center gap-2">
        <Pressable
          onPress={prevWeek}
          className="h-10 w-10 items-center justify-center rounded-full border border-line bg-surface"
        >
          <Icon name="chevron-left" size={18} color={colors.ink} />
        </Pressable>
        <Pressable
          onPress={nextWeek}
          className="h-10 w-10 items-center justify-center rounded-full border border-line bg-surface"
        >
          <Icon name="chevron-right" size={18} color={colors.ink} />
        </Pressable>
        {!isCurrentWeek ? (
          <Button label="Today" variant="secondary" size="sm" onPress={thisWeek} />
        ) : null}
      </View>

      <View className="gap-4">
        {weekDays.map((day, dayIndex) => {
          const dateStr = formatDateString(day);
          const isToday = dateStr === today;
          const dayLabel = day.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          });

          return (
            <View
              key={dateStr}
              className={`overflow-hidden rounded-card border bg-surface ${
                isToday ? 'border-primary/40' : 'border-line'
              }`}
            >
              <View
                className={`flex-row items-center justify-between border-b border-line px-4 py-3 ${
                  isToday ? 'bg-primary/5' : 'bg-canvas'
                }`}
              >
                <View className="flex-row items-center gap-3">
                  <View
                    className={`h-10 w-10 items-center justify-center rounded-2xl ${
                      isToday ? 'bg-primary' : 'border border-line bg-surface'
                    }`}
                  >
                    <Text
                      className={`text-sm font-black ${isToday ? 'text-white' : 'text-ink'}`}
                    >
                      {day.getDate()}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-[10px] font-bold uppercase tracking-widest text-muted">
                      {DAY_LABELS[dayIndex]}
                    </Text>
                    <Text className="text-sm font-bold text-ink">{dayLabel}</Text>
                  </View>
                </View>
                {isToday ? (
                  <View className="rounded-full bg-primary/10 px-2.5 py-0.5">
                    <Text className="text-[10px] font-bold uppercase text-primary">Today</Text>
                  </View>
                ) : null}
              </View>

              <View className="gap-0">
                {MEAL_TYPES.map((mealType) => {
                  const slotMeals = getMealsForSlot(dateStr, mealType);
                  return (
                    <View
                      key={mealType}
                      className="flex-row items-center gap-3 border-b border-line px-4 py-3 last:border-b-0"
                    >
                      <View className="h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                        <Icon name={getMealTypeIcon(mealType)} size={18} color={colors.primary} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-bold text-muted">
                          {MEAL_TYPE_LABELS[mealType]}
                        </Text>
                        {slotMeals.length > 0 ? (
                          <View className="mt-1 gap-1">
                            {slotMeals.map((meal) => (
                              <Pressable
                                key={meal.id}
                                onPress={() => setSelectedMeal(meal)}
                                className="rounded-xl border border-line bg-canvas px-2.5 py-1.5"
                              >
                                <Text numberOfLines={1} className="text-sm font-bold text-ink">
                                  {meal.name}
                                </Text>
                                {meal.ingredients?.length > 0 ? (
                                  <Text className="text-[10px] font-semibold text-muted">
                                    {meal.ingredients.length} ingr.
                                  </Text>
                                ) : null}
                              </Pressable>
                            ))}
                          </View>
                        ) : (
                          <Text className="mt-0.5 text-xs text-muted">No meal planned</Text>
                        )}
                      </View>
                      <Pressable
                        onPress={() => setSelectedSlot({ date: dateStr, mealType })}
                        hitSlop={8}
                        className="h-9 w-9 items-center justify-center rounded-full border border-line bg-surface"
                      >
                        <Icon name="plus" size={18} color={colors.muted} />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>

      <AIIdeasCard
        pantryItems={pantryItems}
        onSaveMeal={onAdd}
        onAddToShoppingList={onAddToShoppingList}
      />

      {selectedSlot ? (
        <AddMealModal
          slot={selectedSlot}
          pantryItems={pantryItems}
          onAdd={onAdd}
          onClose={() => setSelectedSlot(null)}
          onAddToShoppingList={onAddToShoppingList}
        />
      ) : null}

      {selectedMeal ? (
        <ViewMealModal
          meal={selectedMeal}
          pantryItems={pantryItems}
          onClose={() => setSelectedMeal(null)}
          onDelete={onDelete}
          onAddToShoppingList={onAddToShoppingList}
          onAdd={onAdd}
        />
      ) : null}

      {showWeekPlanModal ? (
        <AIPlanWeekModal
          weekStart={weekStart}
          pantryItems={pantryItems}
          onClose={() => setShowWeekPlanModal(false)}
          onAddMeal={onAdd}
          onAddToShoppingList={onAddToShoppingList}
        />
      ) : null}

      {showChatModal ? (
        <AIChatModal pantryItems={pantryItems} onClose={() => setShowChatModal(false)} />
      ) : null}
    </>
  );
}
