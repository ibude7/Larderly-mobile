import { Pressable, Text, View, ActivityIndicator, PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Icon, IconName } from './Icon';
import { useAppColors } from '../../hooks/useAppColors';
import type { AppColors } from '../../theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';

interface ButtonProps {
  label: string;
  onPress: () => void;
  style?: import("react-native").ViewStyle;
  variant?: Variant;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  /** Stretch to fill the parent width. */
  full?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  hitSlop?: PressableProps['hitSlop'];
}

const CONTAINER: Record<Variant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-surface dark:bg-[#1A1A22] border border-line dark:border-[#2A2A35]',
  ghost: 'bg-transparent',
  danger: 'bg-danger',
  outline: 'bg-transparent',
};

const LABEL: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-ink dark:text-[#F0EEE9]',
  ghost: 'text-muted dark:text-[#6B6878]',
  danger: 'text-white',
  outline: 'text-ink dark:text-[#F0EEE9]',
};

function getIconColor(variant: Variant, c: AppColors): string {
  switch (variant) {
    case 'primary':
    case 'danger':
      return '#FFFFFF';
    case 'secondary':
    case 'outline':
      return c.ink;
    case 'ghost':
      return c.muted;
  }
}

export default function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  loading = false,
  full = false,
  size = 'md',
  className = '',
  hitSlop,
}: ButtonProps) {
  const c = useAppColors();
  const scale = useSharedValue(1);
  const pad = size === 'sm' ? 'px-4 py-2' : 'px-5 py-3';
  const isDisabled = disabled || loading;
  const labelSize = size === 'sm' ? 13 : 15;
  const iconColor = getIconColor(variant, c);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const primaryGlow =
    variant === 'primary' && !isDisabled
      ? {
          shadowColor: c.primary,
          shadowOpacity: 0.4,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 4 as const },
          elevation: 8,
        }
      : undefined;

  const outlineBorder =
    variant === 'outline' ? { borderWidth: 1, borderColor: c.line } : undefined;

  return (
    <Animated.View
      style={[animatedStyle, primaryGlow]}
      className={full ? 'w-full' : undefined}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          if (!isDisabled) scale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 12, stiffness: 180 });
        }}
        disabled={isDisabled}
        hitSlop={hitSlop}
        style={{ opacity: isDisabled ? 0.55 : 1, ...outlineBorder }}
        className={`flex-row items-center justify-center gap-2 rounded-full ${pad} ${CONTAINER[variant]} ${
          full ? 'w-full' : ''
        } ${className}`}
      >
        {loading ? (
          <ActivityIndicator size={18} color={iconColor} />
        ) : (
          <>
            {icon && (
              <View>
                <Icon name={icon} size={18} color={iconColor} />
              </View>
            )}
            <Text style={{ fontSize: labelSize }} className={`font-semibold ${LABEL[variant]}`}>
              {label}
            </Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}
