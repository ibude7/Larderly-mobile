import { View, Text, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AnimatedNumber from '../ui/AnimatedNumber';
import { Icon, IconName } from '../ui/Icon';
import type { TabScreenNavigationProp } from '../../navigation/types';
import { useAppColors } from '../../hooks/useAppColors';
import type { DashboardStats } from '../../hooks/useDashboardStats';

interface StatTileRowProps {
  stats: DashboardStats;
  itemsTrend?: string;
  shoppingTrend?: string;
}

type Tone = 'surface' | 'green' | 'yellow' | 'pink';

export default function StatTileRow({ stats, itemsTrend, shoppingTrend }: StatTileRowProps) {
  const navigation = useNavigation<TabScreenNavigationProp>();
  const { itemCount, lowStockItems, expiringSoonItems, uncheckedCount } = stats;

  const lowStockTrend = lowStockItems.length > 0 ? 'Needs attention' : 'Healthy stock';
  const expiringTrend = expiringSoonItems.length > 0 ? 'Consume soon' : 'All fresh';

  return (
    <View className="flex-row flex-wrap gap-3">
      <StatCard
        label="Total Items"
        icon="pantry"
        value={itemCount}
        tone="surface"
        corner="tl"
        trendText={itemsTrend}
        onPress={() => navigation.navigate('Pantry')}
        testID="stat-total-items"
      />
      <StatCard
        label="Shopping List"
        icon="cart"
        value={uncheckedCount}
        tone="green"
        corner="tr"
        trendText={shoppingTrend}
        onPress={() => navigation.navigate('Shopping')}
        testID="stat-shopping-list"
      />
      <StatCard
        label="Low Stock"
        icon="warning"
        value={lowStockItems.length}
        tone={lowStockItems.length > 0 ? 'yellow' : 'surface'}
        corner="bl"
        trendText={lowStockTrend}
        onPress={() => navigation.navigate('Pantry')}
        testID="stat-low-stock"
      />
      <StatCard
        label="Expiring Soon"
        icon="calendar"
        value={expiringSoonItems.length}
        tone={expiringSoonItems.length > 0 ? 'pink' : 'surface'}
        corner="br"
        trendText={expiringTrend}
        onPress={() => navigation.navigate('Pantry', { filterExpiration: 'Expiring Soon' })}
        testID="stat-expiring-soon"
      />
    </View>
  );
}

const R = 28;
const r = 10;
const CORNERS: Record<string, object> = {
  tl: { borderTopLeftRadius: R, borderTopRightRadius: r, borderBottomLeftRadius: r, borderBottomRightRadius: R },
  tr: { borderTopLeftRadius: r, borderTopRightRadius: R, borderBottomLeftRadius: R, borderBottomRightRadius: r },
  bl: { borderTopLeftRadius: r, borderTopRightRadius: R, borderBottomLeftRadius: R, borderBottomRightRadius: r },
  br: { borderTopLeftRadius: R, borderTopRightRadius: r, borderBottomLeftRadius: r, borderBottomRightRadius: R },
};

function StatCard({
  label,
  icon,
  value,
  tone,
  corner,
  trendText,
  onPress,
  testID,
}: {
  label: string;
  icon: IconName;
  value: number;
  tone: Tone;
  corner: keyof typeof CORNERS;
  trendText?: string;
  onPress: () => void;
  testID: string;
}) {
  const c = useAppColors();

  const palette = {
    surface: { bg: c.surface, ink: c.ink, sub: c.muted, chip: `${c.primary}18`, chipInk: c.primary, border: c.line },
    green: { bg: c.teal, ink: '#04231A', sub: 'rgba(4,35,26,0.65)', chip: 'rgba(4,35,26,0.12)', chipInk: '#04231A', border: 'transparent' },
    yellow: { bg: c.amber, ink: '#231A00', sub: 'rgba(35,26,0,0.65)', chip: 'rgba(35,26,0,0.12)', chipInk: '#231A00', border: 'transparent' },
    pink: { bg: c.primary, ink: '#FFFFFF', sub: 'rgba(255,255,255,0.78)', chip: 'rgba(255,255,255,0.2)', chipInk: '#FFFFFF', border: 'transparent' },
  }[tone];

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1, width: '47.5%', transform: [{ scale: pressed ? 0.98 : 1 }] }]}
    >
      <View
        style={[
          CORNERS[corner],
          {
            backgroundColor: palette.bg,
            borderWidth: 1,
            borderColor: palette.border,
            padding: 18,
            shadowColor: tone === 'surface' ? c.shadow : palette.bg,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: tone === 'surface' ? 0.1 : 0.32,
            shadowRadius: 16,
            elevation: 5,
          },
        ]}
      >
        <View className="min-h-[92px] justify-between">
          <View className="flex-row items-start justify-between">
            <AnimatedNumber
              value={value}
              duration={800}
              style={{ fontSize: 34, fontFamily: 'Outfit_800ExtraBold', color: palette.ink }}
            />
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: palette.chip,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={icon} size={16} color={palette.chipInk} />
            </View>
          </View>
          <View>
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'Outfit_700Bold',
                textTransform: 'uppercase',
                letterSpacing: 1.2,
                color: palette.ink,
              }}
            >
              {label}
            </Text>
            {trendText ? (
              <Text style={{ fontSize: 11, fontFamily: 'Outfit_500Medium', marginTop: 3, color: palette.sub }}>
                {trendText}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}
