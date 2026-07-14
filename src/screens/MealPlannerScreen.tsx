import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { FeaturePageShell } from '../components/main/FeaturePageShell';
import { SettingsGlass } from '../components/settings/SettingsGlass';
import { SettingsChoiceChip } from '../components/settings/SettingsChoiceChip';
import { settingsType } from '../components/settings/settingsFonts';
import { GlassButton } from '../components/landing/GlassButton';
import { useAuth } from '../contexts/AuthContext';
import { useHousehold } from '../contexts/HouseholdContext';
import { useGoBack } from '../navigation/useGoBack';
import { BUILTIN_RECIPES, type MealType } from '../lib/recipes';
import { useAppColors } from '../hooks/useAppColors';
import { useScale } from '../theme/scale';

type Slot = { mealType: MealType; recipeId: string; title: string };
type DayPlan = { date: string; slots: Slot[] };

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];

function weekDates(from = new Date()): string[] {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  start.setDate(start.getDate() - ((day + 6) % 7)); // Monday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

function labelDay(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function MealPlannerScreen() {
  const goBack = useGoBack();
  const { s, fs } = useScale();
  const c = useAppColors();
  const { user } = useAuth();
  const { householdId } = useHousehold();
  const days = useMemo(() => weekDates(), []);
  const [selectedDay, setSelectedDay] = useState(days[0]);
  const [plans, setPlans] = useState<Record<string, DayPlan>>({});
  const storageKey = `larderly:mealPlan:${householdId ?? user?.uid ?? 'local'}`;

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(storageKey)
      .then((raw) => {
        if (!alive || !raw) return;
        try {
          setPlans(JSON.parse(raw) as Record<string, DayPlan>);
        } catch {
          // ignore
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [storageKey]);

  const persist = useCallback(
    async (next: Record<string, DayPlan>) => {
      setPlans(next);
      await AsyncStorage.setItem(storageKey, JSON.stringify(next));
    },
    [storageKey],
  );

  const dayPlan = plans[selectedDay] ?? { date: selectedDay, slots: [] };

  const addSlot = async (mealType: MealType) => {
    const recipe = BUILTIN_RECIPES.find((r) => r.mealType === mealType) ?? BUILTIN_RECIPES[0];
    if (!recipe) return;
    const slots = [
      ...dayPlan.slots.filter((s) => s.mealType !== mealType),
      { mealType, recipeId: recipe.id, title: recipe.title },
    ];
    await persist({ ...plans, [selectedDay]: { date: selectedDay, slots } });
  };

  const clearDay = async () => {
    const next = { ...plans };
    delete next[selectedDay];
    await persist(next);
  };

  return (
    <FeaturePageShell
      title="Meal planner"
      subtitle="This week"
      onBack={goBack}
      variant="stack"
      headerExtra={
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <XStack style={{ gap: s(8) }}>
            {days.map((d) => (
              <SettingsChoiceChip
                key={d}
                label={labelDay(d)}
                selected={selectedDay === d}
                onPress={() => setSelectedDay(d)}
              />
            ))}
          </XStack>
        </ScrollView>
      }
    >
      <Text style={[settingsType('semibold'), { fontSize: fs(16), color: c.ink }]}>
        {labelDay(selectedDay)}
      </Text>

      {MEAL_TYPES.map((mealType) => {
        const slot = dayPlan.slots.find((s) => s.mealType === mealType);
        return (
          <Pressable key={mealType} onPress={() => void addSlot(mealType)}>
            <SettingsGlass
              elevated
              interactive={false}
              radius={s(18)}
              contentStyle={{ padding: s(14), gap: s(4) }}
            >
              <Text
                style={[
                  settingsType('medium'),
                  { fontSize: fs(12), color: c.muted, textTransform: 'capitalize' },
                ]}
              >
                {mealType}
              </Text>
              <Text style={[settingsType('semibold'), { fontSize: fs(16), color: c.ink }]}>
                {slot?.title ?? 'Tap to assign a recipe'}
              </Text>
            </SettingsGlass>
          </Pressable>
        );
      })}

      <YStack style={{ gap: s(10) }}>
        <GlassButton label="Clear day" variant="light" frosted onPress={() => void clearDay()} />
      </YStack>
    </FeaturePageShell>
  );
}
