import { Platform } from 'react-native';
import { isGlassEffectAPIAvailable } from 'expo-glass-effect';

let cachedAvailability: boolean | undefined;

export function canUseLiquidGlass() {
  if (Platform.OS !== 'ios') {
    return false;
  }

  if (cachedAvailability === undefined) {
    try {
      cachedAvailability = isGlassEffectAPIAvailable();
    } catch {
      cachedAvailability = false;
    }
  }

  return cachedAvailability;
}
