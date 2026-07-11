import { ReactNode } from 'react';
import { View, Text, Pressable, StyleProp, ViewStyle } from 'react-native';
import { GlassCard } from './Surface';
import { Icon, IconName } from './Icon';
import { useAppColors } from '../../hooks/useAppColors';

interface CardProps {
  children: ReactNode;
  variant?: 'glass' | 'solid' | 'muted';
  bento?: boolean;
  accent?: string;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

export default function Card({
  children,
  variant = 'glass',
  bento = false,
  accent,
  padded = true,
  style,
  className = '',
}: CardProps) {
  const c = useAppColors();

  if (variant === 'glass') {
    return (
      <GlassCard
        padded={padded}
        style={[
          bento && { borderRadius: 8 },
          accent && { borderTopWidth: 3, borderTopColor: accent },
          style,
        ]}
      >
        {children}
      </GlassCard>
    );
  }

  const bg = variant === 'muted' ? c.surfaceMuted : c.surface;

  return (
    <View
      className={`overflow-hidden rounded-card border border-line dark:border-line-dark p-5 ${className}`}
      style={[
        {
          backgroundColor: bg,
          shadowColor: c.shadow,
          shadowOffset: { width: 3, height: 3 },
          shadowOpacity: 0.1,
          shadowRadius: 0,
        },
        bento && { borderRadius: 8 },
        accent && { borderTopWidth: 3, borderTopColor: accent },
        style,
      ]}
    >
      {children}
    </View>
  );
}

interface CardHeaderProps {
  icon: IconName;
  iconColor?: string;
  eyebrow?: string;
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function CardHeader({
  icon,
  iconColor,
  eyebrow,
  title,
  actionLabel,
  onAction,
}: CardHeaderProps) {
  const c = useAppColors();
  const color = iconColor ?? c.primary;

  return (
    <View className="mb-4 flex-row items-center justify-between gap-3">
      <View className="min-w-0 flex-1 flex-row items-center gap-3">
        <View
          className="h-10 w-10 items-center justify-center rounded-field"
          style={{ backgroundColor: `${color}18`, borderWidth: 1.5, borderColor: color }}
        >
          <Icon name={icon} size={18} color={color} />
        </View>
        <View className="min-w-0 flex-1">
          {eyebrow ? (
            <Text className="text-[10px] font-bold uppercase tracking-widest text-muted dark:text-muted-dark">
              {eyebrow}
            </Text>
          ) : null}
          <Text numberOfLines={1} className="font-display text-xl text-ink dark:text-ink-dark">
            {title}
          </Text>
        </View>
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} className="px-3 py-1.5">
          <Text className="text-xs font-bold uppercase tracking-wider text-primary">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
