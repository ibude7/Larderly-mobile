import type { ComponentType, ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useScale } from '../../theme/scale';
import { useSettingsTheme } from '../../theme/settings';
import { usePreferenceValues } from '../../contexts/PreferenceValueContext';

type RowIcon = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

interface SettingsRowProps {
  icon: RowIcon;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  /** Custom trailing content (e.g. a switch or value). Defaults to a chevron when onPress is set. */
  trailing?: ReactNode;
  danger?: boolean;
  iconColor?: string;
  disabled?: boolean;
}

const SPRING = { damping: 18, stiffness: 280 };

export function SettingsRow({
  icon: Icon,
  label,
  subtitle,
  onPress,
  trailing,
  danger,
  iconColor,
  disabled,
}: SettingsRowProps) {
  const { s, fs, fsLayout } = useScale();
  const c = useSettingsTheme();
  const { reduceMotion } = usePreferenceValues();
  const color = danger ? c.danger : iconColor ?? c.accent;
  const labelColor = danger ? c.danger : c.ink;
  const scale = useSharedValue(1);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: s(12),
        paddingHorizontal: s(14),
        paddingVertical: s(12),
        opacity: disabled ? 0.5 : 1,
        minHeight: fsLayout(44),
      }}
    >
      <View
        style={{
          width: s(32),
          height: s(32),
          borderRadius: s(9),
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: c.tint(color, 0.14),
        }}
      >
        <Icon size={fs(16)} color={color} strokeWidth={2.2} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontSize: fs(14.5),
            lineHeight: fs(19),
            fontWeight: '500',
            color: labelColor,
            flexShrink: 0,
          }}
        >
          {label}
        </Text>
        {subtitle ? (
          <Text style={{ fontSize: fs(12), lineHeight: fs(16), color: c.muted, marginTop: s(1), flexShrink: 0 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing !== undefined ? trailing : onPress ? (
        <ChevronRight size={fs(16)} color={c.muted} strokeWidth={2} />
      ) : null}
    </View>
  );

  if (!onPress) return content;

  return (
    <Animated.View style={pressStyle}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={() => {
          if (!reduceMotion) scale.value = withSpring(0.97, SPRING);
        }}
        onPressOut={() => {
          if (!reduceMotion) scale.value = withSpring(1, SPRING);
        }}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={subtitle ? `${label}. ${subtitle}` : label}
        style={({ pressed }) => (reduceMotion && pressed ? { opacity: 0.6 } : undefined)}
      >
        {content}
      </Pressable>
    </Animated.View>
  );
}
