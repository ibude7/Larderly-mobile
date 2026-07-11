import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useScale } from '../../theme/scale';
import { landing } from '../../theme/landing';

interface StepProgressProps {
  index: number;
  total: number;
  color?: string;
}

/**
 * Segmented progress — equal ticks that fill as you advance.
 * Distinct from carousel dots and continuous bars.
 */
export function LandingStepProgress({ index, total, color }: StepProgressProps) {
  const { s } = useScale();
  const segH = s(3);
  const gap = s(4);
  const width = s(Math.min(200, 28 + total * 14));

  return (
    <View style={[styles.row, { width, gap }]}>
      {Array.from({ length: total }).map((_, i) => (
        <Segment
          key={i}
          state={i < index ? 'done' : i === index ? 'active' : 'todo'}
          height={segH}
          color={color}
        />
      ))}
    </View>
  );
}

interface ScrollProgressProps {
  scrollX: SharedValue<number>;
  screenW: number;
  total: number;
}

export function LandingScrollProgress({ scrollX, screenW, total }: ScrollProgressProps) {
  const { s } = useScale();
  const segH = s(3);
  const gap = s(4);
  const width = s(Math.min(200, 28 + total * 14));

  return (
    <View style={[styles.row, { width, gap }]}>
      {Array.from({ length: total }).map((_, i) => (
        <ScrollSegment
          key={i}
          index={i}
          scrollX={scrollX}
          screenW={screenW}
          height={segH}
        />
      ))}
    </View>
  );
}

function Segment({
  state,
  height,
  color = landing.accent,
}: {
  state: 'done' | 'active' | 'todo';
  height: number;
  color?: string;
}) {
  const opacity = useSharedValue(state === 'todo' ? 0.2 : 1);
  const scaleY = useSharedValue(state === 'active' ? 1.35 : 1);

  useEffect(() => {
    opacity.value = withTiming(state === 'todo' ? 0.2 : 1, { duration: 220 });
    scaleY.value = withSpring(state === 'active' ? 1.35 : 1, {
      damping: 16,
      stiffness: 200,
    });
  }, [state, opacity, scaleY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scaleY: scaleY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.segment,
        {
          height,
          borderRadius: height / 2,
          backgroundColor: state === 'todo' ? landing.ink : color,
        },
        style,
      ]}
    />
  );
}

function ScrollSegment({
  index,
  scrollX,
  screenW,
  height,
}: {
  index: number;
  scrollX: SharedValue<number>;
  screenW: number;
  height: number;
}) {
  const style = useAnimatedStyle(() => {
    const center = index * screenW;
    const active = interpolate(
      scrollX.value,
      [center - screenW, center, center + screenW],
      [0, 1, 0],
      Extrapolation.CLAMP,
    );
    const isPast = scrollX.value >= center;
    const isCurrent = active > 0.35;
    return {
      opacity: isPast || isCurrent ? 1 : 0.2,
      transform: [{ scaleY: 1 + active * 0.35 }],
      backgroundColor: isPast || isCurrent ? landing.accent : landing.ink,
    };
  });

  return (
    <Animated.View
      style={[
        styles.segment,
        {
          height,
          borderRadius: height / 2,
          backgroundColor: landing.ink,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
  },
  segment: {
    flex: 1,
  },
});
