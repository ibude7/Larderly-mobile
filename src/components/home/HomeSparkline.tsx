import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { useId } from 'react';
import { useScale } from '../../theme/scale';

/**
 * Soft filled wave at the bottom of Overview metric cards (reference style).
 * Sits edge-to-edge under the card content.
 */
export function HomeSparkline({ color }: { color: string }) {
  const { s } = useScale();
  const h = s(36);
  const uid = useId().replace(/:/g, '');
  const gradId = `sparkFill-${uid}`;

  return (
    <View style={[styles.wrap, { height: h }]} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 120 36" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0.28} />
            <Stop offset="1" stopColor={color} stopOpacity={0.04} />
          </LinearGradient>
        </Defs>
        <Path
          d="M0 22 C18 22 22 8 40 10 C58 12 62 26 80 20 C98 14 106 6 120 8 L120 36 L0 36 Z"
          fill={`url(#${gradId})`}
        />
        <Path
          d="M0 22 C18 22 22 8 40 10 C58 12 62 26 80 20 C98 14 106 6 120 8"
          stroke={color}
          strokeWidth={1.6}
          strokeLinecap="round"
          fill="none"
          opacity={0.55}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
});
