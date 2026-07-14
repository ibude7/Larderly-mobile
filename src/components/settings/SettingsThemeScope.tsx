import type { ReactNode } from 'react';
import { Theme } from 'tamagui';
import { useSettingsTheme } from '../../theme/settings';

/** Scopes Tamagui `settings_light` / `settings_dark` themes for the Settings Console. */
export function SettingsThemeScope({ children }: { children: ReactNode }) {
  const { tamaguiTheme } = useSettingsTheme();
  return <Theme name={tamaguiTheme}>{children}</Theme>;
}
