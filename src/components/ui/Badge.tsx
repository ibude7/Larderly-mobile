import { Text, View, StyleSheet } from 'react-native';
import { useAppColors } from '../../hooks/useAppColors';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'primary';

interface BadgeProps {
  label: string;
  variant: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
}

function alpha(hex: string, value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(hex) ? `${hex}${value}` : hex;
}

export default function Badge({ label, variant, size = 'sm', dot = false }: BadgeProps) {
  const c = useAppColors();
  const colors: Record<BadgeVariant, { background: string; foreground: string }> = {
    success: { background: alpha(c.primary, '1A'), foreground: c.primary },
    warning: { background: 'rgba(245, 158, 11, 0.1)', foreground: '#D97706' },
    danger: { background: alpha(c.danger, '1A'), foreground: c.danger },
    neutral: { background: alpha(c.muted, '1A'), foreground: c.muted },
    primary: { background: c.primary, foreground: '#FFFFFF' },
  };
  const tone = colors[variant];
  const dotSize = size === 'md' ? 8 : 7;

  if (dot) {
    return (
      <View
        accessible
        accessibilityLabel={label}
        accessibilityRole="image"
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: tone.foreground,
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: tone.background,
          borderColor: variant === 'primary' ? tone.background : `${tone.foreground}33`,
          paddingHorizontal: size === 'md' ? 12 : 10,
          paddingVertical: size === 'md' ? 5 : 3,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: tone.foreground,
            fontSize: size === 'md' ? 12 : 11,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
  },
  label: {
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  dot: {
    alignSelf: 'center',
  },
});
