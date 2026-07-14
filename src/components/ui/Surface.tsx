import { ReactNode } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'tamagui';
import { useAppColors } from '../../hooks/useAppColors';
import { GlassView, canUseLiquidGlass } from '../../lib/liquidGlass';

interface ScreenProps {
  children: ReactNode;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

interface SurfaceProps {
  children: ReactNode;
  variant?: 'solid' | 'muted' | 'glass' | 'elevated';
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Screen({ children, padded = false, style }: ScreenProps) {
  const c = useAppColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: c.canvas,
          paddingHorizontal: padded ? 20 : 0,
          paddingTop: padded ? insets.top : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Surface({
  children,
  variant = 'solid',
  padded = true,
  style,
}: SurfaceProps) {
  const c = useAppColors();
  const useNativeGlass = variant === 'glass' && canUseLiquidGlass();
  const backgroundColor =
    variant === 'muted'
      ? c.surfaceMuted
      : variant === 'elevated'
        ? c.surfaceElevated
        : variant === 'glass' && !useNativeGlass
          ? c.surfaceGlass
          : c.surface;

  const containerStyle = [
    styles.surface,
    {
      backgroundColor,
      borderColor: variant === 'glass' ? c.glassBorder : c.line,
      padding: padded ? 18 : 0,
      shadowColor: c.shadow,
    },
    style,
  ];

  if (variant === 'glass') {
    if (useNativeGlass) {
      return (
        <GlassView
          glassEffectStyle="regular"
          colorScheme={c.blurTint === 'dark' ? 'dark' : 'light'}
          tintColor={c.glassUnderlay}
          style={[containerStyle, styles.nativeGlass]}
        >
          <View style={styles.glassContent}>{children}</View>
        </GlassView>
      );
    }

    return (
      <View style={containerStyle}>
        <View style={styles.glassContent}>{children}</View>
      </View>
    );
  }

  return <View style={containerStyle}>{children}</View>;
}

export function GlassCard({ children, style, padded = true }: Omit<SurfaceProps, 'variant'>) {
  return (
    <Surface variant="glass" padded={padded} style={style}>
      {children}
    </Surface>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: 'hidden',
  },
  surface: {
    borderRadius: 8,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 0,
    elevation: 2,
  },
  nativeGlass: {
    backgroundColor: 'transparent',
  },
  glassContent: {
    position: 'relative',
    zIndex: 1,
  },
});
