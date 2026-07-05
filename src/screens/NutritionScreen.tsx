import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Share } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { RootStackNavigationProp } from '../navigation/types';
import { onSnapshot } from '@react-native-firebase/firestore';
import AppHeader from '../components/layout/AppHeader';
import Button from '../components/ui/Button';
import TextField from '../components/ui/TextField';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { useToast } from '../contexts/ToastContext';
import { generateStructuredJson, Schema } from '../lib/aiCore';
import {
  DEFAULT_GOALS,
  EMPTY_INTAKE,
  RATIO_PRESETS,
  todayKey,
  nutritionGoalDocPath,
  nutritionDailyDocPath,
  logMeal,
  logHydration,
  saveGoals,
  recentIntake,
  goalProgress,
  type NutritionGoals,
  type DailyIntake,
} from '../lib/nutrition';
import { useAppColors } from '../hooks/useAppColors';

function MacroBar({ label, current, goal, color }: { label: string; current: number; goal: number; color: string }) {
  const pct = goal > 0 ? Math.min(100, (current / goal) * 100) : 0;
  return (
    <View className="mb-3">
      <View className="mb-1 flex-row justify-between">
        <Text className="text-sm font-semibold text-ink dark:text-[#F0EEE9]">{label}</Text>
        <Text className="text-xs text-muted dark:text-[#6B6878]">{Math.round(current)} / {goal}</Text>
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-line">
        <View className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </View>
    </View>
  );
}

export default function NutritionScreen() {
  const c = useAppColors();
  const navigation = useNavigation<RootStackNavigationProp>();
  const { user } = useAuth();
  const { userProfile } = useProfile();
  const { showToast } = useToast();
  const [goals, setGoals] = useState<NutritionGoals>(DEFAULT_GOALS);
  const [intake, setIntake] = useState<DailyIntake>({ date: todayKey(), ...EMPTY_INTAKE });
  const [trend, setTrend] = useState<DailyIntake[]>([]);
  const [showLog, setShowLog] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [mealLabel, setMealLabel] = useState('');
  const [mealCal, setMealCal] = useState('400');
  const [mealProtein, setMealProtein] = useState('20');
  const [mealCarbs, setMealCarbs] = useState('40');
  const [mealFat, setMealFat] = useState('15');
  const [draftGoals, setDraftGoals] = useState<NutritionGoals>(DEFAULT_GOALS);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubG = onSnapshot(nutritionGoalDocPath(user.uid), (snap) => {
      if (snap.exists()) setGoals({ ...DEFAULT_GOALS, ...(snap.data() as Partial<NutritionGoals>) });
    });
    const unsubI = onSnapshot(nutritionDailyDocPath(user.uid, todayKey()), (snap) => {
      if (snap.exists()) setIntake({ date: todayKey(), ...EMPTY_INTAKE, ...(snap.data() as Partial<DailyIntake>) });
      else setIntake({ date: todayKey(), ...EMPTY_INTAKE });
    });
    recentIntake(user.uid, 7).then(setTrend).catch(() => {});
    return () => {
      unsubG();
      unsubI();
    };
  }, [user]);

  const progress = useMemo(() => goalProgress(intake, goals), [intake, goals]);
  const trendMaxCal = Math.max(goals.dailyCalories, ...trend.map((d) => d.calories), 1);

  useEffect(() => {
    if (!user || intake.calories < 50) return;
    let cancelled = false;
    setAiLoading(true);
    const prompt = `You are a nutrition coach. Give one short actionable tip (max 2 sentences) for today.
Dietary prefs: ${userProfile?.dietaryPreferences?.join(', ') || 'none'}
Allergies: ${userProfile?.personalAllergies || 'none'}
Calories: ${Math.round(intake.calories)}/${goals.dailyCalories}
Protein: ${intake.proteinG}g/${goals.proteinG}g
Carbs: ${intake.carbsG}g/${goals.carbsG}g
Fat: ${intake.fatG}g/${goals.fatG}g
Hydration: ${intake.hydrationMl}ml/${goals.hydrationMl}ml`;
    generateStructuredJson<{ tip: string }>(
      prompt,
      Schema.object({ properties: { tip: Schema.string() }, required: ['tip'] }),
    )
      .then((r) => {
        if (!cancelled) setAiTip(r.tip);
      })
      .catch(() => {
        if (!cancelled) setAiTip(null);
      })
      .finally(() => {
        if (!cancelled) setAiLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, intake.calories, intake.proteinG, goals.dailyCalories, userProfile]);

  const handleLogMeal = async () => {
    if (!user || !mealLabel.trim()) return;
    await logMeal(user.uid, {
      label: mealLabel.trim(),
      calories: Number(mealCal) || 0,
      proteinG: Number(mealProtein) || 0,
      carbsG: Number(mealCarbs) || 0,
      fatG: Number(mealFat) || 0,
    });
    setShowLog(false);
    setMealLabel('');
    showToast('Meal logged', 'success');
  };

  const applyPreset = (preset: NutritionGoals['ratioPreset']) => {
    const r = RATIO_PRESETS[preset];
    const cal = draftGoals.dailyCalories;
    setDraftGoals({
      ...draftGoals,
      ratioPreset: preset,
      proteinG: Math.round((cal * r.protein) / 4),
      carbsG: Math.round((cal * r.carbs) / 4),
      fatG: Math.round((cal * r.fat) / 9),
    });
  };

  const exportReport = async () => {
    const lines = [
      'Larderly Nutrition Report',
      `Date: ${todayKey()}`,
      '',
      `Calories: ${Math.round(intake.calories)} / ${goals.dailyCalories}`,
      `Protein: ${intake.proteinG}g / ${goals.proteinG}g`,
      `Carbs: ${intake.carbsG}g / ${goals.carbsG}g`,
      `Fat: ${intake.fatG}g / ${goals.fatG}g`,
      `Fiber: ${intake.fiberG}g / ${goals.fiberG}g`,
      `Hydration: ${intake.hydrationMl}ml / ${goals.hydrationMl}ml`,
      '',
      "Today's meals:",
      ...intake.meals.map((m) => `- ${m.label}: ${m.calories} kcal`),
    ];
    await Share.share({ message: lines.join('\n') });
  };

  return (
    <View className="flex-1 bg-canvas dark:bg-[#0F0F13]">
      <AppHeader title="Nutrition" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View className="mb-4 flex-row gap-2">
          <Button label="Set goals" variant="secondary" size="sm" onPress={() => { setDraftGoals(goals); setShowGoals(true); }} className="flex-1" />
          <Button label="Export" variant="ghost" size="sm" onPress={exportReport} className="flex-1" />
        </View>

        <View className="mb-4 rounded-2xl border border-line dark:border-[#2A2A35] bg-surface dark:bg-[#1A1A22] p-5">
          <Text className="text-lg font-bold text-ink dark:text-[#F0EEE9]">Today</Text>
          <Text className="mt-2 text-3xl font-bold text-primary">
            {Math.round(intake.calories)} / {goals.dailyCalories} kcal
          </Text>
          <View className="mt-4 h-2 overflow-hidden rounded-full bg-line">
            <View className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, progress.cal * 100)}%` }} />
          </View>
          <MacroBar label="Protein (g)" current={intake.proteinG} goal={goals.proteinG} color={c.info} />
          <MacroBar label="Carbs (g)" current={intake.carbsG} goal={goals.carbsG} color={c.warning} />
          <MacroBar label="Fat (g)" current={intake.fatG} goal={goals.fatG} color={c.danger} />
          <Text className="text-sm text-muted dark:text-[#6B6878]">
            Fiber {intake.fiberG}g / {goals.fiberG}g · Sodium {intake.sodiumMg}mg / {goals.sodiumMg}mg
          </Text>
          <Text className="mt-1 text-sm text-muted dark:text-[#6B6878]">Hydration {intake.hydrationMl} / {goals.hydrationMl} ml</Text>
        </View>

        {(aiLoading || aiTip) && (
          <View className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <Text className="text-xs font-bold uppercase text-primary">AI coach</Text>
            {aiLoading ? <LoadingSpinner className="mt-2" /> : <Text className="mt-2 text-sm text-ink dark:text-[#F0EEE9]">{aiTip}</Text>}
          </View>
        )}

        <View className="mb-4 flex-row gap-2">
          <Button label="Log meal" onPress={() => setShowLog(true)} className="flex-1" />
          <Button label="+250ml water" variant="secondary" onPress={() => user && logHydration(user.uid, 250)} className="flex-1" />
        </View>

        {trend.length > 0 && (
          <View className="mb-4 rounded-2xl border border-line dark:border-[#2A2A35] bg-surface dark:bg-[#1A1A22] p-4">
            <Text className="mb-3 font-semibold text-ink dark:text-[#F0EEE9]">7-day calories</Text>
            <View className="h-28 flex-row items-end gap-1">
              {trend.map((day) => {
                const h = Math.max(4, (day.calories / trendMaxCal) * 100);
                const isToday = day.date === todayKey();
                return (
                  <View key={day.date} className="flex-1 items-center">
                    <View className={`w-full rounded-t-md ${isToday ? 'bg-primary' : 'bg-primary/40'}`} style={{ height: h }} />
                    <Text className="mt-1 text-[10px] text-muted dark:text-[#6B6878]">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {intake.meals.length > 0 && (
          <View className="mt-2">
            <Text className="mb-2 font-semibold text-ink dark:text-[#F0EEE9]">Meals today</Text>
            {[...intake.meals].reverse().map((m, i) => (
              <View key={i} className="mb-2 rounded-xl border border-line dark:border-[#2A2A35] bg-surface dark:bg-[#1A1A22] px-4 py-3">
                <Text className="font-medium text-ink dark:text-[#F0EEE9]">{m.label}</Text>
                <Text className="text-sm text-muted dark:text-[#6B6878]">
                  {m.calories} kcal · P {m.proteinG}g · C {m.carbsG}g · F {m.fatG}g
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal isOpen={showLog} onClose={() => setShowLog(false)} title="Log meal">
        <TextField label="Meal name" value={mealLabel} onChangeText={setMealLabel} placeholder="Lunch" />
        <TextField label="Calories" value={mealCal} onChangeText={setMealCal} keyboardType="numeric" />
        <TextField label="Protein (g)" value={mealProtein} onChangeText={setMealProtein} keyboardType="numeric" />
        <TextField label="Carbs (g)" value={mealCarbs} onChangeText={setMealCarbs} keyboardType="numeric" />
        <TextField label="Fat (g)" value={mealFat} onChangeText={setMealFat} keyboardType="numeric" />
        <Button label="Save" onPress={handleLogMeal} className="mt-4" />
      </Modal>

      <Modal isOpen={showGoals} onClose={() => setShowGoals(false)} title="Nutritional goals">
        <ScrollView style={{ maxHeight: 420 }}>
          <Text className="mb-2 text-sm font-semibold text-ink dark:text-[#F0EEE9]">Macro preset</Text>
          <View className="mb-4 flex-row flex-wrap gap-2">
            {(Object.keys(RATIO_PRESETS) as NutritionGoals['ratioPreset'][]).map((p) => (
              <Pressable
                key={p}
                onPress={() => applyPreset(p)}
                className={`rounded-full px-3 py-2 ${draftGoals.ratioPreset === p ? 'bg-primary' : 'border border-line dark:border-[#2A2A35] bg-surface dark:bg-[#1A1A22]'}`}
              >
                <Text className={draftGoals.ratioPreset === p ? 'text-xs font-bold text-white' : 'text-xs text-ink dark:text-[#F0EEE9]'}>{p}</Text>
              </Pressable>
            ))}
          </View>
          <TextField label="Daily calories" value={String(draftGoals.dailyCalories)} onChangeText={(v) => setDraftGoals({ ...draftGoals, dailyCalories: Number(v) || 0 })} keyboardType="numeric" />
          <TextField label="Protein (g)" value={String(draftGoals.proteinG)} onChangeText={(v) => setDraftGoals({ ...draftGoals, proteinG: Number(v) || 0, ratioPreset: 'custom' })} keyboardType="numeric" />
          <TextField label="Carbs (g)" value={String(draftGoals.carbsG)} onChangeText={(v) => setDraftGoals({ ...draftGoals, carbsG: Number(v) || 0, ratioPreset: 'custom' })} keyboardType="numeric" />
          <TextField label="Fat (g)" value={String(draftGoals.fatG)} onChangeText={(v) => setDraftGoals({ ...draftGoals, fatG: Number(v) || 0, ratioPreset: 'custom' })} keyboardType="numeric" />
          <TextField label="Fiber (g)" value={String(draftGoals.fiberG)} onChangeText={(v) => setDraftGoals({ ...draftGoals, fiberG: Number(v) || 0 })} keyboardType="numeric" />
          <TextField label="Hydration (ml)" value={String(draftGoals.hydrationMl)} onChangeText={(v) => setDraftGoals({ ...draftGoals, hydrationMl: Number(v) || 0 })} keyboardType="numeric" />
        </ScrollView>
        <Button
          label="Save goals"
          className="mt-4"
          onPress={async () => {
            if (!user) return;
            await saveGoals(user.uid, draftGoals);
            setGoals(draftGoals);
            setShowGoals(false);
            showToast('Goals saved', 'success');
          }}
        />
      </Modal>
    </View>
  );
}
