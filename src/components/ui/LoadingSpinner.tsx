import { memo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAppColors } from '../../hooks/useAppColors';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

const SIZE_MAP: Record<NonNullable<LoadingSpinnerProps['size']>, number> = {
  xs: 14,
  sm: 20,
  md: 32,
  lg: 48,
};

/**
 * Brand loading indicator. The web app used an elaborate conic-gradient
 * orbital ring; on RN we use the platform ActivityIndicator tinted in the
 * Larderly amber, which reads as native and performant.
 */
function LoadingSpinner({
  size = 'md',
  color,
  className,
}: LoadingSpinnerProps) {
  const c = useAppColors();
  return (
    <View className={className}>
      <ActivityIndicator size={SIZE_MAP[size]} color={color ?? c.primary} />
    </View>
  );
}

export default memo(LoadingSpinner);
