import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useAppColors } from '../../hooks/useAppColors';

interface EmptyIllustrationProps {
  size?: number;
  variant?: 'pantry' | 'shopping' | 'meals' | 'default';
}

export default function EmptyIllustration({
  size = 148,
  variant = 'default',
}: EmptyIllustrationProps) {
  const c = useAppColors();
  const accent = variant === 'shopping' ? c.teal : variant === 'meals' ? c.warning : c.primary;

  return (
    <Svg width={size} height={size} viewBox="0 0 160 160" fill="none">
      <Defs>
        <LinearGradient id="emptyGlass" x1="20" y1="16" x2="140" y2="148">
          <Stop offset="0" stopColor={c.surfaceElevated} stopOpacity="0.92" />
          <Stop offset="1" stopColor={c.surfaceMuted} stopOpacity="0.46" />
        </LinearGradient>
        <LinearGradient id="emptyAccent" x1="44" y1="28" x2="120" y2="132">
          <Stop offset="0" stopColor={accent} stopOpacity="0.95" />
          <Stop offset="1" stopColor={c.primaryDark} stopOpacity="0.78" />
        </LinearGradient>
      </Defs>
      <Circle cx="80" cy="80" r="68" fill={accent} opacity="0.10" />
      <Circle cx="112" cy="40" r="16" fill={c.teal} opacity="0.12" />
      <Rect x="36" y="34" width="88" height="96" rx="24" fill="url(#emptyGlass)" stroke={c.glassLine} />
      <Path d="M54 66H106M54 94H106" stroke={c.lineStrong} strokeWidth="5" strokeLinecap="round" />
      <Rect x="56" y="48" width="14" height="28" rx="7" fill="url(#emptyAccent)" />
      <Rect x="82" y="52" width="26" height="20" rx="8" fill={accent} opacity="0.52" />
      <Rect x="58" y="82" width="24" height="24" rx="8" fill={c.ink} opacity="0.14" />
      <Rect x="94" y="82" width="12" height="28" rx="6" fill="url(#emptyAccent)" opacity="0.86" />
      <Path
        d="M50 124C65 113 96 112 112 124"
        stroke={accent}
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.36"
      />
    </Svg>
  );
}
