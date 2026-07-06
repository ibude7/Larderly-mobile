import { doc, getDoc, setDoc, serverTimestamp } from '@react-native-firebase/firestore';
import { db } from './firebase';
import { recordActivity } from './activity';
import { trackEvent } from './analytics';

export type AchievementTier = 'bronze' | 'silver' | 'gold';
export type AchievementId =
  | 'first_scan'
  | 'list_master'
  | 'meal_planner'
  | 'zero_waste_warrior'
  | 'savvy_shopper'
  | 'recipe_explorer'
  | 'waste_eliminator'
  | 'budget_master'
  | 'master_chef'
  | 'streak_7'
  | 'streak_30'
  | 'waste_eliminated';

export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  tier: AchievementTier;
  icon: string;
  threshold: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_scan', title: 'First Scan', description: 'Add your first pantry item', tier: 'bronze', icon: '🌱', threshold: 1 },
  { id: 'list_master', title: 'List Master', description: 'Add 5 shopping list items', tier: 'bronze', icon: '🧾', threshold: 5 },
  { id: 'meal_planner', title: 'Meal Planner', description: 'Plan 10 meals', tier: 'bronze', icon: '🍳', threshold: 10 },
  { id: 'waste_eliminated', title: 'Waste Eliminated!', description: 'Consume 10 items before they expire', tier: 'bronze', icon: '🥗', threshold: 10 },
  { id: 'zero_waste_warrior', title: 'Zero Waste Warrior', description: '30 low-waste days', tier: 'silver', icon: '🌍', threshold: 30 },
  { id: 'savvy_shopper', title: 'Savvy Shopper', description: 'Save $50 through smart use', tier: 'silver', icon: '💸', threshold: 50 },
  { id: 'recipe_explorer', title: 'Recipe Explorer', description: 'Try 25 different recipes', tier: 'silver', icon: '🗺️', threshold: 25 },
  { id: 'waste_eliminator', title: 'Waste Eliminator', description: '90 low-waste days', tier: 'gold', icon: '♻️', threshold: 90 },
  { id: 'budget_master', title: 'Budget Master', description: '$500 savings tracked', tier: 'gold', icon: '💰', threshold: 500 },
  { id: 'master_chef', title: 'Master Chef', description: '100 meals planned', tier: 'gold', icon: '👨‍🍳', threshold: 100 },
  { id: 'streak_7', title: '7-Day Streak', description: 'Use the app 7 days in a row', tier: 'silver', icon: '🔥', threshold: 7 },
  { id: 'streak_30', title: '30-Day Streak', description: 'Use the app 30 days in a row', tier: 'gold', icon: '🏆', threshold: 30 },
];

export interface AchievementCounters {
  itemsAdded: number;
  listsCreated: number;
  recipesCooked: number;
  recipesViewed: number;
  checkouts: number;
  dollarsSaved: number;
  lowWasteDays: number;
  lowWasteDayLastDate: string;
  itemsConsumedBeforeExpiry: number;
  mealsSavedFromExpiry: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  unlocked: AchievementId[];
}

export const DEFAULT_COUNTERS: AchievementCounters = {
  itemsAdded: 0,
  listsCreated: 0,
  recipesCooked: 0,
  recipesViewed: 0,
  checkouts: 0,
  dollarsSaved: 0,
  lowWasteDays: 0,
  lowWasteDayLastDate: '',
  itemsConsumedBeforeExpiry: 0,
  mealsSavedFromExpiry: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: '',
  unlocked: [],
};

export type CounterKey = keyof Pick<
  AchievementCounters,
  | 'itemsAdded'
  | 'listsCreated'
  | 'recipesCooked'
  | 'recipesViewed'
  | 'checkouts'
  | 'dollarsSaved'
  | 'lowWasteDays'
  | 'itemsConsumedBeforeExpiry'
  | 'mealsSavedFromExpiry'
>;

const COUNTER_TO_ACHIEVEMENT: Partial<Record<CounterKey, AchievementId[]>> = {
  itemsAdded: ['first_scan'],
  listsCreated: ['list_master'],
  recipesCooked: ['meal_planner', 'master_chef'],
  recipesViewed: ['recipe_explorer'],
  dollarsSaved: ['savvy_shopper', 'budget_master'],
  lowWasteDays: ['zero_waste_warrior', 'waste_eliminator'],
  itemsConsumedBeforeExpiry: ['waste_eliminated'],
};

function counterDocPath(userId: string) {
  return doc(db, 'users', userId, 'gamification', 'counters');
}

export async function getCounters(userId: string): Promise<AchievementCounters> {
  try {
    const snap = await getDoc(counterDocPath(userId));
    if (snap.exists()) {
      return { ...DEFAULT_COUNTERS, ...(snap.data() as Partial<AchievementCounters>) };
    }
  } catch (err) {
    console.warn('[Larderly] Failed to read achievement counters', err);
  }
  return { ...DEFAULT_COUNTERS };
}

async function notifyUnlocks(
  householdId: string | null,
  userId: string,
  actorName: string,
  newlyUnlocked: AchievementId[],
): Promise<void> {
  if (!householdId) return;
  for (const id of newlyUnlocked) {
    const def = ACHIEVEMENTS.find((a) => a.id === id);
    if (def) {
      trackEvent('achievement_unlocked', { achievement: id, tier: def.tier }).catch(() => {});
      await recordActivity(householdId, {
        verb: 'achievement.unlocked',
        target: def.title,
        actorId: userId,
        actorName,
        meta: { tier: def.tier },
      });
    }
  }
}

export async function bumpCounter(
  userId: string,
  householdId: string | null,
  actorName: string,
  key: CounterKey,
  by = 1,
): Promise<AchievementId[]> {
  const counters = await getCounters(userId);
  counters[key] = (counters[key] ?? 0) + by;

  const newlyUnlocked: AchievementId[] = [];
  const targets = COUNTER_TO_ACHIEVEMENT[key] || [];
  for (const target of targets) {
    const def = ACHIEVEMENTS.find((a) => a.id === target);
    if (def && counters[key] >= def.threshold && !counters.unlocked.includes(def.id)) {
      counters.unlocked.push(def.id);
      newlyUnlocked.push(def.id);
    }
  }

  await setDoc(counterDocPath(userId), { ...counters, updatedAt: serverTimestamp() }, { merge: true });
  await notifyUnlocks(householdId, userId, actorName, newlyUnlocked);
  return newlyUnlocked;
}

export async function recordDailyVisit(userId: string): Promise<{ streak: number; isNewDay: boolean; unlocked: AchievementId[] }> {
  const counters = await getCounters(userId);
  const today = new Date().toISOString().slice(0, 10);
  if (counters.lastActiveDate === today) {
    return { streak: counters.currentStreak, isNewDay: false, unlocked: [] };
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const newStreak = counters.lastActiveDate === yesterday ? counters.currentStreak + 1 : 1;
  const longest = Math.max(newStreak, counters.longestStreak ?? 0);

  const unlocked: AchievementId[] = [];
  if (newStreak >= 7 && !counters.unlocked.includes('streak_7')) {
    counters.unlocked.push('streak_7');
    unlocked.push('streak_7');
    trackEvent('achievement_unlocked', { achievement: 'streak_7', tier: 'silver' }).catch(() => {});
  }
  if (newStreak >= 30 && !counters.unlocked.includes('streak_30')) {
    counters.unlocked.push('streak_30');
    unlocked.push('streak_30');
    trackEvent('achievement_unlocked', { achievement: 'streak_30', tier: 'gold' }).catch(() => {});
  }

  await setDoc(
    counterDocPath(userId),
    {
      ...counters,
      currentStreak: newStreak,
      longestStreak: longest,
      lastActiveDate: today,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return { streak: newStreak, isNewDay: true, unlocked };
}
