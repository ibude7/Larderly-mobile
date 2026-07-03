import { doc, getDoc, setDoc, serverTimestamp, collection, query, orderBy, limit, getDocs } from '@react-native-firebase/firestore';
import { db } from './firebase';

export interface NutritionGoals {
  dailyCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sodiumMg: number;
  hydrationMl: number;
  ratioPreset: 'balanced' | 'high-protein' | 'low-carb' | 'mediterranean' | 'custom';
  age?: number;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
  conditions?: string[];
}

export const DEFAULT_GOALS: NutritionGoals = {
  dailyCalories: 2000,
  proteinG: 70,
  carbsG: 250,
  fatG: 65,
  fiberG: 28,
  sodiumMg: 2300,
  hydrationMl: 2000,
  ratioPreset: 'balanced',
};

export const RATIO_PRESETS: Record<NutritionGoals['ratioPreset'], { protein: number; carbs: number; fat: number; description: string }> = {
  balanced: { protein: 0.2, carbs: 0.5, fat: 0.3, description: 'Even split across macros.' },
  'high-protein': { protein: 0.35, carbs: 0.35, fat: 0.3, description: 'Best for active lifestyles.' },
  'low-carb': { protein: 0.3, carbs: 0.2, fat: 0.5, description: 'Lower carb focus.' },
  mediterranean: { protein: 0.2, carbs: 0.45, fat: 0.35, description: 'Whole grains and healthy fats.' },
  custom: { protein: 0, carbs: 0, fat: 0, description: 'Customize each macro manually.' },
};

export interface DailyIntake {
  date: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sodiumMg: number;
  hydrationMl: number;
  meals: Array<{
    label: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    at: number;
  }>;
}

export const EMPTY_INTAKE: Omit<DailyIntake, 'date'> = {
  calories: 0,
  proteinG: 0,
  carbsG: 0,
  fatG: 0,
  fiberG: 0,
  sodiumMg: 0,
  hydrationMl: 0,
  meals: [],
};

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nutritionGoalDocPath(uid: string) {
  return doc(db, 'users', uid, 'nutrition', 'goals');
}

export function nutritionDailyDocPath(uid: string, date: string) {
  return doc(db, 'users', uid, 'nutrition', `day_${date}`);
}

export async function getGoals(uid: string): Promise<NutritionGoals> {
  try {
    const snap = await getDoc(nutritionGoalDocPath(uid));
    if (snap.exists()) return { ...DEFAULT_GOALS, ...(snap.data() as Partial<NutritionGoals>) };
  } catch (err) {
    console.warn('[Larderly] Failed to read nutrition goals', err);
  }
  return DEFAULT_GOALS;
}

export async function saveGoals(uid: string, goals: NutritionGoals): Promise<void> {
  await setDoc(nutritionGoalDocPath(uid), { ...goals, updatedAt: serverTimestamp() }, { merge: true });
}

export async function getIntake(uid: string, date: string): Promise<DailyIntake> {
  try {
    const snap = await getDoc(nutritionDailyDocPath(uid, date));
    if (snap.exists()) {
      return { date, ...EMPTY_INTAKE, ...(snap.data() as Omit<DailyIntake, 'date'>) };
    }
  } catch {
    // ignore
  }
  return { date, ...EMPTY_INTAKE };
}

export async function logMeal(
  uid: string,
  meal: { label: string; calories: number; proteinG: number; carbsG: number; fatG: number; fiberG?: number; sodiumMg?: number },
): Promise<void> {
  const date = todayKey();
  const ref = nutritionDailyDocPath(uid, date);
  const cur = await getIntake(uid, date);
  const next: DailyIntake = {
    date,
    calories: cur.calories + meal.calories,
    proteinG: cur.proteinG + meal.proteinG,
    carbsG: cur.carbsG + meal.carbsG,
    fatG: cur.fatG + meal.fatG,
    fiberG: cur.fiberG + (meal.fiberG ?? 0),
    sodiumMg: cur.sodiumMg + (meal.sodiumMg ?? 0),
    hydrationMl: cur.hydrationMl,
    meals: [...cur.meals, { label: meal.label, calories: meal.calories, proteinG: meal.proteinG, carbsG: meal.carbsG, fatG: meal.fatG, at: Date.now() }],
  };
  await setDoc(ref, { ...next, updatedAt: serverTimestamp() }, { merge: true });
}

export async function logHydration(uid: string, ml: number): Promise<void> {
  const date = todayKey();
  const ref = nutritionDailyDocPath(uid, date);
  const cur = await getIntake(uid, date);
  await setDoc(ref, { ...cur, hydrationMl: cur.hydrationMl + ml, updatedAt: serverTimestamp() }, { merge: true });
}

export async function recentIntake(uid: string, days = 7): Promise<DailyIntake[]> {
  const colRef = collection(db, 'users', uid, 'nutrition');
  const q = query(colRef, orderBy('updatedAt', 'desc'), limit(days + 5));
  const snap = await getDocs(q);
  return snap.docs
    .filter((d) => d.id.startsWith('day_'))
    .map((d) => ({ date: d.id.slice(4), ...(d.data() as Partial<DailyIntake>) } as DailyIntake))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-days);
}

export function goalProgress(intake: DailyIntake, goals: NutritionGoals) {
  const pct = (a: number, b: number) => (b > 0 ? Math.min(1.5, a / b) : 0);
  return {
    cal: pct(intake.calories, goals.dailyCalories),
    protein: pct(intake.proteinG, goals.proteinG),
    carbs: pct(intake.carbsG, goals.carbsG),
    fat: pct(intake.fatG, goals.fatG),
    fiber: pct(intake.fiberG, goals.fiberG),
    hydration: pct(intake.hydrationMl, goals.hydrationMl),
    sodium: pct(intake.sodiumMg, goals.sodiumMg),
  };
}

export function isAllergenRisk(name: string, userAllergies: string): boolean {
  if (!userAllergies?.trim()) return false;
  const userTokens = userAllergies.split(/[,;]/).map((t) => t.trim().toLowerCase()).filter(Boolean);
  if (userTokens.length === 0) return false;
  const lower = name.toLowerCase();
  return userTokens.some((t) => lower.includes(t));
}
