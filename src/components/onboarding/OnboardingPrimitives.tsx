import type { ComponentType, ReactNode } from 'react';
import { Pressable, Text, StyleSheet, Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import { GlassButton } from '../landing/GlassButton';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Check, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useScale } from '../../theme/scale';
import { landing, landingFonts as SF } from '../../theme/landing';
import { useAccent } from '../../theme/accent';

const SPRING = { damping: 18, stiffness: 280 };

export function OptionChip({
  label,
  selected,
  onPress,
  selectedColor,
  icon: Icon,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  selectedColor?: string;
  icon?: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
}) {
  const { s, fs } = useScale();
  const accent = useAccent();
  const color = selectedColor ?? accent;
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync();
          onPress();
        }}
        onPressIn={() => {
          scale.value = withSpring(0.96, SPRING);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, SPRING);
        }}
        style={[
          styles.chip,
          {
            paddingHorizontal: s(10),
            paddingVertical: s(7),
            borderRadius: s(999),
            gap: s(5),
            backgroundColor: selected ? color : landing.surface,
            borderColor: selected ? color : landing.line,
          },
        ]}
      >
        {Icon ? (
          <Icon size={fs(13)} color={selected ? landing.white : color} strokeWidth={2.2} />
        ) : null}
        <Text
          style={{
            fontSize: fs(12),
            fontFamily: selected ? SF.semibold : SF.regular,
            fontWeight: Platform.OS === 'ios' ? (selected ? '600' : '400') : undefined,
            color: selected ? landing.white : landing.ink,
          }}
        >
          {label}
        </Text>
        {selected ? <Check size={fs(11)} color={landing.white} strokeWidth={3} /> : null}
      </Pressable>
    </Animated.View>
  );
}

/** @deprecated Use OptionChip */
export const Chip = OptionChip;

export function ChoiceCard({
  title,
  subtitle,
  icon: Icon,
  accentColor,
  onPress,
  highlighted = false,
}: {
  title: string;
  subtitle: string;
  icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  accentColor?: string;
  onPress: () => void;
  highlighted?: boolean;
}) {
  const { s, fs } = useScale();
  const accent = useAccent();
  const color = accentColor ?? accent;
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={() => {
          scale.value = withSpring(0.98, SPRING);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, SPRING);
        }}
        style={[
          styles.choiceCard,
          {
            gap: s(10),
            borderRadius: s(14),
            padding: s(12),
            borderColor: highlighted ? `${color}55` : landing.line,
            backgroundColor: highlighted ? `${color}0F` : landing.surface,
          },
        ]}
      >
        <View
          style={{
            width: s(40),
            height: s(40),
            borderRadius: s(10),
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: highlighted ? color : `${color}18`,
          }}
        >
          <Icon size={fs(18)} color={highlighted ? landing.white : color} strokeWidth={2.1} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              fontSize: fs(14),
              fontFamily: SF.semibold,
              fontWeight: Platform.OS === 'ios' ? '600' : undefined,
              color: landing.ink,
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text
            style={{
              fontSize: fs(12),
              lineHeight: fs(16),
              color: landing.muted,
              marginTop: s(2),
            }}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        </View>
        <ChevronRight size={fs(16)} color={landing.muted} strokeWidth={2} />
      </Pressable>
    </Animated.View>
  );
}

export function GhostLink({
  label,
  onPress,
  accent = false,
}: {
  label: string;
  onPress: () => void;
  accent?: boolean;
}) {
  const { s, fs } = useScale();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={{ alignItems: 'center', paddingVertical: s(4) }}
    >
      <Text
        style={{
          fontSize: fs(13),
          fontFamily: accent ? SF.semibold : SF.regular,
          fontWeight: Platform.OS === 'ios' ? (accent ? '600' : '400') : undefined,
          color: accent ? landing.accent : landing.muted,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  loading = false,
  flex,
  compact = false,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  flex?: boolean;
  /** Inline width for row actions (e.g. Add beside a field). */
  compact?: boolean;
}) {
  const { s } = useScale();
  const shellStyle: StyleProp<ViewStyle> = [
    flex ? { flex: 1 } : null,
    compact ? { width: 'auto', alignSelf: 'flex-start', minWidth: s(72) } : null,
  ];

  return (
    <GlassButton
      label={label}
      onPress={onPress}
      variant="light"
      loading={loading}
      style={shellStyle}
    />
  );
}

export function DepthCard({
  children,
  accentColor,
  style,
}: {
  children: ReactNode;
  accentColor?: string;
  style?: object;
}) {
  const { s } = useScale();
  const accent = useAccent();
  const color = accentColor ?? accent;

  return (
    <View
      style={[
        styles.depthCard,
        {
          borderRadius: s(14),
          padding: s(14),
          borderColor: `${color}35`,
          backgroundColor: landing.surface,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function BenefitRow({
  icon: Icon,
  title,
  body,
  accentColor,
}: {
  icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  title: string;
  body: string;
  accentColor?: string;
}) {
  const { s, fs } = useScale();
  const accent = useAccent();
  const color = accentColor ?? accent;

  return (
    <View
      style={[
        styles.benefitRow,
        {
          gap: s(10),
          borderRadius: s(12),
          padding: s(10),
        },
      ]}
    >
      <View
        style={{
          width: s(34),
          height: s(34),
          borderRadius: s(9),
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${color}18`,
        }}
      >
        <Icon size={fs(16)} color={color} strokeWidth={2.2} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontSize: fs(13),
            fontFamily: SF.semibold,
            fontWeight: Platform.OS === 'ios' ? '600' : undefined,
            color: landing.ink,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: fs(12),
            lineHeight: fs(16),
            color: landing.body,
            marginTop: s(1),
          }}
          numberOfLines={2}
        >
          {body}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  depthCard: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    width: '100%',
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: landing.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: landing.line,
  },
});
