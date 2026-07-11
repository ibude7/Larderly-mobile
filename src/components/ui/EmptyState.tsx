import { memo, ReactNode } from 'react';
import { Text, View, XStack } from 'tamagui';
import { IconName } from './Icon';
import Button from './Button';
import EmptyIllustration from './EmptyIllustration';
import { GlassCard } from './Surface';

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

function EmptyState({
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
  const artVariant =
    icon === 'shopping' || icon === 'cart'
      ? 'shopping'
      : icon === 'chef' || icon === 'meals'
        ? 'meals'
        : icon === 'pantry' || icon === 'shelf'
          ? 'pantry'
          : 'default';

  const body = (
    <View className={`items-center px-6 py-10 ${variant === 'inline' ? 'py-8' : ''} ${className}`}>
      <View className="mb-4">
        <EmptyIllustration variant={artVariant} size={variant === 'inline' ? 112 : 144} />
      </View>
      <Text className="text-center font-display text-2xl text-ink dark:text-ink-dark">{title}</Text>
      {description ? (
        <Text className="mt-2 max-w-xs text-center text-sm leading-relaxed text-muted dark:text-muted-dark">
          {description}
        </Text>
      ) : null}
      {(actionLabel || secondaryActionLabel) && (
        <XStack className="mt-5 flex-row flex-wrap items-center justify-center gap-2">
          {actionLabel && onAction ? (
            <Button label={actionLabel} onPress={onAction} variant="primary" />
          ) : null}
          {secondaryActionLabel && onSecondaryAction ? (
            <Button label={secondaryActionLabel} onPress={onSecondaryAction} variant="secondary" />
          ) : null}
        </XStack>
      )}
      {extra ? <View className="mt-4">{extra}</View> : null}
    </View>
  );

  if (variant === 'inline') return body;

  return (
    <GlassCard padded={false}>
      {body}
    </GlassCard>
  );
}

export default memo(EmptyState);
