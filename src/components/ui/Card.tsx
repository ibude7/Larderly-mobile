import { ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Button as TamaguiButton, Text, View, XStack, YStack } from 'tamagui';
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
    <XStack style={styles.header}>
      <XStack style={styles.headerTitleRow}>
        <View
          className="h-10 w-10 items-center justify-center rounded-field"
          style={{ backgroundColor: `${color}18`, borderWidth: 1.5, borderColor: color }}
        >
          <Icon name={icon} size={18} color={color} />
        </View>
        <YStack style={styles.headerText}>
          {eyebrow ? (
            <Text className="text-[10px] font-bold uppercase tracking-widest text-muted dark:text-muted-dark">
              {eyebrow}
            </Text>
          ) : null}
          <Text numberOfLines={1} className="font-display text-xl text-ink dark:text-ink-dark">
            {title}
          </Text>
        </YStack>
      </XStack>
      {actionLabel && onAction ? (
        <TamaguiButton unstyled onPress={onAction} style={styles.headerAction}>
          <Text className="text-xs font-bold uppercase tracking-wider text-primary">{actionLabel}</Text>
        </TamaguiButton>
      ) : null}
    </XStack>
  );
}

const styles = {
  header: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    gap: 12,
    justifyContent: 'space-between' as const,
    marginBottom: 16,
  },
  headerTitleRow: {
    alignItems: 'center' as const,
    flex: 1,
    flexDirection: 'row' as const,
    gap: 12,
    minWidth: 0,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  headerAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
};
