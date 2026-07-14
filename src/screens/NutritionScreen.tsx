import { useCallback, useEffect, useState } from 'react';
import { Text, XStack, YStack } from 'tamagui';
import { FeaturePageShell } from '../components/main/FeaturePageShell';
import { SettingsGlass } from '../components/settings/SettingsGlass';
import { settingsType } from '../components/settings/settingsFonts';
import { GlassButton } from '../components/landing/GlassButton';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  DEFAULT_GOALS,
  EMPTY_INTAKE,
  getGoals,
  getIntake,
  goalProgress,
  logHydration,
  logMeal,
  todayKey,
  type DailyIntake,
  type NutritionGoals,
} from '../lib/nutrition';
import { useGoBack } from '../navigation/useGoBack';
import { useAppColors } from '../hooks/useAppColors';
import { useScale } from '../theme/scale';

const QUICK_MEALS = [
  { label: 'Breakfast', calories: 420, proteinG: 22, carbsG: 45, fatG: 16 },
  { label: 'Lunch', calories: 560, proteinG: 32, carbsG: 55, fatG: 20 },
  { label: 'Dinner', calories: 640, proteinG: 38, carbsG: 50, fatG: 24 },
  { label: 'Snack', calories: 180, proteinG: 8, carbsG: 18, fatG: 8 },
];

export default function NutritionScreen() {
  const goBack = useGoBack();
  const { s, fs } = useScale();
  const c = useAppColors();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [goals, setGoals] = useState<NutritionGoals>(DEFAULT_GOALS);
  const [intake, setIntake] = useState<DailyIntake>({ date: todayKey(), ...EMPTY_INTAKE });
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    if (!user?.uid) return;
    const [g, i] = await Promise.all([getGoals(user.uid), getIntake(user.uid, todayKey())]);
    setGoals(g);
    setIntake(i);
  }, [user?.uid]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const progress = goalProgress(intake, goals);

  const addMeal = async (meal: (typeof QUICK_MEALS)[number]) => {
    if (!user?.uid) return;
    setBusy(true);
    try {
      await logMeal(user.uid, meal);
      await reload();
      showToast(`Logged ${meal.label}`, 'success');
    } catch {
      showToast('Could not log meal', 'error');
    } finally {
      setBusy(false);
    }
  };

  const addWater = async (ml: number) => {
    if (!user?.uid) return;
    setBusy(true);
    try {
      await logHydration(user.uid, ml);
      await reload();
      showToast(`+${ml} ml water`, 'success');
    } catch {
      showToast('Could not log water', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <FeaturePageShell
      title="Nutrition"
      subtitle={`Today · ${intake.calories}/${goals.dailyCalories} kcal`}
      onBack={goBack}
      variant="stack"
    >
      <SettingsGlass
        elevated
        interactive={false}
        radius={s(20)}
        contentStyle={{ padding: s(16), gap: s(12) }}
      >
        <ProgressRow label="Calories" value={intake.calories} goal={goals.dailyCalories} pct={progress.cal} />
        <ProgressRow label="Protein" value={intake.proteinG} goal={goals.proteinG} pct={progress.protein} unit="g" />
        <ProgressRow label="Carbs" value={intake.carbsG} goal={goals.carbsG} pct={progress.carbs} unit="g" />
        <ProgressRow label="Fat" value={intake.fatG} goal={goals.fatG} pct={progress.fat} unit="g" />
        <ProgressRow
          label="Hydration"
          value={intake.hydrationMl}
          goal={goals.hydrationMl}
          pct={progress.hydration}
          unit="ml"
        />
      </SettingsGlass>

      <Text style={[settingsType('semibold'), { fontSize: fs(15), color: c.ink }]}>Quick log</Text>
      <XStack style={{ gap: s(8), flexWrap: 'wrap' }}>
        {QUICK_MEALS.map((meal) => (
          <GlassButton
            key={meal.label}
            label={meal.label}
            variant="light"
            frosted
            disabled={busy}
            onPress={() => void addMeal(meal)}
            style={{ minWidth: '46%' }}
          />
        ))}
      </XStack>

      <XStack style={{ gap: s(8) }}>
        <GlassButton
          label="+250 ml"
          variant="amber"
          disabled={busy}
          onPress={() => void addWater(250)}
          style={{ flex: 1 }}
        />
        <GlassButton
          label="+500 ml"
          variant="light"
          frosted
          disabled={busy}
          onPress={() => void addWater(500)}
          style={{ flex: 1 }}
        />
      </XStack>

      {intake.meals.length > 0 ? (
        <SettingsGlass
          elevated
          interactive={false}
          radius={s(18)}
          contentStyle={{ padding: s(14), gap: s(8) }}
        >
          <Text style={[settingsType('semibold'), { fontSize: fs(15), color: c.ink }]}>
            Today’s meals
          </Text>
          {[...intake.meals].reverse().map((m, idx) => (
            <XStack key={`${m.at}-${idx}`} style={{ justifyContent: 'space-between', gap: s(8) }}>
              <Text style={[settingsType('medium'), { fontSize: fs(14), color: c.ink, flex: 1 }]}>
                {m.label}
              </Text>
              <Text style={[settingsType('semibold'), { fontSize: fs(13), color: c.muted }]}>
                {m.calories} kcal
              </Text>
            </XStack>
          ))}
        </SettingsGlass>
      ) : null}
    </FeaturePageShell>
  );
}

function ProgressRow({
  label,
  value,
  goal,
  pct,
  unit = '',
}: {
  label: string;
  value: number;
  goal: number;
  pct: number;
  unit?: string;
}) {
  const { s, fs } = useScale();
  const c = useAppColors();
  const width = `${Math.round(Math.min(1, pct) * 100)}%`;
  return (
    <YStack style={{ gap: s(4) }}>
      <XStack style={{ justifyContent: 'space-between' }}>
        <Text style={[settingsType('medium'), { fontSize: fs(13), color: c.ink }]}>{label}</Text>
        <Text style={[settingsType('regular'), { fontSize: fs(12), color: c.muted }]}>
          {Math.round(value)}
          {unit} / {goal}
          {unit}
        </Text>
      </XStack>
      <XStack
        style={{
          height: s(8),
          borderRadius: s(99),
          backgroundColor: c.surfaceMuted,
          overflow: 'hidden',
        }}
      >
        <XStack style={{ width, backgroundColor: c.primary, borderRadius: s(99) }} />
      </XStack>
    </YStack>
  );
}
