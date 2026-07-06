import { Text, View } from 'react-native';
import AnimatedNumber from './AnimatedNumber';
import { GlassCard } from './Surface';
import { Icon, IconName } from './Icon';
import { useAppColors } from '../../hooks/useAppColors';

interface MetricTileProps {
  label: string;
  value: number;
  icon: IconName;
  tone?: 'primary' | 'teal' | 'warning' | 'danger' | 'success';
  trend?: string;
}

export default function MetricTile({
  label,
  value,
  icon,
  tone = 'primary',
  trend,
}: MetricTileProps) {
  const c = useAppColors();
  const color =
    tone === 'teal'
      ? c.teal
      : tone === 'warning'
        ? c.warning
        : tone === 'danger'
          ? c.danger
          : tone === 'success'
            ? c.success
            : c.primary;

  return (
    <GlassCard style={{ width: '47.5%' }}>
      <View className="min-h-[104px] justify-between">
        <View className="flex-row items-start justify-between gap-3">
          <View>
            <AnimatedNumber
              value={value}
              duration={800}
              style={{ color: c.ink, fontSize: 34, fontWeight: '900' }}
            />
            <Text className="mt-1 text-xs font-bold uppercase text-muted dark:text-[#9A948D]">
              {label}
            </Text>
          </View>
          <View
            className="h-9 w-9 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${color}22`, borderWidth: 1, borderColor: `${color}44` }}
          >
            <Icon name={icon} size={17} color={color} />
          </View>
        </View>
        {trend ? (
          <Text numberOfLines={1} className="mt-4 text-xs font-semibold text-muted dark:text-[#9A948D]">
            {trend}
          </Text>
        ) : null}
      </View>
    </GlassCard>
  );
}
