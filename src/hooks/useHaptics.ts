import { useMemo } from 'react';
import * as Haptics from 'expo-haptics';

function fire(effect: () => Promise<void>) {
  effect().catch(() => {});
}

export function useHaptics() {
  return useMemo(
    () => ({
      tap: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
      heavy: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
      success: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
      warning: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
      error: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
    }),
    [],
  );
}
