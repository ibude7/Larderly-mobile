import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useAppColors } from '../../hooks/useAppColors';

interface ProgressBarProps {
  value: number;
  color?: string;
  trackColor?: string;
  height?: number;
  animated?: boolean;
  showLabel?: boolean;
  labelText?: string;
}

function clamp(value: number) {
  'worklet';
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

function alpha(hex: string, value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(hex) ? `${hex}${value}` : hex;
}

export default function ProgressBar({
  value,
  color,
  trackColor,
  height = 6,
  animated = true,
  showLabel = false,
  labelText,
}: ProgressBarProps) {
  const c = useAppColors();
  const clampedValue = clamp(value);
  const progress = useSharedValue(clampedValue);
  const fillColor = color ?? (clampedValue >= 1 ? c.danger : clampedValue >= 0.7 ? c.amber : c.primary);
  const resolvedTrackColor = trackColor ?? alpha(c.surfaceMuted, 'AA');

  useEffect(() => {
    progress.value = animated
      ? withTiming(clampedValue, {
          duration: 400,
          easing: Easing.out(Easing.quad),
        })
      : clampedValue;
  }, [animated, clampedValue, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.wrap}>
      {showLabel ? (
        <Text style={[styles.label, { color: clampedValue >= 1 ? c.danger : c.muted }]}>
          {labelText ?? `${Math.round(clampedValue * 100)}%`}
        </Text>
      ) : null}
      <View
        style={[
          styles.track,
          {
            backgroundColor: resolvedTrackColor,
            borderColor: c.glassLine,
            borderRadius: height / 2,
            height,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: fillColor,
              borderRadius: height / 2,
              height,
              shadowColor: fillColor,
            },
            fillStyle,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  track: {
    overflow: 'hidden',
    width: '100%',
    borderWidth: StyleSheet.hairlineWidth,
  },
  fill: {
    minWidth: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 8,
  },
});
