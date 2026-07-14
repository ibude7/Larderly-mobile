import { defaultConfig } from '@tamagui/config/v5';
import { createTamagui, type CreateTamaguiProps } from 'tamagui';

/**
 * Settings Console themes — Home cream canvas + floating glass (light/dark).
 */
const settingsLight = {
  ...defaultConfig.themes.light,
  background: '#F4F1E8',
  backgroundHover: '#FBF8EF',
  backgroundPress: '#E7E0D1',
  backgroundFocus: '#FBF8EF',
  backgroundStrong: '#FFFDF6',
  backgroundTransparent: 'rgba(244, 241, 232, 0)',
  color: '#101010',
  colorHover: '#101010',
  colorPress: '#101010',
  colorFocus: '#101010',
  colorTransparent: 'rgba(16, 16, 16, 0)',
  borderColor: 'rgba(16, 16, 16, 0.16)',
  borderColorHover: 'rgba(16, 16, 16, 0.22)',
  borderColorFocus: 'rgba(16, 16, 16, 0.28)',
  borderColorPress: 'rgba(16, 16, 16, 0.22)',
  placeholderColor: '#6D665B',
  settingsCanvas: '#F4F1E8',
  settingsSurface: '#FFFDF6',
  settingsSurfaceMuted: '#E7E0D1',
  settingsSurfaceElevated: '#FFFFFF',
  settingsInk: '#101010',
  settingsInkSoft: '#38342D',
  settingsMuted: '#6D665B',
  settingsLine: '#1B1B1B',
  settingsLineStrong: '#101010',
  settingsSuccess: '#34C759',
  settingsWarning: '#FF9F0A',
  settingsDanger: '#FF3B30',
  settingsInfo: '#007AFF',
  settingsShadow: 'rgba(16, 16, 16, 0.18)',
} as const;

const settingsDark = {
  ...defaultConfig.themes.dark,
  background: '#101010',
  backgroundHover: '#171713',
  backgroundPress: '#1E1D19',
  backgroundFocus: '#171713',
  backgroundStrong: '#26241F',
  backgroundTransparent: 'rgba(16, 16, 16, 0)',
  color: '#FFFDF6',
  colorHover: '#FFFDF6',
  colorPress: '#FFFDF6',
  colorFocus: '#FFFDF6',
  colorTransparent: 'rgba(255, 253, 246, 0)',
  borderColor: 'rgba(255,253,246,0.14)',
  borderColorHover: 'rgba(255,253,246,0.22)',
  borderColorFocus: 'rgba(255,253,246,0.28)',
  borderColorPress: 'rgba(255,253,246,0.22)',
  placeholderColor: '#B6AC9A',
  settingsCanvas: '#101010',
  settingsSurface: '#1E1D19',
  settingsSurfaceMuted: '#2A2822',
  settingsSurfaceElevated: '#26241F',
  settingsInk: '#FFFDF6',
  settingsInkSoft: '#E6DFD0',
  settingsMuted: '#B6AC9A',
  settingsLine: 'rgba(255,253,246,0.14)',
  settingsLineStrong: 'rgba(255,253,246,0.28)',
  settingsSuccess: '#45D18F',
  settingsWarning: '#FFC247',
  settingsDanger: '#FF6E6E',
  settingsInfo: '#6EA1FF',
  settingsShadow: 'rgba(0, 0, 0, 0.54)',
} as const;

const config = {
  ...defaultConfig,
  themes: {
    ...defaultConfig.themes,
    settings_light: settingsLight,
    settings_dark: settingsDark,
  },
} satisfies CreateTamaguiProps;

export const tamaguiConfig = createTamagui(config);

export default tamaguiConfig;

export type AppTamaguiConfig = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppTamaguiConfig {}
}
