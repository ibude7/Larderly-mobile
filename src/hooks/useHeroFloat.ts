import { useEffect } from 'react';
import { Easing, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

/** Gentle idle float animation shared by landing + onboarding heroes. */
export function useHeroFloat() {
  const floatY = useSharedValue(0);

  useEffect(() => {
    floatY.value = withRepeat(
      withTiming(1, { duration: 3400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [floatY]);

  return floatY;
}
