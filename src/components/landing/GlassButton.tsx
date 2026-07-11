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
import { BlurView } from 'expo-blur';
import { GlassView } from 'expo-glass-effect';
import { ChevronRight } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { canUseLiquidGlass } from '../../lib/liquidGlass';
import { FrostedNavbarGlass } from './FrostedNavbarGlass';
import { useScale } from '../../theme/scale';
import { landing } from '../../theme/landing';

type GlassButtonVariant = 'dark' | 'amber' | 'light' | 'navbar';

interface GlassButtonProps {
  label?: string;
  children?: ReactNode;
  onPress: () => void;
  variant?: GlassButtonVariant;
  /** Light variant only — flat canvas fill matching the page background. */
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
  const scale = useSharedValue(1);
  const inactive = disabled || loading;
  const isLight = variant === 'light';
  const isFrostedLight = isLight && frosted;
  const isNavbar = variant === 'navbar';
  const isAmber = variant === 'amber';
  const useNativeGlass = canUseLiquidGlass();
  const labelColor = isLight || isNavbar ? landing.ink : '#FFFFFF';
  const spinnerColor = isLight || isNavbar ? landing.ink : '#FFFFFF';

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: inactive ? 0.55 : 1,
  }));

  const frostedGlassStyle = {
    backgroundColor: landing.canvas,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: landing.ink,
  };

  const shellStyle = isFrostedLight
    ? { shadowOpacity: 0, elevation: 0 }
    : {
        shadowColor: '#000000',
        shadowRadius: isLight ? s(12) : s(22),
        shadowOffset: { width: 0, height: isLight ? s(4) : s(8) },
        shadowOpacity: 0.1,
      };

  const glassContent = (
    <>
      {!isFrostedLight ? (
        <View
          pointerEvents="none"
          style={[
            styles.specularLine,
            {
              left: s(20),
              right: s(20),
              backgroundColor: isLight
                ? 'rgba(0, 0, 0, 0.12)'
                : 'rgba(255,255,255,0.18)',
            },
          ]}
        />
      ) : null}
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
    </>
  );

  const sizeStyle = {
    paddingVertical: s(10),
    paddingHorizontal: s(20),
    minHeight: s(40),
  };

  const variantStyle = isLight
    ? styles.nativeGlassLight
    : isAmber
      ? styles.nativeGlassAmber
      : styles.nativeGlassDark;

  if (isNavbar) {
    const pillRadius = s(28);
    return (
      <Animated.View style={[styles.shell, { shadowOpacity: 0, elevation: 0 }, pressStyle, style]}>
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
          <FrostedNavbarGlass
            borderRadius={pillRadius}
            contentStyle={[sizeStyle, { alignItems: 'center', justifyContent: 'center', width: '100%' }]}
          >
            {loading ? (
              <ActivityIndicator size="small" color={spinnerColor} />
            ) : children ? (
              <View style={[styles.content, { gap: s(8) }]}>{children}</View>
            ) : (
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
            )}
          </FrostedNavbarGlass>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.shell, shellStyle, pressStyle, style]}>
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
        style={styles.pressable}
      >
        {isFrostedLight ? (
          <View style={[styles.glass, sizeStyle, frostedGlassStyle]}>{glassContent}</View>
        ) : useNativeGlass ? (
          <GlassView
            glassEffectStyle={isLight ? 'clear' : 'regular'}
            colorScheme={isLight ? 'light' : 'dark'}
            tintColor={
              isLight
                ? undefined
                : isAmber
                  ? 'rgba(194, 102, 45, 0.42)'
                  : 'rgba(0, 0, 0, 0.92)'
            }
            isInteractive
            style={[styles.glass, sizeStyle, variantStyle]}
          >
            {glassContent}
          </GlassView>
        ) : (
          <BlurView
            intensity={
              Platform.OS === 'ios'
                ? isLight
                  ? 22
                  : 40
                : isLight
                  ? 18
                  : 32
            }
            tint={isLight ? 'default' : 'dark'}
            style={[
              styles.glass,
              sizeStyle,
              isLight ? styles.glassLight : isAmber ? styles.glassAmber : styles.glassDark,
            ]}
          >
            {glassContent}
          </BlurView>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    borderRadius: 999,
    elevation: 6,
  },
  pressable: {
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  glass: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
  },
  glassDark: {
    backgroundColor: '#000000',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  glassAmber: {
    backgroundColor: '#C2662D',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  glassLight: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(0, 0, 0, 0.14)',
  },
  nativeGlassDark: {
    backgroundColor: '#000000',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  nativeGlassAmber: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255,255,255,0.24)',
  },
  nativeGlassLight: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(0, 0, 0, 0.14)',
  },
  specularLine: {
    position: 'absolute',
    top: 1,
    height: 1,
    borderRadius: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Outfit_600SemiBold',
    fontWeight: Platform.OS === 'ios' ? '600' : undefined,
  },
});
