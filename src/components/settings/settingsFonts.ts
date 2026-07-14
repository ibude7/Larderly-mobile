import { Platform, type TextStyle } from 'react-native';

type SettingsFontRole = 'regular' | 'medium' | 'semibold' | 'bold';

const OUTFIT: Record<SettingsFontRole, string> = {
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semibold: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
};

const IOS_WEIGHT: Record<SettingsFontRole, TextStyle['fontWeight']> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

/**
 * Settings type styles — SF Pro weights on iOS (matches reference),
 * Outfit faces elsewhere.
 */
export function settingsType(role: SettingsFontRole): TextStyle {
  if (Platform.OS === 'ios') {
    return {
      fontFamily: 'System',
      fontWeight: IOS_WEIGHT[role],
    };
  }
  return { fontFamily: OUTFIT[role] };
}

/** @deprecated Prefer settingsType(role) so iOS weights resolve correctly. */
export const settingsFonts = {
  regular: Platform.OS === 'ios' ? 'System' : OUTFIT.regular,
  medium: Platform.OS === 'ios' ? 'System' : OUTFIT.medium,
  semibold: Platform.OS === 'ios' ? 'System' : OUTFIT.semibold,
  bold: Platform.OS === 'ios' ? 'System' : OUTFIT.bold,
} as const;
