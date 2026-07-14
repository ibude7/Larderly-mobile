import { View } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { settingsType } from '../settings/settingsFonts';
import { useAppColors } from '../../hooks/useAppColors';
import { useScale } from '../../theme/scale';
import type { WeeklyBucket } from '../../lib/homeOverview';

export function HomeWeeklyBars({
  buckets,
  accent,
  emptyLabel = 'No adds yet this week',
}: {
  buckets: WeeklyBucket[];
  accent: string;
  emptyLabel?: string;
}) {
  const { s, fs, fsLayout } = useScale();
  const c = useAppColors();
  const max = Math.max(1, ...buckets.map((b) => b.count));
  const chartH = fsLayout(44);
  const weekTotal = buckets.reduce((sum, b) => sum + b.count, 0);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <YStack style={{ gap: s(6), flexShrink: 0 }}>
      <XStack
        style={{ height: chartH, alignItems: 'flex-end', gap: s(4) }}
        accessibilityRole="summary"
        accessibilityLabel={
          weekTotal === 0
            ? emptyLabel
            : `Items added this week: ${buckets
                .map((b) => {
                  const d = new Date(b.dayStart);
                  return `${b.count} on ${dayNames[d.getDay()]}`;
                })
                .join(', ')}`
        }
      >
        {buckets.map((b) => {
          const pct = b.count / max;
          const barH = Math.max(s(3), Math.round(pct * chartH));
          const day = new Date(b.dayStart);
          return (
            <YStack key={b.dayStart} style={{ flex: 1, minWidth: 0, alignItems: 'center', gap: s(4) }}>
              <View
                accessibilityElementsHidden
                style={{
                  width: '70%',
                  maxWidth: s(18),
                  height: barH,
                  borderRadius: s(4),
                  backgroundColor: b.count > 0 ? accent : c.glassLine,
                  opacity: b.count > 0 ? 1 : 0.55,
                }}
              />
              <Text
                accessibilityElementsHidden
                style={[
                  settingsType('medium'),
                  {
                    fontSize: fs(9),
                    color: c.muted,
                    lineHeight: fs(11),
                  },
                ]}
              >
                {b.label.charAt(0)}
              </Text>
            </YStack>
          );
        })}
      </XStack>
      {weekTotal === 0 ? (
        <Text style={[settingsType('regular'), { fontSize: fs(11), color: c.muted }]}>
          {emptyLabel}
        </Text>
      ) : (
        <Text style={[settingsType('regular'), { fontSize: fs(11), color: c.muted }]}>
          {weekTotal} added this week
        </Text>
      )}
    </YStack>
  );
}
