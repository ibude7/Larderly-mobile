import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { MainStackNavigationProp } from './types';

/**
 * Safe back navigation for settings screens. Falls back to the tabs root when
 * there's no history to pop to (e.g. the screen was opened via a deep link).
 */
export function useGoBack() {
  const navigation = useNavigation<MainStackNavigationProp>();
  return useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
    }
  }, [navigation]);
}
