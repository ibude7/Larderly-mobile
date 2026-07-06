import { View, Text } from 'react-native';
import { Icon } from '../ui/Icon';
import { useAppColors } from '../../hooks/useAppColors';
import type { ActivityEvent } from '../../lib/insights';

interface ActivityFeedCardProps {
  activities: ActivityEvent[];
  maxItems?: number;
}

export default function ActivityFeedCard({ activities, maxItems = 6 }: ActivityFeedCardProps) {
  const c = useAppColors();

  if (activities.length === 0) return null;

  return (
    <View className="mt-6 rounded-card border border-line dark:border-[#303541] bg-surface dark:bg-[#171A21] p-5">
      <View className="mb-4 flex-row items-center gap-2">
        <Icon name="trending-down" size={20} color={c.primary} />
        <Text className="text-lg font-bold text-ink dark:text-[#F6F1EA]">Recent activity</Text>
      </View>

      <View className="gap-2">
        {activities.slice(0, maxItems).map((ev, i) => (
          <View
            key={`${ev.actorId}-${ev.target}-${i}`}
            className="flex-row items-center gap-3 rounded-xl bg-canvas dark:bg-[#090A0D] px-3 py-2"
          >
            <Icon name="sparkles" size={14} color={c.muted} />
            <View className="flex-1">
              <Text className="text-sm text-ink dark:text-[#F6F1EA]">
                <Text className="font-bold">{ev.actorName}</Text> {ev.verb} {ev.target}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
