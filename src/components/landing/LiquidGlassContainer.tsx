import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LiquidGlassView } from '@callstack/liquid-glass';
import { LinearGradient } from 'expo-linear-gradient';
import { canUseLiquidGlass } from '../../lib/liquidGlass';
import { useScale } from '../../theme/scale';
import { landing } from '../../theme/landing';

interface LiquidGlassContainerProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  /** Soft accent tint for the glass (hex). */
  tintColor?: string;
}

/**
 * 3D liquid-glass panel sized to its children.
 * Glass fills via absoluteFill so LiquidGlassView cannot collapse layout.
 */
export function LiquidGlassContainer({
  children,
  style,
  contentStyle,
  tintColor = landing.accent,
}: LiquidGlassContainerProps) {
  const { s } = useScale();
  const useNativeGlass = canUseLiquidGlass();
  const radius = s(28);

  return (
    <View
      style={[
        styles.shell,
        {
          borderRadius: radius,
          shadowRadius: s(24),
          shadowOffset: { width: 0, height: s(10) },
        },
        style,
      ]}
    >
      <LiquidGlassView
        effect="regular"
        colorScheme="light"
        tintColor={`${tintColor}18`}
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: radius,
            borderWidth: StyleSheet.hairlineWidth * 1.5,
            borderColor: 'rgba(255,255,255,0.55)',
            backgroundColor: useNativeGlass ? 'transparent' : 'rgba(255, 253, 246, 0.62)',
            overflow: 'hidden',
          },
        ]}
      />

      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255,255,255,0.5)', 'rgba(255,255,255,0.06)', 'transparent']}
        style={[
          styles.sheen,
          { borderTopLeftRadius: radius, borderTopRightRadius: radius },
        ]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <View
        pointerEvents="none"
        style={[
          styles.specular,
          { left: s(22), right: s(22), top: s(2), borderRadius: 1 },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.rim,
          {
            borderRadius: radius - 1,
            margin: s(1),
            borderColor: `${tintColor}28`,
          },
        ]}
      />

      <View style={[styles.content, { padding: s(18), gap: s(10) }, contentStyle]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    alignSelf: 'center',
    flexShrink: 0,
    overflow: 'hidden',
    shadowColor: '#2E2B26',
    shadowOpacity: 0.14,
    elevation: 8,
    backgroundColor: 'rgba(255,253,246,0.35)',
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  specular: {
    position: 'absolute',
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  rim: {
    ...StyleSheet.absoluteFill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  content: {
    width: '100%',
    zIndex: 1,
  },
});
