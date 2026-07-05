import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { RootStackNavigationProp } from '../navigation/types';
import { doc, onSnapshot } from '@react-native-firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  ACHIEVEMENTS,
  DEFAULT_COUNTERS,
  type AchievementCounters,
  type AchievementId,
} from '../lib/achievements';
import { Icon } from '../components/ui/Icon';
import { useAppColors } from '../hooks/useAppColors';

const TIER_BORDER: Record<'bronze' | 'silver' | 'gold', string> = {
  bronze: 'border-amber-200',
  silver: 'border-slate-200',
  gold: 'border-yellow-300',
};

const COUNTER_LABEL: Partial<
  Record<AchievementId, { count: keyof AchievementCounters; label: string; prefix?: string }>
> = {
  list_master: { count: 'listsCreated', label: 'list items' },
  meal_planner: { count: 'recipesCooked', label: 'meals planned' },
  master_chef: { count: 'recipesCooked', label: 'meals planned' },
  savvy_shopper: { count: 'dollarsSaved', label: 'saved', prefix: '$' },
  budget_master: { count: 'dollarsSaved', label: 'saved', prefix: '$' },
  zero_waste_warrior: { count: 'lowWasteDays', label: 'low waste days' },
  waste_eliminator: { count: 'lowWasteDays', label: 'low waste days' },
  waste_eliminated: { count: 'itemsConsumedBeforeExpiry', label: 'saved from expiry' },
};

export default function AchievementsScreen() {
  const c = useAppColors();
  const navigation = useNavigation<RootStackNavigationProp>();
  const { user } = useAuth();
  const [counters, setCounters] = useState<AchievementCounters>(DEFAULT_COUNTERS);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid, 'gamification', 'counters');
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setCounters({ ...DEFAULT_COUNTERS, ...(snap.data() as Partial<AchievementCounters>) });
      }
    });
    return unsub;
  }, [user]);

  const unlockedCount = counters.unlocked.length;

  return (
    <SafeAreaView className="flex-1 bg-canvas dark:bg-[#0F0F13]" edges={['top']}>
      <View className="flex-row items-center gap-3 border-b border-line dark:border-[#2A2A35] px-5 py-4">
        <Pressable onPress={() => navigation.goBack()} className="h-10 w-10 items-center justify-center rounded-full border border-line dark:border-[#2A2A35] bg-surface dark:bg-[#1A1A22]">
          <Icon name="chevron-left" size={20} color={c.ink} />
        </Pressable>
        <Text className="flex-1 text-2xl font-bold text-ink dark:text-[#F0EEE9]">Achievements</Text>
        <Icon name="star" size={22} color={c.primary} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View className="mb-6 flex-row flex-wrap gap-3">
          <StatBox label="Unlocked" value={`${unlockedCount}/${ACHIEVEMENTS.length}`} highlight />
          <StatBox label="Streak" value={`${counters.currentStreak} days`} sub={`Best: ${counters.longestStreak}`} />
          <StatBox
            label="Impact"
            value={`$${counters.dollarsSaved}`}
            sub={`${counters.itemsConsumedBeforeExpiry} saved from expiry`}
          />
        </View>

        <Text className="mb-4 text-lg font-bold text-ink dark:text-[#F0EEE9]">Your Badges</Text>
        <View className="gap-3">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = counters.unlocked.includes(a.id);
            const meta = COUNTER_LABEL[a.id];
            let progress = unlocked ? 1 : 0;
            let progressLabel = a.description;
            if (meta) {
              const cur = (counters[meta.count] as number) ?? 0;
              progress = Math.min(1, cur / a.threshold);
              progressLabel = `${meta.prefix || ''}${cur}/${meta.prefix || ''}${a.threshold} ${meta.label}`;
            } else if (a.id === 'streak_7' || a.id === 'streak_30') {
              progress = Math.min(1, counters.currentStreak / a.threshold);
              progressLabel = `${counters.currentStreak}/${a.threshold} day streak`;
            } else if (a.id === 'first_scan') {
              progress = counters.itemsAdded >= 1 ? 1 : 0;
              progressLabel = counters.itemsAdded >= 1 ? 'Done' : 'Add one item';
            }

            return (
              <View
                key={a.id}
                className={`rounded-2xl border bg-surface dark:bg-[#1A1A22] p-4 ${TIER_BORDER[a.tier]} ${unlocked ? '' : 'opacity-85'}`}
              >
                <View className="flex-row items-center gap-3">
                  <View className={`h-12 w-12 items-center justify-center rounded-2xl bg-canvas dark:bg-[#0F0F13] ${unlocked ? '' : 'opacity-60'}`}>
                    <Text className="text-2xl">{a.icon}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-ink dark:text-[#F0EEE9]">{a.title}</Text>
                    <Text className="text-[10px] font-bold uppercase tracking-wide text-muted dark:text-[#6B6878]">{a.tier}</Text>
                    <Text className="mt-1 text-xs text-muted dark:text-[#6B6878]">{a.description}</Text>
                  </View>
                  <Icon name={unlocked ? 'check' : 'lock'} size={18} color={unlocked ? '#10b981' : c.muted} />
                </View>
                {!unlocked ? (
                  <View className="mt-3">
                    <View className="h-1.5 overflow-hidden rounded-full bg-line">
                      <View className="h-full rounded-full bg-primary" style={{ width: `${progress * 100}%` }} />
                    </View>
                    <Text className="mt-1 text-[10px] font-semibold text-muted dark:text-[#6B6878]">{progressLabel}</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <View
      className={`min-w-[45%] flex-1 rounded-2xl border p-4 ${
        highlight ? 'border-primary/30 bg-primary/5' : 'border-line dark:border-[#2A2A35] bg-surface dark:bg-[#1A1A22]'
      }`}
    >
      <Text className="text-[10px] font-bold uppercase tracking-wider text-muted dark:text-[#6B6878]">{label}</Text>
      <Text className="mt-1 text-2xl font-black text-ink dark:text-[#F0EEE9]">{value}</Text>
      {sub ? <Text className="mt-1 text-xs text-muted dark:text-[#6B6878]">{sub}</Text> : null}
    </View>
  );
}
