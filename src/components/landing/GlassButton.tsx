import { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { ChevronRight } from '../ui/Glyph';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SettingsGlass } from '../settings/SettingsGlass';
import { FrostedNavbarGlass } from './FrostedNavbarGlass';
import { useLandingColors } from '../../hooks/useLandingColors';
import { useScale } from '../../theme/scale';

type GlassButtonVariant = 'dark' | 'amber' | 'light' | 'navbar';

interface GlassButtonProps {
  label?: string;
  children?: ReactNode;
  onPress: () => void;
  variant?: GlassButtonVariant;
  /** Light variant only — Settings frosted glass fill. */
  frosted?: boolean;
  showArrow?: boolean;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Defaults to `label` when omitted — set explicitly when using `children`. */
  accessibilityLabel?: string;
}

const SPRING = { damping: 18, stiffness: 280 };

export function GlassButton({
  label,
  children,
  onPress,
  variant = 'dark',
  frosted = false,
  showArrow = false,
  loading = false,
  disabled = false,
  style,
  accessibilityLabel,
}: GlassButtonProps) {
  const { s, fs } = useScale();
  const lc = useLandingColors();
  const scale = useSharedValue(1);
  const inactive = disabled || loading;
  const isLight = variant === 'light';
  const isFrostedLight = isLight && frosted;
  const isNavbar = variant === 'navbar';
  const isAmber = variant === 'amber';
  const isSolid = !isLight && !isNavbar;
  // Dark fill is near-black in light theme; in dark theme it inverts to cream ink.
  // Label must flip with the fill — white-on-cream was unreadable.
  const labelColor = isSolid
    ? isAmber || !lc.isDark
      ? '#FFFFFF'
      : '#101010'
    : lc.ink;
  const spinnerColor = labelColor;
  const pillRadius = s(28);

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: inactive ? 0.55 : 1,
  }));

  const sizeStyle = {
    paddingVertical: s(10),
    paddingHorizontal: s(20),
    minHeight: s(40),
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    width: '100%' as const,
  };

  const content = (
    <View style={[styles.content, { gap: s(children ? 8 : 4) }]}>
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : children ? (
        children
      ) : (
        <>
          <Text
            style={[
              styles.label,
              {
                fontSize: fs(14),
                letterSpacing: fs(-0.15),
                color: labelColor,
              },
            ]}
          >
            {label}
          </Text>
          {showArrow ? (
            <ChevronRight size={fs(16)} color={labelColor} strokeWidth={2.4} />
          ) : null}
        </>
      )}
    </View>
  );

  const pressable = (face: ReactNode) => (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      onPressIn={() => {
        scale.value = withSpring(0.978, SPRING);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING);
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={{ width: '100%', borderRadius: pillRadius, overflow: 'hidden' }}
    >
      {face}
    </Pressable>
  );

  if (isNavbar) {
    return (
      <Animated.View style={[styles.shell, pressStyle, style]}>
        {pressable(
          <FrostedNavbarGlass borderRadius={pillRadius} contentStyle={sizeStyle}>
            {content}
          </FrostedNavbarGlass>,
        )}
      </Animated.View>
    );
  }

  if (isLight) {
    return (
      <Animated.View style={[styles.shell, pressStyle, style]}>
        {pressable(
          <SettingsGlass
            interactive={!inactive}
            elevated={!isFrostedLight}
            radius={pillRadius}
            contentStyle={sizeStyle}
          >
            {content}
          </SettingsGlass>,
        )}
      </Animated.View>
    );
  }

  const solidBg = isAmber ? lc.accent : lc.isDark ? lc.ink : '#101010';
  const solidBorder = isAmber
    ? lc.isDark
      ? 'rgba(0,0,0,0.45)'
      : 'rgba(255,255,255,0.28)'
    : lc.isDark
      ? 'rgba(16,16,16,0.2)'
      : 'rgba(255,255,255,0.28)';

  return (
    <Animated.View
      style={[
        styles.shell,
        {
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowRadius: s(16),
          shadowOffset: { width: 0, height: s(6) },
          elevation: 6,
        },
        pressStyle,
        style,
      ]}
    >
      {pressable(
        <View
          style={[
            sizeStyle,
            {
              backgroundColor: solidBg,
              borderRadius: pillRadius,
              borderWidth: StyleSheet.hairlineWidth * 1.5,
              borderColor: solidBorder,
            },
          ]}
        >
          {content}
        </View>,
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    borderRadius: 999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  label: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Outfit_600SemiBold',
    fontWeight: Platform.OS === 'ios' ? '600' : undefined,
  },
});
