import { Text, View, XStack, YStack } from 'tamagui';
import Button from './Button';
import { Icon, IconName } from './Icon';
import { useAppColors } from '../../hooks/useAppColors';

interface SectionHeaderProps {
  title: string;
  eyebrow?: string;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
}

export default function SectionHeader({
  title,
  eyebrow,
  icon,
  actionLabel,
  onAction,
}: SectionHeaderProps) {
  const c = useAppColors();

  return (
    <XStack className="mb-4 flex-row items-center justify-between gap-3">
      <XStack className="min-w-0 flex-1 flex-row items-center gap-3">
        {icon ? (
          <View
            className="h-10 w-10 items-center justify-center rounded-2xl"
            style={{ backgroundColor: c.primaryGlow, borderWidth: 1, borderColor: c.glassLine }}
          >
            <Icon name={icon} size={18} color={c.primary} />
          </View>
        ) : null}
        <YStack className="min-w-0 flex-1">
          {eyebrow ? (
            <Text className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted dark:text-muted-dark">
              {eyebrow}
            </Text>
          ) : null}
          <Text numberOfLines={1} className="font-display text-2xl text-ink dark:text-ink-dark">
            {title}
          </Text>
        </YStack>
      </XStack>
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="ghost" size="sm" />
      ) : null}
    </XStack>
  );
}
