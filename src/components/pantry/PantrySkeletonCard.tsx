import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useAppColors } from '../../hooks/useAppColors';
import { useTheme } from '../../hooks/useTheme';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface PantrySkeletonCardProps {
  listMode?: boolean;
}

export default function PantrySkeletonCard({ listMode }: PantrySkeletonCardProps) {
  const c = useAppColors();
  const theme = useTheme();

  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = listMode ? windowWidth - 40 : (windowWidth - 52) / 2;

  const translateX = useSharedValue(-cardWidth);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(cardWidth, { duration: 1200 }),
      -1,
      false
    );
  }, [cardWidth]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const placeholderBg = theme === 'dark' ? '#2A2A35' : '#EAE8E3';
  const shimmerColors = theme === 'dark'
    ? (['rgba(42, 42, 53, 0)', 'rgba(255, 255, 255, 0.08)', 'rgba(42, 42, 53, 0)'] as const)
    : (['rgba(234, 232, 227, 0)', 'rgba(255, 255, 255, 0.6)', 'rgba(234, 232, 227, 0)'] as const);

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: c.line,
          backgroundColor: theme === 'dark' ? '#1A1A22' : '#FFFFFF',
          flex: listMode ? undefined : 1,
          width: listMode ? undefined : cardWidth,
        },
        listMode && styles.listMargin,
      ]}
    >
      {/* Top section: name + image */}
      <View style={styles.topRow}>
        <View style={styles.textColumn}>
          {/* Name line 1 */}
          <View style={[styles.placeholder, { width: '85%', height: 16, backgroundColor: placeholderBg }]} />
          {/* Name line 2 */}
          <View style={[styles.placeholder, { width: '60%', height: 16, marginTop: 6, backgroundColor: placeholderBg }]} />
        </View>
        <View style={[styles.imagePlaceholder, { backgroundColor: placeholderBg }]} />
      </View>

      {/* Expiry Badge */}
      <View style={[styles.placeholder, { width: 80, height: 18, borderRadius: 9, marginTop: 12, backgroundColor: placeholderBg }]} />

      {/* Bottom Row */}
      <View style={[styles.bottomRow, { borderTopColor: c.line }]}>
        <View style={[styles.placeholder, { width: 60, height: 20, borderRadius: 10, backgroundColor: placeholderBg }]} />
        <View style={[styles.placeholder, { width: 80, height: 20, borderRadius: 10, backgroundColor: placeholderBg }]} />
      </View>

      {/* Shimmer Overlay */}
      <AnimatedLinearGradient
        colors={shimmerColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          StyleSheet.absoluteFill,
          shimmerStyle,
          { width: cardWidth },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
    minHeight: 140,
  },
  listMargin: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  textColumn: {
    flex: 1,
    marginRight: 12,
  },
  placeholder: {
    borderRadius: 4,
  },
  imagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    borderTopWidth: 1,
    paddingTop: 12,
  },
});
