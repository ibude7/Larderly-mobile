import { useEffect, useState } from 'react';
import { Text, XStack, YStack } from 'tamagui';
import { FeaturePageShell } from '../components/main/FeaturePageShell';
import { SettingsGlass } from '../components/settings/SettingsGlass';
import { settingsType } from '../components/settings/settingsFonts';
import { useAuth } from '../contexts/AuthContext';
import {
  ACHIEVEMENTS,
  DEFAULT_COUNTERS,
  getCounters,
  type AchievementCounters,
} from '../lib/achievements';
import { useGoBack } from '../navigation/useGoBack';
import { useAppColors } from '../hooks/useAppColors';
import { useScale } from '../theme/scale';

function progressFor(id: string, counters: AchievementCounters): { current: number; threshold: number } {
  const def = ACHIEVEMENTS.find((a) => a.id === id)!;
  const map: Record<string, number> = {
    first_scan: counters.itemsAdded,
    list_master: counters.listsCreated,
    meal_planner: counters.recipesCooked,
    waste_eliminated: counters.itemsConsumedBeforeExpiry,
    zero_waste_warrior: counters.lowWasteDays,
    savvy_shopper: counters.dollarsSaved,
    recipe_explorer: counters.recipesViewed,
    waste_eliminator: counters.lowWasteDays,
    budget_master: counters.dollarsSaved,
    master_chef: counters.recipesCooked,
    streak_7: counters.currentStreak,
    streak_30: counters.currentStreak,
  };
  return { current: map[id] ?? 0, threshold: def.threshold };
}

export default function AchievementsScreen() {
  const goBack = useGoBack();
  const { s, fs } = useScale();
  const c = useAppColors();
  const { user } = useAuth();
  const [counters, setCounters] = useState<AchievementCounters>(DEFAULT_COUNTERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      const data = await getCounters(user.uid);
      if (alive) {
        setCounters(data);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user?.uid]);

  const unlocked = new Set(counters.unlocked);

  return (
    <FeaturePageShell
      title="Achievements"
      subtitle={
        loading
          ? 'Loading…'
          : `${unlocked.size}/${ACHIEVEMENTS.length} unlocked · ${counters.currentStreak}-day streak`
      }
      onBack={goBack}
      variant="stack"
    >
      <XStack style={{ gap: s(10) }}>
        <Stat label="Streak" value={String(counters.currentStreak)} />
        <Stat label="Best" value={String(counters.longestStreak)} />
        <Stat label="Saved" value={`$${Math.round(counters.dollarsSaved)}`} />
      </XStack>

      {ACHIEVEMENTS.map((a) => {
        const done = unlocked.has(a.id);
        const { current, threshold } = progressFor(a.id, counters);
        const pct = Math.min(1, current / Math.max(1, threshold));
        return (
          <SettingsGlass
            key={a.id}
            elevated
            interactive={false}
            radius={s(18)}
            contentStyle={{ padding: s(14), gap: s(8), opacity: done ? 1 : 0.85 }}
          >
            <XStack style={{ gap: s(12), alignItems: 'center' }}>
              <Text style={{ fontSize: fs(28) }}>{a.icon}</Text>
              <YStack style={{ flex: 1, minWidth: 0, gap: s(2) }}>
                <Text style={[settingsType('semibold'), { fontSize: fs(15), color: c.ink }]}>
                  {a.title}
                </Text>
                <Text style={[settingsType('regular'), { fontSize: fs(12), color: c.muted }]}>
                  {a.description}
                </Text>
              </YStack>
              <Text
                style={[
                  settingsType('semibold'),
                  { fontSize: fs(11), color: done ? c.success : c.muted, textTransform: 'capitalize' },
                ]}
              >
                {done ? 'Done' : a.tier}
              </Text>
            </XStack>
            {!done ? (
              <YStack style={{ gap: s(4) }}>
                <XStack
                  style={{
                    height: s(6),
                    borderRadius: s(99),
                    backgroundColor: c.surfaceMuted,
                    overflow: 'hidden',
                  }}
                >
                  <XStack
                    style={{
                      width: `${Math.round(pct * 100)}%`,
                      backgroundColor: c.primary,
                      borderRadius: s(99),
                    }}
                  />
                </XStack>
                <Text style={[settingsType('medium'), { fontSize: fs(11), color: c.muted }]}>
                  {Math.min(current, threshold)}/{threshold}
                </Text>
              </YStack>
            ) : null}
          </SettingsGlass>
        );
      })}
    </FeaturePageShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const { s, fs } = useScale();
  const c = useAppColors();
  return (
    <SettingsGlass
      elevated
      interactive={false}
      radius={s(16)}
      style={{ flex: 1 }}
      contentStyle={{ padding: s(12), alignItems: 'center', gap: s(2) }}
    >
      <Text style={[settingsType('bold'), { fontSize: fs(18), color: c.ink }]}>{value}</Text>
      <Text style={[settingsType('medium'), { fontSize: fs(11), color: c.muted }]}>{label}</Text>
    </SettingsGlass>
  );
}
