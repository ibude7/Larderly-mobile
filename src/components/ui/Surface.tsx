import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColors } from '../../hooks/useAppColors';
import { useTheme } from '../../hooks/useTheme';

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
      <LinearGradient
        pointerEvents="none"
        colors={[c.primaryGlow, 'transparent', c.tealGlow]}
        locations={[0, 0.46, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
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
  const theme = useTheme();
  const backgroundColor =
    variant === 'muted'
      ? c.surfaceMuted
      : variant === 'elevated'
        ? c.surfaceElevated
        : variant === 'glass'
          ? c.surfaceGlass
          : c.surface;

  const containerStyle = [
    styles.surface,
    {
      backgroundColor,
      borderColor: variant === 'glass' ? c.glassLine : c.line,
      padding: padded ? 18 : 0,
      shadowColor: c.shadow,
    },
    style,
  ];

  if (variant === 'glass') {
    return (
      <View style={containerStyle}>
        <BlurView intensity={c.blurIntensity} tint={theme} style={StyleSheet.absoluteFill} />
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(255,255,255,0.12)', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
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
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.16,
    shadowRadius: 34,
    elevation: 8,
  },
  glassContent: {
    position: 'relative',
    zIndex: 1,
  },
});
