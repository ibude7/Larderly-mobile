import { ReactNode } from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import { canUseLiquidGlass } from '../../lib/liquidGlass';
import { useScale } from '../../theme/scale';
import { landing } from '../../theme/landing';

interface FrostedNavbarGlassProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  borderRadius?: number;
}

/** Shared frosted glass shell used by the floating tab bar and nav route buttons. */
export function FrostedNavbarGlass({
  children,
  style,
  contentStyle,
  borderRadius: borderRadiusProp,
}: FrostedNavbarGlassProps) {
  const { s } = useScale();
  const useNativeGlass = canUseLiquidGlass();
  const borderRadius = borderRadiusProp ?? s(28);
  const canvasTint = `${landing.canvas}94`;
  const canvasUnderlay = `${landing.canvas}47`;

  return (
    <View
      style={[
        styles.shell,
        {
          borderRadius,
          shadowRadius: s(20),
          shadowOffset: { width: 0, height: s(8) },
          shadowOpacity: 0.8,
          backgroundColor: canvasUnderlay,
        },
        style,
      ]}
    >
      {useNativeGlass ? (
        <GlassView
          glassEffectStyle="regular"
          colorScheme="light"
          tintColor={canvasTint}
          isInteractive
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius,
              borderWidth: StyleSheet.hairlineWidth * 1.5,
              borderColor: landing.ink,
              overflow: 'hidden',
            },
          ]}
        />
      ) : (
        <BlurView
          intensity={Platform.OS === 'ios' ? 48 : 36}
          tint="light"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius,
              borderWidth: StyleSheet.hairlineWidth * 1.5,
              borderColor: landing.ink,
              backgroundColor: canvasTint,
              overflow: 'hidden',
            },
          ]}
        />
      )}

      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255,255,255,0.48)', 'rgba(255,255,255,0.08)', 'transparent']}
        style={[styles.sheen, { borderTopLeftRadius: borderRadius, borderTopRightRadius: borderRadius }]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <View
        pointerEvents="none"
        style={[styles.specular, { left: s(24), right: s(24), top: s(2), borderRadius: 1 }]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.rim,
          {
            borderRadius: borderRadius - 1,
            margin: s(1),
            borderColor: `${landing.canvas}99`,
          },
        ]}
      />

      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    overflow: 'hidden',
    shadowColor: landing.ink,
    shadowOpacity: 0.8,
    elevation: 12,
    backgroundColor: 'rgba(244, 241, 232, 0.28)',
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
  },
  specular: {
    position: 'absolute',
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  rim: {
    ...StyleSheet.absoluteFill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  content: {
    zIndex: 1,
  },
});
