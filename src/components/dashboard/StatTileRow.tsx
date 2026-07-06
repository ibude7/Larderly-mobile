import { View, Text, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import AnimatedNumber from '../ui/AnimatedNumber';
import { Icon, IconName } from '../ui/Icon';
import type { TabScreenNavigationProp } from '../../navigation/types';
import { useAppColors } from '../../hooks/useAppColors';
import { useTheme } from '../../hooks/useTheme';
import type { DashboardStats } from '../../hooks/useDashboardStats';

const STAT_ICONS: Record<string, IconName> = {
  'Total Items': 'pantry',
  'Shopping List': 'cart',
  'Low Stock': 'warning',
  'Expiring Soon': 'calendar',
};

interface StatTileRowProps {
  stats: DashboardStats;
  itemsTrend?: string;
  shoppingTrend?: string;
}

export default function StatTileRow({ stats, itemsTrend, shoppingTrend }: StatTileRowProps) {
  const navigation = useNavigation<TabScreenNavigationProp>();
  const { itemCount, lowStockItems, expiringSoonItems, uncheckedCount } = stats;

  const lowStockTrend = lowStockItems.length > 0 ? 'Needs attention' : 'Healthy stock';
  const expiringTrend = expiringSoonItems.length > 0 ? 'Consume soon' : 'All fresh';

  return (
    <View className="flex-row flex-wrap gap-3">
      <StatCard
        label="Total Items"
        value={itemCount}
        trendText={itemsTrend}
        onPress={() => navigation.navigate('Pantry')}
      />
      <StatCard
        label="Shopping List"
        value={uncheckedCount}
        trendText={shoppingTrend}
        onPress={() => navigation.navigate('Shopping')}
      />
      <StatCard
        label="Low Stock"
        value={lowStockItems.length}
        alert={lowStockItems.length > 0}
        trendText={lowStockTrend}
        onPress={() => navigation.navigate('Pantry')}
      />
      <StatCard
        label="Expiring Soon"
        value={expiringSoonItems.length}
        alert={expiringSoonItems.length > 0}
        trendText={expiringTrend}
        onPress={() => navigation.navigate('Pantry')}
      />
    </View>
  );
}

function StatCard({
  label,
  value,
  alert,
  trendText,
  onPress,
}: {
  label: string;
  value: number;
  alert?: boolean;
  trendText?: string;
  onPress: () => void;
}) {
  const c = useAppColors();
  const theme = useTheme();
  const highlight = alert && value > 0;

  const iconName = STAT_ICONS[label];

  const glassBg = theme === 'dark' ? 'rgba(26, 26, 34, 0.5)' : 'rgba(255, 255, 255, 0.4)';
  const accentColor = highlight ? c.danger : c.primary;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1, width: '47.5%' }]}
    >
      <View
        style={{
          borderRadius: 20,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
          shadowColor: theme === 'dark' ? '#000' : '#A09C96',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: theme === 'dark' ? 0.4 : 0.12,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <BlurView
          intensity={theme === 'dark' ? 65 : 70}
          tint={theme}
          style={{
            width: '100%',
            padding: 20,
            backgroundColor: glassBg,
            flexDirection: 'row',
          }}
        >
          {/* Left accent bar */}
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 4,
              backgroundColor: accentColor,
            }}
          />

          <View className="flex-1 min-h-[85px] justify-between pl-2">
            <View className="mt-1">
              <AnimatedNumber
                value={value}
                duration={800}
                style={{
                  fontSize: 30,
                  fontWeight: '900',
                  color: theme === 'dark' ? '#F0EEE9' : c.ink,
                }}
              />
              <Text className="mt-1 text-[11px] font-bold uppercase tracking-wider text-muted dark:text-[#6B6878]">
                {label}
              </Text>
            </View>

            {trendText ? (
              <Text className="text-[11px] font-semibold text-muted dark:text-[#6B6878] mt-3">
                {trendText}
              </Text>
            ) : null}
          </View>

          {iconName ? (
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: highlight ? `${c.danger}15` : `${c.primary}15`,
                alignItems: 'center',
                justifyContent: 'center',
                position: 'absolute',
                top: 16,
                right: 16,
              }}
            >
              <Icon name={iconName} size={16} color={accentColor} />
            </View>
          ) : null}
        </BlurView>
      </View>
    </Pressable>
  );
}
