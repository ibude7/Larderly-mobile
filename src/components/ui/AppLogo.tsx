import { useEffect, useId } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Defs, LinearGradient, Stop, Ellipse } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type AppLogoSize = 'sm' | 'md' | 'lg';

interface AppLogoProps {
  size?: AppLogoSize;
  showWordmark?: boolean;
  showSubtitle?: boolean;
  subtitle?: string;
  /** Ambient float animation — used on auth and loading surfaces. */
  animated?: boolean;
}

const SIZES: Record<AppLogoSize, { mark: number; glyph: number; title: string; radius: number }> = {
  sm: { mark: 40, glyph: 30, title: 'text-[15px]', radius: 18 },
  md: { mark: 48, glyph: 36, title: 'text-lg', radius: 20 },
  lg: { mark: 64, glyph: 48, title: 'text-2xl', radius: 24 },
};

const AnimatedView = Animated.createAnimatedComponent(View);

function PantryGlyph({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Path d="M10 7V41M38 7V41" stroke="white" strokeWidth={3.5} strokeLinecap="round" />
      <Path d="M10 17H38M10 29H38M10 41H38" stroke="white" strokeWidth={3.5} strokeLinecap="round" />
      <Rect x={13} y={7} width={4} height={9} rx={2} fill="white" fillOpacity={0.95} />
      <Rect x={23} y={8} width={12} height={8} rx={2} fill="white" fillOpacity={0.7} />
      <Rect x={12} y={19} width={11} height={9} rx={2} fill="white" fillOpacity={0.7} />
      <Rect x={28} y={18} width={4} height={10} rx={2} fill="white" fillOpacity={0.95} />
      <Rect x={12} y={31} width={6} height={9} rx={2} fill="white" fillOpacity={0.95} />
      <Rect x={23} y={31} width={12} height={9} rx={2} fill="white" fillOpacity={0.7} />
    </Svg>
  );
}

export function AppLogoMark({ size = 'md', animated = false }: { size?: AppLogoSize; animated?: boolean }) {
  const s = SIZES[size];
  const gradId = useId().replace(/:/g, '');
  const floatY = useSharedValue(0);

  useEffect(() => {
    if (!animated) return;
    floatY.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [animated, floatY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const mark = (
    <View style={styles.wrapper}>
      {animated ? (
        <View
          pointerEvents="none"
          style={[
            styles.halo,
            {
              width: s.mark + s.mark * 0.3,
              height: s.mark + s.mark * 0.3,
              borderRadius: s.radius + 12,
            },
          ]}
        />
      ) : null}
      <View
        style={[
          styles.mark,
          {
            width: s.mark,
            height: s.mark,
            borderRadius: s.radius,
          },
        ]}
      >
        <Svg width={s.mark} height={s.mark} viewBox="0 0 48 48" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#fb923c" />
              <Stop offset="0.5" stopColor="#f97316" />
              <Stop offset="1" stopColor="#ea580c" />
            </LinearGradient>
          </Defs>
          <Rect width="48" height="48" rx="11" fill={`url(#${gradId})`} />
          <Ellipse cx="24" cy="7" rx="18" ry="8" fill="white" fillOpacity={0.18} />
        </Svg>
        <View style={[styles.topGloss, { borderRadius: s.radius }]} />
        <View style={styles.bottomGlow} />
        <View style={styles.glyph}>
          <PantryGlyph size={s.glyph} />
        </View>
      </View>
    </View>
  );

  if (animated) {
    return <AnimatedView style={animStyle}>{mark}</AnimatedView>;
  }
  return mark;
}

export default function AppLogo({
  size = 'md',
  showWordmark = true,
  showSubtitle = false,
  subtitle = 'Pantry tracker',
  animated = false,
}: AppLogoProps) {
  const s = SIZES[size];
  if (!showWordmark) return <AppLogoMark size={size} animated={animated} />;
  return (
    <View className="flex-row items-center gap-3">
      <AppLogoMark size={size} animated={animated} />
      <View>
        <Text className={`${s.title} font-bold tracking-tight text-ink`}>Larderly</Text>
        {showSubtitle ? (
          <Text className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    backgroundColor: 'rgba(249, 115, 22, 0.25)',
    opacity: 0.6,
  },
  mark: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.6)',
    backgroundColor: '#ea580c',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  topGloss: {
    position: 'absolute',
    top: 2,
    left: 4,
    right: 4,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  bottomGlow: {
    position: 'absolute',
    bottom: 4,
    left: 8,
    right: 8,
    height: '12%',
    borderRadius: 999,
    backgroundColor: 'rgba(120, 53, 15, 0.12)',
  },
  glyph: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
