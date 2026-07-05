import { ReactNode } from 'react';
import { View, Text } from 'react-native';
import { Icon, IconName } from './Icon';
import Button from './Button';
import { colors } from '../../theme';

interface EmptyStateProps {
  icon: IconName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  variant?: 'default' | 'card' | 'inline';
  extra?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  variant = 'default',
  extra,
  className = '',
}: EmptyStateProps) {
  const container =
    variant === 'card'
      ? 'items-center rounded-card border border-line bg-surface px-6 py-12'
      : variant === 'inline'
        ? 'items-center py-8'
        : 'items-center rounded-card border border-dashed border-line bg-canvas px-6 py-10';

  return (
    <View className={`${container} ${className}`}>
      <View className="mb-5 h-20 w-20 items-center justify-center rounded-full border border-line bg-surface-muted">
        <Icon name={icon} size={32} color={colors.primary} />
      </View>
      <Text className="text-center text-lg font-bold text-ink">{title}</Text>
      {description ? (
        <Text className="mt-2 max-w-xs text-center text-sm leading-relaxed text-muted">
          {description}
        </Text>
      ) : null}
      {(actionLabel || secondaryActionLabel) && (
        <View className="mt-5 flex-row flex-wrap items-center justify-center gap-2">
          {actionLabel && onAction ? (
            <Button label={actionLabel} onPress={onAction} variant="primary" />
          ) : null}
          {secondaryActionLabel && onSecondaryAction ? (
            <Button label={secondaryActionLabel} onPress={onSecondaryAction} variant="secondary" />
          ) : null}
        </View>
      )}
      {extra ? <View className="mt-4">{extra}</View> : null}
    </View>
  );
}
