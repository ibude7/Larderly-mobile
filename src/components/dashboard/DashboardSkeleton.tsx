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

export default function DashboardSkeleton() {
  const c = useAppColors();
  const theme = useTheme();

  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = (windowWidth - 40 - 12) / 2;

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

  const renderSkeletonCard = (index: number) => (
    <View
      key={index}
      style={[
        styles.card,
        {
          borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
          backgroundColor: theme === 'dark' ? 'rgba(26, 26, 34, 0.5)' : 'rgba(255, 255, 255, 0.4)',
          width: '47.5%',
        },
      ]}
    >
      <View style={styles.content}>
        {/* Number placeholder */}
        <View style={[styles.placeholder, { width: 50, height: 36, backgroundColor: placeholderBg }]} />
        {/* Label placeholder */}
        <View style={[styles.placeholder, { width: '80%', height: 12, marginTop: 8, backgroundColor: placeholderBg }]} />
        {/* Trend placeholder */}
        <View style={[styles.placeholder, { width: '60%', height: 10, marginTop: 12, backgroundColor: placeholderBg }]} />
      </View>

      {/* Circular Icon placeholder in top-right */}
      <View style={[styles.iconPlaceholder, { backgroundColor: placeholderBg }]} />

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

  return (
    <View style={styles.container}>
      {[0, 1, 2, 3].map((i) => renderSkeletonCard(i))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 24,
    width: '100%',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    overflow: 'hidden',
    minHeight: 127,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  placeholder: {
    borderRadius: 4,
  },
  iconPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    position: 'absolute',
    top: 16,
    right: 16,
  },
});
