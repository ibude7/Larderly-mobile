import { Pressable, Text, View, ActivityIndicator, PressableProps } from 'react-native';
import { Icon, IconName } from './Icon';
import { colors } from '../../theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

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

const CONTAINER: Record<Variant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-surface border border-line',
  ghost: 'bg-transparent',
  danger: 'bg-danger',
};

const LABEL: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-ink',
  ghost: 'text-muted',
  danger: 'text-white',
};

const ICON_COLOR: Record<Variant, string> = {
  primary: '#FFFFFF',
  secondary: colors.ink,
  ghost: colors.muted,
  danger: '#FFFFFF',
};

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
  const pad = size === 'sm' ? 'px-4 py-2' : 'px-5 py-3';
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      hitSlop={hitSlop}
      style={({ pressed }) => [
        { opacity: isDisabled ? 0.55 : pressed ? 0.85 : 1 },
        pressed && !isDisabled ? { transform: [{ scale: 0.98 }] } : null,
      ]}
      className={`flex-row items-center justify-center gap-2 rounded-full ${pad} ${CONTAINER[variant]} ${
        full ? 'w-full' : ''
      } ${className}`}
    >
      {loading ? (
        <ActivityIndicator size={18} color={ICON_COLOR[variant]} />
      ) : (
        <>
          {icon && (
            <View>
              <Icon name={icon} size={18} color={ICON_COLOR[variant]} />
            </View>
          )}
          <Text className={`text-sm font-semibold ${LABEL[variant]}`}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}
