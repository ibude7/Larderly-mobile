import { memo } from 'react';
import { Pressable, Text, View, ActivityIndicator, PressableProps, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Icon, IconName } from './Icon';
import { useAppColors } from '../../hooks/useAppColors';
import type { AppColors } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';

interface ButtonProps {
  label: string;
  onPress: () => void;
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

const LABEL: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-ink dark:text-[#F6F1EA]',
  ghost: 'text-muted dark:text-[#9A948D]',
  danger: 'text-white',
  outline: 'text-ink dark:text-[#F6F1EA]',
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

function Button({
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
  const haptics = useHaptics();
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
          shadowOpacity: 0.36,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 10 as const },
          elevation: 9,
        }
      : undefined;

  const backgroundColor =
    variant === 'primary'
      ? c.primary
      : variant === 'danger'
        ? c.danger
        : variant === 'secondary'
          ? c.surfaceGlass
          : 'transparent';

  const borderColor =
    variant === 'outline' || variant === 'secondary'
      ? variant === 'secondary'
        ? c.glassLine
        : c.line
      : 'transparent';

  return (
    <Animated.View
      style={[animatedStyle, primaryGlow]}
      className={full ? 'w-full' : undefined}
    >
      <Pressable
        onPress={() => {
          haptics.tap();
          onPress();
        }}
        onPressIn={() => {
          if (!isDisabled) scale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 12, stiffness: 180 });
        }}
        disabled={isDisabled}
        hitSlop={hitSlop}
        style={[
          styles.button,
          {
            opacity: isDisabled ? 0.55 : 1,
            backgroundColor,
            borderColor,
            shadowColor: variant === 'secondary' ? c.shadow : 'transparent',
          },
        ]}
        className={`flex-row items-center justify-center gap-2 rounded-full ${pad} ${
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

export default memo(Button);

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
  },
});
