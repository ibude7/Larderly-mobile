import { StyleSheet, View } from 'react-native';
import { LarderShelfMark } from './LarderShelfMark';
import { useScale } from '../../theme/scale';
import { landing } from '../../theme/landing';

type LogoSize = 'sm' | 'md' | 'lg';

const SIZES: Record<LogoSize, number> = {
  sm: 32,
  md: 40,
  lg: 56,
};

/** Line-art pantry shelf mark for Landing / Auth / Onboarding chrome. */
export function LandingLogoMark({
  size = 'md',
  color = landing.muted,
}: {
  size?: LogoSize;
  color?: string;
}) {
  const { s } = useScale();
  const dim = s(SIZES[size]);

  return (
    <View
      style={[styles.wrap, { width: dim, height: dim }]}
      accessibilityLabel="Larderly"
    >
      <LarderShelfMark size={dim} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
