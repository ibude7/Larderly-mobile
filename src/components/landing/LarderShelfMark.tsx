import Svg, { Line, Rect } from 'react-native-svg';
import { landing } from '../../theme/landing';

interface LarderShelfMarkProps {
  size: number;
  color?: string;
}

/**
 * Minimal pantry-shelf line mark — warm brown strokes, rounded caps.
 */
export function LarderShelfMark({
  size,
  color = landing.muted,
}: LarderShelfMarkProps) {
  const stroke = color;
  const sw = 2.1;

  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Line
        x1={11}
        y1={8}
        x2={11}
        y2={40}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <Line
        x1={37}
        y1={8}
        x2={37}
        y2={40}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <Line
        x1={11}
        y1={16}
        x2={37}
        y2={16}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <Line
        x1={11}
        y1={27}
        x2={37}
        y2={27}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <Line
        x1={11}
        y1={38}
        x2={37}
        y2={38}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
      />

      {/* Top shelf — three jars */}
      <Rect
        x={13}
        y={9}
        width={5}
        height={6}
        rx={1.2}
        stroke={stroke}
        strokeWidth={1.7}
      />
      <Line
        x1={13}
        y1={9}
        x2={18}
        y2={9}
        stroke={stroke}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
      <Rect
        x={21.5}
        y={10.5}
        width={4}
        height={4.5}
        rx={1}
        stroke={stroke}
        strokeWidth={1.7}
      />
      <Line
        x1={21.5}
        y1={10.5}
        x2={25.5}
        y2={10.5}
        stroke={stroke}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
      <Rect
        x={29}
        y={9}
        width={5}
        height={6}
        rx={1.2}
        stroke={stroke}
        strokeWidth={1.7}
      />
      <Line
        x1={29}
        y1={9}
        x2={34}
        y2={9}
        stroke={stroke}
        strokeWidth={1.7}
        strokeLinecap="round"
      />

      {/* Middle shelf — box + bottle */}
      <Rect
        x={13}
        y={18}
        width={10}
        height={7.5}
        rx={1.2}
        stroke={stroke}
        strokeWidth={1.7}
      />
      <Rect
        x={29}
        y={17}
        width={4}
        height={9}
        rx={1.5}
        stroke={stroke}
        strokeWidth={1.7}
      />

      {/* Bottom shelf — bottle + box */}
      <Rect
        x={14}
        y={29}
        width={4}
        height={8}
        rx={1.5}
        stroke={stroke}
        strokeWidth={1.7}
      />
      <Rect
        x={25}
        y={29.5}
        width={10}
        height={7.5}
        rx={1.2}
        stroke={stroke}
        strokeWidth={1.7}
      />
    </Svg>
  );
}
