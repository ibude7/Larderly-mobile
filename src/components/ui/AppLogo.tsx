import { useEffect, useId } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, {
  Path,
  Rect,
  Defs,
  LinearGradient,
  Stop,
  Ellipse,
} from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useScale } from "../../theme/scale";

type AppLogoSize = "sm" | "md" | "lg";

interface AppLogoProps {
  size?: AppLogoSize;
  showWordmark?: boolean;
  showSubtitle?: boolean;
  subtitle?: string;
  /** Ambient float animation — used on auth and loading surfaces. */
  animated?: boolean;
}

const SIZES: Record<
  AppLogoSize,
  { mark: number; glyph: number; title: number; radius: number }
> = {
  sm: { mark: 40, glyph: 30, title: 15, radius: 18 },
  md: { mark: 48, glyph: 36, title: 18, radius: 20 },
  lg: { mark: 64, glyph: 48, title: 24, radius: 24 },
};

const AnimatedView = Animated.createAnimatedComponent(View);

function PantryGlyph({ size, color = "white" }: { size: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Path
        d="M10 7V41M38 7V41"
        stroke={color}
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      <Path
        d="M10 17H38M10 29H38M10 41H38"
        stroke={color}
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      <Rect
        x={13}
        y={7}
        width={4}
        height={9}
        rx={2}
        fill={color}
        fillOpacity={0.95}
      />
      <Rect
        x={23}
        y={8}
        width={12}
        height={8}
        rx={2}
        fill={color}
        fillOpacity={0.7}
      />
      <Rect
        x={12}
        y={19}
        width={11}
        height={9}
        rx={2}
        fill={color}
        fillOpacity={0.7}
      />
      <Rect
        x={28}
        y={18}
        width={4}
        height={10}
        rx={2}
        fill={color}
        fillOpacity={0.95}
      />
      <Rect
        x={12}
        y={31}
        width={6}
        height={9}
        rx={2}
        fill={color}
        fillOpacity={0.95}
      />
      <Rect
        x={23}
        y={31}
        width={12}
        height={9}
        rx={2}
        fill={color}
        fillOpacity={0.7}
      />
    </Svg>
  );
}

const PLAIN_ORANGE = "#ea580c";

export function AppLogoMark({
  size = "md",
  animated = false,
  plain = false,
  color,
}: {
  size?: AppLogoSize;
  animated?: boolean;
  /** Glyph only — no rounded orange fill. */
  plain?: boolean;
  /** Glyph color. Defaults to white (filled) or brand orange (plain). */
  color?: string;
}) {
  const { s } = useScale();
  const dimensions = SIZES[size];
  const markSize = s(dimensions.mark);
  const glyphSize = s(dimensions.glyph);
  const radius = s(dimensions.radius);
  const floatOffset = s(4);
  const gradId = useId().replace(/:/g, "");
  const floatY = useSharedValue(0);
  const glyphColor = color ?? (plain ? PLAIN_ORANGE : "white");

  useEffect(() => {
    if (!animated) return;
    floatY.value = withRepeat(
      withSequence(
        withTiming(-floatOffset, {
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [animated, floatOffset, floatY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const mark = plain ? (
    <View
      style={[
        styles.wrapper,
        styles.plainMark,
        { width: markSize, height: markSize },
      ]}
    >
      <PantryGlyph size={glyphSize} color={glyphColor} />
    </View>
  ) : (
    <View style={styles.wrapper}>
      {animated ? (
        <View
          pointerEvents="none"
          style={[
            styles.halo,
            {
              width: markSize * 1.3,
              height: markSize * 1.3,
              borderRadius: radius + s(12),
            },
          ]}
        />
      ) : null}
      <View
        style={[
          styles.mark,
          {
            width: markSize,
            height: markSize,
            borderRadius: radius,
            borderWidth: StyleSheet.hairlineWidth,
          },
        ]}
      >
        <Svg
          width={markSize}
          height={markSize}
          viewBox="0 0 48 48"
          style={StyleSheet.absoluteFill}
        >
          <Defs>
            <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#fb923c" />
              <Stop offset="0.5" stopColor="#f97316" />
              <Stop offset="1" stopColor="#ea580c" />
            </LinearGradient>
          </Defs>
          <Rect width="48" height="48" rx="11" fill={`url(#${gradId})`} />
          <Ellipse
            cx="24"
            cy="7"
            rx="18"
            ry="8"
            fill="white"
            fillOpacity={0.18}
          />
        </Svg>
        <View
          style={[
            styles.topGloss,
            {
              top: s(2),
              left: s(4),
              right: s(4),
              borderRadius: radius,
            },
          ]}
        />
        <View
          style={[
            styles.bottomGlow,
            {
              bottom: s(4),
              left: s(8),
              right: s(8),
            },
          ]}
        />
        <View style={styles.glyph}>
          <PantryGlyph size={glyphSize} color={glyphColor} />
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
  size = "md",
  showWordmark = true,
  showSubtitle = false,
  subtitle = "Pantry tracker",
  animated = false,
}: AppLogoProps) {
  const { s, fs } = useScale();
  const dimensions = SIZES[size];
  if (!showWordmark) return <AppLogoMark size={size} animated={animated} />;
  return (
    <View style={[styles.logoRow, { gap: s(12) }]}>
      <AppLogoMark size={size} animated={animated} />
      <View>
        <Text
          className="font-bold tracking-tight text-ink dark:text-ink-dark"
          style={{ fontSize: fs(dimensions.title) }}
        >
          Larderly
        </Text>
        {showSubtitle ? (
          <Text
            className="font-bold uppercase text-muted dark:text-muted-dark"
            style={{
              marginTop: s(4),
              fontSize: fs(11),
              letterSpacing: fs(1.98),
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  plainMark: {
    backgroundColor: "transparent",
  },
  halo: {
    position: "absolute",
    backgroundColor: "rgba(249, 115, 22, 0.25)",
    opacity: 0.6,
  },
  mark: {
    overflow: "hidden",
    borderColor: "rgba(251, 146, 60, 0.6)",
    backgroundColor: "#ea580c",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  topGloss: {
    position: "absolute",
    height: "50%",
    backgroundColor: "rgba(255, 255, 255, 0.22)",
  },
  bottomGlow: {
    position: "absolute",
    height: "12%",
    borderRadius: 999,
    backgroundColor: "rgba(120, 53, 15, 0.12)",
  },
  glyph: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
});
